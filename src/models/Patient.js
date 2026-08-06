import mongoose, { Schema } from "mongoose";
const PatientSchema = new Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    sex: { type: String, enum: ["Male", "Female", "Other"], required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);
PatientSchema.index({ name: 1, mobile: 1, doctor: 1 }, { unique: true });
const Patient = mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
var Patient_default = Patient;
export {
  Patient_default as default
};
