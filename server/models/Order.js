const mongoose = require("mongoose");

// Tamang pagkakasunod-sunod ng status ng isang labada
const ORDER_STATUSES = ["received", "washing", "drying", "ready", "claimed", "cancelled"];

// Presyo ng bawat add-on (piso)
const ADD_ONS = {
  fabcon: 15,
  extra_rinse: 20,
  stain_removal: 30,
  folding: 25,
};

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: [true, "Order code is required"],
      unique: true,
      uppercase: true,
      match: [/^LND-\d{4,}$/, "Order code must look like LND-0001"],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity (kg or pieces) is required"],
      min: [0.5, "Quantity must be at least 0.5"],
      max: [100, "Quantity must not exceed 100"],
    },
    addOns: {
      type: [
        {
          type: String,
          enum: { values: Object.keys(ADD_ONS), message: "Invalid add-on: {VALUE}" },
        },
      ],
      default: [],
    },
    isRush: {
      type: Boolean,
      default: false,
    },

    // Computed ng server kapag ginawa ang order (snapshot ng presyo)
    subtotal: { type: Number, required: true, min: 0 },
    addOnsTotal: { type: Number, default: 0, min: 0 },
    rushFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: {
        values: ORDER_STATUSES,
        message: "Invalid status: {VALUE}",
      },
      default: "received",
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    promisedAt: {
      type: Date,
      required: [true, "Promised pickup date is required"],
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Notes must not exceed 300 characters"],
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

// Para magamit sa routes ang listahan ng statuses at presyo ng add-ons
Order.STATUSES = ORDER_STATUSES;
Order.ADD_ONS = ADD_ONS;

module.exports = Order;