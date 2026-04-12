const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Vendor = require("../models/Vendor.model");

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPER — verify Bearer token and return decoded payload
// ─────────────────────────────────────────────────────────────────────────────
const extractToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer")) {
    return req.headers.authorization.split(" ")[1];
  }
  if (req.cookies?.jwt) {
    return req.cookies.jwt;
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// USER / ADMIN / DELIVERY_AGENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Protect routes that require a logged-in USER
 * Attaches: req.user
 */
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * ADMIN only
 */
const admin = (req, res, next) => {
  if (!req.user || (!req.user.isAdmin && req.user.role !== "ADMIN")) {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

/**
 * DELIVERY AGENT only
 */

/**
 * ACCEPTED vendors only  (use after protectVendor)
 * Useful if you want PENDING vendors to log in but not access certain routes.
 *
 * Usage:  router.get("/dashboard", protectVendor, acceptedVendorOnly, handler)
 */

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  // user
  protect,
  admin,
};
