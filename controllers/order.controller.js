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
    const userId = req.user._id;
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    const products = await Product.find({
      _id: { $in: items.map((i) => i.product) },
    });

    let subTotal = 0;

    const orderItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.product);

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
      trackingUpdates: [], // 🔥 INIT
    });

    res.status(201).json({ success: true, order, razorpayOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create order failed" });
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

    order.payment.status = "PAID";
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.paidAt = new Date();

    await order.save();

    await Cart.updateOne(
      { user: order.user },
      { $set: { items: [], subTotal: 0, grandTotal: 0 } },
    );

    res.json({ success: true, order });
  } catch (err) {
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

    order.payment.status = "FAILED";
    order.payment.failedReason = reason;

    await order.save();

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Error updating payment" });
  }
};

//
// 🔹 GET MY ORDERS
//
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("items.product")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

//
// 🔹 GET SINGLE ORDER
//
exports.getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product");

  if (!order) return res.status(404).json({ message: "Not found" });

  res.json({ success: true, order });
};

//
// 🔹 ADMIN - GET ALL
//
exports.getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate("user", "email")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

//
// 🔹 ADMIN - UPDATE STATUS
//
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  order.status = status;
  await order.save();

  res.json({ success: true, order });
};

//
// 🔥 ADMIN - UPDATE ITEMS
//
exports.updateOrderItemsByAdmin = async (req, res) => {
  try {
    const { items } = req.body;

    const order = await Order.findById(req.params.id);

    let subTotal = 0;

    const updatedItems = items.map((item) => {
      const total = item.quantity * item.sellingPrice;
      subTotal += total;

      return { ...item, lineTotal: total };
    });

    order.items = updatedItems;
    order.subTotal = subTotal;
    order.totalAmount = subTotal + order.deliveryFee;

    await order.save();

    res.json({ success: true, order });
  } catch {
    res.status(500).json({ message: "Item update failed" });
  }
};

//
// 🔥 ADMIN - ADD TRACKING (FIXED PROPERLY)
//
exports.addTrackingUpdate = async (req, res) => {
  try {
    const { status, location, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.trackingUpdates.push({
      status,
      location,
      note,
      updatedBy: req.user._id,
    });

    await order.save();

    res.json({
      success: true,
      message: "Tracking updated",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Tracking failed" });
  }
};
