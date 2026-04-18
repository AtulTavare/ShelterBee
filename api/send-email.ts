import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { to, subject, text, html, from, replyTo } = req.body;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        error: "SMTP credentials not configured on server. Please add them to your environment variables." 
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

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
}
