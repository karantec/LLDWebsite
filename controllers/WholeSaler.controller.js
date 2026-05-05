const WholeSaler = require("../models/WholeSaler.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔐 Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ─────────────────────────────────────────────
// ✅ REGISTER
// ─────────────────────────────────────────────
exports.registerWholeSaler = async (req, res) => {
  try {
    const { storeName, email, pin, city, address } = req.body;

    // Validate
    if (!storeName || !email || !pin || !city || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing
    const existing = await WholeSaler.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create user
    const wholesaler = await WholeSaler.create({
      storeName,
      email,
      pin: hashedPin,
      city,
      address,
    });

    res.status(201).json({
      message: "Registered successfully",
      token: generateToken(wholesaler._id),
      wholesaler: {
        id: wholesaler._id,
        storeName: wholesaler.storeName,
        email: wholesaler.email,
        city: wholesaler.city,
        address: wholesaler.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// ✅ LOGIN (email + pin)
// ─────────────────────────────────────────────
exports.loginWholeSaler = async (req, res) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({ message: "Email and PIN required" });
    }

    // Get user with pin
    const wholesaler = await WholeSaler.findOne({ email }).select("+pin");

    if (!wholesaler) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare PIN
    const isMatch = await bcrypt.compare(pin, wholesaler.pin);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(wholesaler._id),
      wholesaler: {
        id: wholesaler._id,
        storeName: wholesaler.storeName,
        email: wholesaler.email,
        city: wholesaler.city,
        address: wholesaler.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
