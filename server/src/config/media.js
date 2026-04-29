const fs = require("fs");
const path = require("path");

const uploadsRoot = path.resolve(__dirname, "../../uploads");
const courseVideoUploadDir = path.join(uploadsRoot, "videos");
const localCourseLibraryRoot =
  process.env.LOCAL_COURSE_LIBRARY || "C:\\Users\\karna\\Downloads\\courses";

const ensureMediaDirectories = () => {
  [uploadsRoot, courseVideoUploadDir].forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

const toUrlPath = (value) =>
  String(value || "")
    .split(/[\\/]+/)
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const buildUploadVideoPath = (fileName) => `/media/uploads/videos/${toUrlPath(fileName)}`;

const buildLibraryVideoPath = (relativePath) => `/media/library/${toUrlPath(relativePath)}`;

module.exports = {
  uploadsRoot,
  courseVideoUploadDir,
  localCourseLibraryRoot,
  ensureMediaDirectories,
  buildUploadVideoPath,
  buildLibraryVideoPath
};
