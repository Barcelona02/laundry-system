const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^09\d{9}$/, "Phone must be a valid PH mobile number (e.g. 09171234567)"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address must not exceed 200 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Notes must not exceed 300 characters"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);