const express = require("express");
const Machine = require("../models/Machine");
const Order = require("../models/Order");
const httpError = require("../utils/httpError");

const router = express.Router();

// GET /api/machines  (?type=washer  ?status=available)
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  const machines = await Machine.find(filter)
    .populate("currentOrder", "orderCode status")
    .sort({ code: 1 });
  res.json(machines);
});

// GET /api/machines/availability  (DAPAT nasa itaas ng /:id)
router.get("/availability", async (req, res) => {
  const machines = await Machine.find();

  const summarize = (type) => {
    const list = machines.filter((m) => m.type === type);
    const available = list.filter((m) => m.status === "available");
    return {
      total: list.length,
      available: available.length,
      inUse: list.filter((m) => m.status === "in_use").length,
      maintenance: list.filter((m) => m.status === "maintenance").length,
      availableCapacityKg: available.reduce((sum, m) => sum + m.capacityKg, 0),
    };
  };

  const working = machines.filter((m) => m.status !== "maintenance").length;
  const inUse = machines.filter((m) => m.status === "in_use").length;

  res.json({
    washer: summarize("washer"),
    dryer: summarize("dryer"),
    utilizationRate: working ? Math.round((inUse / working) * 100) : 0,
  });
});

// GET /api/machines/:id
router.get("/:id", async (req, res) => {
  const machine = await Machine.findById(req.params.id).populate("currentOrder", "orderCode status");
  if (!machine) throw httpError(404, "Machine not found");
  res.json(machine);
});

// POST /api/machines
router.post("/", async (req, res) => {
  if (req.body.status === "in_use") {
    throw httpError(400, "A new machine cannot start as in_use");
  }
  const machine = await Machine.create({ ...req.body, currentOrder: null });
  res.status(201).json(machine);
});

// PUT /api/machines/:id
router.put("/:id", async (req, res) => {
  const machine = await Machine.findById(req.params.id);
  if (!machine) throw httpError(404, "Machine not found");

  const { status } = req.body;
  if (status === "in_use") {
    throw httpError(400, "Machines become in_use only when assigned to an order");
  }
  if (machine.status === "in_use" && status) {
    throw httpError(400, `Machine ${machine.code} is currently in use by an order`);
  }

  machine.set({ ...req.body, currentOrder: machine.currentOrder });
  await machine.save();
  res.json(machine);
});

// DELETE /api/machines/:id
router.delete("/:id", async (req, res) => {
  const machine = await Machine.findById(req.params.id);
  if (!machine) throw httpError(404, "Machine not found");
  if (machine.status === "in_use") {
    throw httpError(400, `Cannot delete ${machine.code} while it is in use`);
  }

  await machine.deleteOne();
  res.json({ message: "Machine deleted" });
});

module.exports = router;