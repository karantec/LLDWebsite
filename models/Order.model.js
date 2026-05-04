const mongoose = require("mongoose");

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

    // 🔥 ADD THIS
    designs: [
      {
        config: { type: Object, default: {} },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  { _id: false },
);

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
        "PENDING",
        "PAID",
        "FAILED",
        "REFUND_PENDING", // ✅ add this
        "REFUNDED", // ✅ optional (recommended)
      ],
      default: "PENDING",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    amount: Number,
    currency: { type: String, default: "INR" },
    paidAt: Date,
  },
  { _id: false },
);

/* 🔥 NEW: TRACKING SCHEMA */
const TrackingSchema = new mongoose.Schema(
  {
    status: String, // e.g. Shipped, Out for delivery
    location: String, // Delhi, Bangalore
    note: String,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [OrderItemSchema],

    subTotal: Number,
    deliveryFee: Number,
    totalAmount: Number,

    shippingAddress: AddressSchema,

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

    payment: PaymentSchema,

    /* 🔥 NEW FIELD */
    trackingUpdates: {
      type: [TrackingSchema],
      default: [],
    },

    notes: String,
  },
  { timestamps: true },
);

module.exports = mongoose.models.Order || mongoose.model("Order", OrderSchema);
