const express = require("express");
const router = express.Router();
const {
  registerWholeSaler,
  loginWholeSaler,
  getAllWholesalers,
  getWholesalerById,
  updateWholesaler,
  deleteWholesaler,
  getCurrentWholesaler,
} = require("../controllers/WholeSaler.controller");
const { admin, protect } = require("../middleware/auth.middleware");

// Public routes
router.post("/register", registerWholeSaler);
router.post("/login", loginWholeSaler);
router.get("/", getAllWholesalers); // Made public for product dropdown

// Protected routes (require authentication)
router.get("/me", protect, getCurrentWholesaler);
router.get("/:id", protect, admin, getWholesalerById);
router.put("/:id", protect, admin, updateWholesaler);
router.delete("/:id", protect, admin, deleteWholesaler);

module.exports = router;
