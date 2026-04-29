const jwt = require("jsonwebtoken");

const User = require("../models/User");
const asyncHandler = require("../middlewares/asyncHandler");
const { sendWelcomeEmail } = require("../utils/mailer");

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET || "dev_jwt_secret",
    { expiresIn: "7d" }
  );
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  wishlistCount: Array.isArray(user.wishlist) ? user.wishlist.length : 0
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedRole = role === "educator" ? "educator" : "student";

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    role: normalizedRole
  });

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user).catch(() => {});

  res.status(201).json({
    message: "Registration successful",
    token: createToken(user),
    user: sanitizeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.json({
    message: "Login successful",
    token: createToken(user),
    user: sanitizeUser(user)
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = {
  register,
  login,
  me
};
