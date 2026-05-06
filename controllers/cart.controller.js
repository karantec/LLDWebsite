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
  const { userId, productId, configs = [], offers = [] } = req.body;

  if (!userId || !productId)
    return res.status(400).json({ message: "Missing fields" });

  // 🔥 ADD THIS VALIDATION
  if (!configs || configs.length === 0) {
    return res.status(400).json({ message: "No configurations provided" });
  }

  const normalizedConfigs = configs.map((c) => ({
    config: c.config || c,
    quantity: c.quantity || 1,
  }));

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId });

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    console.log("PRICE GOING INTO CART:", product.price);

    const index = cart.items.findIndex(
      (i) => i.productId.toString() === productId,
    );

    if (index > -1) {
      // 🔥 PUSH new designs
      if (!cart.items[index].customizations) {
        cart.items[index].customizations = product.customizations || [];
      }
      normalizedConfigs.forEach((newDesign) => {
        const designWithOffers = {
          config: newDesign.config,
          quantity: newDesign.quantity || 1,
          offers: offers || [],
        };

        const isSameConfig = (a, b) =>
  JSON.stringify(Object.keys(a).sort().reduce((o, k) => (o[k] = a[k], o), {})) ===
  JSON.stringify(Object.keys(b).sort().reduce((o, k) => (o[k] = b[k], o), {}));

const isSameOffers = (a = [], b = []) =>
  JSON.stringify(a.map(o => o._id || o).sort()) ===
  JSON.stringify(b.map(o => o._id || o).sort());

const existing = cart.items[index].designs.find(
  (d) =>
    isSameConfig(d.config, newDesign.config) &&
    isSameOffers(d.offers, offers)
);

        if (existing) {
          existing.quantity += newDesign.quantity || 1;
        } else {
          cart.items[index].designs.push(designWithOffers);
        }
      });
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price: product.discountedMRP || product.price,
        customizations: product.customizations || [], // ✅ ADD THIS
        designs: normalizedConfigs.map((c) => ({
          config: c.config,
          quantity: c.quantity || 1,
          offers: offers.map(o => o._id),
        })),
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
  const { userId, productId, designId, quantity } = req.body;

  try {
    if (!userId || !productId || !designId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.productId.toString() === productId);

    if (!item) return res.status(404).json({ message: "Item not found" });

    const design = item.designs.id(designId);
    if (!design) return res.status(404).json({ message: "Design not found" });

    design.quantity = Number(quantity);

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
  const { userId, productId, designId } = req.body;

  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.productId.toString() === productId);

    if (!item) return res.status(404).json({ message: "Item not found" });

    // 🔥 REMOVE SPECIFIC DESIGN BY ID
    item.designs = item.designs.filter((d) => d._id.toString() !== designId);

    // 🔥 If no designs left → remove product completely
    if (item.designs.length === 0) {
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
