import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { requireAdmin } from "../middleware/auth.js";
import { createDoctorFolder } from "../services/storageService.js";

const router = Router();
router.use(requireAdmin);
router.get("/dashboard-stats", async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const recentDoctors = await User.find({ role: "doctor" }).select("-password").sort({ createdAt: -1 }).limit(5);
    return res.json({
      totalDoctors,
      activeDoctors: totalDoctors,
      // Currently all non-deleted are active
      recentDoctors
    });
  } catch (error) {
    console.error("GET /admin/dashboard-stats error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a new doctor
router.post("/doctors", async (req, res) => {
  try {
    const { username, password, name, clinicName, qualifications } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create doctor
    const newDoctor = new User({
      username,
      password: hashedPassword,
      name,
      clinicName,
      qualifications,
      role: "doctor",
      isActive: true,
      permissions: { canAddPatients: true }
    });

    await newDoctor.save();

    // Trigger dynamic folder creation for this specific doctor
    await createDoctorFolder(newDoctor._id);

    return res.status(201).json({
      success: true,
      message: "Doctor added successfully and storage folder provisioned",
      data: {
        id: newDoctor._id,
        username: newDoctor.username,
        name: newDoctor.name
      }
    });
  } catch (error) {
    console.error("POST /admin/doctors error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
var admin_default = router;
export {
  admin_default as default
};
