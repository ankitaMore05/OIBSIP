require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { User, Inventory, Variety } = require("./models");

const stockData = [
  ["base", "Classic Hand-Tossed", 120], ["base", "Thin Crust", 110], ["base", "Cheese Burst", 150],
  ["base", "Whole Wheat", 130], ["base", "Multigrain", 135],
  ["sauce", "Tomato Basil", 20], ["sauce", "Pesto", 30], ["sauce", "Smoky BBQ", 25],
  ["sauce", "White Garlic", 25], ["sauce", "Spicy Arrabbiata", 25],
  ["cheese", "Mozzarella", 40], ["cheese", "Cheddar", 40], ["cheese", "Parmesan", 50], ["cheese", "Vegan Cheese", 55],
  ["veggie", "Onion", 15], ["veggie", "Capsicum", 15], ["veggie", "Mushroom", 20], ["veggie", "Black Olives", 20],
  ["veggie", "Tomato", 15], ["veggie", "Sweet Corn", 15], ["veggie", "Jalapeno", 20],
];
const varieties = [
  { name: "Margherita", description: "Classic tomato, mozzarella and tomato slices.", price: 199, base: "Classic Hand-Tossed", sauce: "Tomato Basil", cheese: "Mozzarella", veggies: ["Tomato"] },
  { name: "Farmhouse", description: "Loaded with fresh vegetables on a thin crust.", price: 279, base: "Thin Crust", sauce: "Tomato Basil", cheese: "Mozzarella", veggies: ["Onion", "Capsicum", "Mushroom"] },
  { name: "Spicy Garden", description: "Arrabbiata sauce with jalapeno and corn.", price: 259, base: "Whole Wheat", sauce: "Spicy Arrabbiata", cheese: "Cheddar", veggies: ["Jalapeno", "Sweet Corn", "Onion"] },
  { name: "Pesto Delight", description: "Pesto, parmesan, olives and mushrooms.", price: 299, base: "Multigrain", sauce: "Pesto", cheese: "Parmesan", veggies: ["Black Olives", "Mushroom"] },
];

async function ensureSeed() {
  if ((await Inventory.countDocuments()) === 0) {
    await Inventory.insertMany(stockData.map(([category, name, price]) => ({ category, name, price, stock: 100, threshold: 20 })));
    console.log("Seeded inventory");
  }
  if ((await Variety.countDocuments()) === 0) { await Variety.insertMany(varieties); console.log("Seeded pizza varieties"); }
  const email = (process.env.ADMIN_EMAIL || "admin@pizza.local").toLowerCase();
  if (!(await User.findOne({ role: "admin" }))) {
    await User.create({ name: "Admin", email, role: "admin", verified: true, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@12345", 10) });
    console.log("Created admin account:", email);
  }
}

module.exports = { ensureSeed };

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI).then(ensureSeed).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
