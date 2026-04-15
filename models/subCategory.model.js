const mongoose = require("mongoose");

// Define allowed sections (you can customize these)

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subcategory name is required"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    image: {
      type: String, // will store image URL
      required: false, // optional
      trim: true,
    },
    section: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = {
  subCategoryModel: mongoose.model("subCategory", subCategorySchema),
};
