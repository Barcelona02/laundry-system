const Order = require("../models/Order");

// ===== Mga patakaran ng shop =====
const RUSH_RATE = 0.5;          // rush = +50% ng subtotal, kalahati ng turnaround
const FREE_STORAGE_DAYS = 3;    // libre ang 3 araw pagka-Ready
const STORAGE_FEE_PER_DAY = 20; // ₱20 kada araw pagkalampas
const DAY_MS = 24 * 60 * 60 * 1000;

// Tamang daloy ng status (hindi pwedeng mag-skip)
const ALLOWED_TRANSITIONS = {
  received: ["washing", "cancelled"],
  washing: ["drying"],
  drying: ["ready"],
  ready: ["claimed"],
  claimed: [],
  cancelled: [],
};

function round2(n) {
  return Math.round(n * 100) / 100;
}

// 1. Presyo ng order
function computePricing(service, quantity, addOns = [], isRush = false) {
  const base = service.price * quantity;
  const subtotal = round2(Math.max(base, service.minimumCharge || 0));
  const addOnsTotal = addOns.reduce((sum, key) => sum + (Order.ADD_ONS[key] || 0), 0);
  const rushFee = isRush ? round2(subtotal * RUSH_RATE) : 0;
  const totalAmount = round2(subtotal + addOnsTotal + rushFee);
  return { subtotal, addOnsTotal, rushFee, totalAmount };
}

// 2. Kailan dapat matapos (promised pickup)
function computePromisedAt(service, isRush, from = new Date()) {
  const hours = isRush ? Math.ceil(service.turnaroundHours / 2) : service.turnaroundHours;
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

// 3. Pwede bang lumipat sa susunod na status?
function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

// 4. Storage fee kapag matagal nang Ready pero hindi kinukuha
function computeStorageFee(order, now = new Date()) {
  if (!["ready", "claimed"].includes(order.status)) return { daysUnclaimed: 0, storageFee: 0 };

  const readyEntry = [...order.statusHistory].reverse().find((h) => h.status === "ready");
  const readyAt = readyEntry ? readyEntry.changedAt : order.updatedAt;
  // Kung claimed na, hanggang claimedAt lang ang bilang (hindi na lalaki)
  const endDate = order.status === "claimed" && order.claimedAt ? order.claimedAt : now;
  const daysUnclaimed = Math.floor((new Date(endDate) - new Date(readyAt)) / DAY_MS);
  const chargeableDays = Math.max(0, daysUnclaimed - FREE_STORAGE_DAYS);

  return { daysUnclaimed, storageFee: chargeableDays * STORAGE_FEE_PER_DAY };
}

// 5. Late ba ang shop? (lampas na sa promised date pero hindi pa Ready)
function isLate(order, now = new Date()) {
  const active = ["received", "washing", "drying"].includes(order.status);
  return active && now > new Date(order.promisedAt);
}

// 6. Running balance: total + storage fee - lahat ng bayad
function computeBalance(order, payments = [], now = new Date()) {
  const amountPaid = round2(payments.reduce((sum, p) => sum + p.amount, 0));
  const { daysUnclaimed, storageFee } = computeStorageFee(order, now);
  const amountDue = round2(order.totalAmount + storageFee);
  const balance = round2(Math.max(amountDue - amountPaid, 0));

  return { amountPaid, storageFee, daysUnclaimed, amountDue, balance, isPaid: balance === 0 };
}

// 7. Susunod na order code (LND-0001, LND-0002, ...)
async function generateOrderCode() {
  const last = await Order.findOne().sort({ orderCode: -1 }).select("orderCode");
  const lastNumber = last ? parseInt(last.orderCode.split("-")[1], 10) : 0;
  return `LND-${String(lastNumber + 1).padStart(4, "0")}`;
}

module.exports = {
  ALLOWED_TRANSITIONS,
  computePricing,
  computePromisedAt,
  canTransition,
  computeStorageFee,
  isLate,
  computeBalance,
  generateOrderCode,
};