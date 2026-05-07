const WholeSaler = require("../models/WholeSaler.model");
const jwt = require("jsonwebtoken");

// 🔐 Generate JWT for wholesaler
const generateToken = (wholesalerId) => {
  return jwt.sign({ wholesalerId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ REGISTER WHOLESALER (No hashing - stores plain text PIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.registerWholeSaler = async (req, res) => {
  try {
    const { storeName, email, pin, phoneNumber, city, address } = req.body;

    // Validate
    if (!storeName || !email || !pin || !phoneNumber || !city || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing email
    const existingEmail = await WholeSaler.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check existing phone number
    const existingPhone = await WholeSaler.findOne({ phoneNumber });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "Phone number already registered" });
    }

    // Create wholesaler with plain text PIN
    const wholesaler = await WholeSaler.create({
      storeName,
      email,
      pin: pin, // Store PIN as plain text
      phoneNumber,
      city,
      address,
    });

    res.status(201).json({
      success: true,
      message: "Wholesaler registered successfully",
      token: generateToken(wholesaler._id),
      wholesaler: {
        id: wholesaler._id,
        storeName: wholesaler.storeName,
        email: wholesaler.email,
        pin: wholesaler.pin,
        phoneNumber: wholesaler.phoneNumber,
        city: wholesaler.city,
        address: wholesaler.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ LOGIN WHOLESALER (Direct PIN comparison - no bcrypt)
// ─────────────────────────────────────────────────────────────────────────────
exports.loginWholeSaler = async (req, res) => {
  try {
    const { phoneNumber, pin } = req.body;

    if (!phoneNumber || !pin) {
      return res
        .status(400)
        .json({ message: "Phone number and PIN required" });
    }

    // Find wholesaler using phone number
    const wholesaler = await WholeSaler.findOne({ phoneNumber });

    if (!wholesaler) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare PIN
    if (wholesaler.pin !== pin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: generateToken(wholesaler._id),
      wholesaler: {
        id: wholesaler._id,
        storeName: wholesaler.storeName,
        email: wholesaler.email,
        pin: wholesaler.pin,
        phoneNumber: wholesaler.phoneNumber,
        city: wholesaler.city,
        address: wholesaler.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET ALL WHOLESALERS (Shows plain text PIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllWholesalers = async (req, res) => {
  try {
    const wholesalers = await WholeSaler.find({});
    res.status(200).json({
      success: true,
      count: wholesalers.length,
      data: wholesalers, // This includes the plain text PIN and phoneNumber
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET WHOLESALER BY ID (Shows plain text PIN)
// ─────────────────────────────────────────────────────────────────────────────
exports.getWholesalerById = async (req, res) => {
  try {
    const wholesaler = await WholeSaler.findById(req.params.id);

    if (!wholesaler) {
      return res.status(404).json({ message: "Wholesaler not found" });
    }

    res.status(200).json({
      success: true,
      data: wholesaler,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ UPDATE WHOLESALER
// ─────────────────────────────────────────────────────────────────────────────
exports.updateWholesaler = async (req, res) => {
  try {
    const { storeName, city, address, pin, phoneNumber } = req.body;
    const updateData = { storeName, city, address, phoneNumber };

    // Update PIN directly if provided (no hashing)
    if (pin) {
      updateData.pin = pin;
    }

    const wholesaler = await WholeSaler.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    if (!wholesaler) {
      return res.status(404).json({ message: "Wholesaler not found" });
    }

    res.status(200).json({
      success: true,
      message: "Wholesaler updated successfully",
      data: wholesaler,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ DELETE WHOLESALER
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteWholesaler = async (req, res) => {
  try {
    const wholesaler = await WholeSaler.findByIdAndDelete(req.params.id);

    if (!wholesaler) {
      return res.status(404).json({ message: "Wholesaler not found" });
    }

    res.status(200).json({
      success: true,
      message: "Wholesaler deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET CURRENT WHOLESALER (from token)
// ─────────────────────────────────────────────────────────────────────────────
exports.getCurrentWholesaler = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.wholesaler,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
