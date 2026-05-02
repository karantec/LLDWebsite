// routes/testimonial.routes.js

const express = require("express");
const router = express.Router();

const {
  addTestimonial,
  getTestimonials,
  deleteTestimonial,
} = require("../controllers/Testimonial.Controller");

// Dashboard
router.post("/add", addTestimonial);

// Website
router.get("/get", getTestimonials);

// Optional
router.delete("/delete/:id", deleteTestimonial);

module.exports = router;
