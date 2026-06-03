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

export const config = {
  api: {
    bodyParser: false,
  },
}

function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-razorpay-signature'] as string;

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
    .update(rawBody)
    .digest('hex');

  if (expectedSig !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  try {
    const event = JSON.parse(rawBody);
    const db = getFirestore();
    const eventType = event.event;

    let orderId = '';
    let paymentId = '';
    let refundId = '';
    let amount = 0;
    let fee = 0;
    let method = '';
    let eventStatus = '';

    if (event.payload?.payment?.entity) {
      const p = event.payload.payment.entity;
      orderId = p.order_id || '';
      paymentId = p.id || '';
      amount = p.amount || 0;
      fee = (p.fee || 0) + (p.tax || 0);
      method = p.method || '';
      eventStatus = p.status || '';
    }

    if (event.payload?.refund?.entity) {
      const r = event.payload.refund.entity;
      refundId = r.id || '';
      paymentId = r.payment_id || '';
      amount = r.amount || 0;
      eventStatus = r.status || '';
    }

    let bookingId: string | null = null;
    if (event.payload?.payment?.entity?.notes?.bookingId) {
      bookingId = event.payload.payment.entity.notes.bookingId;
    }
    if (!bookingId && orderId) {
      const snap = await db.collection('bookings')
        .where('razorpayOrderId', '==', orderId)
        .limit(1)
        .get();
      if (!snap.empty) bookingId = snap.docs[0].id;
    }

    await db.collection('paymentLogs').add({
      eventType,
      orderId,
      paymentId,
      refundId,
      bookingId,
      amount,
      fee,
      method,
      status: eventStatus,
      fullPayload: event,
      createdAt: Timestamp.now(),
    });

    if (eventType === 'payment.captured' && bookingId) {
      const bookingDoc = db.collection('bookings').doc(bookingId);
      const data = (await bookingDoc.get()).data();
      if (data && data.status === 'pending_owner') {
        await bookingDoc.update({
          status: 'confirmed',
          razorpayPaymentId: paymentId,
          paymentStatus: 'paid',
          updatedAt: Timestamp.now(),
        });
      }
    }

    if ((eventType === 'payment.failed' || eventType === 'payment.authorized') && bookingId) {
      const bookingDoc = db.collection('bookings').doc(bookingId);
      const data = (await bookingDoc.get()).data();
      if (data && data.status === 'pending_owner') {
        await bookingDoc.update({
          paymentStatus: 'failed',
          updatedAt: Timestamp.now(),
        });
      }
    }

    if (eventType.startsWith('refund.') && bookingId) {
      const bookingDoc = db.collection('bookings').doc(bookingId);
      const data = (await bookingDoc.get()).data();
      if (data && data.status === 'confirmed') {
        await bookingDoc.update({
          paymentStatus: 'refunded',
          refundId,
          refundAmount: amount,
          updatedAt: Timestamp.now(),
        });
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.json({ status: 'ok' });
}
