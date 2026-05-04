const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const Cart = require("../models/Cart.model");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

//
// 🔹 CREATE ORDER
//
exports.createOrder = async (req, res) => {
  try {
    console.log("🔥 NEW CREATE ORDER HIT");

    const userId = req.user._id;
    const { items, shippingAddress, paymentMethod } = req.body;

    // ✅ Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // ✅ FIXED: correct fields
    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.line1 || // ✅ FIXED
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode
    ) {
      return res.status(400).json({
        message: "Complete shipping address is required",
      });
    }

    console.log("REQ ITEMS:", JSON.stringify(items, null, 2));

    const products = await Product.find({
      _id: { $in: items.map((i) => i.product) },
    });

    let subTotal = 0;

    const orderItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.product);

      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }

      let totalQty = 0;
      let lineTotal = 0;

      const designs = (item.designs || []).map((d) => {
        const qty = d.quantity || 1;

        totalQty += qty;
        lineTotal += product.price * qty;

        return {
          config: d.config || {},
          quantity: qty,
        };
      });

      // ✅ fallback if no designs sent
      if (!item.designs || item.designs.length === 0) {
        totalQty = item.quantity || 1;
        lineTotal = product.price * totalQty;
      }

      subTotal += lineTotal;

      return {
        product: product._id,
        name: product.name,
        image: product.image,
        unit: product.unit,
        mrp: product.originalPrice,
        sellingPrice: product.price,
        discount: product.discount,
        quantity: totalQty,
        lineTotal,
        designs,
      };
    });

    const deliveryFee = 50;
    const totalAmount = subTotal + deliveryFee;

    // ✅ FIX: match schema structure
    let paymentData = {
      method: paymentMethod, // expects "COD" or "ONLINE"
      status: "NOT_INITIATED",
      amount: totalAmount,
      currency: "INR",
    };

    let razorpayOrder = null;

    if (paymentMethod === "ONLINE") {
      razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
        receipt: `order_${Date.now()}`,
      });

      paymentData = {
        method: "ONLINE",
        status: "CREATED",
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: "INR",
      };
    }

    const order = await Order.create({
      user: userId,
      items: orderItems,
      subTotal,
      deliveryFee,
      totalAmount,
      shippingAddress,
      payment: paymentData,
      status: "PLACED",
      trackingUpdates: [],
    });

    res.status(201).json({
      success: true,
      order,
      razorpayOrder,
    });
  } catch (err) {
    console.error("❌ CREATE ORDER ERROR:", err);
    res.status(500).json({
      message: err.message || "Create order failed",
    });
  }
};
//
// 🔹 VERIFY PAYMENT
//
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res
        .status(400)
        .json({ message: "Missing payment verification details" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.payment.status = "PAID";
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.paidAt = new Date();

    await order.save();

    // Clear user's cart after successful payment
    await Cart.updateOne(
      { user: order.user },
      { $set: { items: [], subTotal: 0, grandTotal: 0 } },
    );

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};

//
// 🔹 PAYMENT FAILED
//
exports.paymentFailed = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.payment.status = "FAILED";
    order.payment.failedReason = reason || "Payment failed";

    await order.save();

    res.json({ success: true, message: "Payment failure recorded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating payment" });
  }
};

