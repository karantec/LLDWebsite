const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    homeBanner1: {
      type: String, // Single image URL
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Banner", bannerSchema);
