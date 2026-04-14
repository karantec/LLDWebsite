const router = require("express").Router();
const orderCtrl = require("../controllers/order.controller");

const { protect, admin } = require("../middleware/auth.middleware");

//
// 🔹 USER ROUTES
//
router.post("/create", protect, orderCtrl.createOrder);
router.post("/verify-payment", protect, orderCtrl.verifyPayment);
router.post("/payment-failed", protect, orderCtrl.paymentFailed);

router.get("/my-orders", protect, orderCtrl.getMyOrders);
router.get("/:id", protect, orderCtrl.getOrder);

//
// 🔹 ADMIN ROUTES
//
router.get("/admin/all", protect, admin, orderCtrl.getAllOrders);
router.put("/admin/:id/status", protect, admin, orderCtrl.updateOrderStatus);

module.exports = router;
