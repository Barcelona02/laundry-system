require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); // same DNS fix gaya ng server.js

const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Service = require("../models/Service");
const Machine = require("../models/Machine");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const { computePricing, computePromisedAt } = require("../utils/orderLogic");

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const hoursAgo = (h) => new Date(Date.now() - h * HOUR);
const addHours = (date, h) => new Date(date.getTime() + h * HOUR);

// ===== BASE DATA =====
const services = [
  { name: "Wash-Dry-Fold", description: "Full service: wash, dry, and neatly folded", pricingType: "per_kg", price: 35, minimumCharge: 105, turnaroundHours: 24 },
  { name: "Wash Only", description: "Washing only, customer dries at home", pricingType: "per_kg", price: 25, minimumCharge: 75, turnaroundHours: 12 },
  { name: "Dry Only", description: "Drying only for already-washed clothes", pricingType: "per_kg", price: 20, minimumCharge: 60, turnaroundHours: 6 },
  { name: "Ironing", description: "Pressed and hanger-ready", pricingType: "per_piece", price: 15, turnaroundHours: 24 },
  { name: "Comforter / Blanket", description: "Heavy items washed individually", pricingType: "per_piece", price: 150, turnaroundHours: 48 },
  { name: "Dry Clean", description: "For barong, gowns, and delicate fabrics", pricingType: "per_piece", price: 180, turnaroundHours: 72 },
  { name: "Shoe Cleaning", description: "Currently unavailable", pricingType: "per_piece", price: 120, turnaroundHours: 48, isActive: false },
];

const machines = [
  { code: "W-01", type: "washer", capacityKg: 8 },
  { code: "W-02", type: "washer", capacityKg: 8 },
  { code: "W-03", type: "washer", capacityKg: 10 },
  { code: "W-04", type: "washer", capacityKg: 10, status: "maintenance" },
  { code: "D-01", type: "dryer", capacityKg: 10 },
  { code: "D-02", type: "dryer", capacityKg: 10 },
  { code: "D-03", type: "dryer", capacityKg: 12 },
];

const customers = [
  { name: "Rosa Santos", phone: "09171234567", address: "Balibago, Angeles City" },
  { name: "Mark Dela Cruz", phone: "09182345678", address: "Malabanias, Angeles City" },
  { name: "Joanna Reyes", phone: "09193456789", address: "Pampang, Angeles City" },
  { name: "Carlo Mendoza", phone: "09204567890", address: "Sto. Rosario, Angeles City" },
  { name: "Liza Manalo", phone: "09215678901", address: "Dau, Mabalacat", notes: "Prefers unscented fabcon" },
  { name: "Paolo Garcia", phone: "09226789012", address: "Telabastagan, San Fernando" },
  { name: "Andrea Lim", phone: "09237890123", address: "Cutcut, Angeles City" },
  { name: "Benjie Tolentino", phone: "09248901234", address: "Pulung Maragul, Angeles City" },
];

// ===== ORDER SCENARIOS =====
// customer = index sa customers, ago = ilang oras na ang nakalipas mula ginawa
// claimAfter = ilang oras mula ginawa bago na-claim
// payments: at "start" (pagka-drop off) o "claim"; amount "full" = natitirang balance
const orderPlans = [
  // --- Claimed at bayad na ---
  { customer: 0, service: "Wash-Dry-Fold", quantity: 5, ago: 168, status: "claimed", claimAfter: 26,
    payments: [{ at: "claim", amount: "full", method: "cash" }] },
  { customer: 1, service: "Wash-Dry-Fold", quantity: 8, addOns: ["fabcon"], ago: 150, status: "claimed", claimAfter: 30,
    payments: [{ at: "start", amount: 100, method: "cash" }, { at: "claim", amount: "full", method: "gcash", reference: "GC5512340001" }] },
  { customer: 2, service: "Comforter / Blanket", quantity: 2, ago: 140, status: "claimed", claimAfter: 50,
    payments: [{ at: "start", amount: "full", method: "cash" }] },
  { customer: 3, service: "Ironing", quantity: 12, ago: 120, status: "claimed", claimAfter: 26,
    payments: [{ at: "claim", amount: "full", method: "cash" }] },
  { customer: 4, service: "Dry Clean", quantity: 1, ago: 118, status: "claimed", claimAfter: 74,
    payments: [{ at: "start", amount: "full", method: "maya", reference: "MY7788120002" }] },
  { customer: 5, service: "Wash-Dry-Fold", quantity: 4, isRush: true, ago: 96, status: "claimed", claimAfter: 13,
    payments: [{ at: "claim", amount: "full", method: "gcash", reference: "GC5512340003" }] },
  { customer: 6, service: "Wash Only", quantity: 6, ago: 72, status: "claimed", claimAfter: 20,
    payments: [{ at: "claim", amount: "full", method: "cash" }] },
  { customer: 0, service: "Wash-Dry-Fold", quantity: 7, addOns: ["folding"], ago: 48, status: "claimed", claimAfter: 25,
    payments: [{ at: "start", amount: 150, method: "cash" }, { at: "claim", amount: "full", method: "cash" }] },
  { customer: 7, service: "Dry Only", quantity: 3, ago: 24, status: "claimed", claimAfter: 10,
    payments: [{ at: "claim", amount: "full", method: "cash" }] },

  // --- Ready pero hindi pa kinukuha ---
  { customer: 1, service: "Wash-Dry-Fold", quantity: 6, ago: 144, status: "ready", notes: "Customer not answering calls",
    payments: [{ at: "start", amount: 100, method: "cash" }] }, // ~5 araw nang ready -> may storage fee
  { customer: 2, service: "Ironing", quantity: 8, ago: 48, status: "ready",
    payments: [{ at: "start", amount: "full", method: "gcash", reference: "GC5512340004" }] },

  // --- Nasa machine ngayon ---
  { customer: 3, service: "Wash-Dry-Fold", quantity: 9, ago: 30, status: "washing", machine: "W-03",
    payments: [{ at: "start", amount: 100, method: "cash" }] }, // late na (lampas 24 oras)
  { customer: 4, service: "Wash Only", quantity: 5, ago: 3, status: "washing", machine: "W-01", payments: [] },
  { customer: 5, service: "Wash-Dry-Fold", quantity: 6, addOns: ["stain_removal"], ago: 12, status: "drying", machine: "D-01",
    payments: [{ at: "start", amount: 100, method: "cash" }] },

  // --- Bagong dating ---
  { customer: 6, service: "Comforter / Blanket", quantity: 1, ago: 1, status: "received", payments: [] },
  { customer: 7, service: "Wash-Dry-Fold", quantity: 3, isRush: true, ago: 0.5, status: "received",
    payments: [{ at: "start", amount: "full", method: "gcash", reference: "GC5512340005" }] },

  // --- Cancelled ---
  { customer: 3, service: "Dry Clean", quantity: 2, ago: 96, status: "cancelled", notes: "Customer changed mind", payments: [] },
];

