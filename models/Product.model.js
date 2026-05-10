const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 OPTION SCHEMA — each selectable option with its own price delta
// ─────────────────────────────────────────────────────────────────────────────
const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },

    /**
     * Price adjustment for this specific option.
     * ✅ Can be positive  (+50  → adds ₹50 to base price)
     * ✅ Can be negative  (-30  → subtracts ₹30 from base price)
     * ✅ Can be zero      (0    → no change, default)
     *
     * Final price = product.price + sum of priceAdjustment of all selected options
     */
    priceAdjustment: { type: Number, default: 0 },
  },
  { _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 CUSTOMIZATION SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const customizationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },

    type: {
      type: String,
      enum: ["radio", "checkbox", "dropdown", "text", "textarea", "file"],
      required: true,
    },

    /**
     * Replaces the old `options: [String]` array.
     * Each entry is now { label, priceAdjustment }.
     *
     * For "text" / "textarea" / "file" types this stays empty ([]).
     * For "radio" / "checkbox" / "dropdown" every choice gets its own delta.
     */
    options: { type: [optionSchema], default: [] },

    placeholder: { type: String, default: "" },

    required: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },

    // Cloudinary URLs for file/image uploads
    files: { type: [String], default: [] },

    // Stored value for non-file fields (Mixed keeps flexibility)
    value: { type: mongoose.Schema.Types.Mixed, default: null },

    showIf: {
      field: { type: String, default: "" },
      value: { type: String, default: "" },
    },
  },
  { _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 MEDIA SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 SPECIFICATION SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const specificationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 OFFER SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    active: { type: Boolean, default: true },
    expiryDate: { type: Date, default: null },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 WHOLESALER PRICE SCHEMA — For multiple wholesaler pricing
// ─────────────────────────────────────────────────────────────────────────────
const wholesalerPriceSchema = new mongoose.Schema(
  {
    wholesalerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WholeSaler",
      required: true,
    },
    defaultPrice: { type: Number, required: true, default: 0 },
    wholesalePrice: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 PRODUCT SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    // 📌 Basic Info
    name: { type: String, required: true, trim: true },
    productName: { type: String, default: "" },
    description: { type: String, default: "" },

    // 📝 Specifications
    specifications: { type: [specificationSchema], default: [] },

    // 🖼️ Media
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    canvasimages: { type: [String], default: [] },
    media: { type: [mediaSchema], default: [] },

    // 📂 Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },

    // 💰 Pricing
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: null },
    discount: { type: Number, default: 0 },
    discountedMRP: { type: Number, default: null },
    amountSaving: { type: Number, default: null },

    // � wholesale pricing - NEW: Support for multiple wholesalers
    wholesalerPrices: { type: [wholesalerPriceSchema], default: [] },

    // ⚠️ DEPRECATED: These fields are kept for backward compatibility
    // Will be removed in future version. Use wholesalerPrices instead.
    WholeSaler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WholeSaler",
      required: false,
    },
    wholeSalerDefault: { type: Number, default: 0 },
    wholeSalerPrice: { type: Number, default: 0 },

    // 📦 Stock
    stock: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    pack: { type: String, default: "" },

    // ⭐ Ratings
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },

    // 🏷️ Tags
    tags: { type: [String], default: [] },

    // 🚀 Super Tags (max 5)
    superTags: {
      type: [String],
      enum: ["design1", "design2", "design3", "design4", "design5"],
      default: [],
      validate: [(val) => val.length <= 5, "Max 5 super tags allowed"],
    },

    // 🎁 Offers
    offers: { type: [offerSchema], default: [] },

    // 🚩 Flags
    popular: { type: Boolean, default: false },
    active: { type: Boolean, default: true },

    // 🎯 Customizations (each option now has its own priceAdjustment)
    customizations: { type: [customizationSchema], default: [] },

    // 🧩 Extra flexible data
    more_details: { type: Object, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 AUTO CALCULATE PRICING (from base price only — customization deltas are
//    computed at order/cart time, not stored on the product itself)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 INSTANCE METHOD — compute final price from selected option labels
//
//    Usage (e.g. in your order/cart controller):
//      const product = await Product.findById(id);
//      const finalPrice = product.computeFinalPrice({
//        size:     'XL',          // radio / dropdown
//        addons:   ['Gift wrap', 'Express delivery'],  // checkbox (multiple)
//      });
// ─────────────────────────────────────────────────────────────────────────────
productSchema.methods.computeFinalPrice = function (selectedOptions = {}) {
  let total = this.price;

  for (const customization of this.customizations) {
    const chosen = selectedOptions[customization.id];
    if (!chosen) continue;

    const chosenArray = Array.isArray(chosen) ? chosen : [chosen];

    for (const chosenLabel of chosenArray) {
      const match = customization.options.find((o) => o.label === chosenLabel);
      if (match) total += match.priceAdjustment;
    }
  }

  return Math.max(0, total); // never go below 0
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 INSTANCE METHOD — Get wholesale price for a specific wholesaler
//
//    Usage:
//      const product = await Product.findById(id);
//      const wholesalePrice = product.getWholesalePrice(wholesalerId);
//      console.log(wholesalePrice); // { defaultPrice: 1000, wholesalePrice: 800 }
// ─────────────────────────────────────────────────────────────────────────────
productSchema.methods.getWholesalePrice = function (wholesalerId) {
  // Check in new wholesalerPrices array
  const wholesalerPrice = this.wholesalerPrices.find(
    (wp) => wp.wholesalerId.toString() === wholesalerId.toString(),
  );

  if (wholesalerPrice) {
    return {
      defaultPrice: wholesalerPrice.defaultPrice,
      wholesalePrice: wholesalerPrice.wholesalePrice,
    };
  }

  // Fallback to deprecated fields for backward compatibility
  if (
    this.WholeSaler &&
    this.WholeSaler.toString() === wholesalerId.toString()
  ) {
    return {
      defaultPrice: this.wholeSalerDefault,
      wholesalePrice: this.wholeSalerPrice,
    };
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 INSTANCE METHOD — Get all wholesaler prices
//
//    Usage:
//      const product = await Product.findById(id);
//      const allPrices = product.getAllWholesalerPrices();
//      // Returns array of { wholesalerId, defaultPrice, wholesalePrice }
// ─────────────────────────────────────────────────────────────────────────────
productSchema.methods.getAllWholesalerPrices = function () {
  if (this.wholesalerPrices && this.wholesalerPrices.length > 0) {
    return this.wholesalerPrices;
  }

  // Fallback for backward compatibility
  if (this.WholeSaler) {
    return [
      {
        wholesalerId: this.WholeSaler,
        defaultPrice: this.wholeSalerDefault,
        wholesalePrice: this.wholeSalerPrice,
      },
    ];
  }

  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 INSTANCE METHOD — Add or update wholesaler price
//
//    Usage:
//      const product = await Product.findById(id);
//      product.setWholesalerPrice(wholesalerId, 1000, 800);
//      await product.save();
// ─────────────────────────────────────────────────────────────────────────────
productSchema.methods.setWholesalerPrice = function (
  wholesalerId,
  defaultPrice,
  wholesalePrice,
) {
  const existingIndex = this.wholesalerPrices.findIndex(
    (wp) => wp.wholesalerId.toString() === wholesalerId.toString(),
  );

  if (existingIndex >= 0) {
    // Update existing
    this.wholesalerPrices[existingIndex].defaultPrice = defaultPrice;
    this.wholesalerPrices[existingIndex].wholesalePrice = wholesalePrice;
  } else {
    // Add new
    this.wholesalerPrices.push({
      wholesalerId,
      defaultPrice,
      wholesalePrice,
    });
  }

  return this;
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 INSTANCE METHOD — Remove wholesaler price
//
//    Usage:
//      const product = await Product.findById(id);
//      product.removeWholesalerPrice(wholesalerId);
//      await product.save();
// ─────────────────────────────────────────────────────────────────────────────
productSchema.methods.removeWholesalerPrice = function (wholesalerId) {
  this.wholesalerPrices = this.wholesalerPrices.filter(
    (wp) => wp.wholesalerId.toString() !== wholesalerId.toString(),
  );
  return this;
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 STATIC METHOD — Find products by wholesaler
//
//    Usage:
//      const products = await Product.findByWholesaler(wholesalerId);
// ─────────────────────────────────────────────────────────────────────────────
productSchema.statics.findByWholesaler = function (wholesalerId) {
  return this.find({
    $or: [
      { "wholesalerPrices.wholesalerId": wholesalerId },
      { WholeSaler: wholesalerId },
    ],
  }).populate("wholesalerPrices.wholesalerId", "storeName pin city");
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 STATIC METHOD — Find products with wholesale price range
//
//    Usage:
//      const products = await Product.findByWholesalePriceRange(500, 1000);
// ─────────────────────────────────────────────────────────────────────────────
productSchema.statics.findByWholesalePriceRange = function (
  minPrice,
  maxPrice,
) {
  return this.find({
    $or: [
      { "wholesalerPrices.wholesalePrice": { $gte: minPrice, $lte: maxPrice } },
      { wholeSalerPrice: { $gte: minPrice, $lte: maxPrice } },
    ],
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 VIRTUAL — Get wholesaler count
// ─────────────────────────────────────────────────────────────────────────────
productSchema.virtual("wholesalerCount").get(function () {
  return this.wholesalerPrices.length;
});

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 VIRTUAL — Get formatted wholesale prices for API response
// ─────────────────────────────────────────────────────────────────────────────
productSchema.virtual("formattedWholesalerPrices").get(function () {
  return this.wholesalerPrices.map((wp) => ({
    wholesalerId: wp.wholesalerId,
    defaultPrice: `₹${wp.defaultPrice.toLocaleString("en-IN")}`,
    wholesalePrice: `₹${wp.wholesalePrice.toLocaleString("en-IN")}`,
    discount: `${(((wp.defaultPrice - wp.wholesalePrice) / wp.defaultPrice) * 100).toFixed(1)}%`,
  }));
});

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 EXPORT
// ─────────────────────────────────────────────────────────────────────────────
module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
