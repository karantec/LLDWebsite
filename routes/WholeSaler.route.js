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
} = require("../controllers/wholesaler.controller");
const {
  protectWholesaler,
  admin,
  protect,
} = require("../middleware/auth.middleware");

// Public routes
router.post("/register", registerWholeSaler);
router.post("/login", loginWholeSaler);

// Protected routes
router.get("/me", protectWholesaler, getCurrentWholesaler);
router.get("/", getAllWholesalers);
router.get("/:id", protect, admin, getWholesalerById);
router.put("/:id", protect, admin, updateWholesaler);
router.delete("/:id", protect, admin, deleteWholesaler);

module.exports = router;
