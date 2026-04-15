const Complaint = require("../models/Complain.model");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sendSuccess = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

const sendError = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/complaints
 * Returns all complaints (newest first).
 */
const getAllComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find().sort({ createdAt: -1 });
  sendSuccess(res, complaints);
});

/**
 * GET /api/complaints/:id
 * Returns a single complaint by ID.
 */
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return sendError(res, "Complaint not found", 404);
  sendSuccess(res, complaint);
});

/**
 * POST /api/complaints
 * Creates a new complaint.
 * Required body fields: title, description, category
 */
const createComplaint = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    priority,
    status,
    complainantName,
    complainantEmail,
    complainantPhone,
    attachments,
    adminNotes,
    resolution,
  } = req.body;

  // Basic validation (schema also validates, but gives cleaner messages here)
  if (!title || !description || !category) {
    return sendError(res, "Title, description and category are required");
  }

  const complaint = await Complaint.create({
    title,
    description,
    category,
    priority,
    status,
    complainantName,
    complainantEmail,
    complainantPhone,
    attachments,
    adminNotes,
    resolution,
  });

  sendSuccess(res, complaint, 201);
});

/**
 * PUT /api/complaints/:id
 * Updates an existing complaint (full or partial update).
 */
const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return sendError(res, "Complaint not found", 404);

  const allowedFields = [
    "title",
    "description",
    "category",
    "priority",
    "status",
    "complainantName",
    "complainantEmail",
    "complainantPhone",
    "attachments",
    "adminNotes",
    "resolution",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      complaint[field] = req.body[field];
    }
  });

  await complaint.save();
  sendSuccess(res, complaint);
});

/**
 * DELETE /api/complaints/:id
 * Deletes a complaint by ID.
 */
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return sendError(res, "Complaint not found", 404);

  await complaint.deleteOne();
  sendSuccess(res, { message: "Complaint deleted successfully" });
});

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
};
