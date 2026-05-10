const mongoose = require("mongoose");
const Product = require("../models/Product.model");
const Category = require("../models/Category.model");
const SubCategory = require("../models/subCategory.model");

const WholeSaler = require("../models/WholeSaler.model");
const populateFields = [
  { path: "category", select: "name" },
  {
    path: "subCategory",
    select: "name section",
    populate: {
      path: "section",
      select: "name",
    },
  },
];
// ─────────────────────────────────────────────────────────────────────────────
// 🔹 VALIDATE CUSTOMIZATIONS
// ─────────────────────────────────────────────────────────────────────────────
const validateCustomizations = (customizations) => {
  if (!Array.isArray(customizations)) {
    return "customizations must be an array";
  }

  const allowedTypes = [
    "radio",
    "checkbox",
    "dropdown",
    "text",
    "textarea",
    "file",
  ];

  for (const c of customizations) {
    if (!c.id || !c.label || !c.type) {
      return "Each customization must have id, label, type";
    }

    if (!allowedTypes.includes(c.type)) {
      return `Invalid customization type: ${c.type}`;
    }

    // ✅ Options validation for choice-based types
    if (["radio", "checkbox", "dropdown"].includes(c.type)) {
      if (!c.options || c.options.length === 0) {
        return `Options required for ${c.type} in "${c.label}"`;
      }

      for (const opt of c.options) {
        // Each option must be { label, priceAdjustment }
        if (
          !opt.label ||
          typeof opt.label !== "string" ||
          opt.label.trim() === ""
        ) {
          return `Each option in "${c.label}" must have a non-empty label`;
        }

        if (
          opt.priceAdjustment !== undefined &&
          typeof opt.priceAdjustment !== "number"
        ) {
          return `priceAdjustment in "${c.label}" → "${opt.label}" must be a number`;
        }
      }
    }

    // ✅ File validation
    if (c.type === "file") {
      if (c.required && (!c.files || c.files.length === 0)) {
        return `"${c.label}" is required`;
      }
      if (c.files && !Array.isArray(c.files)) {
        return `files must be an array in "${c.label}"`;
      }
    }

    // ✅ Value validation for non-file types
    if (c.type !== "file") {
      if (c.required && (c.value === null || c.value === "")) {
        return `"${c.label}" is required`;
      }
    }
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 NORMALIZE CUSTOMIZATIONS
//    • Ensures options are always { label, priceAdjustment }
//    • Accepts legacy plain-string options and auto-converts them
// ─────────────────────────────────────────────────────────────────────────────
const normalizeCustomizations = (customizations) => {
  return customizations.map((c) => ({
    ...c,
    files: c.files || [],
    value: c.value ?? null,
    options: (c.options || []).map((opt) => {
      // Legacy support: if opt is a plain string, convert it
      if (typeof opt === "string") {
        return { label: opt, priceAdjustment: 0 };
      }
      return {
        label: opt.label,
        priceAdjustment:
          typeof opt.priceAdjustment === "number" ? opt.priceAdjustment : 0,
      };
    }),
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 COMPUTE FINAL PRICE (helper for order/cart use)
//    selectedOptions: { [customizationId]: string | string[] }
// ─────────────────────────────────────────────────────────────────────────────
const computeFinalPrice = (product, selectedOptions = {}) => {
  let total = product.price;

  for (const customization of product.customizations) {
    const chosen = selectedOptions[customization.id];
    if (!chosen) continue;

    const chosenArray = Array.isArray(chosen) ? chosen : [chosen];

    for (const chosenLabel of chosenArray) {
      const match = customization.options.find((o) => o.label === chosenLabel);
      if (match) total += match.priceAdjustment;
    }
  }

  return Math.max(0, total);
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 GET PRODUCTS BY SUBCATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductsBySubCategories = async (req, res) => {
  try {
    const { subCategories } = req.query;

    const filter = {};
    if (subCategories) {
      filter.subCategory = { $in: subCategories.split(",") };
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error("Get Products By SubCategories Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 CREATE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const data = req.body;

    // Required fields
    const missing = [
      "name",
      "category",
      "subCategory",
      "price",
      "WholeSaler",
    ].filter((f) => !data[f]);
    if (missing.length) {
      return res
        .status(400)
        .json({ message: `Missing fields: ${missing.join(", ")}` });
    }

    // Category check
    if (!mongoose.Types.ObjectId.isValid(data.category)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    if (!(await Category.findById(data.category))) {
      return res.status(400).json({ message: "Category not found" });
    }

    // SubCategory check
    if (!mongoose.Types.ObjectId.isValid(data.subCategory)) {
      return res.status(400).json({ message: "Invalid subCategory ID" });
    }
    if (!(await SubCategory.findById(data.subCategory))) {
      return res.status(400).json({ message: "SubCategory not found" });
    }

    // ✅ WholeSaler validation - Check if the provided wholesaler ID exists
    if (!mongoose.Types.ObjectId.isValid(data.WholeSaler)) {
      return res.status(400).json({ message: "Invalid WholeSaler ID" });
    }
    const wholesaler = await WholeSaler.findById(data.WholeSaler);
    if (!wholesaler) {
      return res.status(400).json({ message: "WholeSaler not found" });
    }

    // Optional: Set wholesaler prices based on wholesaler data
    // You can add logic here to auto-populate wholeSalerDefault and wholeSalerPrice
    // based on the selected wholesaler's pricing rules

    // Customizations
    if (data.customizations) {
      data.customizations = normalizeCustomizations(data.customizations);
      const error = validateCustomizations(data.customizations);
      if (error) return res.status(400).json({ message: error });
    }

    // Media
    if (data.media && !Array.isArray(data.media)) {
      return res.status(400).json({ message: "media must be an array" });
    }

    // SuperTags
    if (data.superTags && data.superTags.length > 5) {
      return res.status(400).json({ message: "Maximum 5 superTags allowed" });
    }

    const product = await Product.create(data);
    const populated = await Product.findById(product._id)
      .populate("category", "name")
      .populate("subCategory", "name")
      .populate("WholeSaler", "storeName email pin phoneNumber");

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populated,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// 🔹 GET ALL PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
// exports.getAllProducts = async (req, res) => {
//   try {
//     const { category, subCategory, popular, active, search } = req.query;

//     const filter = {};
//     if (category) filter.category = category;
//     if (subCategory) filter.subCategory = subCategory;
//     if (popular) filter.popular = popular === "true";
//     if (active) filter.active = active === "true";

//     if (search) {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { productName: { $regex: search, $options: "i" } },
//       ];
//     }

//     const [products, total] = await Promise.all([
//       Product.find(filter)
//         .populate("category", "name")
//         .populate("subCategory", "name")
//         .sort({ createdAt: -1 }),
//       Product.countDocuments(filter),
//     ]);

//     return res.status(200).json({ success: true, total, data: products });
//   } catch (error) {
//     console.error("Get All Products Error:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };
exports.getAllProducts = async (req, res) => {
  try {
    const { category, subCategory, popular, active, search } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (popular) filter.popular = popular === "true";
    if (active) filter.active = active === "true";

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { productName: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ FETCH WITH POPULATE
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .populate("subCategory", "name image section") // 👈 include image
        .sort({ createdAt: -1 }),

      Product.countDocuments(filter),
    ]);

    // ✅ TRANSFORM RESPONSE (IMPORTANT)
    const updatedProducts = products.map((p) => {
      const subCat = p.subCategory || {};

      return {
        ...p._doc,

        // ✅ clean subCategory object
        subCategory: {
          _id: subCat._id,
          name: subCat.name,
          section: subCat.section || null,
          image: subCat.image || p.media?.[0]?.url || null, // 👈 fallback fix
        },
      };
    });

    return res.status(200).json({
      success: true,
      total,
      data: updatedProducts,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 GET PRODUCT BY ID
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id)
      .populate("category", "name")
      .populate("subCategory", "name");

    if (!product) return res.status(404).json({ message: "Product not found" });

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 COMPUTE PRICE ENDPOINT
//    POST /api/products/:id/compute-price
//    Body: { selectedOptions: { [customizationId]: string | string[] } }
// ─────────────────────────────────────────────────────────────────────────────
exports.computePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedOptions = {} } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const basePrice = product.price;
    const finalPrice = computeFinalPrice(product, selectedOptions);
    const delta = finalPrice - basePrice;

    return res.status(200).json({
      success: true,
      basePrice,
      finalPrice,
      adjustment: delta, // total +/- applied
      adjustmentLabel: delta >= 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`,
    });
  } catch (error) {
    console.error("Compute Price Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Customizations
    if (data.customizations) {
      data.customizations = normalizeCustomizations(data.customizations);
      const error = validateCustomizations(data.customizations);
      if (error) return res.status(400).json({ message: error });
    }

    // SuperTags
    if (data.superTags && data.superTags.length > 5) {
      return res.status(400).json({ message: "Maximum 5 superTags allowed" });
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name")
      .populate("subCategory", "name");

    if (!product) return res.status(404).json({ message: "Product not found" });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 DELETE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    return res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 GET PRODUCTS BY CATEGORY
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const products = await Product.find({ category: categoryId, active: true })
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ rating: -1 });

    return res
      .status(200)
      .json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error("Get Products By Category Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 GET PRODUCTS BY SUBCATEGORY
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductsBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
      return res.status(400).json({ message: "Invalid subCategory ID" });
    }

    const products = await Product.find({
      subCategory: subCategoryId,
      active: true,
    })
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ rating: -1 });

    return res
      .status(200)
      .json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error("Get Products By SubCategory Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 GET POPULAR PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
exports.getPopularProducts = async (req, res) => {
  try {
    const products = await Product.find({ popular: true, active: true })
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ rating: -1 })
      .limit(10);

    return res
      .status(200)
      .json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error("Get Popular Products Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔹 TOGGLE ACTIVE STATUS
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.active = !product.active;
    await product.save();

    return res.status(200).json({
      success: true,
      active: product.active,
      message: `Product ${product.active ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Toggle Product Status Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
