const express = require("express");

const {
  getEducatorDashboard,
  getStudentDashboard
} = require("../controllers/analyticsController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

router.get("/educator/dashboard", protect, requireRole("educator"), getEducatorDashboard);
router.get("/student/dashboard", protect, requireRole("student"), getStudentDashboard);

module.exports = router;
