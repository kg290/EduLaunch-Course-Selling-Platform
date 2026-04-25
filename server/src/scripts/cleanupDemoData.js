const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const cleanupDemoData = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/course_platform";

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const demoUserRegex = /^(educator|student)\d+@test\.com$/i;
  const demoEmails = [
    "educator.demo@edulaunch.com",
    "student.demo@edulaunch.com"
  ];

  const usersToDelete = await User.find({
    $or: [{ email: { $in: demoEmails } }, { email: { $regex: demoUserRegex } }]
  }).select("_id email");

  const userIds = usersToDelete.map((user) => user._id);
  const userEmails = usersToDelete.map((user) => user.email);

  const coursesToDelete = await Course.find({
    educator: { $in: userIds }
  }).select("_id title");

  const courseIds = coursesToDelete.map((course) => course._id);

  const deletedCourseCount = (
    await Course.deleteMany({ _id: { $in: courseIds } })
  ).deletedCount;

  const deletedEnrollmentCount = (
    await Enrollment.deleteMany({
      $or: [
        { student: { $in: userIds } },
        { educator: { $in: userIds } },
        { course: { $in: courseIds } }
      ]
    })
  ).deletedCount;

  const deletedUserCount = (
    await User.deleteMany({ _id: { $in: userIds } })
  ).deletedCount;

  console.log(`Deleted users: ${deletedUserCount}`);
  console.log(`Deleted courses: ${deletedCourseCount}`);
  console.log(`Deleted enrollments: ${deletedEnrollmentCount}`);

  if (userEmails.length > 0) {
    console.log(`Removed test/demo accounts: ${userEmails.join(", ")}`);
  } else {
    console.log("No test/demo accounts found.");
  }

  await mongoose.disconnect();
  console.log("Cleanup complete.");
};

cleanupDemoData().catch((error) => {
  console.error("Failed to clean demo data:", error.message);
  process.exit(1);
});
