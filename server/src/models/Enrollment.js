const mongoose = require("mongoose");
const certificateSchema = require("./Certificate");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    educator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    payment: {
      provider: {
        type: String,
        enum: ["stripe", "razorpay"],
        required: true
      },
      transactionId: {
        type: String,
        required: true
      },
      status: {
        type: String,
        default: "captured"
      },
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: "INR"
      }
    },
    progress: {
      completedChapterIndexes: {
        type: [Number],
        default: []
      },
      bookmarkedChapterIndexes: {
        type: [Number],
        default: []
      },
      completedPercent: {
        type: Number,
        default: 0
      },
      lastWatchedAt: Date,
      lastChapterIndex: {
        type: Number,
        default: 0
      }
    },
    certificate: {
      type: certificateSchema,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active"
    },
    completedAt: Date
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
