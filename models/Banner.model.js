const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    homeBanner1: { type: String },
    homeBanner2: { type: String },
    homeBanner3: { type: String },
    homeBanner4: { type: String },
    homeBanner5: { type: String },
    homeBanner6: { type: String },
    homeBanner7: { type: String },
    homeBanner8: { type: String },
    homeBanner9: { type: String },
    homeBanner10: { type: String },
    homeBanner11: { type: String },
    homeBanner12: { type: String },
    homeBanner13: { type: String },
    homeBanner14: { type: String },
    homeBanner15: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Banner", bannerSchema);
