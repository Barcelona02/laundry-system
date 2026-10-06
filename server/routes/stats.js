const express = require("express");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Machine = require("../models/Machine");
const Customer = require("../models/Customer"); // para sa populate
const Service = require("../models/Service");   // para sa populate
const httpError = require("../utils/httpError");
const { computeBalance, isLate } = require("../utils/orderLogic");

const router = express.Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const MANILA_OFFSET = 8 * 60 * 60 * 1000; // UTC+8, walang daylight saving ang PH

const round2 = (n) => Math.round(n * 100) / 100;
const average = (arr) => (arr.length ? round2(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

// Simula ng araw o buwan sa oras ng Pilipinas
function manilaStart(date, unit) {
  const d = new Date(date.getTime() + MANILA_OFFSET);
  d.setUTCHours(0, 0, 0, 0);
  if (unit === "month") d.setUTCDate(1);
  return new Date(d.getTime() - MANILA_OFFSET);
}

// GET /api/stats/dashboard
router.get("/dashboard", async (req, res) => {
  const now = new Date();
  const todayStart = manilaStart(now, "day");
  const monthStart = manilaStart(now, "month");

  const [orders, payments, machines] = await Promise.all([
    Order.find().populate("service", "name pricingType").populate("customer", "name"),
    Payment.find(),
    Machine.find(),
  ]);

  // Total na bayad kada order
  const paidByOrder = new Map();
  for (const p of payments) {
    const key = String(p.order);
    paidByOrder.set(key, (paidByOrder.get(key) || 0) + p.amount);
  }
  const collectedSince = (from) =>
    round2(payments.filter((p) => p.createdAt >= from).reduce((sum, p) => sum + p.amount, 0));

  const byStatus = Object.fromEntries(Order.STATUSES.map((s) => [s, 0]));
  let late = 0;
  let unclaimed = 0;
  let unpaidBalance = 0;
  let pendingStorageFees = 0;
  const serviceStats = new Map();
  const customerStats = new Map();
  const turnaroundHours = [];
  const kgPerOrder = [];
  const orderValues = [];

  for (const o of orders) {
    byStatus[o.status]++;
    if (o.status === "cancelled") continue;

    const bal = computeBalance(o, [{ amount: paidByOrder.get(String(o._id)) || 0 }], now);
    unpaidBalance += bal.balance;
    if (isLate(o, now)) late++;
    if (o.status === "ready") {
      unclaimed++;
      pendingStorageFees += bal.storageFee;
    }
    orderValues.push(o.totalAmount);

    // Pinakamabentang services
    const serviceName = o.service ? o.service.name : "Deleted service";
    const s = serviceStats.get(serviceName) || { name: serviceName, orders: 0, billed: 0 };
    s.orders++;
    s.billed = round2(s.billed + o.totalAmount);
    serviceStats.set(serviceName, s);

    // Top customers
    if (o.customer) {
      const key = String(o.customer._id);
      const c = customerStats.get(key) || { _id: o.customer._id, name: o.customer.name, orders: 0, totalSpent: 0 };
      c.orders++;
      c.totalSpent = round2(c.totalSpent + o.totalAmount);
      customerStats.set(key, c);
    }

    // Average turnaround: mula received hanggang ready
    const received = o.statusHistory.find((h) => h.status === "received");
    const ready = o.statusHistory.find((h) => h.status === "ready");
    if (received && ready) {
      turnaroundHours.push((new Date(ready.changedAt) - new Date(received.changedAt)) / 3600000);
    }

    if (o.service && o.service.pricingType === "per_kg") kgPerOrder.push(o.quantity);
  }

  const working = machines.filter((m) => m.status !== "maintenance").length;
  const inUse = machines.filter((m) => m.status === "in_use").length;

  res.json({
    sales: {
      today: collectedSince(todayStart),
      thisMonth: collectedSince(monthStart),
      allTime: collectedSince(new Date(0)),
    },
    orders: {
      total: orders.length,
      byStatus,
      active: byStatus.received + byStatus.washing + byStatus.drying,
      late,
      unclaimed,
    },
    receivables: {
      unpaidBalance: round2(unpaidBalance),
      pendingStorageFees,
    },
    machines: {
      total: machines.length,
      inUse,
      maintenance: machines.filter((m) => m.status === "maintenance").length,
      utilizationRate: working ? Math.round((inUse / working) * 100) : 0,
    },
    averages: {
      turnaroundHours: average(turnaroundHours),
      kgPerOrder: average(kgPerOrder),
      orderValue: average(orderValues),
    },
    topServices: [...serviceStats.values()].sort((a, b) => b.billed - a.billed).slice(0, 5),
    topCustomers: [...customerStats.values()].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
  });
});

// GET /api/stats/sales?days=7   (para sa sales chart)
router.get("/sales", async (req, res) => {
  const days = req.query.days === undefined ? 7 : Number(req.query.days);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw httpError(400, "days must be a whole number from 1 to 90");
  }

  const start = manilaStart(new Date(Date.now() - (days - 1) * DAY_MS), "day");

  const grouped = await Payment.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Manila" } },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDate = new Map(grouped.map((g) => [g._id, g]));

  // Kumpletong listahan ng araw, kasama ang mga araw na walang benta (0)
  const series = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * DAY_MS + MANILA_OFFSET).toISOString().slice(0, 10);
    const g = byDate.get(date);
    series.push({ date, total: g ? round2(g.total) : 0, payments: g ? g.count : 0 });
  }

  res.json({
    days,
    total: round2(series.reduce((sum, d) => sum + d.total, 0)),
    series,
  });
});

module.exports = router;