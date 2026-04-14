const mongoose = require("mongoose");
const Product = require("../models/Product.model");
const Category = require("../models/Category.model");
const SubCategory = require("../models/subCategory.model");

//
// 🔹 VALIDATION FUNCTION (UPDATED)
//
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

  for (let c of customizations) {
    if (!c.id || !c.label || !c.type) {
      return "Each customization must have id, label, type";
    }

    if (!allowedTypes.includes(c.type)) {
      return `Invalid customization type: ${c.type}`;
    }

    // ✅ Options validation
    if (
      ["radio", "checkbox", "dropdown"].includes(c.type) &&
      (!c.options || c.options.length === 0)
    ) {
      return `Options required for ${c.type}`;
    }

    // ✅ File validation
    if (c.type === "file") {
      if (c.required && (!c.files || c.files.length === 0)) {
        return `${c.label} is required`;
      }

      if (c.files && !Array.isArray(c.files)) {
        return `files must be array in ${c.label}`;
      }
    }

    // ✅ Value validation
    if (c.type !== "file") {
      if (c.required && (c.value === null || c.value === "")) {
        return `${c.label} is required`;
      }
    }
  }

  return null;
};

//
// 🔹 NORMALIZE CUSTOMIZATION DATA
//
const normalizeCustomizations = (customizations) => {
  return customizations.map((c) => ({
    ...c,
    files: c.files || [],
    value: c.value ?? null,
  }));
};

//
// 🔹 GET PRODUCTS BY SUBCATEGORIES (MISSING FUNCTION - FIXED)
//
exports.getProductsBySubCategories = async (req, res) => {
  try {
    const { subCategories } = req.query;

    let filter = {};

    if (subCategories) {
      const subCategoryArray = subCategories.split(",");
      filter.subCategory = { $in: subCategoryArray };
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get Products By SubCategories Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//
// 🔹 CREATE PRODUCT
//
exports.createProduct = async (req, res) => {
  try {
    const data = req.body;

    // ✅ Required fields
    const requiredFields = ["name", "category", "subCategory", "price"];
    const missing = requiredFields.filter((f) => !data[f]);

    if (missing.length) {
      return res.status(400).json({
        message: `Missing fields: ${missing.join(", ")}`,
      });
    }

    // ✅ Category check
    if (!mongoose.Types.ObjectId.isValid(data.category)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Category not found" });
    }

    // ✅ SubCategory check
    if (!mongoose.Types.ObjectId.isValid(data.subCategory)) {
      return res.status(400).json({ message: "Invalid subCategory ID" });
    }

    const subCategoryExists = await SubCategory.findById(data.subCategory);
    if (!subCategoryExists) {
      return res.status(400).json({ message: "SubCategory not found" });
    }

    // 🔥 Customizations
    if (data.customizations) {
      data.customizations = normalizeCustomizations(data.customizations);

      const error = validateCustomizations(data.customizations);
      if (error) return res.status(400).json({ message: error });
    }

    // ✅ Media validation
    if (data.media && !Array.isArray(data.media)) {
      return res.status(400).json({ message: "media must be an array" });
    }

    // ✅ SuperTags validation
    if (data.superTags && data.superTags.length > 5) {
      return res.status(400).json({
        message: "Maximum 5 superTags allowed",
      });
    }

    // ✅ Create
    const product = await Product.create(data);

    const populated = await Product.findById(product._id)
      .populate("category", "name")
      .populate("subCategory", "name");

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

//
// 🔹 GET ALL PRODUCTS
//
exports.getAllProducts = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      popular,
      active,
      search,
      page = 1,
      limit = 10,
    } = req.query;

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

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("subCategory", "name")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      data: products,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//
// 🔹 GET PRODUCT BY ID
//
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id)
      .populate("category", "name")
      .populate("subCategory", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//
// 🔹 UPDATE PRODUCT
//
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // 🔥 Customizations
    if (data.customizations) {
      data.customizations = normalizeCustomizations(data.customizations);

      const error = validateCustomizations(data.customizations);
      if (error) return res.status(400).json({ message: error });
    }

    // ✅ SuperTags validation
    if (data.superTags && data.superTags.length > 5) {
      return res.status(400).json({
        message: "Maximum 5 superTags allowed",
      });
    }

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name")
      .populate("subCategory", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

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

//
// 🔹 DELETE PRODUCT
//
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

//
// 🔹 GET PRODUCTS BY CATEGORY
//
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

//
// 🔹 GET PRODUCTS BY SUBCATEGORY
//
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

//
// 🔹 GET POPULAR PRODUCTS
//
exports.getPopularProducts = async (req, res) => {
  try {
    const products = await Product.find({
      popular: true,
      active: true,
    })
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

//
// 🔹 TOGGLE ACTIVE STATUS
//
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

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
