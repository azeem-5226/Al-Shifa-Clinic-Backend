import { Router } from "express";
import Visit from "../models/Visit.js";
import Earning from "../models/Earning.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/", async (req, res) => {
  try {
    const patientId = req.query.patientId;
    if (!patientId) {
      return res.status(400).json({ error: "patientId is required" });
    }
    const visits = await Visit.find({ patient: patientId, doctor: req.user?.id }).populate("doctor", "username").sort({ visitDate: -1, createdAt: -1 });
    return res.json(visits);
  } catch (error) {
    console.error("GET /visits error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/", async (req, res) => {
  try {
    const { patient, visitDate, complaint, advice, medicines, fee, amountPaid } = req.body;
    const doctorId = req.user?.id;
    if (!patient) {
      return res.status(400).json({ error: "patient is required" });
    }
    const visit = new Visit({
      patient,
      doctor: doctorId,
      visitDate: visitDate || /* @__PURE__ */ new Date(),
      complaint,
      advice,
      medicines,
      fee: Number(fee) || 0,
      amountPaid: amountPaid !== void 0 ? Number(amountPaid) : Number(fee) || 0
    });
    await visit.save();
    return res.status(201).json({ visitId: visit._id });
  } catch (error) {
    console.error("POST /visits error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const visit = await Visit.findOne({ _id: req.params.id, doctor: req.user?.id }).populate("patient");
    if (!visit) return res.status(404).json({ error: "Visit not found" });
    return res.json(visit);
  } catch (error) {
    console.error("GET /visits/:id error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const visit = await Visit.findOne({ _id: req.params.id, doctor: req.user?.id });
    if (!visit) return res.status(404).json({ error: "Visit not found" });
    visit.visitDate = req.body.visitDate || visit.visitDate;
    visit.complaint = req.body.complaint !== void 0 ? req.body.complaint : visit.complaint;
    visit.advice = req.body.advice !== void 0 ? req.body.advice : visit.advice;
    visit.medicines = req.body.medicines !== void 0 ? req.body.medicines : visit.medicines;
    visit.fee = req.body.fee !== void 0 ? Number(req.body.fee) : visit.fee;
    visit.amountPaid = req.body.amountPaid !== void 0 ? Number(req.body.amountPaid) : visit.amountPaid;
    await visit.save();
    return res.json(visit);
  } catch (error) {
    console.error("PUT /visits/:id error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const visit = await Visit.findOneAndDelete({ _id: req.params.id, doctor: req.user?.id });
    if (!visit) return res.status(404).json({ error: "Visit not found" });
    await Earning.deleteOne({ relatedVisit: req.params.id, doctor: req.user?.id });
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE /visits/:id error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
var visits_default = router;
export {
  visits_default as default
};
