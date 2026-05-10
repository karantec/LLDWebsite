const wholesalerPriceSchema = new mongoose.Schema({
  wholesalerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WholeSaler",
    required: true,
  },
  defaultPrice: { type: Number, required: true, default: 0 },
  wholesalePrice: { type: Number, required: true, default: 0 },
});
