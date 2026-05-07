const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");

const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const {
  localEducatorAccount,
  localCourseDefinitions,
  mapLocalCourseForStorage
} = require("./localCourseCatalog");

const ensureUser = async (userData) => {
  const existing = await User.findOne({ email: userData.email });
  if (existing) return existing;
  return User.create(userData);
};

const syncCoursesForEducator = async (educatorId, coursePayloads) => {
  const syncedCourses = [];

  for (const coursePayload of coursePayloads) {
    const course = await Course.findOneAndUpdate(
      { title: coursePayload.title, educator: educatorId },
      coursePayload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );
    syncedCourses.push(course);
  }

  const syncedIds = syncedCourses.map((course) => course._id);
  const staleCourses = await Course.find({
    educator: educatorId,
    _id: { $nin: syncedIds }
  }).select("_id");

  if (staleCourses.length) {
    const staleIds = staleCourses.map((course) => course._id);
    await Enrollment.deleteMany({ course: { $in: staleIds } });
    await Course.deleteMany({ _id: { $in: staleIds } });
  }

  return syncedCourses;
};

const importLocalCourses = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/course_platform";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const educator = await ensureUser(localEducatorAccount);
  const mappedCourses = localCourseDefinitions.map((courseDefinition) =>
    mapLocalCourseForStorage(courseDefinition, educator._id)
  );

  const syncedCourses = await syncCoursesForEducator(educator._id, mappedCourses);

  console.log(`Imported local courses: ${syncedCourses.length}`);
  console.log(`Local educator: ${localEducatorAccount.email} / ${localEducatorAccount.password}`);
  await mongoose.disconnect();
};

importLocalCourses().catch((error) => {
  console.error("Failed to import local courses:", error.message);
  process.exit(1);
});
