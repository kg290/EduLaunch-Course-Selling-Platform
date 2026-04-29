const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const asyncHandler = require("../middlewares/asyncHandler");

const getEducatorDashboard = asyncHandler(async (req, res) => {
  const educatorId = req.user._id;

  const courses = await Course.find({ educator: educatorId }).select(
    "title price createdAt"
  );
  const courseIds = courses.map((course) => course._id);

  const enrollments = await Enrollment.find({
    course: { $in: courseIds }
  }).select("course payment.amount progress.completedPercent");

  const totalCourses = courses.length;
  const totalStudents = enrollments.length;
  const totalRevenue = enrollments.reduce(
    (sum, enrollment) => sum + (enrollment.payment?.amount || 0),
    0
  );
  const avgCompletion =
    totalStudents === 0
      ? 0
      : Math.round(
          enrollments.reduce(
            (sum, enrollment) => sum + (enrollment.progress?.completedPercent || 0),
            0
          ) / totalStudents
        );

  const courseBreakdown = courses
    .map((course) => {
      const relatedEnrollments = enrollments.filter(
        (enrollment) => enrollment.course.toString() === course._id.toString()
      );
      const courseRevenue = relatedEnrollments.reduce(
        (sum, enrollment) => sum + (enrollment.payment?.amount || 0),
        0
      );
      const courseAvgCompletion =
        relatedEnrollments.length === 0
          ? 0
          : Math.round(
              relatedEnrollments.reduce(
                (sum, enrollment) =>
                  sum + (enrollment.progress?.completedPercent || 0),
                0
              ) / relatedEnrollments.length
            );

      return {
        courseId: course._id,
        title: course.title,
        price: course.price,
        enrollments: relatedEnrollments.length,
        revenue: courseRevenue,
        avgCompletion: courseAvgCompletion
      };
    })
    .sort((a, b) => b.enrollments - a.enrollments);

  res.json({
    metrics: {
      totalCourses,
      totalStudents,
      totalRevenue,
      avgCompletion
    },
    courseBreakdown
  });
});

const getStudentDashboard = asyncHandler(async (req, res) => {
  const [user, enrollments] = await Promise.all([
    User.findById(req.user._id).select("wishlist"),
    Enrollment.find({ student: req.user._id })
      .populate({ path: "course", populate: { path: "educator", select: "name" } })
      .populate("educator", "name")
      .sort({ updatedAt: -1 })
  ]);

  const completedCourses = enrollments.filter(
    (enrollment) => enrollment.status === "completed"
  );
  const certificates = enrollments.filter(
    (enrollment) => enrollment.certificate?.certificateId
  );
  const continueLearning = enrollments.filter(
    (enrollment) => enrollment.status !== "completed"
  );
  const totalLearningProgress =
    enrollments.length === 0
      ? 0
      : Math.round(
          enrollments.reduce(
            (sum, enrollment) => sum + (enrollment.progress?.completedPercent || 0),
            0
          ) / enrollments.length
        );
  const lessonsCompleted = enrollments.reduce(
    (sum, enrollment) =>
      sum + (enrollment.progress?.completedChapterIndexes?.length || 0),
    0
  );

  res.json({
    metrics: {
      enrolledCourses: enrollments.length,
      completedCourses: completedCourses.length,
      certificatesEarned: certificates.length,
      totalLearningProgress,
      lessonsCompleted,
      wishlistCount: user?.wishlist?.length || 0
    },
    continueLearning: continueLearning.slice(0, 3),
    certificates: certificates.map((enrollment) => ({
      courseId: enrollment.course?._id,
      courseTitle: enrollment.course?.title,
      educatorName: enrollment.educator?.name || enrollment.course?.educator?.name,
      certificateId: enrollment.certificate?.certificateId,
      recipientName: enrollment.certificate?.recipientName,
      issuedAt: enrollment.certificate?.issuedAt,
      completedAt: enrollment.completedAt
    }))
  });
});

module.exports = {
  getEducatorDashboard,
  getStudentDashboard
};
