const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      trim: true
    },
    recipientName: {
      type: String,
      required: true,
      trim: true
    },
    issuedAt: {
      type: Date,
      required: true
    }
  },
  { _id: false }
);

module.exports = certificateSchema;
