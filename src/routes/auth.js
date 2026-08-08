import { Router } from "express";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import { requireAdmin } from "../middleware/auth.js";
const router = Router();
console.log("================ SMTP Configuration ================");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS is configured:", !!process.env.EMAIL_PASS);
console.log("====================================================");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4, // Force IPv4
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

router.post("/send-otp", async (req, res) => {
  try {
    let { username, password } = req.body;
    if (username) username = username.trim();
    if (password) password = password.trim();
    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password" });
    }
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1e3);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    const mailOptions = {
      from: {
        name: "Al-Shifa Clinic",
        address: process.env.EMAIL_USER
      },
      to: user.username,
      subject: `Your Secure Login OTP - Al-Shifa Clinic`,
      text: `Your OTP for login is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #000; margin: 0;">Al-Shifa Clinic</h2>
            <p style="color: #666; font-size: 14px; margin-top: 5px;">Secure Login Verification</p>
          </div>
          <div style="background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello,</p>
            <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
              You recently requested to sign in to your Al-Shifa Clinic account. Please use the following One-Time Password (OTP) to complete your login:
            </p>
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #000; letter-spacing: 5px; padding: 15px 30px; background-color: #f4f4f5; border-radius: 8px; border: 1px solid #e4e4e7;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 10px; text-align: center;">
              This OTP is valid for <strong>10 minutes</strong>.
            </p>
            <p style="font-size: 14px; color: #999; text-align: center;">
              If you did not request this OTP, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #aaa;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Al-Shifa Clinic. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    try {
      console.log(`[SMTP Send] Attempting to send email to: ${user.username}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP Send] Success:`, info.messageId);
      
      return res.json({ success: true, message: "OTP sent successfully" });
    } catch (smtpError) {
      console.error(`[SMTP Error] in /send-otp:`, smtpError.message);
      return res.status(500).json({ error: "Email sending failed. Please try again later." });
    }
  } catch (error) {
    console.error("Auth send-otp error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/login", async (req, res) => {
  try {
    let { username, password, otp } = req.body;
    if (username) username = username.trim();
    if (password) password = password.trim();
    if (otp) otp = otp.trim();
    if (!username || !password || !otp) {
      return res.status(400).json({ error: "Missing username, password, or otp" });
    }
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (user.isActive === false) {
      return res.status(403).json({ error: "Your account has been disabled by the administrator." });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!user.otp || !user.otpExpires || user.otp !== otp || user.otpExpires < /* @__PURE__ */ new Date()) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }
    user.otp = void 0;
    user.otpExpires = void 0;
    await user.save();
    return res.json({
      id: user._id.toString(),
      name: user.name || user.username,
      email: user.username,
      role: user.role,
      clinicName: user.clinicName,
      qualifications: user.qualifications,
      isActive: user.isActive,
      permissions: user.permissions
    });
  } catch (error) {
    console.error("Auth login error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/forgot-password-otp", async (req, res) => {
  try {

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Missing email/username" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: true, message: "If the email is registered, an OTP has been sent." });
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1e3);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    const mailOptions = {
      from: {
        name: "Al-Shifa Clinic",
        address: process.env.EMAIL_USER
      },
      to: user.username,
      subject: `Password Reset OTP - Al-Shifa Clinic`,
      text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #000; margin: 0;">Al-Shifa Clinic</h2>
            <p style="color: #666; font-size: 14px; margin-top: 5px;">Password Reset</p>
          </div>
          <div style="background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello,</p>
            <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
              You requested to reset your password. Please use the following One-Time Password (OTP):
            </p>
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #000; letter-spacing: 5px; padding: 15px 30px; background-color: #f4f4f5; border-radius: 8px; border: 1px solid #e4e4e7;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 10px; text-align: center;">
              This OTP is valid for <strong>10 minutes</strong>.
            </p>
            <p style="font-size: 14px; color: #999; text-align: center;">
              If you did not request a password reset, please secure your account immediately.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #aaa;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Al-Shifa Clinic. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    try {
      console.log(`[SMTP Send] Attempting to send email to: ${user.username}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP Send] Success:`, info.messageId);
      
      return res.json({ success: true, message: "If the email is registered, an OTP has been sent." });
    } catch (smtpError) {
      console.error(`[SMTP Error] in /forgot-password-otp:`, smtpError.message);
      return res.status(500).json({ error: "Email sending failed. Please try again later." });
    }
  } catch (error) {
    console.error("Auth forgot-password error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;
    if (!username || !otp || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid request" });
    }
    if (!user.otp || !user.otpExpires || user.otp !== otp || user.otpExpires < /* @__PURE__ */ new Date()) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.otp = void 0;
    user.otpExpires = void 0;
    await user.save();
    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Auth reset-password error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/add-doctor", requireAdmin, async (req, res) => {
  try {
    let { username, password, name, clinicName, qualifications } = req.body;
    if (username) username = username.trim();
    if (password) password = password.trim();
    if (!username || !password) {
      return res.status(400).json({ error: "Missing doctor email or password" });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists with this email" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      username,
      password: hashedPassword,
      name,
      clinicName,
      qualifications,
      role: "doctor"
    });
    await user.save();

    const mailOptions = {
      from: {
        name: "Al-Shifa Clinic",
        address: process.env.EMAIL_USER
      },
      to: username,
      subject: `Welcome to Al-Shifa Clinic - Your Doctor Account`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2>Welcome to Al-Shifa Clinic</h2>
          <p>Hello Doctor,</p>
          <p>An administrator has created an account for you.</p>
          <p>Your login email is: <strong>${username}</strong></p>
          <p>Your temporary password is: <strong>${password}</strong></p>
          <p>Please log in using this password. You can change your password later using the forgot password flow.</p>
        </div>
      `
    };
    
    try {
      console.log(`[SMTP Send] Attempting to send email to: ${username}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP Send] Success:`, info.messageId);
      
      return res.json({ success: true, message: "Doctor added successfully and email sent." });
    } catch (smtpError) {
      console.error(`[SMTP Error] in /add-doctor:`, smtpError.message);
      return res.status(500).json({ error: "Email sending failed. Please try again later." });
    }
  } catch (error) {
    console.error("Auth add-doctor error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
var auth_default = router;
export {
  auth_default as default
};
