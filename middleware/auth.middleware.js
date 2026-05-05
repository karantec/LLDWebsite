const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const WholeSaler = require("../models/WholeSaler.model");

const extractToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer")) {
    return req.headers.authorization.split(" ")[1];
  }
  if (req.cookies?.jwt) {
    return req.cookies.jwt;
  }
  return null;
};

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
    req.userType = "user";
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const admin = (req, res, next) => {
  if (!req.user || (!req.user.isAdmin && req.user.role !== "ADMIN")) {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

const protectWholesaler = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authenticated as wholesaler" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const wholesalerId = decoded.wholesalerId || decoded.id;

    const wholesaler = await WholeSaler.findById(wholesalerId);

    if (!wholesaler) {
      return res.status(401).json({ message: "Wholesaler not found" });
    }

    req.wholesaler = wholesaler;
    req.userType = "wholesaler";
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = {
  protect,
  admin,
  protectWholesaler,
};
