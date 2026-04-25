const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");

const seedAdmin = async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/course_platform";

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const email = process.env.ADMIN_EMAIL || "admin@edulaunch.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = "Platform Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  await User.create({ name, email, password, role: "admin" });
  console.log(`Admin user created: ${email} / ${password}`);
  await mongoose.disconnect();
};

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err.message);
  process.exit(1);
});
