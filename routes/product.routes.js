const express = require("express");
const {
  getProductsBySubCategories,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsBySubCategory,
  getPopularProducts,
  toggleProductStatus,
  computePrice,
} = require("../controllers/item.controller");
const { protect, admin } = require("../middleware/auth.middleware");

const router = express.Router();

// ─── Public Routes ─────────────────────────────────────────
// Get products by subcategories (query param)
router.get("/subcategories", getProductsBySubCategories);

// Get all products with filters
router.get("/", getAllProducts);

// Get popular products
router.get("/popular/all", getPopularProducts);

// Get products by category
router.get("/category/:categoryId", getProductsByCategory);

// Get products by subcategory
router.get("/subcategory/:subCategoryId", getProductsBySubCategory);

// Compute price for a product (no auth needed for price calc)
router.post("/:id/compute-price", computePrice);

// Get single product by ID (must be after specific routes to avoid conflicts)
router.get("/:id", getProductById);

// ─── Admin Routes ──────────────────────────────────────────
// Create product
router.post("/create", protect, admin, createProduct);
//
router.post("/createCard", createProduct);

// Update product
router.put("/:id", protect, admin, updateProduct);

// Delete product
router.delete("/:id", protect, admin, deleteProduct);

// Toggle product active status
router.patch("/:id/toggle-status", protect, admin, toggleProductStatus);

module.exports = router;
