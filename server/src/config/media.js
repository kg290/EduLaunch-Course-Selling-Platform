const fs = require("fs");
const path = require("path");

const isVercel = process.env.VERCEL === "1";
const uploadsRoot = isVercel
  ? path.join("/tmp", "edulaunch-uploads")
  : path.resolve(__dirname, "../../uploads");
const courseVideoUploadDir = path.join(uploadsRoot, "videos");
const localCourseLibraryRoot =
  process.env.LOCAL_COURSE_LIBRARY ||
  (isVercel ? "" : "C:\\Users\\karna\\Downloads\\courses");

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
  isVercel,
  uploadsRoot,
  courseVideoUploadDir,
  localCourseLibraryRoot,
  ensureMediaDirectories,
  buildUploadVideoPath,
  buildLibraryVideoPath
};
