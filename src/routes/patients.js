import { Router } from "express";
import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Visit from "../models/Visit.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/", async (req, res) => {
  try {
    const query = req.query.query;
    let filter = { doctor: req.user?.id };
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { mobile: { $regex: query, $options: "i" } }
      ];
    }
    const patients = await Patient.find(filter).sort({ createdAt: -1 }).limit(50);
    return res.json(patients);
  } catch (error) {
    console.error("GET /patients error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/", async (req, res) => {
  try {
    const doctorId = req.user?.id;
    const doctor = await mongoose.model("User").findById(doctorId);
    if (doctor?.permissions?.canAddPatients === false) {
      return res.status(403).json({ error: "Access Denied: You do not have permission to add patients." });
    }
    const { name, age, sex, mobile, address, visitDate, complaint, advice, medicines, fee, amountPaid } = req.body;
    const existingPatient = await Patient.findOne({ name, mobile, doctor: doctorId });
    if (existingPatient) {
      return res.status(409).json({ error: "Duplicate Patient: A patient with this name and mobile already exists for your clinic." });
    }
    let newPatientId;
    let newVisitId;
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        const patient = new Patient({ name, age, sex, mobile, address, doctor: doctorId });
        await patient.save({ session: dbSession });
        newPatientId = patient._id;
        const visit = new Visit({
          patient: patient._id,
          doctor: doctorId,
          visitDate: visitDate || /* @__PURE__ */ new Date(),
          complaint,
          advice,
          medicines,
          fee: Number(fee) || 0,
          amountPaid: amountPaid !== void 0 ? Number(amountPaid) : Number(fee) || 0
        });
        await visit.save({ session: dbSession });
        newVisitId = visit._id;
      });
    } catch (txError) {
      const patient = new Patient({ name, age, sex, mobile, address, doctor: doctorId });
      await patient.save();
      newPatientId = patient._id;
      const visit = new Visit({
        patient: patient._id,
        doctor: doctorId,
        visitDate: visitDate || /* @__PURE__ */ new Date(),
        complaint,
        advice,
        medicines,
        fee: Number(fee) || 0,
        amountPaid: amountPaid !== void 0 ? Number(amountPaid) : Number(fee) || 0
      });
      await visit.save();
      newVisitId = visit._id;
    } finally {
      await dbSession.endSession();
    }
    return res.status(201).json({ patientId: newPatientId, visitId: newVisitId });
  } catch (error) {
    console.error("POST /patients error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, doctor: req.user?.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    return res.json(patient);
  } catch (error) {
    console.error("GET /patients/:id error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (req.body.name || req.body.mobile) {
      const existing = await Patient.findOne({
        name: req.body.name || { $exists: true },
        mobile: req.body.mobile || { $exists: true },
        doctor: doctorId,
        _id: { $ne: req.params.id }
      });
      const currentPatient = await Patient.findOne({ _id: req.params.id, doctor: doctorId });
      if (!currentPatient) return res.status(404).json({ error: "Patient not found" });
      const checkName = req.body.name || currentPatient.name;
      const checkMobile = req.body.mobile || currentPatient.mobile;
      const duplicate = await Patient.findOne({
        name: checkName,
        mobile: checkMobile,
        doctor: doctorId,
        _id: { $ne: req.params.id }
      });
      if (duplicate) {
        return res.status(409).json({ error: "Duplicate Patient: A patient with this name and mobile already exists." });
      }
    }
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user?.id },
      req.body,
      { new: true }
    );
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    return res.json(patient);
  } catch (error) {
    console.error("PUT /patients/:id error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, doctor: req.user?.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE /patients/:id error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
var patients_default = router;
export {
  patients_default as default
};
