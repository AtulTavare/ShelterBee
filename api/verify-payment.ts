import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import crypto from "crypto";

if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccount) {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount))
      });
    } else {
      initializeApp();
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification fields" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
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
}
