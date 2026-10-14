const router = require("express").Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User } = require("../models");
const { wrap, sign, bad } = require("../middleware");
const { sendMail, esc } = require("../mailer");

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const client = () => process.env.CLIENT_URL || "http://localhost:5173";
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || "");
const pwOk = (p) => typeof p === "string" && p.length >= 8 && /\d/.test(p);
const PW_MSG = "Password must be at least 8 characters and include a number.";

// Register (always creates a normal user, never an admin)
router.post("/register", wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !name.trim() || !emailOk(email)) throw bad("Enter your name and a valid email.");
  if (!pwOk(password)) throw bad(PW_MSG);
  const mail = email.toLowerCase();
  if (await User.findOne({ email: mail })) throw bad("This email is already registered.", 409);
  const token = crypto.randomBytes(24).toString("hex");
  await User.create({ name: name.trim(), email: mail, passwordHash: await bcrypt.hash(password, 10), verifyToken: sha(token) });
  await sendMail(mail, "Verify your email", `<p>Hi ${esc(name)},</p><p>Please verify your email: <a href="${client()}/verify/${token}">Verify email</a></p>`);
  res.status(201).json({ message: "Registered! Check your email for the verification link." });
}));

router.post("/verify", wrap(async (req, res) => {
  const user = await User.findOne({ verifyToken: sha(String((req.body || {}).token || "")) });
  if (!user) throw bad("This verification link is invalid or already used.");
  user.verified = true; user.verifyToken = undefined; await user.save();
  res.json({ message: "Email verified. You can log in now." });
}));

async function doLogin(req, res, role) {
  const { email, password } = req.body || {};
  const u = await User.findOne({ email: String(email || "").toLowerCase(), role });
  if (!u || !(await bcrypt.compare(String(password || ""), u.passwordHash))) throw bad("Invalid email or password.", 401);
  if (!u.verified) throw bad("Please verify your email first.", 403);
  res.json({ token: sign(u), name: u.name, role: u.role });
}
router.post("/login", wrap((req, res) => doLogin(req, res, "user")));
router.post("/admin-login", wrap((req, res) => doLogin(req, res, "admin")));   // separate admin entrance

// Forgot password: always the same reply so emails cannot be probed
router.post("/forgot", wrap(async (req, res) => {
  const u = await User.findOne({ email: String((req.body || {}).email || "").toLowerCase(), role: "user" });
  if (u) {
    const token = crypto.randomBytes(24).toString("hex");
    u.resetToken = sha(token); u.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await u.save();
    await sendMail(u.email, "Reset your password", `<p>Reset your password (valid 1 hour): <a href="${client()}/reset/${token}">Reset password</a></p>`);
  }
  res.json({ message: "If that email is registered, a reset link has been sent." });
}));

router.post("/reset", wrap(async (req, res) => {
  const { token, password } = req.body || {};
  if (!pwOk(password)) throw bad(PW_MSG);
  const u = await User.findOne({ resetToken: sha(String(token || "")), resetExpires: { $gt: new Date() } });
  if (!u) throw bad("This reset link is invalid or has expired.");
  u.passwordHash = await bcrypt.hash(password, 10); u.resetToken = undefined; u.resetExpires = undefined;
  await u.save();
  res.json({ message: "Password updated. You can log in now." });
}));

module.exports = router;
