const mongoose = require("mongoose");

const WholeSalerSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    pin: {
      type: String,
      required: [true, "PIN is required"],
      select: false, // hide in queries
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("WholeSaler", WholeSalerSchema);
