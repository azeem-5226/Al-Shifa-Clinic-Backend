import { Router } from "express";
import Earning from "../models/Earning.js";
import Patient from "../models/Patient.js";
import Visit from "../models/Visit.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/", async (req, res) => {
  try {
    const startDateStr = req.query.startDate;
    const endDateStr = req.query.endDate;
    const type = req.query.type;
    let filter = { doctor: req.user?.id };
    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (type === "dashboard") {
      const startOfToday = /* @__PURE__ */ new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = /* @__PURE__ */ new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const todaysPatients = await Patient.countDocuments({
        doctor: req.user?.id,
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      });
      const todaysVisits = await Visit.countDocuments({
        doctor: req.user?.id,
        visitDate: { $gte: startOfToday, $lte: endOfToday }
      });
      const todaysEarningsList = await Earning.find({
        doctor: req.user?.id,
        date: { $gte: startOfToday, $lte: endOfToday }
      });
      const todaysEarnings = todaysEarningsList.reduce((acc, curr) => acc + curr.amount, 0);
      const pendingVisitsQuery = {
        doctor: req.user?.id,
        $expr: {
          $gt: [
            "$fee",
            { $ifNull: ["$amountPaid", "$fee"] }
          ]
        }
      };
      const pendingVisitsList = await Visit.find(pendingVisitsQuery).populate("patient", "name mobile").sort({ visitDate: -1 });
      const totalPendingBalance = pendingVisitsList.reduce(
        (acc, visit) => acc + (visit.fee - (visit.amountPaid ?? visit.fee)),
        0
      );
      return res.json({
        todaysPatients,
        todaysVisits,
        todaysEarnings,
        totalPendingBalance,
        pendingVisitsList
      });
    }
    const earnings = await Earning.find(filter).populate({
      path: "relatedVisit",
      populate: { path: "patient", select: "name mobile" }
    }).sort({ date: 1 });
    const total = earnings.reduce((acc, curr) => acc + curr.amount, 0);
    return res.json({
      earnings,
      total
    });
  } catch (error) {
    console.error("GET /earnings error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
var earnings_default = router;
export {
  earnings_default as default
};
