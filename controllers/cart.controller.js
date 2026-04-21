// controllers/cartController.js

const Cart = require("../models/Cart.model");
const Product = require("../models/Product.model");

// ---------------- GET USER CART ----------------
const userCart = async (req, res) => {
  const userId = req.query.userId || req.params.userId;
  if (!userId) return res.status(400).json({ message: "userId is required" });

  try {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(200).json({
        items: [],
        subTotal: 0,
        grandTotal: 0,
      });
    }

    res.status(200).json({
      items: cart.items,
      subTotal: cart.subTotal,
      grandTotal: cart.grandTotal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- ADD TO CART ----------------
const addToCart = async (req, res) => {
  const { userId, productId, configs = [] } = req.body;

  if (!userId || !productId)
    return res.status(400).json({ message: "Missing fields" });

  // 🔥 ADD THIS VALIDATION
  if (!configs || configs.length === 0) {
    return res.status(400).json({ message: "No configurations provided" });
  }

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const index = cart.items.findIndex(
      (i) => i.productId.toString() === productId,
    );

    if (index > -1) {
      // 🔥 PUSH new designs
      cart.items[index].designs.push(...configs);
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price: product.sellingPrice,
        designs: configs,
      });
    }

    await cart.save();

    res.status(200).json({
      message: "Added to cart",
      items: cart.items,
      subTotal: cart.subTotal,
      grandTotal: cart.grandTotal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- UPDATE QUANTITY ----------------
const updateQuantity = async (req, res) => {
  const { userId, productId, designIndex, quantity } = req.body;

  if (!userId || !productId || quantity <= 0)
    return res.status(400).json({ message: "Invalid request" });

  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.productId.toString() === productId);

    if (!item) return res.status(404).json({ message: "Item not found" });

    if (
      designIndex === undefined ||
      !item.designs ||
      !item.designs[designIndex]
    ) {
      return res.status(404).json({ message: "Design not found" });
    }

    item.designs[designIndex].quantity = Number(quantity);

    await cart.save();

    res.status(200).json({
      message: "Quantity updated",
      items: cart.items,
      subTotal: cart.subTotal,
      grandTotal: cart.grandTotal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- REMOVE FROM CART ----------------
const removeFromCart = async (req, res) => {
  const { userId, productId, designIndex } = req.body;

  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.productId.toString() === productId);

    if (!item) return res.status(404).json({ message: "Item not found" });

    // 🔥 REMOVE SPECIFIC DESIGN
    if (
      designIndex === undefined ||
      !item.designs ||
      !item.designs[designIndex]
    ) {
      return res.status(400).json({ message: "Invalid design index" });
    }

    item.designs.splice(designIndex, 1);

    // 🔥 If no designs left → remove product
    if (!item.designs || item.designs.length === 0) {
      cart.items = cart.items.filter(
        (i) => i.productId.toString() !== productId,
      );
    }

    await cart.save();

    res.status(200).json({
      message: "Item removed",
      items: cart.items,
      subTotal: cart.subTotal,
      grandTotal: cart.grandTotal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  userCart,
  addToCart,
  updateQuantity,
  removeFromCart,
};
