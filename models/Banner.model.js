const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    homeBanner1: { type: String },
    homeBanner2: { type: String },
    homeBanner3: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Banner", bannerSchema);
