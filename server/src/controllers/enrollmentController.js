const crypto = require("crypto");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const asyncHandler = require("../middlewares/asyncHandler");
const { createMockIntent, simulatePayment } = require("../utils/mockPayment");
const {
  isRazorpayConfigured,
  createRazorpayOrderRequest
} = require("../utils/razorpay");
const { sendEnrollmentEmail } = require("../utils/mailer");

const createRazorpayReceipt = (courseId) => {
  // Razorpay receipt max length is 40 chars.
  return `crs_${String(courseId).slice(-8)}_${Date.now().toString(36)}`;
};

const createCertificateId = (courseId, studentId) => {
  const stamp = Date.now().toString(36).toUpperCase();
  return `EDU-${String(courseId).slice(-4).toUpperCase()}-${String(studentId)
    .slice(-4)
    .toUpperCase()}-${stamp}`;
};

const createMockPaymentIntent = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    res.status(400);
    throw new Error("courseId is required");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (course.educator.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Educators cannot enroll in their own courses");
  }

  const existingEnrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id
  });
  if (existingEnrollment) {
    res.status(409);
    throw new Error("Already enrolled in this course");
  }

  const intent = createMockIntent("razorpay", course.price);

  res.json({
    message: "Mock payment intent created",
    intent,
    course: {
      id: course._id,
      title: course.title,
      price: course.price
    }
  });
});

const confirmMockPaymentAndEnroll = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    res.status(400);
    throw new Error("courseId is required");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (course.educator.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Educators cannot enroll in their own courses");
  }

  const existingEnrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id
  });
  if (existingEnrollment) {
    res.status(409);
    throw new Error("Already enrolled in this course");
  }

  const paymentResult = simulatePayment("razorpay", course.price);

  if (!paymentResult.success) {
    return res.status(402).json({
      message: "Mock payment failed. Please retry.",
      payment: paymentResult
    });
  }

  const enrollment = await Enrollment.create({
    student: req.user._id,
    educator: course.educator,
    course: course._id,
    payment: {
      provider: paymentResult.provider,
      transactionId: paymentResult.transactionId,
      status: paymentResult.status,
      amount: paymentResult.amount,
      currency: paymentResult.currency
    },
    progress: {
      completedChapterIndexes: [],
      completedPercent: 0,
      lastWatchedAt: new Date()
    },
    status: "active"
  });

  const populatedEnrollment = await Enrollment.findById(enrollment._id)
    .populate("course")
    .populate("educator", "name")
    .lean();

  // Send enrollment email (non-blocking)
  const student = await User.findById(req.user._id);
  sendEnrollmentEmail(student, course).catch(() => {});

  res.status(201).json({
    message: "Enrollment successful",
    payment: paymentResult,
    enrollment: populatedEnrollment
  });
});

// ---- Razorpay Real Payment ----

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    res.status(400);
    throw new Error("courseId is required");
  }

  if (!isRazorpayConfigured()) {
    res.status(503);
    throw new Error("Razorpay is not configured. Use mock payment instead.");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (course.educator.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Educators cannot enroll in their own courses");
  }

  const existingEnrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id
  });
  if (existingEnrollment) {
    res.status(409);
    throw new Error("Already enrolled in this course");
  }

  const order = await createRazorpayOrderRequest({
    amount: Math.round(course.price * 100), // Razorpay uses paise
    currency: "INR",
    receipt: createRazorpayReceipt(course._id),
    notes: {
      courseId: course._id.toString(),
      studentId: req.user._id.toString()
    }
  });

  res.json({
    order,
    course: {
      id: course._id,
      title: course.title,
      price: course.price
    },
    razorpayKeyId: process.env.RAZORPAY_KEY_ID
  });
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    courseId
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
    res.status(400);
    throw new Error("All payment verification fields are required");
  }

  if (!isRazorpayConfigured()) {
    res.status(503);
    throw new Error("Razorpay is not configured");
  }

  // Verify signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error("Payment verification failed — invalid signature");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const existingEnrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id
  });
  if (existingEnrollment) {
    res.status(409);
    throw new Error("Already enrolled in this course");
  }

  const enrollment = await Enrollment.create({
    student: req.user._id,
    educator: course.educator,
    course: course._id,
    payment: {
      provider: "razorpay",
      transactionId: razorpay_payment_id,
      status: "captured",
      amount: course.price,
      currency: "INR"
    },
    progress: {
      completedChapterIndexes: [],
      completedPercent: 0,
      lastWatchedAt: new Date()
    },
    status: "active"
  });

  const populatedEnrollment = await Enrollment.findById(enrollment._id)
    .populate("course")
    .populate("educator", "name")
    .lean();

  // Send enrollment email (non-blocking)
  const student = await User.findById(req.user._id);
  sendEnrollmentEmail(student, course).catch(() => {});

  res.status(201).json({
    message: "Payment verified and enrollment successful",
    enrollment: populatedEnrollment
  });
});

// ---- Check if Razorpay is configured ----

const getPaymentConfig = asyncHandler(async (req, res) => {
  res.json({
    razorpayConfigured: isRazorpayConfigured(),
    razorpayKeyId: isRazorpayConfigured() ? process.env.RAZORPAY_KEY_ID : null
  });
});

// ---- Existing endpoints ----

const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate("course")
    .populate("educator", "name")
    .sort({ createdAt: -1 });

  res.json({ enrollments });
});

