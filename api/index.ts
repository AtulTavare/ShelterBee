import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// API Route to send emails
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, text, html, from, replyTo } = req.body;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        error: "SMTP credentials not configured on server. Please add them to your environment variables." 
      });
    }

    const info = await transporter.sendMail({
      from: from || process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
      replyTo: replyTo || process.env.SMTP_USER,
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default app;
