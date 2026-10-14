const router = require("express").Router();
const { Inventory, Order, STATUSES } = require("../models");
const { wrap, auth, bad } = require("../middleware");

router.use(auth("admin"));

router.get("/inventory", wrap(async (req, res) => {
  res.json(await Inventory.find().sort({ category: 1, name: 1 }).lean());
}));

// Manual stock update and configurable threshold
router.patch("/inventory/:id", wrap(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw bad("Item not found.", 404);
  for (const key of ["stock", "threshold"]) {
    if (req.body[key] === undefined) continue;
    const n = Number(req.body[key]);
    if (!Number.isInteger(n) || n < 0) throw bad(`${key} must be a whole number, 0 or more.`);
    item[key] = n;
  }
  if (item.stock >= item.threshold) item.lowAlertSent = false;   // re-arm the alert after restocking
  await item.save();
  res.json(item);
}));

router.get("/orders", wrap(async (req, res) => {
  res.json(await Order.find({ status: { $in: STATUSES } }).populate("user", "name email").sort({ createdAt: -1 }).lean());
}));

router.patch("/orders/:id/status", wrap(async (req, res) => {
  if (!STATUSES.includes(req.body.status)) throw bad("Invalid status.");
  const order = await Order.findOneAndUpdate({ _id: req.params.id, status: { $in: STATUSES } }, { status: req.body.status }, { new: true });
  if (!order) throw bad("Order not found.", 404);
  res.json(order);
}));

module.exports = router;
