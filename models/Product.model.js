const mongoose = require("mongoose");

// Customization option schema (for each customization field on a product)
const customizationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // e.g. "size", "finish"
    label: { type: String, required: true }, // e.g. "Card Size"
    type: {
      type: String,
      enum: ["radio", "checkbox", "dropdown", "text", "textarea", "file"],
      required: true,
    },
    options: { type: [String], default: [] }, // for radio/checkbox/dropdown
    placeholder: { type: String, default: "" }, // for text/textarea
    showIf: {
      // conditional display
      field: { type: String, default: "" },
      value: { type: String, default: "" },
    },
  },
  { _id: false },
);

// Media schema (images + videos)
const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true, trim: true },
    productName: { type: String, default: "" },
    description: { type: String, default: "" },

    // Media
    image: { type: String, default: "" }, // primary thumbnail
    images: { type: [String], default: [] }, // extra images (legacy support)
    media: { type: [mediaSchema], default: [] }, // images + videos combined

    // Category References
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subCategory",
    },

    // Pricing
    price: { type: Number, default: null },
    originalPrice: { type: Number, default: null },
    discountedMRP: { type: Number, default: null },
    discount: { type: Number, default: null },
    amountSaving: { type: Number, default: null },

    // Stock & Unit
    stock: { type: Number, default: null },
    unit: { type: String, default: "" },
    pack: { type: String, default: "" },

    // Ratings
    rating: { type: Number, default: null },
    reviews: { type: Number, default: 0 },

    // Flags
    popular: { type: Boolean, default: false },
    active: { type: Boolean, default: true },

    // Customizations (per product config)
    customizations: { type: [customizationSchema], default: [] },

    // Extra flexible fields
    more_details: { type: Object, default: {} },
  },
  { timestamps: true },
);

const ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;
