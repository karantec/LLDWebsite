const express = require("express");

const {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} = require("../controllers/Complaint.Controller");

const router = express.Router();

// /api/complaints
router
  .route("/")
  .get(getAllComplaints) // GET  – list all
  .post(createComplaint); // POST – create new

// /api/complaints/:id
router
  .route("/:id")
  .get(getComplaintById) // GET    – single record
  .put(updateComplaint) // PUT    – full / partial update
  .delete(deleteComplaint); // DELETE – remove

module.exports = router;
