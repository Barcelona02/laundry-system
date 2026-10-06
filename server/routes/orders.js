const express = require("express");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Service = require("../models/Service");
const Payment = require("../models/Payment");
const Machine = require("../models/Machine");
const httpError = require("../utils/httpError");
const {
  ALLOWED_TRANSITIONS,
  canTransition,
  computePricing,
  computePromisedAt,
  computeBalance,
  isLate,
  generateOrderCode,
} = require("../utils/orderLogic");

const router = express.Router();

// Helper: i-validate ang input at i-compute ang presyo
async function buildOrderFields(body) {
  const { customer, service, quantity, addOns = [], isRush = false, notes } = body;

  if (!customer) throw httpError(400, "Customer is required");
  if (!service) throw httpError(400, "Service is required");

  const foundCustomer = await Customer.findById(customer);
  if (!foundCustomer) throw httpError(404, "Customer not found");

  const foundService = await Service.findById(service);
  if (!foundService) throw httpError(404, "Service not found");
  if (!foundService.isActive) {
    throw httpError(400, `${foundService.name} is currently unavailable`);
  }

  const qty = Number(quantity);
  if (!qty || qty <= 0) throw httpError(400, "Quantity must be greater than 0");
  if (foundService.pricingType === "per_piece" && !Number.isInteger(qty)) {
    throw httpError(400, `${foundService.name} is priced per piece, so quantity must be a whole number`);
  }

  const pricing = computePricing(foundService, qty, addOns, Boolean(isRush));

  return {
    data: {
      customer: foundCustomer._id,
      service: foundService._id,
      quantity: qty,
      addOns,
      isRush: Boolean(isRush),
      notes,
      ...pricing,
    },
    service: foundService,
  };
}

// GET /api/orders  (?status=ready  ?customer=<id>  ?search=LND-0001  ?unpaid=true  ?late=true)
router.get("/", async (req, res) => {
  const { status, customer, search, unpaid, late } = req.query;
  const filter = {};

  if (status) {
    if (!Order.STATUSES.includes(status)) throw httpError(400, `Invalid status: ${status}`);
    filter.status = status;
  }
  if (customer) filter.customer = customer;
  if (search) {
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.orderCode = new RegExp(safe, "i");
  }

  const orders = await Order.find(filter)
    .populate("customer", "name phone")
    .populate("service", "name pricingType price")
    .sort({ createdAt: -1 });

  // Kunin ang total na bayad ng lahat ng orders sa iisang query
  const paidTotals = await Payment.aggregate([
    { $match: { order: { $in: orders.map((o) => o._id) } } },
    { $group: { _id: "$order", amountPaid: { $sum: "$amount" } } },
  ]);
  const paidMap = new Map(paidTotals.map((p) => [String(p._id), p.amountPaid]));

  let result = orders.map((o) => ({
    ...o.toObject(),
    ...computeBalance(o, [{ amount: paidMap.get(String(o._id)) || 0 }]),
    isLate: isLate(o),
  }));

  if (unpaid === "true") result = result.filter((o) => o.balance > 0 && o.status !== "cancelled");
  if (late === "true") result = result.filter((o) => o.isLate);

  res.json(result);
});

// GET /api/orders/:id  (kasama ang payments at computed balance)
router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer")
    .populate("service")
    .populate("machine", "code type");
  if (!order) throw httpError(404, "Order not found");

  const payments = await Payment.find({ order: order._id }).sort({ createdAt: 1 });

  res.json({
    ...order.toObject(),
    ...computeBalance(order, payments),
    isLate: isLate(order),
    payments,
  });
});

// POST /api/orders
router.post("/", async (req, res) => {
  const { data, service } = await buildOrderFields(req.body);
  const now = new Date();

  const order = await Order.create({
    ...data,
    orderCode: await generateOrderCode(),
    promisedAt: computePromisedAt(service, data.isRush, now),
    statusHistory: [{ status: "received", changedAt: now }],
  });

  res.status(201).json(order);
});

