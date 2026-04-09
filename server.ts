import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase Admin client (server-side)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

  // API Route to check if user exists (Supabase-based)
  app.post("/api/check-user", async (req, res) => {
    try {
      const { email, isOwner } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const { data, error } = await supabaseAdmin.from('profiles').select('id, role').eq('email', email).single();
      if (error || !data) {
        return res.status(404).json({ error: 'User not found' });
      }
      const role = data.role;
      if (Boolean(isOwner)) {
        if (role !== 'owner') {
          return res.status(400).json({ error: 'User is not an owner' });
        }
      } else {
        if (!['visitor','admin','owner'].includes(role)) {
          return res.status(400).json({ error: 'Invalid user role' });
        }
      }
      return res.status(200).json({ ok: true, uid: data.id, role });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to check user' });
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

  // API Route to reset password (Supabase Admin REST path)
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
      }
      const { data, error } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
      if (error || !data) return res.status(404).json({ error: 'User not found' });
      const userId = data.id;

      // Use Supabase Admin REST API to update password
      const adminUrl = `${process.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`;
      const fetchFn = globalThis.fetch ? globalThis.fetch : (await import('node-fetch')).default;
      const resp = await fetchFn(adminUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        return res.status(500).json({ error: errData?.message || 'Password reset failed' });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: 'Failed to reset password' });
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
