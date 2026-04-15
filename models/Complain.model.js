const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
});

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Product Quality",
        "Delivery Issue",
        "Customer Service",
        "Billing / Payment",
        "Technical Issue",
        "Other",
      ],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Review", "Resolved", "Rejected"],
      default: "Pending",
    },
    complainantName: { type: String, trim: true, default: "" },
    complainantEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    complainantPhone: { type: String, trim: true, default: "" },
    attachments: { type: [attachmentSchema], default: [] },
    adminNotes: { type: String, trim: true, default: "" },
    resolution: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Complaint", complaintSchema);
