const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      unique: true,
      trim: true,
      maxlength: [60, "Service name must not exceed 60 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description must not exceed 300 characters"],
    },
    pricingType: {
      type: String,
      enum: {
        values: ["per_kg", "per_piece"],
        message: "Pricing type must be per_kg or per_piece",
      },
      default: "per_kg",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be at least 1"],
    },
    minimumCharge: {
      type: Number,
      default: 0,
      min: [0, "Minimum charge cannot be negative"],
    },
    turnaroundHours: {
      type: Number,
      default: 24,
      min: [1, "Turnaround must be at least 1 hour"],
      max: [168, "Turnaround must not exceed 168 hours (7 days)"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);