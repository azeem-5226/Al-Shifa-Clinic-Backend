import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    clinicName: { type: String },
    qualifications: { type: String },
    role: { type: String, enum: ["admin", "doctor"], default: "doctor" },
    isActive: { type: Boolean, default: true },
    permissions: {
      canAddPatients: { type: Boolean, default: true }
    },
    otp: { type: String },
    otpExpires: { type: Date }
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
var User_default = User;
export {
  User_default as default
};
