const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const {
  courseVideoUploadDir,
  ensureMediaDirectories,
  localCourseLibraryRoot
} = require("./config/media");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

ensureMediaDirectories();

app.use("/media/uploads/videos", express.static(courseVideoUploadDir));
if (fs.existsSync(localCourseLibraryRoot)) {
  app.use("/media/library", express.static(localCourseLibraryRoot));
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "course-platform-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
