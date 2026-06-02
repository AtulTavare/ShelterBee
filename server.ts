import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Firebase Admin with service account
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  initializeApp({
    credential: cert(serviceAccount),
    projectId: 'sheterbee',
  });
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // API Route to check health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Set up Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
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

  // API Route to reset password - handles both check-user and update-password actions
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { action, email, newPassword, uid } = req.body;

      if (action === 'check-user') {
        if (!email) return res.status(400).json({ error: "Email is required" });
        const user = await getAuth().getUserByEmail(email);
        return res.status(200).json({
          exists: true,
          uid: user.uid,
          emailVerified: user.emailVerified
        });
      }

      if (action === 'update-password') {
        if (!uid || !newPassword) {
          return res.status(400).json({ error: "UID and new password are required" });
        }
        await getAuth().updateUser(uid, { password: newPassword });
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: "Invalid action" });

    } catch (error: any) {
      console.error("Error resetting password:", error);
      if (error.code === 'auth/user-not-found') {
        res.status(404).json({ exists: false, error: "No account found with this email. Please register." });
      } else {
        res.status(500).json({ error: "Failed to reset password" });
      }
    }
  });

  // API Route to generate Cloudinary signature for direct upload
  app.post("/api/cloudinary-signature", async (req, res) => {
    try {
      const { folder } = req.body;
      const timestamp = Math.round(new Date().getTime() / 1000);
      
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        console.error("Missing Cloudinary configuration:", { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret });
        return res.status(500).json({ 
          error: "Cloudinary is not fully configured on the server. Please check environment variables.",
          missing: { 
            cloudName: !cloudName, 
            apiKey: !apiKey, 
            apiSecret: !apiSecret 
          }
        });
      }

      const signature = cloudinary.utils.api_sign_request(
        { folder, timestamp },
        apiSecret
      );

      res.json({
        signature,
        timestamp,
        cloudName,
        apiKey
      });
    } catch (error: any) {
      console.error("Signature generation error:", error);
      res.status(500).json({ error: "Failed to generate Cloudinary signature", details: error.message });
    }
  });

  // Initialize Razorpay
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SwkQFzVHrQ0dYr',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '3vz5ToTHrDMlomV6b2BdAviC',
  });

  // API Route to create Razorpay order
  app.post("/api/create-order", async (req, res) => {
    try {
      const { bookingId, amount } = req.body;
      if (!bookingId || !amount) {
        return res.status(400).json({ error: "bookingId and amount are required" });
      }

      const amountPaise = Math.round(amount * 100);
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: bookingId,
        notes: { bookingId },
      });

      const db = getFirestore();
      await db.collection("bookings").doc(bookingId).update({
        razorpayOrderId: order.id,
        updatedAt: Timestamp.now(),
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_SwkQFzVHrQ0dYr',
      });
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });

  // API Route to verify Razorpay payment
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment verification fields" });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '3vz5ToTHrDMlomV6b2BdAviC')
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: "Invalid payment signature" });
      }

      const db = getFirestore();
      await db.collection("bookings").doc(bookingId).update({
        status: "confirmed",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: "paid",
        updatedAt: Timestamp.now(),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
  });

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled Server Error:", err);
    if (req.url.startsWith('/api/')) {
      return res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
      });
    }
    next(err);
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