const mongoose = require("mongoose");

//
// 🔹 Order Item Snapshot (IMPORTANT)
//
const OrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: String,
    image: String,
    unit: String,

    mrp: Number,
    sellingPrice: Number,
    discount: Number,

    quantity: Number,
    lineTotal: Number,
  },
  { _id: false },
);

//
// 🔹 Address Schema
//
const AddressSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    line1: String,
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false },
);

//
// 🔹 Razorpay Payment Schema
//
const PaymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "NOT_INITIATED",
        "CREATED", // Razorpay order created
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
      ],
      default: "NOT_INITIATED",
    },

    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    amount: { type: Number, required: true },

    currency: { type: String, default: "INR" },

    paidAt: { type: Date, default: null },
    failedReason: { type: String, default: null },

    refundId: { type: String, default: null },
    refundAmount: { type: Number, default: null },
  },
  { _id: false },
);

//
// 🔹 Main Order Schema
//
const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [OrderItemSchema],
      required: true,
    },

    // 💰 Pricing snapshot
    subTotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // 📍 Address
    shippingAddress: AddressSchema,

    // 📦 Order lifecycle
    status: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
    },

    // 💳 Payment info
    payment: {
      type: PaymentSchema,
      required: true,
    },

    // 🧾 Optional metadata
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Order || mongoose.model("Order", OrderSchema);
