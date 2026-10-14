const nodemailer = require("nodemailer");

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// If SMTP is not configured, the email is printed in the console (handy for local testing).
async function sendMail(to, subject, html) {
  if (!transporter) {
    console.log(`\n[MAIL - SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, " ")}\n`);
    return true;
  }
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html });
    return true;
  } catch (e) {
    console.error("Email failed:", e.message);
    return false;
  }
}

module.exports = { sendMail, esc };
