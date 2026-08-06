import mongoose, { Schema } from "mongoose";
import Earning from "./Earning.js";
const VisitSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    visitDate: { type: Date, required: true, default: Date.now },
    complaint: { type: String },
    advice: { type: String },
    medicines: { type: String },
    fee: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, default: 0, min: 0 }
  },
  { timestamps: true }
);
VisitSchema.post("save", async function(doc) {
  try {
    const existingEarning = await Earning.findOne({ relatedVisit: doc._id });
    if (existingEarning) {
      if (existingEarning.amount !== doc.fee) {
        existingEarning.amount = doc.fee;
        await existingEarning.save();
      }
    } else if (doc.fee > 0) {
      await Earning.create({
        doctor: doc.doctor,
        amount: doc.fee,
        date: doc.visitDate,
        source: "visit_fee",
        relatedVisit: doc._id
      });
    }
  } catch (error) {
    console.error("Error creating earning from visit hook:", error);
  }
});
const Visit = mongoose.models.Visit || mongoose.model("Visit", VisitSchema);
var Visit_default = Visit;
export {
  Visit_default as default
};
