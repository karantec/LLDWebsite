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

// Protected routes
router.get("/me", getCurrentWholesaler);
router.get("/", getAllWholesalers);
router.get("/:id", protect, admin, admin, getWholesalerById);
router.put("/:id", protect, admin, updateWholesaler);
router.delete("/:id", protect, admin, deleteWholesaler);

module.exports = router;