const FLOW = ["received", "washing", "drying", "ready", "claimed"];
// Kailan nangyari ang bawat stage, bilang bahagi ng promised turnaround
const STAGE_SHARE = { received: 0, washing: 0.1, drying: 0.4, ready: 0.8 };

function buildStatusHistory(plan, createdAt, turnaroundHours) {
  if (plan.status === "cancelled") {
    return [
      { status: "received", changedAt: createdAt },
      { status: "cancelled", changedAt: addHours(createdAt, 1) },
    ];
  }
  const lastIndex = FLOW.indexOf(plan.status);
  return FLOW.slice(0, lastIndex + 1).map((status) => ({
    status,
    changedAt:
      status === "claimed"
        ? addHours(createdAt, plan.claimAfter)
        : addHours(createdAt, turnaroundHours * STAGE_SHARE[status]),
  }));
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await Promise.all([
      Payment.deleteMany(),
      Order.deleteMany(),
      Machine.deleteMany(),
      Service.deleteMany(),
      Customer.deleteMany(),
    ]);
    console.log("Cleared old data");

    const createdServices = await Service.insertMany(services);
    const createdMachines = await Machine.insertMany(machines);
    const createdCustomers = await Customer.insertMany(customers);

    const serviceByName = new Map(createdServices.map((s) => [s.name, s]));
    const machineByCode = new Map(createdMachines.map((m) => [m.code, m]));

    // Pinakaluma muna para sunod-sunod ang order codes
    const plans = [...orderPlans].sort((a, b) => b.ago - a.ago);

    const orderDocs = [];
    const paymentDocs = [];

    plans.forEach((plan, i) => {
      const service = serviceByName.get(plan.service);
      const createdAt = hoursAgo(plan.ago);
      const isRush = Boolean(plan.isRush);
      const addOns = plan.addOns || [];
      const pricing = computePricing(service, plan.quantity, addOns, isRush);
      const promisedAt = computePromisedAt(service, isRush, createdAt);
      const turnaroundHours = (promisedAt - createdAt) / HOUR;
      const statusHistory = buildStatusHistory(plan, createdAt, turnaroundHours);
      const lastChange = statusHistory[statusHistory.length - 1].changedAt;
      const machine = plan.machine ? machineByCode.get(plan.machine) : null;

      const order = {
        _id: new mongoose.Types.ObjectId(),
        orderCode: `LND-${String(i + 1).padStart(4, "0")}`,
        customer: createdCustomers[plan.customer]._id,
        service: service._id,
        quantity: plan.quantity,
        addOns,
        isRush,
        ...pricing,
        status: plan.status,
        statusHistory,
        promisedAt,
        claimedAt: plan.status === "claimed" ? lastChange : null,
        machine: machine ? machine._id : null,
        notes: plan.notes,
        createdAt,
        updatedAt: lastChange,
        __v: 0,
      };
      orderDocs.push(order);

      let paidSoFar = 0;
      for (const p of plan.payments) {
        const amount = p.amount === "full" ? pricing.totalAmount - paidSoFar : p.amount;
        paidSoFar += amount;
        const paidAt = p.at === "claim" ? order.claimedAt : addHours(createdAt, 0.1);
        paymentDocs.push({
          _id: new mongoose.Types.ObjectId(),
          order: order._id,
          amount,
          method: p.method,
          reference: p.reference,
          createdAt: paidAt,
          updatedAt: paidAt,
          __v: 0,
        });
      }
    });

    // I-validate gamit ang schema bago i-save (para sigurado na tama ang data)
    for (const doc of orderDocs) await new Order(doc).validate();
    for (const doc of paymentDocs) await new Payment(doc).validate();

    // Direktang insert para masunod ang lumang petsa (hindi papalitan ng timestamps)
    await Order.collection.insertMany(orderDocs);
    await Payment.collection.insertMany(paymentDocs);

    // Markahan ang mga machine na ginagamit ngayon
    for (const order of orderDocs.filter((o) => o.machine)) {
      await Machine.updateOne({ _id: order.machine }, { status: "in_use", currentOrder: order._id });
    }

    console.log(`Seeded ${createdServices.length} services`);
    console.log(`Seeded ${createdMachines.length} machines`);
    console.log(`Seeded ${createdCustomers.length} customers`);
    console.log(`Seeded ${orderDocs.length} orders`);
    console.log(`Seeded ${paymentDocs.length} payments`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

seed();