function errorHandler(err, req, res, next) {
  // Mongoose validation error (kulang o maling fields) -> 400
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Validation failed", errors });
  }

  // Invalid MongoDB ID (e.g. /orders/abc123) -> 400
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  // Duplicate value sa unique field -> 400
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }

  // Custom errors na may sariling status (gagamitin natin sa business rules)
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  // Lahat ng iba pa -> 500
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
}

module.exports = errorHandler;