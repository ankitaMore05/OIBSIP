const router = require("express").Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { Inventory, Variety, Order } = require("../models");
const { wrap, auth, bad } = require("../middleware");

const CATS = ["base", "sauce", "cheese", "veggie"];
const partsOf = (p) => [["base", p.base], ["sauce", p.sauce], ["cheese", p.cheese], ...p.veggies.map((v) => ["veggie", v])];

// Dashboard data: pizza varieties + builder options
router.get("/menu", auth("user"), wrap(async (req, res) => {
  const inv = await Inventory.find().sort({ price: 1, name: 1 }).lean();
  const options = {};
  CATS.forEach((c) => { options[c] = inv.filter((i) => i.category === c).map((i) => ({ name: i.name, price: i.price, available: i.stock > 0 })); });
  res.json({ varieties: await Variety.find().lean(), options });
}));

// Validates the choice and calculates the price on the server (never trust the browser's price)
async function resolvePizza(body) {
  let pizza, fixedPrice;
  if (body.type === "variety") {
    const v = await Variety.findById(body.varietyId).lean();
    if (!v) throw bad("Pizza not found.");
    pizza = { name: v.name, base: v.base, sauce: v.sauce, cheese: v.cheese, veggies: v.veggies };
    fixedPrice = v.price;
  } else {
    const { base, sauce, cheese } = body;
    const veggies = Array.isArray(body.veggies) ? [...new Set(body.veggies)] : [];
    if (!base || !sauce || !cheese || veggies.length === 0) throw bad("Choose a base, a sauce, a cheese and at least one vegetable.");
    pizza = { name: "Custom Pizza", base, sauce, cheese, veggies };
  }
  let sum = 0;
  for (const [category, name] of partsOf(pizza)) {
    const item = await Inventory.findOne({ category, name }).lean();
    if (!item) throw bad(`Unknown ${category}: ${name}`);
    if (item.stock < 1) throw bad(`${name} is out of stock.`);
    sum += item.price;
  }
  return { pizza, total: fixedPrice ?? sum };
}

router.post("/orders/checkout", auth("user"), wrap(async (req, res) => {
  const { RAZORPAY_KEY_ID: id, RAZORPAY_KEY_SECRET: secret } = process.env;
  if (!id || !secret) throw bad("Razorpay test keys are missing in backend/.env", 503);
  const { pizza, total } = await resolvePizza(req.body || {});
  const order = await Order.create({ user: req.user.id, pizza, total });
  const rz = await new Razorpay({ key_id: id, key_secret: secret }).orders.create({
    amount: Math.round(total * 100), currency: "INR", receipt: String(order._id),
  });
  order.razorpayOrderId = rz.id;
  await order.save();
  res.json({ orderId: order._id, razorpayOrderId: rz.id, amount: rz.amount, keyId: id });
}));

// After the Razorpay popup succeeds: verify the signature, confirm the order, reduce stock
router.post("/orders/verify", auth("user"), wrap(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  const order = await Order.findOne({ _id: orderId, user: req.user.id });
  if (!order || order.razorpayOrderId !== razorpay_order_id) throw bad("Order not found.");
  if (order.status !== "Payment Pending") return res.json({ message: "Order already confirmed." });

  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature || ""));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw bad("Payment verification failed.");

  order.status = "Order Received";
  order.paymentId = razorpay_payment_id;
  await order.save();
  for (const [category, name] of partsOf(order.pizza)) {      // stock decrements automatically
    await Inventory.updateOne({ category, name }, { $inc: { stock: -1 } });
  }
  res.json({ message: "Order confirmed!" });
}));

// The dashboard polls this every few seconds for live status
router.get("/orders/mine", auth("user"), wrap(async (req, res) => {
  res.json(await Order.find({ user: req.user.id, status: { $ne: "Payment Pending" } }).sort({ createdAt: -1 }).lean());
}));

module.exports = router;
