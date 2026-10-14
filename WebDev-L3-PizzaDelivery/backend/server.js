require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/shop"));

app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : "Server error. Please try again." });
});

const { PORT = 5000, MONGO_URI } = process.env;
if (!MONGO_URI || !process.env.JWT_SECRET) { console.error("Set MONGO_URI and JWT_SECRET in backend/.env (copy .env.example)"); process.exit(1); }

mongoose.connect(MONGO_URI).then(async () => {
  await require("./seed").ensureSeed();
  require("./jobs/stockAlert").start();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}).catch((e) => { console.error("MongoDB connection failed:", e.message); process.exit(1); });
