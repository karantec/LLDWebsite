const mongoose = require("mongoose");

//
// 🔹 CUSTOMIZATION SCHEMA (UPDATED ✅ IMAGE SUPPORT)
//
const customizationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },

    type: {
      type: String,
      enum: ["radio", "checkbox", "dropdown", "text", "textarea", "file"],
      required: true,
    },

    options: { type: [String], default: [] },
    placeholder: { type: String, default: "" },

    required: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },

    // ✅ NEW: store uploaded image/file URLs
    files: {
      type: [String], // Cloudinary URLs
      default: [],
    },

    // ✅ NEW: store value for non-file fields
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    showIf: {
      field: { type: String, default: "" },
      value: { type: String, default: "" },
    },
  },
  { _id: false },
);

//
// 🔹 MEDIA SCHEMA
//
const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

//
// 🔹 SPECIFICATION SCHEMA
//
const specificationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

//
// 🔹 OFFER SCHEMA
//
const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    active: { type: Boolean, default: true },
    expiryDate: { type: Date, default: null },
  },
  { timestamps: true },
);

//
// 🔹 PRODUCT SCHEMA
//
const productSchema = new mongoose.Schema(
  {
    // 📌 Basic Info
    name: { type: String, required: true, trim: true },
    productName: { type: String, default: "" },
    description: { type: String, default: "" },

    // 📝 Specifications
    specifications: {
      type: [specificationSchema],
      default: [],
    },

    // 🖼️ Media
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    media: { type: [mediaSchema], default: [] },

    // 📂 Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },

    // 💰 Pricing
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: null },
    discount: { type: Number, default: 0 },
    discountedMRP: { type: Number, default: null },
    amountSaving: { type: Number, default: null },

    // 📦 Stock
    stock: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    pack: { type: String, default: "" },

    // ⭐ Ratings
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },

    // 🏷️ TAGS
    tags: {
      type: [String],
      default: [],
    },

    // 🚀 SUPER TAGS (MAX 5)
    superTags: {
      type: [String],
      enum: ["design1", "design2", "design3", "design4", "design5"],
      default: [],
      validate: [(val) => val.length <= 5, "Max 5 super tags allowed"],
    },

    // 🎁 OFFERS
    offers: {
      type: [offerSchema],
      default: [],
    },

    // 🚩 Flags
    popular: { type: Boolean, default: false },
    active: { type: Boolean, default: true },

    // 🎯 CUSTOMIZATION (NOW SUPPORTS IMAGE ✅)
    customizations: {
      type: [customizationSchema],
      default: [],
    },

    // 🧩 Extra flexible data
    more_details: { type: Object, default: {} },
  },
  { timestamps: true },
);

//
// 🔹 AUTO CALCULATE PRICING
//
productSchema.pre("save", function (next) {
  if (this.originalPrice && this.price) {
    this.discount = Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100,
    );
    this.amountSaving = this.originalPrice - this.price;
    this.discountedMRP = this.price;
  }
  next();
});

//
// 🔹 EXPORT
//
module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
