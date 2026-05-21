// models/Question.js

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: Number,
      required: true,
      unique: true,
    },

    questionLink: {
      type: String,
      required: true,
    },

    videoLink: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Basic", "Standard", "Non Standard"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Question", questionSchema);
