const express = require("express");
const Service = require("../models/Service");

const router = express.Router();

// GET /api/services  (?active=true para sa order form)
router.get("/", async (req, res) => {
  const filter = req.query.active === "true" ? { isActive: true } : {};
  const services = await Service.find(filter).sort({ name: 1 });
  res.json(services);
});

// TODO (groupmate): GET /:id, POST /, PUT /:id, DELETE /:id

module.exports = router;