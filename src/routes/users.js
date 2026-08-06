import { Router } from "express";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Visit from "../models/Visit.js";
import Earning from "../models/Earning.js";
import { requireAdmin } from "../middleware/auth.js";
const router = Router();
router.get("/doctors", requireAdmin, async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-password");
    return res.json(doctors);
  } catch (error) {
    console.error("GET /users/doctors error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete("/doctors/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }
    const doctor = await User.findById(id);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ error: "Doctor not found." });
    }
    await Patient.deleteMany({ doctor: id });
    await Visit.deleteMany({ doctor: id });
    await Earning.deleteMany({ doctor: id });
    await User.findByIdAndDelete(id);
    return res.json({ success: true, message: "Doctor deleted successfully." });
  } catch (error) {
    console.error("DELETE /users/doctors/:id error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/doctors/:id/permissions", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, permissions } = req.body;
    const doctor = await User.findById(id);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ error: "Doctor not found." });
    }
    if (isActive !== void 0) {
      doctor.isActive = isActive;
    }
    if (permissions !== void 0) {
      doctor.permissions = {
        ...doctor.permissions,
        ...permissions
      };
    }
    await doctor.save();
    return res.json({ success: true, doctor });
  } catch (error) {
    console.error("PUT /users/doctors/:id/permissions error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
var users_default = router;
export {
  users_default as default
};