const getEnrollmentForCourse = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId
  })
    .populate({ path: "course", populate: { path: "educator", select: "name" } })
    .populate("educator", "name");

  if (!enrollment) {
    res.status(404);
    throw new Error("Enrollment not found for this course");
  }

  res.json({ enrollment });
});

const updateProgress = asyncHandler(async (req, res) => {
  const { chapterIndex, completed = true } = req.body;

  if (chapterIndex === undefined || Number.isNaN(Number(chapterIndex))) {
    res.status(400);
    throw new Error("chapterIndex must be provided");
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId
  }).populate("course");

  if (!enrollment) {
    res.status(404);
    throw new Error("Enrollment not found");
  }

  const numericChapterIndex = Number(chapterIndex);
  const totalChapters = enrollment.course.chapters.length;

  if (numericChapterIndex < 0 || numericChapterIndex >= totalChapters) {
    res.status(400);
    throw new Error("Invalid chapter index");
  }

  const currentCompleted = new Set(enrollment.progress.completedChapterIndexes);
  if (completed) {
    currentCompleted.add(numericChapterIndex);
  } else {
    currentCompleted.delete(numericChapterIndex);
  }

  const completedChapterIndexes = Array.from(currentCompleted).sort((a, b) => a - b);
  const completedPercent = Math.round(
    (completedChapterIndexes.length / totalChapters) * 100
  );

  enrollment.progress.completedChapterIndexes = completedChapterIndexes;
  enrollment.progress.completedPercent = completedPercent;
  enrollment.progress.lastWatchedAt = new Date();
  enrollment.progress.lastChapterIndex = numericChapterIndex;
  enrollment.status = completedPercent === 100 ? "completed" : "active";
  enrollment.completedAt = completedPercent === 100 ? enrollment.completedAt || new Date() : null;

  await enrollment.save();
  await enrollment.populate({ path: "course", populate: { path: "educator", select: "name" } });
  await enrollment.populate("educator", "name");
  const responseEnrollment = enrollment.toObject();

  res.json({
    message: "Progress updated",
    progress: enrollment.progress,
    status: enrollment.status,
    enrollment: responseEnrollment
  });
});

const updateBookmarks = asyncHandler(async (req, res) => {
  const { chapterIndex, bookmarked = true } = req.body;

  if (chapterIndex === undefined || Number.isNaN(Number(chapterIndex))) {
    res.status(400);
    throw new Error("chapterIndex must be provided");
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId
  }).populate("course");

  if (!enrollment) {
    res.status(404);
    throw new Error("Enrollment not found");
  }

  const numericChapterIndex = Number(chapterIndex);
  const totalChapters = enrollment.course.chapters.length;

  if (numericChapterIndex < 0 || numericChapterIndex >= totalChapters) {
    res.status(400);
    throw new Error("Invalid chapter index");
  }

  const currentBookmarks = new Set(enrollment.progress.bookmarkedChapterIndexes || []);
  if (bookmarked) {
    currentBookmarks.add(numericChapterIndex);
  } else {
    currentBookmarks.delete(numericChapterIndex);
  }

  enrollment.progress.bookmarkedChapterIndexes = Array.from(currentBookmarks).sort(
    (a, b) => a - b
  );
  enrollment.progress.lastWatchedAt = new Date();

  await enrollment.save();

  res.json({
    message: "Bookmarks updated",
    bookmarks: enrollment.progress.bookmarkedChapterIndexes
  });
});

const issueCertificate = asyncHandler(async (req, res) => {
  const recipientName = String(req.body.recipientName || "").trim();

  if (!recipientName) {
    res.status(400);
    throw new Error("recipientName is required");
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId
  })
    .populate({ path: "course", populate: { path: "educator", select: "name" } })
    .populate("educator", "name")
    .lean();

  if (!enrollment) {
    res.status(404);
    throw new Error("Enrollment not found");
  }

  if (enrollment.status !== "completed") {
    res.status(400);
    throw new Error("Complete all chapters before generating a certificate");
  }

  enrollment.certificate = {
    certificateId:
      enrollment.certificate?.certificateId ||
      createCertificateId(enrollment.course._id, req.user._id),
    recipientName,
    issuedAt: enrollment.certificate?.issuedAt || new Date()
  };

  await enrollment.save();

  res.status(201).json({
    message: "Certificate generated successfully",
    certificate: enrollment.certificate,
    course: {
      id: enrollment.course._id,
      title: enrollment.course.title,
      category: enrollment.course.category
    },
    educator: {
      name: enrollment.educator?.name || enrollment.course.educator?.name
    },
    completedAt: enrollment.completedAt
  });
});

const getCertificate = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId
  })
    .populate({ path: "course", populate: { path: "educator", select: "name" } })
    .populate("educator", "name");

  if (!enrollment) {
    res.status(404);
    throw new Error("Enrollment not found");
  }

  if (!enrollment.certificate?.certificateId) {
    res.status(404);
    throw new Error("Certificate has not been generated yet");
  }

  res.json({
    certificate: enrollment.certificate,
    course: {
      id: enrollment.course._id,
      title: enrollment.course.title,
      category: enrollment.course.category
    },
    educator: {
      name: enrollment.educator?.name || enrollment.course.educator?.name
    },
    student: {
      name: req.user.name
    },
    completedAt: enrollment.completedAt
  });
});

module.exports = {
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
};
