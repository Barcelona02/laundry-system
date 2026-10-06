const mongoose = require("mongoose");

const machineSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Machine code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[WD]-\d{2}$/, "Machine code must look like W-01 (washer) or D-01 (dryer)"],
    },
    type: {
      type: String,
      required: [true, "Machine type is required"],
      enum: {
        values: ["washer", "dryer"],
        message: "Machine type must be washer or dryer",
      },
    },
    capacityKg: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1 kg"],
      max: [30, "Capacity must not exceed 30 kg"],
    },
    status: {
      type: String,
      enum: {
        values: ["available", "in_use", "maintenance"],
        message: "Status must be available, in_use, or maintenance",
      },
      default: "available",
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Machine", machineSchema);