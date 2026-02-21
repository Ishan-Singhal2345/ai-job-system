require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Check existing admin
    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin@786", 10);

    const admin = await User.create({
      name: "Ishan",
      email: "ishan@admin.com",
      password: hashedPassword,
      role: "admin", // ✅ lowercase
    });

    console.log("✅ Admin created successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();