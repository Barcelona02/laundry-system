const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },
    method: {
      type: String,
      enum: {
        values: ["cash", "gcash", "maya"],
        message: "Method must be cash, gcash, or maya",
      },
      default: "cash",
    },
    reference: {
      type: String,
      trim: true,
      maxlength: [50, "Reference must not exceed 50 characters"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);