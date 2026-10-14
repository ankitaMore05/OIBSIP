const mongoose = require("mongoose");
const { Schema } = mongoose;

const User = mongoose.model("User", new Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  verified: { type: Boolean, default: false },
  verifyToken: String,
  resetToken: String,
  resetExpires: Date,
}, { timestamps: true }));

const inventorySchema = new Schema({
  category: { type: String, enum: ["base", "sauce", "cheese", "veggie"], required: true },
  name: { type: String, required: true },
  stock: { type: Number, default: 100 },
  threshold: { type: Number, default: 20 },   // configurable per item
  price: { type: Number, default: 0 },
  lowAlertSent: { type: Boolean, default: false },
});
inventorySchema.index({ category: 1, name: 1 }, { unique: true });
const Inventory = mongoose.model("Inventory", inventorySchema);

const Variety = mongoose.model("Variety", new Schema({
  name: String, description: String, price: Number,
  base: String, sauce: String, cheese: String, veggies: [String],
}));

const STATUSES = ["Order Received", "In Kitchen", "Sent to Delivery"];
const Order = mongoose.model("Order", new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  pizza: { name: String, base: String, sauce: String, cheese: String, veggies: [String] },
  total: Number,
  status: { type: String, enum: ["Payment Pending", ...STATUSES], default: "Payment Pending" },
  razorpayOrderId: String,
  paymentId: String,
}, { timestamps: true }));

module.exports = { User, Inventory, Variety, Order, STATUSES };
