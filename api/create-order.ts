import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import Razorpay from "razorpay";

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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
}
