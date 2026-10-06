const express = require("express");
const cors = require("cors");
const logger = require("./middleware/logger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const customerRoutes = require("./routes/customers");
const serviceRoutes = require("./routes/services");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const machineRoutes = require("./routes/machines");
const statsRoutes = require("./routes/stats");
const trackRoutes = require("./routes/track");

const app = express();

// 1. Global middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(logger);

// 2. Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/customers", customerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/track", trackRoutes);


// 3. 404 catch-all (pagkatapos ng lahat ng routes)
app.use(notFound);

// 4. Error handler (laging huli)
app.use(errorHandler);

module.exports = app;