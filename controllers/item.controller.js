const mongoose = require("mongoose");
const Product = require("../models/Product.model");
const Category = require("../models/Category.model");
const SubCategory = require("../models/subCategory.model");

// ✅ Create Product
const createProduct = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message:
          "Request body is empty or invalid. Make sure you're sending JSON data.",
      });
    }

    const productData = req.body;

    // Validate required fields
    const requiredFields = ["name", "category", "subCategory"];
    const missingFields = requiredFields.filter((f) => !productData[f]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `The following fields are required: ${missingFields.join(", ")}`,
        missingFields,
      });
    }

    // Validate category (single ObjectId)
    if (!mongoose.Types.ObjectId.isValid(productData.category)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    const categoryExists = await Category.findById(productData.category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Category not found" });
    }

    // Validate subCategory (single ObjectId)
    if (!mongoose.Types.ObjectId.isValid(productData.subCategory)) {
      return res.status(400).json({ message: "Invalid subCategory ID" });
    }
    const subCategoryExists = await SubCategory.findById(
      productData.subCategory,
    );
    if (!subCategoryExists) {
      return res.status(400).json({ message: "SubCategory not found" });
    }

    // Validate customizations if provided
    if (
      productData.customizations &&
      !Array.isArray(productData.customizations)
    ) {
      return res
        .status(400)
        .json({ message: "customizations must be an array" });
    }

    // Validate media if provided
    if (productData.media && !Array.isArray(productData.media)) {
      return res.status(400).json({ message: "media must be an array" });
    }

    const product = await Product.create(productData);

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("subCategory", "name");

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Get All Products
const getAllProducts = async (req, res) => {
  try {
    // Optional filters via query params
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subCategory) filter.subCategory = req.query.subCategory;
    if (req.query.popular) filter.popular = req.query.popular === "true";
    if (req.query.active) filter.active = req.query.active === "true";

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: products.length,
      data: products,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Get Product by ID
const getProductById = async (req, res) => {
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

    return res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Update Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Validate category if updating
    if (updateData.category) {
      if (!mongoose.Types.ObjectId.isValid(updateData.category)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Category not found" });
      }
    }

    // Validate subCategory if updating
    if (updateData.subCategory) {
      if (!mongoose.Types.ObjectId.isValid(updateData.subCategory)) {
        return res.status(400).json({ message: "Invalid subCategory ID" });
      }
      const subCategoryExists = await SubCategory.findById(
        updateData.subCategory,
      );
      if (!subCategoryExists) {
        return res.status(400).json({ message: "SubCategory not found" });
      }
    }

    // Validate customizations if updating
    if (
      updateData.customizations &&
      !Array.isArray(updateData.customizations)
    ) {
      return res
        .status(400)
        .json({ message: "customizations must be an array" });
    }

    // Validate media if updating
    if (updateData.media && !Array.isArray(updateData.media)) {
      return res.status(400).json({ message: "media must be an array" });
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
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
    console.error("Error updating product:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Delete Product
const deleteProduct = async (req, res) => {
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
      product,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Category wise products
const categoryWiseProduct = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Support both ObjectId and name lookup
    let categoryDoc;
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryDoc = await Category.findById(category);
    } else {
      categoryDoc = await Category.findOne({ name: category });
    }

    if (!categoryDoc) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({ category: categoryDoc._id })
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Category wise products fetched",
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ SubCategory wise products
const getProductsBySubCategories = async (req, res) => {
  try {
    let { subCategories } = req.query;

    if (!subCategories) {
      return res
        .status(400)
        .json({ message: "subCategories query is required" });
    }

    if (typeof subCategories === "string") {
      subCategories = subCategories.split(",").map((s) => s.trim());
    }

    const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    let query;
    if (subCategories.every(isObjectId)) {
      query = {
        subCategory: {
          $in: subCategories.map((id) => new mongoose.Types.ObjectId(id)),
        },
      };
    } else {
      // Lookup by name
      const subCategoryDocs = await SubCategory.find({
        name: { $in: subCategories },
      });
      const ids = subCategoryDocs.map((s) => s._id);
      if (!ids.length) {
        return res
          .status(404)
          .json({ message: "No matching subCategories found" });
      }
      query = { subCategory: { $in: ids } };
    }

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products by subCategories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Get Popular Products
const getPopularProducts = async (req, res) => {
  try {
    const products = await Product.find({ popular: true, active: true })
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ rating: -1 });

    return res.status(200).json({
      success: true,
      total: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ Toggle Product Active Status
const toggleProductStatus = async (req, res) => {
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
      message: `Product ${product.active ? "activated" : "deactivated"} successfully`,
      active: product.active,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  categoryWiseProduct,
  getProductsBySubCategories,
  getPopularProducts,
  toggleProductStatus,
};
