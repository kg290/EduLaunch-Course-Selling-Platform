const mongoose = require("mongoose");

let cachedConnection = global.mongooseConnectionCache;
if (!cachedConnection) {
  cachedConnection = global.mongooseConnectionCache = {
    conn: null,
    promise: null
  };
}

const connectDB = async () => {
  if (cachedConnection.conn) {
    return cachedConnection.conn;
  }

  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/course_platform";

  if (!cachedConnection.promise) {
    cachedConnection.promise = mongoose.connect(mongoUri).then((mongooseInstance) => {
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return mongooseInstance;
    });
  }

  cachedConnection.conn = await cachedConnection.promise;
  return cachedConnection.conn;
};

module.exports = connectDB;
