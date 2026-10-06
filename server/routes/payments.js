const express = require("express");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Customer = require("../models/Customer"); // kailangan para sa nested populate
const httpError = require("../utils/httpError");
const { computeBalance } = require("../utils/orderLogic");

const router = express.Router();

// GET /api/payments  (?order=<id>  ?method=gcash)
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.order) filter.order = req.query.order;
  if (req.query.method) {
    if (!["cash", "gcash", "maya"].includes(req.query.method)) {
      throw httpError(400, `Invalid method: ${req.query.method}`);
    }
    filter.method = req.query.method;
  }

  const payments = await Payment.find(filter)
    .populate({
      path: "order",
      select: "orderCode totalAmount customer",
      populate: { path: "customer", select: "name" },
    })
    .sort({ createdAt: -1 });

  res.json(payments);
});

// GET /api/payments/:id
router.get("/:id", async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("order", "orderCode totalAmount");
  if (!payment) throw httpError(404, "Payment not found");
  res.json(payment);
});

// POST /api/payments   body: { order, amount, method, reference }
router.post("/", async (req, res) => {
  const { order: orderId, amount, method = "cash", reference } = req.body;
  if (!orderId) throw httpError(400, "Order is required");

  const order = await Order.findById(orderId);
  if (!order) throw httpError(404, "Order not found");
  if (order.status === "cancelled") throw httpError(400, "Cannot add payment to a cancelled order");

  const existing = await Payment.find({ order: order._id });
  const { balance } = computeBalance(order, existing);

  if (balance === 0) throw httpError(400, "Order is already fully paid");
  if (Number(amount) > balance) {
    throw httpError(400, `Amount exceeds remaining balance of ₱${balance}`);
  }
  if (["gcash", "maya"].includes(method) && !reference) {
    throw httpError(400, `Reference number is required for ${method} payments`);
  }

  const payment = await Payment.create({ order: order._id, amount, method, reference });

  res.status(201).json({
    payment,
    ...computeBalance(order, [...existing, payment]),
  });
});

// DELETE /api/payments/:id  (pang-correct ng maling encode)
router.delete("/:id", async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("order", "status");
  if (!payment) throw httpError(404, "Payment not found");
  if (payment.order && payment.order.status === "claimed") {
    throw httpError(400, "Cannot delete a payment of an order that was already claimed");
  }

  await payment.deleteOne();
  res.json({ message: "Payment deleted" });
});

module.exports = router;