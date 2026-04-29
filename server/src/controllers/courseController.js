const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const asyncHandler = require("../middlewares/asyncHandler");
const { buildUploadVideoPath } = require("../config/media");
const { isYouTubeUrl } = require("../utils/youtube");

const normalizeChapters = (chapters) => {
  if (!Array.isArray(chapters) || chapters.length === 0) {
    const error = new Error("At least one chapter is required");
    error.statusCode = 400;
    throw error;
  }

  return chapters.map((chapter, index) => {
    const title = String(chapter?.title || "").trim();
    const youtubeUrl = String(chapter?.youtubeUrl || "").trim();
    const videoPath = String(chapter?.videoPath || "").trim();
    const originalVideoName = String(chapter?.originalVideoName || "").trim();

    if (!title || (!youtubeUrl && !videoPath)) {
      const error = new Error(
        `Chapter ${index + 1} must include title and at least one video source`
      );
      error.statusCode = 400;
      throw error;
    }

    if (youtubeUrl && !isYouTubeUrl(youtubeUrl)) {
      const error = new Error(`Chapter ${index + 1} has an invalid YouTube URL`);
      error.statusCode = 400;
      throw error;
    }

    return {
      title,
      youtubeUrl,
      videoPath,
      originalVideoName,
      summary: String(chapter?.summary || "").trim()
    };
  });
};

const appendWishlistState = (courseObject, wishlistedIds) => ({
  ...courseObject,
  isWishlisted: wishlistedIds.has(String(courseObject._id))
});

const getWishlistedIds = async (user) => {
  if (!user || user.role !== "student") {
    return new Set();
  }

  const freshUser = await User.findById(user._id).select("wishlist");
  return new Set((freshUser?.wishlist || []).map((item) => String(item)));
};

const mapCourseWithAccess = async (course, user) => {
  const previewChapterLimit = 1;
  let hasFullAccess = false;

  if (user) {
    const educatorId = course.educator?._id
      ? course.educator._id.toString()
      : course.educator?.toString();
    const isOwner =
      user.role === "educator" && educatorId === user._id.toString();
    const isAdmin = user.role === "admin";

    if (isOwner || isAdmin) {
      hasFullAccess = true;
    } else if (user.role === "student") {
      const enrollment = await Enrollment.findOne({
        student: user._id,
        course: course._id
      }).select("_id");
      hasFullAccess = Boolean(enrollment);
    }
  }

  const courseObject = course.toObject();
  const totalChapters = courseObject.chapters.length;
  const previewChapterCount = hasFullAccess
    ? totalChapters
    : totalChapters > 1
    ? Math.min(previewChapterLimit, totalChapters)
    : 0;

  const chapters = courseObject.chapters.map((chapter, index) => {
    if (hasFullAccess || index < previewChapterCount) {
      return {
        ...chapter,
        isLocked: false,
        isPreview: !hasFullAccess
      };
    }

    return {
      ...chapter,
      youtubeUrl: "",
      videoPath: "",
      isLocked: true,
      isPreview: false
    };
  });

  return {
    ...courseObject,
    chapters,
    access: {
      hasFullAccess,
      previewChapterCount,
      lockedChapterCount: Math.max(
        totalChapters - previewChapterCount,
        0
      )
    }
  };
};

const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, price, thumbnailUrl, chapters } = req.body;

  if (!title || !description || price === undefined || price === null) {
    res.status(400);
    throw new Error("Title, description, and price are required");
  }

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    res.status(400);
    throw new Error("Price must be a valid non-negative number");
  }

  const normalizedChapters = normalizeChapters(chapters);

  const course = await Course.create({
    title: String(title).trim(),
    description: String(description).trim(),
    category: String(category || "General").trim() || "General",
    price: numericPrice,
    thumbnailUrl: String(thumbnailUrl || "").trim(),
    chapters: normalizedChapters,
    educator: req.user._id
  });

  const populatedCourse = await Course.findById(course._id).populate(
    "educator",
    "name email"
  );

  res.status(201).json({
    message: "Course created successfully",
    course: populatedCourse
  });
});

const uploadCourseVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("A video file is required");
  }

  res.status(201).json({
    message: "Video uploaded successfully",
    asset: {
      videoPath: buildUploadVideoPath(req.file.filename),
      originalVideoName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    }
  });
});

const listCourses = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim();
  const filter = search
    ? {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } }
        ]
      }
    : {};

  const courses = await Course.find(filter)
    .select("-chapters.youtubeUrl -chapters.videoPath")
    .populate("educator", "name")
    .sort({ createdAt: -1 });

  const wishlistedIds = await getWishlistedIds(req.user);
  const mappedCourses = courses.map((course) =>
    appendWishlistState(course.toObject(), wishlistedIds)
  );

  res.json({ courses: mappedCourses });
});

const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate("educator", "name");

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const courseWithAccess = await mapCourseWithAccess(course, req.user);
  const wishlistedIds = await getWishlistedIds(req.user);

  res.json({
    course: appendWishlistState(courseWithAccess, wishlistedIds)
  });
});

const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ educator: req.user._id }).sort({
    createdAt: -1
  });

  res.json({ courses });
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (course.educator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can update only your own courses");
  }

  const { title, description, category, price, thumbnailUrl, chapters } = req.body;

  if (title !== undefined) {
    course.title = String(title).trim();
  }
  if (description !== undefined) {
    course.description = String(description).trim();
  }
  if (category !== undefined) {
    course.category = String(category).trim() || "General";
  }
  if (price !== undefined) {
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      res.status(400);
      throw new Error("Price must be a valid non-negative number");
    }
    course.price = numericPrice;
  }
  if (thumbnailUrl !== undefined) {
    course.thumbnailUrl = String(thumbnailUrl).trim();
  }
  if (chapters !== undefined) {
    course.chapters = normalizeChapters(chapters);
  }

  await course.save();

  const populatedCourse = await Course.findById(course._id).populate(
    "educator",
    "name email"
  );

  res.json({
    message: "Course updated successfully",
    course: populatedCourse
  });
});

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
    select: "-chapters.youtubeUrl -chapters.videoPath",
    populate: { path: "educator", select: "name" }
  });

  const courses = (user?.wishlist || []).map((course) => ({
    ...course.toObject(),
    isWishlisted: true
  }));

  res.json({ courses });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).select("_id");
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { wishlist: course._id }
  });

  res.json({ message: "Course saved to wishlist" });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { wishlist: req.params.id }
  });

  res.json({ message: "Course removed from wishlist" });
});

module.exports = {
  createCourse,
  uploadCourseVideo,
  listCourses,
  getCourseById,
  getMyCourses,
  updateCourse,
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
