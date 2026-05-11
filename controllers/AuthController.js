const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const SMSService = require("../services/smsService");

/* ================= OTP SEND (USER + DELIVERY AGENT) ================= */

const sendOtp = async (req, res) => {
  try {
    let { phoneNumber, role } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

    // ✅ normalize role
    role = role ? role.toUpperCase() : "USER";

    let user = await User.findOne({ phoneNumber: formattedPhone });

    if (!user) {
      user = new User({
        phoneNumber: formattedPhone,
        role: role === "DELIVERY_AGENT" ? "DELIVERY_AGENT" : "USER",
      });
    } else {
      // ✅ update role if user is joining as delivery agent
      if (role === "DELIVERY_AGENT" && user.role !== "DELIVERY_AGENT") {
        user.role = "DELIVERY_AGENT";
      }
    }

    const otp = user.generateOTP();
    await user.save();

    const smsResult = await SMSService.sendOTP(formattedPhone, otp);
    if (!smsResult.success) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    res.json({
      success: true,
      message: "OTP sent successfully",
      expiresIn: 300,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= OTP VERIFY (USER + DELIVERY AGENT) ================= */

const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: "Phone number & OTP required" });
    }

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const user = await User.findOne({ phoneNumber: formattedPhone });

    if (!user || !user.verifyOTP(otp)) {
      if (user) await user.save();
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // ✅ SAME JWT FOR ALL ROLES — signed with "userId"
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "8d",
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= ADMIN LOGIN (EMAIL + PASSWORD) ================= */

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Incoming Email:", email);
    console.log("Incoming Password:", password);

    const adminUser = await User.findOne({
      email,
      role: "ADMIN",
    });

    console.log("Admin Found:", adminUser);

    if (!adminUser) {
      return res.status(401).json({
        message: "Admin not found",
      });
    }

    const isMatch = await adminUser.comparePassword(password);

    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        message: "Password incorrect",
      });
    }

    const token = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: "8d",
    });

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= UPDATE PROFILE ================= */

const updateProfile = async (req, res) => {
  try {
    // req.user is attached by the protect middleware
    const userId = req.user._id || req.user.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated." });
    }

    const { name, email, address, profilePicture } = req.body;

    // Build update object — only include fields that were sent
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (address !== undefined) updates.address = address.trim();
    if (profilePicture !== undefined)
      updates.profilePicture = profilePicture.trim();

    // Email needs uniqueness check
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail) {
        const existing = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: userId },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "This email is already in use by another account.",
          });
        }
      }
      updates.email = normalizedEmail || undefined;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-otp -password -__v");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Issue a fresh token so frontend localStorage stays in sync
    const token = jwt.sign(
      { userId: updatedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "8d" },
    );

    res.json({
      success: true,
      message: "Profile updated successfully.",
      token,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} is already taken.`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= OTHER ================= */

const getAllUsers = async (req, res) => {
  const users = await User.find().select("-otp -__v -password");
  res.json({ success: true, users });
};

const logout = async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  sendOtp,
  verifyOtp,
  adminLogin,
  updateProfile,
  getAllUsers,
  logout,
};
