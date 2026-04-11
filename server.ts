import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

// Initialize Firebase Admin with default credentials
// This works automatically in Google Cloud Run environments
try {
  initializeApp();
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // API Route to check if user exists
  app.post("/api/check-user", async (req, res) => {
    try {
      const { email, isOwner } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const userRecord = await getAuth().getUserByEmail(email);
      
      if (isOwner) {
        const db = getFirestore();
        const userDoc = await db.collection("users").doc(userRecord.uid).get();
        if (userDoc.exists && userDoc.data()?.role !== 'owner') {
           return res.status(404).json({ error: "No property owner account found with this email address." });
        }
      }

      res.json({ exists: true });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        res.status(404).json({ error: "No user found" });
      } else {
        res.status(500).json({ error: "Failed to check user" });
      }
    }
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

  // API Route to reset password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ error: "Email and new password are required" });
      }

      // Get user by email
      const userRecord = await getAuth().getUserByEmail(email);
      
      // Update password
      await getAuth().updateUser(userRecord.uid, {
        password: newPassword
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      if (error.code === 'auth/user-not-found') {
        res.status(404).json({ error: "No account found with this email address." });
      } else {
        res.status(500).json({ error: "Failed to reset password" });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
