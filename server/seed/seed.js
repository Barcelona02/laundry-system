require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); // same DNS fix gaya ng server.js

const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Service = require("../models/Service");
const Machine = require("../models/Machine");
const Order = require("../models/Order");
const Payment = require("../models/Payment");

const services = [
  { name: "Wash-Dry-Fold", description: "Full service: wash, dry, and neatly folded", pricingType: "per_kg", price: 35, minimumCharge: 105, turnaroundHours: 24 },
  { name: "Wash Only", description: "Washing only, customer dries at home", pricingType: "per_kg", price: 25, minimumCharge: 75, turnaroundHours: 12 },
  { name: "Dry Only", description: "Drying only for already-washed clothes", pricingType: "per_kg", price: 20, minimumCharge: 60, turnaroundHours: 6 },
  { name: "Ironing", description: "Pressed and hanger-ready", pricingType: "per_piece", price: 15, turnaroundHours: 24 },
  { name: "Comforter / Blanket", description: "Heavy items washed individually", pricingType: "per_piece", price: 150, turnaroundHours: 48 },
  { name: "Dry Clean", description: "For barong, gowns, and delicate fabrics", pricingType: "per_piece", price: 180, turnaroundHours: 72 },
  { name: "Shoe Cleaning", description: "Currently unavailable", pricingType: "per_piece", price: 120, turnaroundHours: 48, isActive: false },
];

const machines = [
  { code: "W-01", type: "washer", capacityKg: 8 },
  { code: "W-02", type: "washer", capacityKg: 8 },
  { code: "W-03", type: "washer", capacityKg: 10 },
  { code: "W-04", type: "washer", capacityKg: 10, status: "maintenance" },
  { code: "D-01", type: "dryer", capacityKg: 10 },
  { code: "D-02", type: "dryer", capacityKg: 10 },
  { code: "D-03", type: "dryer", capacityKg: 12 },
];

const customers = [
  { name: "Rosa Santos", phone: "09171234567", address: "Balibago, Angeles City" },
  { name: "Mark Dela Cruz", phone: "09182345678", address: "Malabanias, Angeles City" },
  { name: "Joanna Reyes", phone: "09193456789", address: "Pampang, Angeles City" },
  { name: "Carlo Mendoza", phone: "09204567890", address: "Sto. Rosario, Angeles City" },
  { name: "Liza Manalo", phone: "09215678901", address: "Dau, Mabalacat", notes: "Prefers unscented fabcon" },
  { name: "Paolo Garcia", phone: "09226789012", address: "Telabastagan, San Fernando" },
  { name: "Andrea Lim", phone: "09237890123", address: "Cutcut, Angeles City" },
  { name: "Benjie Tolentino", phone: "09248901234", address: "Pulung Maragul, Angeles City" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Burahin muna ang lumang data para malinis ang simula
    await Promise.all([
      Payment.deleteMany(),
      Order.deleteMany(),
      Machine.deleteMany(),
      Service.deleteMany(),
      Customer.deleteMany(),
    ]);
    console.log("Cleared old data");

    const createdServices = await Service.insertMany(services);
    const createdMachines = await Machine.insertMany(machines);
    const createdCustomers = await Customer.insertMany(customers);

    console.log(`Seeded ${createdServices.length} services`);
    console.log(`Seeded ${createdMachines.length} machines`);
    console.log(`Seeded ${createdCustomers.length} customers`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

seed();