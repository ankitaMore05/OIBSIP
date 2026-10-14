const cron = require("node-cron");
const { Inventory } = require("../models");
const { sendMail, esc } = require("../mailer");

// Emails the admin when any item is below its threshold. Each item alerts once until it is restocked.
async function checkStock() {
  await Inventory.updateMany({ $expr: { $gte: ["$stock", "$threshold"] }, lowAlertSent: true }, { lowAlertSent: false });
  const low = await Inventory.find({ $expr: { $lt: ["$stock", "$threshold"] }, lowAlertSent: false });
  if (low.length === 0) return;
  const rows = low.map((i) => `<li>${esc(i.category)}: <b>${esc(i.name)}</b> has ${i.stock} left (threshold ${i.threshold})</li>`).join("");
  const sent = await sendMail(process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL, "Low stock alert", `<p>These items need restocking:</p><ul>${rows}</ul>`);
  if (sent) await Inventory.updateMany({ _id: { $in: low.map((i) => i._id) } }, { lowAlertSent: true });
}

function start() {
  const schedule = process.env.STOCK_CRON || "*/15 * * * *";
  cron.schedule(schedule, () => checkStock().catch((e) => console.error("Stock job failed:", e.message)));
  checkStock().catch((e) => console.error("Stock job failed:", e.message));
  console.log("Stock alert job scheduled:", schedule);
}

module.exports = { start, checkStock };
