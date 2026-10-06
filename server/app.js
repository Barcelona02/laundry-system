const express = require("express");
const cors = require("cors");
const logger = require("./middleware/logger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// 1. Global middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(logger);

// 2. Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
// (dito natin ima-mount ang customers, orders, etc. mamaya)

// 3. 404 catch-all (pagkatapos ng lahat ng routes)
app.use(notFound);

// 4. Error handler (laging huli)
app.use(errorHandler);

module.exports = app;