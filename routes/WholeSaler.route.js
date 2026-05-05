const express = require("express");
const router = express.Router();
const {
  registerWholeSaler,
  loginWholeSaler,
} = require("../controllers/wholesaler.controller");

router.post("/register", registerWholeSaler);
router.post("/login", loginWholeSaler);

module.exports = router;
