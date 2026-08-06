import mongoose, { Schema } from "mongoose";
const EarningSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    source: { type: String, enum: ["visit_fee", "other"], default: "visit_fee" },
    relatedVisit: { type: Schema.Types.ObjectId, ref: "Visit" }
  },
  { timestamps: true }
);
const Earning = mongoose.models.Earning || mongoose.model("Earning", EarningSchema);
var Earning_default = Earning;
export {
  Earning_default as default
};