//
// 🔹 GET MY ORDERS
//
exports.getMyOrders = async (req, res) => {
  try {
    console.log("🚀 ORDER CONTROLLER - getMyOrders called");
    console.log("URL:", req.originalUrl);
    console.log("User:", req.user?._id);

    const orders = await Order.find({ user: req.user._id })
      .populate("items.product")
      .populate("trackingUpdates.updatedBy", "name email")
      .sort({ createdAt: -1 });

    console.log("Orders found:", orders.length);
    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

//
// 🔹 GET SINGLE ORDER
//
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product")
      .populate("trackingUpdates.updatedBy", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is authorized (owner or admin)
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

//
// 🔹 CANCEL ORDER (UPDATED)
//
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const orderId = req.params.id;

    // Validate reason
    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 🔒 Only owner can cancel
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - You can only cancel your own orders",
      });
    }

    // ❌ Prevent cancel if already delivered
    if (order.status === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot cancel delivered order. Please contact customer support.",
      });
    }

    // ❌ Prevent cancel if already shipped (optional - depends on your policy)
    if (order.status === "SHIPPED") {
      return res.status(400).json({
        success: false,
        message:
          "Order has already been shipped. Please contact customer support for cancellation.",
      });
    }

    // ❌ Prevent duplicate cancel
    if (order.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
        cancelledAt: order.updatedAt,
      });
    }

    // Store original status for reference
    const originalStatus = order.status;

    // 🔄 Update status
    order.status = "CANCELLED";

    // 💰 Handle refund logic (if online payment)
    if (order.payment.method === "ONLINE" && order.payment.status === "PAID") {
      order.payment.status = "REFUND_PENDING";
      order.payment.refundRequestedAt = new Date();
      order.payment.refundReason = reason.trim();
    }

    // 🧾 Save cancel reason and details
    order.cancelReason = reason.trim();
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;

    // 📦 Add tracking update
    order.trackingUpdates.push({
      status: "CANCELLED",
      location: "System",
      note: `Order cancelled by user. Reason: ${reason.trim()}`,
      updatedBy: req.user._id,
    });

    await order.save();

    // Optional: Restore product quantities if needed
    // for (const item of order.items) {
    //   await Product.findByIdAndUpdate(item.product, {
    //     $inc: { stock: item.quantity }
    //   });
    // }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        id: order._id,
        status: order.status,
        cancelReason: order.cancelReason,
        cancelledAt: order.cancelledAt,
        refundStatus:
          order.payment.status === "REFUND_PENDING" ? "Pending" : null,
      },
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order. Please try again later.",
    });
  }
};

//
// 🔹 ADMIN - GET ALL ORDERS
//
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

//
// 🔹 ADMIN - UPDATE ORDER STATUS
//
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = [
      "PLACED",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const oldStatus = order.status;
    order.status = status;

    // Add tracking update for status change
    order.trackingUpdates.push({
      status: status,
      location: "Admin Panel",
      note: `Order status changed from ${oldStatus} to ${status}`,
      updatedBy: req.user._id,
    });

    await order.save();

    res.json({
      success: true,
      message: `Order status updated from ${oldStatus} to ${status}`,
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

//
// 🔹 ADMIN - UPDATE ORDER ITEMS
//
exports.updateOrderItemsByAdmin = async (req, res) => {
  try {
    const { items } = req.body;
    const { id } = req.params;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Valid items array is required" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let subTotal = 0;

    const updatedItems = items.map((item) => {
      const total = item.quantity * item.sellingPrice;
      subTotal += total;
      return { ...item, lineTotal: total };
    });

    order.items = updatedItems;
    order.subTotal = subTotal;
    order.totalAmount = subTotal + order.deliveryFee;

    // Add tracking update
    order.trackingUpdates.push({
      status: order.status,
      location: "Admin Panel",
      note: "Order items were updated by admin",
      updatedBy: req.user._id,
    });

    await order.save();

    res.json({
      success: true,
      message: "Order items updated successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update order items" });
  }
};

//
// 🔹 ADMIN - ADD TRACKING UPDATE
//
exports.addTrackingUpdate = async (req, res) => {
  try {
    const { status, location, note } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.trackingUpdates.push({
      status,
      location: location || "Warehouse",
      note: note || `Order ${status.toLowerCase()}`,
      updatedBy: req.user._id,
    });

    // Optionally update order status if tracking status matches
    const trackingToOrderStatus = {
      ORDER_CONFIRMED: "CONFIRMED",
      PROCESSING: "PROCESSING",
      SHIPPED: "SHIPPED",
      OUT_FOR_DELIVERY: "SHIPPED",
      DELIVERED: "DELIVERED",
    };

    if (trackingToOrderStatus[status]) {
      order.status = trackingToOrderStatus[status];
    }

    await order.save();

    res.json({
      success: true,
      message: "Tracking update added successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add tracking update" });
  }
};
