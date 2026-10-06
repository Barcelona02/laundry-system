const express = require("express");
const Customer = require("../models/Customer");
const Order = require("../models/Order");

const router = express.Router();

// GET /api/customers  (pwedeng may ?search=rosa)
router.get("/", async (req, res) => {
  const filter = {};

  if (req.query.search) {
    // escape special characters para hindi masira ang regex
    const safe = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safe, "i");
    filter.$or = [{ name: regex }, { phone: regex }];
  }

  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  res.json(customers);
});

// GET /api/customers/:id
router.get("/:id", async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  res.json(customer);
});

// POST /api/customers
router.post("/", async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
});

// PUT /api/customers/:id
router.put("/:id", async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  customer.set(req.body);
  await customer.save(); // dito tumatakbo ang validation
  res.json(customer);
});

// DELETE /api/customers/:id
router.delete("/:id", async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  // Business rule: bawal burahin ang customer na may orders na
  const orderCount = await Order.countDocuments({ customer: customer._id });
  if (orderCount > 0) {
    return res.status(400).json({
      message: `Cannot delete customer with ${orderCount} order(s) on record`,
    });
  }

  await customer.deleteOne();
  res.json({ message: "Customer deleted" });
});

module.exports = router;