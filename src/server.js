import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import dbConnect from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import visitRoutes from "./routes/visits.js";
import earningRoutes from "./routes/earnings.js";
import userRoutes from "./routes/users.js";
import adminRoutes from "./routes/admin.js";
const app = express();
const PORT = process.env.PORT || 5e3;
const allowedOrigins = [
  "https://al-shifa-clinic-frontend.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/earnings", earningRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
const startServer = async () => {
  try {
    await dbConnect();
    console.log("Connected to MongoDB via Express");
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
startServer();
