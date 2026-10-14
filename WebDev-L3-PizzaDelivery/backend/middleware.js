const jwt = require("jsonwebtoken");

// Lets async route handlers pass errors to Express
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// auth("user") or auth("admin"): checks the JWT and the role
const auth = (role) => (req, res, next) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please log in." });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    if (role && p.role !== role) return res.status(403).json({ message: "Not allowed." });
    req.user = p;
    next();
  } catch (e) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
};

const sign = (u) => jwt.sign({ id: u._id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
const bad = (message, status = 400) => Object.assign(new Error(message), { status });

module.exports = { wrap, auth, sign, bad };
