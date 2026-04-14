const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const Cart = require("../models/Cart.model");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

//
// 🔹 CREATE ORDER (COD + ONLINE)
//
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // 🔹 Fetch products
    const products = await Product.find({
      _id: { $in: items.map((i) => i.product) },
    });

    if (products.length === 0) {
      return res.status(400).json({ message: "Products not found" });
    }

    let subTotal = 0;

    const orderItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.product);
      if (!product) throw new Error("Invalid product");

      const lineTotal = product.price * item.quantity;
      subTotal += lineTotal;

      return {
        product: product._id,
        name: product.name,
        image: product.image,
        unit: product.unit,
        mrp: product.originalPrice,
        sellingPrice: product.price,
        discount: product.discount,
        quantity: item.quantity,
        lineTotal,
      };
    });

    const deliveryFee = 50;
    const totalAmount = subTotal + deliveryFee;

    let paymentData = {
      method: paymentMethod,
      status: "NOT_INITIATED",
      amount: totalAmount,
      currency: "INR",
    };

    let razorpayOrder = null;

    //
    // 🔥 ONLINE PAYMENT FLOW
    //
    if (paymentMethod === "ONLINE") {
      razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // paise
        currency: "INR",
        receipt: `order_rcpt_${Date.now()}`,
      });

      paymentData = {
        method: "ONLINE",
        status: "CREATED",
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: "INR",
      };
    }

    //
    // 🔹 CREATE ORDER
    //
    const order = await Order.create({
      user: userId,
      items: orderItems,
      subTotal,
      deliveryFee,
      totalAmount,
      shippingAddress,
      payment: paymentData,
      status: "PLACED",
    });

    res.status(201).json({
      success: true,
      order,
      razorpayOrder, // frontend needs this
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: "Error creating order" });
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

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ Update payment
    order.payment.status = "PAID";
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.razorpaySignature = razorpay_signature;
    order.payment.paidAt = new Date();

    await order.save();

    // ✅ Clear cart
    await Cart.updateOne(
      { user: order.user },
      { $set: { items: [], subTotal: 0, grandTotal: 0 } },
    );

    res.json({
      success: true,
      message: "Payment verified",
      order,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

//
// 🔹 PAYMENT FAILED
//
exports.paymentFailed = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.payment.status = "FAILED";
    order.payment.failedReason = reason || "Payment failed";

    await order.save();

    res.json({
      success: true,
      message: "Payment marked failed",
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating payment" });
  }
};

//
// 🔹 GET MY ORDERS
//
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

//
// 🔹 GET SINGLE ORDER
//
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order" });
  }
};

//
// 🔹 ADMIN - GET ALL ORDERS
//
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "email")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

//
// 🔹 UPDATE ORDER STATUS
//
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "PLACED",
      "CONFIRMED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Error updating order status" });
  }
};
