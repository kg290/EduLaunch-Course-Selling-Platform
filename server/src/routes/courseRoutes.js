const express = require("express");

const {
  createCourse,
  uploadCourseVideo,
  listCourses,
  getCourseById,
  getMyCourses,
  updateCourse,
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require("../controllers/courseController");
const { protect, optionalProtect, requireRole } = require("../middlewares/auth");
const { courseVideoUpload } = require("../middlewares/upload");

const router = express.Router();

router.get("/", optionalProtect, listCourses);
router.get("/educator/mine", protect, requireRole("educator"), getMyCourses);
router.get("/wishlist/mine", protect, requireRole("student"), getWishlist);
router.post("/upload-video", protect, requireRole("educator"), courseVideoUpload, uploadCourseVideo);
router.post("/:id/wishlist", protect, requireRole("student"), addToWishlist);
router.delete("/:id/wishlist", protect, requireRole("student"), removeFromWishlist);
router.post("/", protect, requireRole("educator"), createCourse);
router.put("/:id", protect, requireRole("educator"), updateCourse);
router.get("/:id", optionalProtect, getCourseById);

module.exports = router;