// PUT /api/orders/:id  (pwede lang i-edit habang "received" pa)
router.put("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, "Order not found");
  if (order.status !== "received") {
    throw httpError(400, `Cannot edit an order that is already ${order.status}`);
  }

  const current = {
    customer: order.customer,
    service: order.service,
    quantity: order.quantity,
    addOns: order.addOns,
    isRush: order.isRush,
    notes: order.notes,
  };
  const { data, service } = await buildOrderFields({ ...current, ...req.body });

  order.set({ ...data, promisedAt: computePromisedAt(service, data.isRush, order.createdAt) });
  await order.save();
  res.json(order);
});

// DELETE /api/orders/:id
router.delete("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, "Order not found");

  if (!["received", "cancelled"].includes(order.status)) {
    throw httpError(400, `Cannot delete an order that is ${order.status}`);
  }
  const paymentCount = await Payment.countDocuments({ order: order._id });
  if (paymentCount > 0) {
    throw httpError(400, "Cannot delete an order with recorded payments. Cancel it instead.");
  }

  await order.deleteOne();
  res.json({ message: "Order deleted" });
});

// PATCH /api/orders/:id/status   body: { "status": "washing" }
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!status) throw httpError(400, "Status is required");
  if (!Order.STATUSES.includes(status)) throw httpError(400, `Invalid status: ${status}`);

  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, "Order not found");

  // Rule 1: bawal mag-skip o bumalik
  if (!canTransition(order.status, status)) {
    const allowed = ALLOWED_TRANSITIONS[order.status];
    const message = allowed.length
      ? `Cannot move from ${order.status} to ${status}. Next allowed: ${allowed.join(", ")}`
      : `Order is already ${order.status} and can no longer change`;
    throw httpError(400, message);
  }

  // Rule 2: bawal i-claim kapag may balance pa
  if (status === "claimed") {
    const payments = await Payment.find({ order: order._id });
    const { balance } = computeBalance(order, payments);
    if (balance > 0) {
      throw httpError(400, `Cannot claim: remaining balance is ₱${balance}`);
    }
    order.claimedAt = new Date();
  }

  // Rule 3: bawat lipat ng stage, ibalik sa "available" ang machine
  if (order.machine) {
    await Machine.findByIdAndUpdate(order.machine, { status: "available", currentOrder: null });
    order.machine = null;
  }

  order.status = status;
  order.statusHistory.push({ status, changedAt: new Date() });
  await order.save();

  res.json(order);
});

// PATCH /api/orders/:id/machine   body: { "machine": "<machineId>" }
router.patch("/:id/machine", async (req, res) => {
  const { machine: machineId } = req.body;
  if (!machineId) throw httpError(400, "Machine is required");

  const order = await Order.findById(req.params.id).populate("service", "pricingType");
  if (!order) throw httpError(404, "Order not found");

  // Rule 1: washer kapag washing, dryer kapag drying
  const neededType = { washing: "washer", drying: "dryer" }[order.status];
  if (!neededType) {
    throw httpError(400, `Machines can only be assigned while washing or drying (order is ${order.status})`);
  }
  if (order.machine) throw httpError(400, "Order already has a machine assigned");

  const machine = await Machine.findById(machineId);
  if (!machine) throw httpError(404, "Machine not found");

  if (machine.type !== neededType) {
    throw httpError(400, `Order is ${order.status}, so it needs a ${neededType}, not a ${machine.type}`);
  }
  // Rule 2: dapat available
  if (machine.status !== "available") {
    throw httpError(400, `Machine ${machine.code} is ${machine.status.replace("_", " ")}`);
  }
  // Rule 3: kasya dapat sa capacity
  if (order.service.pricingType === "per_kg" && order.quantity > machine.capacityKg) {
    throw httpError(400, `${order.quantity} kg exceeds ${machine.code}'s capacity of ${machine.capacityKg} kg`);
  }

  // Atomic: kunin lang kung available pa talaga (para hindi magdoble kapag sabay na nag-assign)
  const taken = await Machine.findOneAndUpdate(
    { _id: machine._id, status: "available" },
    { status: "in_use", currentOrder: order._id }
  );
  if (!taken) throw httpError(400, `Machine ${machine.code} was just taken. Pick another one.`);

  order.machine = machine._id;
  await order.save();
  await order.populate("machine", "code type capacityKg");
  res.json(order);
});

module.exports = router;