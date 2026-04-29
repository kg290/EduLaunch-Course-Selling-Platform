const express = require("express");

const {
  createMockPaymentIntent,
  confirmMockPaymentAndEnroll,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentConfig,
  getMyEnrollments,
  getEnrollmentForCourse,
  updateProgress,
  updateBookmarks,
  issueCertificate,
  getCertificate
} = require("../controllers/enrollmentController");
const { protect, requireRole } = require("../middlewares/auth");

const router = express.Router();

// Payment config (public for frontend to decide which flow to show)
router.get("/payment-config", getPaymentConfig);

router.use(protect, requireRole("student"));

// Mock payment (fallback)
router.post("/mock-payment/intent", createMockPaymentIntent);
router.post("/mock-payment/confirm", confirmMockPaymentAndEnroll);

// Razorpay real payment
router.post("/razorpay/order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);

// Enrollments
router.get("/mine", getMyEnrollments);
router.get("/course/:courseId", getEnrollmentForCourse);
router.patch("/course/:courseId/progress", updateProgress);
router.patch("/course/:courseId/bookmarks", updateBookmarks);
router.post("/course/:courseId/certificate", issueCertificate);
router.get("/course/:courseId/certificate", getCertificate);

module.exports = router;
