const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    otp: {
      code: String,
      expiresAt: Date,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    savedAddresses: [],
  },
  {
    timestamps: true,
  },
);

/* HASH PASSWORD */

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);

  next();
});

/* COMPARE PASSWORD */

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
