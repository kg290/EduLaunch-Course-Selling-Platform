const path = require("path");
const multer = require("multer");

const {
  courseVideoUploadDir,
  ensureMediaDirectories
} = require("../config/media");

ensureMediaDirectories();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, courseVideoUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".mp4";
    const safeBase = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    cb(null, `${safeBase}${ext.toLowerCase()}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const mimeType = String(file.mimetype || "").toLowerCase();
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowedExts = new Set([".mp4", ".webm", ".mov", ".m4v", ".mkv"]);
  const isVideo = mimeType.startsWith("video/") || allowedExts.has(ext);

  if (!isVideo) {
    return cb(new Error("Only video files are allowed"));
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
  }
});

module.exports = {
  courseVideoUpload: upload.single("file")
};
