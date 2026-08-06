import "dotenv/config.js";
import express from "express";
import cors from "cors";
import dbConnect from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import visitRoutes from "./routes/visits.js";
import earningRoutes from "./routes/earnings.js";
import userRoutes from "./routes/users.js";
import adminRoutes from "./routes/admin.js";
const app = express();
const PORT = process.env.PORT || 5e3;
app.use(cors({
  origin: true,
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
