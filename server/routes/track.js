const express = require("express");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer"); // para sa populate
const Service = require("../models/Service");   // para sa populate
const httpError = require("../utils/httpError");
const { computeBalance, isLate } = require("../utils/orderLogic");

const router = express.Router();

// GET /api/track/:orderCode   e.g. /api/track/LND-0001
router.get("/:orderCode", async (req, res) => {
  const code = req.params.orderCode.trim().toUpperCase();
  if (!/^LND-\d{4,}$/.test(code)) {
    throw httpError(400, "Invalid order code format. Example: LND-0001");
  }

  const order = await Order.findOne({ orderCode: code })
    .populate("service", "name")
    .populate("customer", "name");
  if (!order) throw httpError(404, `No order found with code ${code}`);

  const payments = await Payment.find({ order: order._id });
  const bal = computeBalance(order, payments);

  // Privacy: unang pangalan lang, walang phone at address
  const firstName = order.customer ? order.customer.name.split(" ")[0] : "Customer";

  res.json({
    orderCode: order.orderCode,
    customerFirstName: firstName,
    service: order.service ? order.service.name : null,
    quantity: order.quantity,
    status: order.status,
    statusHistory: order.statusHistory,
    promisedAt: order.promisedAt,
    claimedAt: order.claimedAt,
    isLate: isLate(order),
    amountDue: bal.amountDue,
    amountPaid: bal.amountPaid,
    balance: bal.balance,
    storageFee: bal.storageFee,
  });
});

module.exports = router;