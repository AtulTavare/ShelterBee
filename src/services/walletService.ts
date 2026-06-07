import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  runTransaction,
  onSnapshot,
  limit,
  Transaction,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Wallet {
  userId: string;
  balance: number;
  availableBalance: number; // Added for UI compatibility
  pendingBalance: number;
  updatedAt: any;
  bankAccount?: any;
}

export interface WalletTransaction {
  id?: string;
  userId: string;
  userName?: string;
  userRole?: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  reason?: string;
  bookingId: string;
  propertyTitle: string;
  bookingAmount?: number;
  platformCommission?: number;
  receivedAmount?: number;
  refundPercentage?: number;
  paymentPartnerCharge?: number;
  walletProcessed: boolean;
  createdAt: any;
  balanceAfter: number;
  amountType?: "BOOKING" | "COMMISSION" | "REFUND" | "WITHDRAWAL" | "PENALTY" | "SETTLEMENT";
  paymentMode?: string;
  status?: string;
}

export interface WithdrawalRequest {
  id?: string;
  userId: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  bankAccount: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upiId?: string;
  };
  createdAt: any;
  requestedAt?: any; // Added for UI alias
  processedAt?: any;
}

export const walletService = {
  // FUNCTION 1 - getOrCreateWallet
  async getOrCreateWallet(
    userId: string,
    transaction?: Transaction,
  ): Promise<number> {
    const walletRef = doc(db, "wallets", userId);

    if (transaction) {
      const walletSnap = await transaction.get(walletRef);
      if (walletSnap.exists()) {
        return walletSnap.data().balance ?? 0;
      } else {
        transaction.set(walletRef, {
          userId,
          balance: 0,
          pendingBalance: 0,
          updatedAt: serverTimestamp(),
        });
        return 0;
      }
    } else {
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        return walletSnap.data().balance ?? 0;
      } else {
        await setDoc(walletRef, {
          userId,
          balance: 0,
          pendingBalance: 0,
          updatedAt: serverTimestamp(),
        });
        return 0;
      }
    }
  },

  // Helper to find admin
  async getAdminId(): Promise<string> {
    const q = query(collection(db, "users"), where("role", "==", "admin"));
    const snap = await getDocs(q);
    if (snap.empty) return "platform_admin"; // Fallback
    return snap.docs[0].id;
  },

  // FUNCTION 2 - processBookingWallet
  async processBookingWallet(
    bookingId: string,
    bookingAmount: number,
    ownerUid: string,
    visitorUid: string,
    propertyTitle: string,
    partnerId?: string,
  ): Promise<void> {
    try {
      const adminUid = await this.getAdminId();
      const partnerCredit = partnerId ? bookingAmount * 0.05 : 0;
      const ownerCredit = bookingAmount * 0.80;
      const adminCredit = partnerId ? bookingAmount * 0.15 : bookingAmount * 0.20;

      const [adminSnap, ownerSnap] = await Promise.all([
        getDoc(doc(db, "users", adminUid)),
        getDoc(doc(db, "users", ownerUid)),
      ]);
      const adminData = adminSnap.data();
      const ownerData = ownerSnap.data();
      const adminName = adminData?.name || adminData?.displayName || "Admin";
      const ownerName = ownerData?.name || ownerData?.displayName || "Owner";

      let partnerName = "";
      if (partnerId) {
        const partnerSnap = await getDoc(doc(db, "users", partnerId));
        const partnerData = partnerSnap.data();
        partnerName = partnerData?.name || partnerData?.displayName || "Partner";
      }

      await runTransaction(db, async (transaction) => {
        const adminWalletRef = doc(db, "wallets", adminUid);
        const bookingRef = doc(db, "bookings", bookingId);
        const txnRef = collection(db, "walletTransactions");

        const adminWalletSnap = await transaction.get(adminWalletRef);
        const adminBal = adminWalletSnap.exists()
          ? (adminWalletSnap.data().balance ?? 0)
          : 0;
        const newAdminBalance = adminBal + bookingAmount;

        transaction.set(
          adminWalletRef,
          {
            userId: adminUid,
            balance: newAdminBalance,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        transaction.set(doc(txnRef), {
          userId: adminUid,
          userName: adminName,
          userRole: "admin",
          type: "credit",
          amount: bookingAmount,
          description: `Booking payment received - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          walletProcessed: true,
          amountType: "BOOKING",
          paymentMode: "Online Payment",
          status: "completed",
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance,
        });

        transaction.update(bookingRef, {
          pendingOwnerAmount: ownerCredit,
          pendingPartnerAmount: partnerCredit,
          pendingAdminAmount: adminCredit,
          amountSettled: false,
          walletProcessed: true,
          updatedAt: serverTimestamp(),
        });
      });

      console.log(
        `Success: processBookingWallet for ${bookingId}. Total ₹${bookingAmount} credited to admin. Pending: Owner ₹${ownerCredit}${partnerId ? `, Partner ₹${partnerCredit}` : ''}`,
      );
    } catch (error) {
      console.error("Wallet failed for booking:", bookingId, error);
      throw error;
    }
  },

  // FUNCTION 3 - releasePendingSettlement
  async releasePendingSettlement(bookingId: string): Promise<void> {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);
      if (!bookingSnap.exists()) return;

      const booking = bookingSnap.data();
      if (booking.amountSettled) return;
      if (!booking.pendingOwnerAmount || booking.pendingOwnerAmount <= 0) return;

      const adminUid = await this.getAdminId();

      const [adminUserSnap, ownerUserSnap] = await Promise.all([
        getDoc(doc(db, "users", adminUid)),
        getDoc(doc(db, "users", booking.ownerId)),
      ]);
      const adminName = adminUserSnap.data()?.name || adminUserSnap.data()?.displayName || "Admin";
      const ownerName = ownerUserSnap.data()?.name || ownerUserSnap.data()?.displayName || "Owner";

      let partnerName = "";
      if (booking.partnerId) {
        const pSnap = await getDoc(doc(db, "users", booking.partnerId));
        partnerName = pSnap.data()?.name || pSnap.data()?.displayName || "Partner";
      }

      const { pendingOwnerAmount, pendingPartnerAmount, pendingAdminAmount, propertyTitle, ownerId, partnerId, totalAmount } = booking;

      await runTransaction(db, async (transaction) => {
        const ownerWalletRef = doc(db, "wallets", ownerId);
        const adminWalletRef = doc(db, "wallets", adminUid);
        const txnRef = collection(db, "walletTransactions");

        const ownerSnap = await transaction.get(ownerWalletRef);
        const adminSnap = await transaction.get(adminWalletRef);

        const ownerBal = ownerSnap.exists() ? (ownerSnap.data().balance ?? 0) : 0;
        const adminBal = adminSnap.exists() ? (adminSnap.data().balance ?? 0) : 0;

        const newOwnerBalance = ownerBal + pendingOwnerAmount;
        const newAdminBalance = adminBal - pendingOwnerAmount - (pendingPartnerAmount || 0);

        // Credit owner
        transaction.set(ownerWalletRef, {
          userId: ownerId, balance: newOwnerBalance, updatedAt: serverTimestamp(),
        }, { merge: true });

        // Debit admin (owner + partner payout)
        transaction.set(adminWalletRef, {
          userId: adminUid, balance: newAdminBalance, updatedAt: serverTimestamp(),
        }, { merge: true });

        // Owner transaction
        transaction.set(doc(txnRef), {
          userId: ownerId,
          userName: ownerName,
          userRole: "owner",
          type: "credit",
          amount: pendingOwnerAmount,
          description: `Booking amount released after check-in - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount: totalAmount,
          walletProcessed: true,
          amountType: "SETTLEMENT",
          paymentMode: "Wallet Transfer",
          status: "completed",
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance,
        });

        // Admin payout transaction
        transaction.set(doc(txnRef), {
          userId: adminUid,
          userName: adminName,
          userRole: "admin",
          type: "debit",
          amount: pendingOwnerAmount + (pendingPartnerAmount || 0),
          description: `Payout to owner${partnerId ? ' & partner' : ''} - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount: totalAmount,
          walletProcessed: true,
          amountType: "SETTLEMENT",
          paymentMode: "Wallet Transfer",
          status: "completed",
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance,
        });

        // Partner commission
        if (partnerId && pendingPartnerAmount > 0) {
          const partnerWalletRef = doc(db, "wallets", partnerId);
          const partnerSnap = await transaction.get(partnerWalletRef);
          const partnerBal = partnerSnap.exists() ? (partnerSnap.data().balance ?? 0) : 0;
          const newPartnerBalance = partnerBal + pendingPartnerAmount;

          transaction.set(partnerWalletRef, {
            userId: partnerId, balance: newPartnerBalance, updatedAt: serverTimestamp(),
          }, { merge: true });

          transaction.set(doc(txnRef), {
            userId: partnerId,
            userName: partnerName,
            userRole: "partner",
            type: "credit",
            amount: pendingPartnerAmount,
            description: `Referral commission released after check-in - ${propertyTitle}`,
            bookingId,
            propertyTitle,
            bookingAmount: totalAmount,
            walletProcessed: true,
            amountType: "COMMISSION",
            paymentMode: "Wallet Transfer",
            status: "completed",
            createdAt: serverTimestamp(),
            balanceAfter: newPartnerBalance,
          });
        }

        transaction.update(bookingRef, {
          amountSettled: true,
          settledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      console.log(`Settlement released for booking ${bookingId}`);
    } catch (error) {
      console.error("Failed to release settlement:", bookingId, error);
    }
  },

  // FUNCTION 4 - processAllPendingSettlements
  async processAllPendingSettlements(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, "bookings"),
        where("amountSettled", "==", false),
        where("walletProcessed", "==", true),
        limit(20),
      );
      const snap = await getDocs(q);
      const pending = snap.docs.filter((d) => {
        const data = d.data();
        if (!data.checkIn) return false;
        const checkInTime = data.checkIn?.toMillis?.() || new Date(data.checkIn).getTime();
        return checkInTime <= now.getTime() && (data.pendingOwnerAmount || 0) > 0;
      });

      for (const docSnap of pending) {
        try {
          await this.releasePendingSettlement(docSnap.id);
        } catch (err) {
          console.error(`Settlement failed for booking ${docSnap.id}:`, err);
        }
      }
      if (pending.length > 0) {
        console.log(`Processed ${pending.length} pending settlements`);
      }
    } catch (error) {
      console.error("processAllPendingSettlements failed:", error);
    }
  },

  // FUNCTION 5 - processOwnerRejectionWallet
  async processOwnerRejectionWallet(
    bookingId: string,
    bookingAmount: number,
    ownerUid: string,
    visitorUid: string,
    propertyTitle: string,
    partnerId?: string,
  ): Promise<void> {
    try {
      const adminUid = await this.getAdminId();
      const visitorRefund = bookingAmount * 1.00;

      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);
      if (bookingSnap.exists() && bookingSnap.data().amountSettled) {
        console.log("Booking already settled, using old reversal logic for rejection");
        // Fall back to old logic if already settled (rare edge case)
        return this.processCancellationWallet(
          bookingSnap.data(), 100, partnerId
        );
      }

      const [adminUserSnap, visitorUserSnap] = await Promise.all([
        getDoc(doc(db, "users", adminUid)),
        getDoc(doc(db, "users", visitorUid)),
      ]);
      const adminName = adminUserSnap.data()?.name || adminUserSnap.data()?.displayName || "Admin";
      const visitorName = visitorUserSnap.data()?.name || visitorUserSnap.data()?.displayName || "Visitor";

      await runTransaction(db, async (transaction) => {
        const adminWalletRef = doc(db, "wallets", adminUid);
        const visitorWalletRef = doc(db, "wallets", visitorUid);
        const txnRef = collection(db, "walletTransactions");

        const adminSnap = await transaction.get(adminWalletRef);
        const visitorSnap = await transaction.get(visitorWalletRef);

        const adminBal = adminSnap.exists() ? (adminSnap.data().balance ?? 0) : 0;
        const visitorBal = visitorSnap.exists() ? (visitorSnap.data().balance ?? 0) : 0;

        const newAdminBalance = adminBal - visitorRefund;
        const newVisitorBalance = visitorBal + visitorRefund;

        transaction.set(adminWalletRef, {
          userId: adminUid, balance: newAdminBalance, updatedAt: serverTimestamp(),
        }, { merge: true });

        transaction.set(visitorWalletRef, {
          userId: visitorUid, balance: newVisitorBalance, updatedAt: serverTimestamp(),
        }, { merge: true });

        transaction.set(doc(txnRef), {
          userId: visitorUid,
          userName: visitorName,
          userRole: "visitor",
          type: "credit",
          amount: visitorRefund,
          description: `Refund - booking rejected by owner - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          refundPercentage: 100,
          walletProcessed: true,
          amountType: "REFUND",
          paymentMode: "Online Payment",
          status: "completed",
          createdAt: serverTimestamp(),
          balanceAfter: newVisitorBalance,
        });

        transaction.set(doc(txnRef), {
          userId: adminUid,
          userName: adminName,
          userRole: "admin",
          type: "debit",
          amount: visitorRefund,
          description: `Refund issued - booking rejected by owner - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          walletProcessed: true,
          amountType: "REFUND",
          paymentMode: "Online Payment",
          status: "completed",
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance,
        });

        transaction.update(bookingRef, {
          refundProcessed: true,
          updatedAt: serverTimestamp(),
        });
      });

      console.log(`Owner rejection refund processed for ${bookingId}. Visitor +${visitorRefund} from admin`);
    } catch (error) {
      console.error("Rejection wallet failed:", error);
      throw error;
    }
  },

  // FUNCTION 6 - processCancellationWallet
  async processCancellationWallet(
    booking: any,
    refundPercent: number,
    partnerId?: string,
  ): Promise<void> {
    try {
      const adminUid = await this.getAdminId();
      const bookingAmount = booking.totalAmount;
      const refundAmount = bookingAmount * (refundPercent / 100);

      const bid = booking.id || booking.bookingId;
      const bookingRef = doc(db, "bookings", bid);
      const bookingSnap = await getDoc(bookingRef);
      if (bookingSnap.exists() && bookingSnap.data().amountSettled) {
        console.log("Booking already settled, using old reversal logic for cancellation");
        // Fall back to old logic for already-settled bookings
        const oldProcessCancellation = async () => {
          const ownerDebit = bookingAmount * 0.80;
          const partnerDebit = partnerId ? bookingAmount * 0.05 : 0;
          const adminGets = ownerDebit + partnerDebit - refundAmount;
          await runTransaction(db, async (transaction) => {
            const ownerWalletRef = doc(db, "wallets", booking.ownerId);
            const adminWalletRef = doc(db, "wallets", adminUid);
            const visitorWalletRef = doc(db, "wallets", booking.visitorId);
            const txnRef = collection(db, "walletTransactions");
            const ownerSnap = await transaction.get(ownerWalletRef);
            const adminSnap = await transaction.get(adminWalletRef);
            const visitorSnap = await transaction.get(visitorWalletRef);
            const ownerBal = ownerSnap.exists() ? (ownerSnap.data().balance ?? 0) : 0;
            const adminBal = adminSnap.exists() ? (adminSnap.data().balance ?? 0) : 0;
            const visitorBal = visitorSnap.exists() ? (visitorSnap.data().balance ?? 0) : 0;
            const newOwnerBalance = ownerBal - ownerDebit;
            let newAdminBalance = adminBal;
            let newVisitorBalance = visitorBal;
            transaction.set(ownerWalletRef, { userId: booking.ownerId, balance: newOwnerBalance, updatedAt: serverTimestamp() }, { merge: true });
            transaction.set(doc(txnRef), {
              userId: booking.ownerId, type: "debit", amount: ownerDebit,
              description: `Booking cancelled - ${booking.propertyTitle}`,
              bookingId: booking.id, propertyTitle: booking.propertyTitle,
              bookingAmount, walletProcessed: true, createdAt: serverTimestamp(), balanceAfter: newOwnerBalance,
            });
            if (refundPercent > 0) {
              newVisitorBalance = visitorBal + refundAmount;
              transaction.set(visitorWalletRef, { userId: booking.visitorId, balance: newVisitorBalance, updatedAt: serverTimestamp() }, { merge: true });
              transaction.set(doc(txnRef), {
                userId: booking.visitorId, type: "credit", amount: refundAmount,
                description: `Refund ${refundPercent}% - ${booking.propertyTitle}`,
                bookingId: booking.id, propertyTitle: booking.propertyTitle,
                bookingAmount, refundPercentage: refundPercent, walletProcessed: true,
                createdAt: serverTimestamp(), balanceAfter: newVisitorBalance,
              });
            }
            if (partnerId && partnerDebit > 0) {
              const partnerWalletRef = doc(db, "wallets", partnerId);
              const partnerSnap = await transaction.get(partnerWalletRef);
              const partnerBal = partnerSnap.exists() ? (partnerSnap.data().balance ?? 0) : 0;
              const newPartnerBalance = partnerBal - partnerDebit;
              transaction.set(partnerWalletRef, { userId: partnerId, balance: newPartnerBalance, updatedAt: serverTimestamp() }, { merge: true });
              transaction.set(doc(txnRef), {
                userId: partnerId, type: "debit", amount: partnerDebit,
                description: `Commission reversed - ${booking.propertyTitle}`,
                bookingId: booking.id, propertyTitle: booking.propertyTitle,
                bookingAmount, walletProcessed: true, createdAt: serverTimestamp(), balanceAfter: newPartnerBalance,
              });
            }
            if (adminGets > 0) {
              newAdminBalance = adminBal + adminGets;
              transaction.set(adminWalletRef, { userId: adminUid, balance: newAdminBalance, updatedAt: serverTimestamp() }, { merge: true });
              transaction.set(doc(txnRef), {
                userId: adminUid, type: "credit", amount: adminGets,
                description: `Cancellation charge - ${booking.propertyTitle}`,
                bookingId: booking.id, propertyTitle: booking.propertyTitle,
                walletProcessed: true, createdAt: serverTimestamp(), balanceAfter: newAdminBalance,
              });
            }
            transaction.update(bookingRef, { walletProcessed: true, updatedAt: serverTimestamp() });
          });
        };
        return oldProcessCancellation();
      }

      const [adminUserSnap, visitorUserSnap] = await Promise.all([
        getDoc(doc(db, "users", adminUid)),
        getDoc(doc(db, "users", booking.visitorId)),
      ]);
      const adminName = adminUserSnap.data()?.name || adminUserSnap.data()?.displayName || "Admin";
      const visitorName = visitorUserSnap.data()?.name || visitorUserSnap.data()?.displayName || "Visitor";

      await runTransaction(db, async (transaction) => {
        const adminWalletRef = doc(db, "wallets", adminUid);
        const visitorWalletRef = doc(db, "wallets", booking.visitorId);
        const txnRef = collection(db, "walletTransactions");

        const adminSnap = await transaction.get(adminWalletRef);
        const visitorSnap = await transaction.get(visitorWalletRef);

        const adminBal = adminSnap.exists() ? (adminSnap.data().balance ?? 0) : 0;
        const visitorBal = visitorSnap.exists() ? (visitorSnap.data().balance ?? 0) : 0;

        let newAdminBalance = adminBal;
        let newVisitorBalance = visitorBal;

        if (refundPercent > 0) {
          newAdminBalance = adminBal - refundAmount;
          newVisitorBalance = visitorBal + refundAmount;

          transaction.set(adminWalletRef, {
            userId: adminUid, balance: newAdminBalance, updatedAt: serverTimestamp(),
          }, { merge: true });

          transaction.set(visitorWalletRef, {
            userId: booking.visitorId, balance: newVisitorBalance, updatedAt: serverTimestamp(),
          }, { merge: true });

          transaction.set(doc(txnRef), {
            userId: booking.visitorId,
            userName: visitorName,
            userRole: "visitor",
            type: "credit",
            amount: refundAmount,
            description: `Refund ${refundPercent}% - ${booking.propertyTitle}`,
            bookingId: bid,
            propertyTitle: booking.propertyTitle,
            bookingAmount,
            refundPercentage: refundPercent,
            walletProcessed: true,
            amountType: "REFUND",
            paymentMode: "Online Payment",
            status: "completed",
            createdAt: serverTimestamp(),
            balanceAfter: newVisitorBalance,
          });

          transaction.set(doc(txnRef), {
            userId: adminUid,
            userName: adminName,
            userRole: "admin",
            type: "debit",
            amount: refundAmount,
            description: `Refund issued (${refundPercent}%) - ${booking.propertyTitle}`,
            bookingId: bid,
            propertyTitle: booking.propertyTitle,
            bookingAmount,
            walletProcessed: true,
            amountType: "REFUND",
            paymentMode: "Online Payment",
            status: "completed",
            createdAt: serverTimestamp(),
            balanceAfter: newAdminBalance,
          });
        } else {
          // No refund - admin keeps the full amount as cancellation fee
          transaction.set(doc(txnRef), {
            userId: adminUid,
            userName: adminName,
            userRole: "admin",
            type: "credit",
            amount: bookingAmount,
            description: `Cancellation (no refund) - ${booking.propertyTitle}`,
            bookingId: bid,
            propertyTitle: booking.propertyTitle,
            bookingAmount,
            walletProcessed: true,
            amountType: "BOOKING",
            paymentMode: "Online Payment",
            status: "completed",
            createdAt: serverTimestamp(),
            balanceAfter: adminBal,
          });
        }

        transaction.update(bookingRef, {
          refundProcessed: refundPercent > 0,
          updatedAt: serverTimestamp(),
        });
      });

      console.log(`Cancellation refund processed for ${bid}. Visitor +${refundAmount} from admin`);
    } catch (error) {
      console.error("Cancellation wallet failed:", error);
      throw error;
    }
  },

  // FUNCTION 5 - requestWithdrawal
  async requestWithdrawal(
    userId: string,
    amount: number,
    bankDetails: object,
  ): Promise<void> {
    if (amount < 1000) {
      throw new Error("Minimum withdrawal amount is ₹1,000");
    }
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "withdrawalRequests"),
        where("userId", "==", userId),
      );
      const snap = await getDocs(q);

      const todayRequests = snap.docs.filter((d) => {
        const ts = d.data().createdAt?.toMillis?.() || 0;
        return ts >= todayStart.getTime();
      });
      const todayTotal = todayRequests.reduce((sum, d) => sum + (d.data().amount || 0), 0);
      if (todayTotal + amount > 1000) {
        throw new Error("Daily withdrawal limit is ₹1,000.");
      }

      const weekRequests = snap.docs.filter((d) => {
        const ts = d.data().createdAt?.toMillis?.() || 0;
        return ts >= weekStart.getTime();
      });
      if (weekRequests.length >= 2) {
        throw new Error("Maximum 2 withdrawals per week.");
      }

      await runTransaction(db, async (transaction) => {
        const walletBal = await this.getOrCreateWallet(userId, transaction);
        if (walletBal < amount) {
          throw new Error("Insufficient balance for withdrawal.");
        }

        const newBalance = walletBal - amount;
        const walletRef = doc(db, "wallets", userId);
        const txnRef = collection(db, "walletTransactions");
        const reqRef = collection(db, "withdrawalRequests");

        // Deduct from wallet
        transaction.update(walletRef, {
          balance: newBalance,
          updatedAt: serverTimestamp(),
        });

        // Debit transaction record
        transaction.set(doc(txnRef), {
          userId,
          type: "debit",
          amount,
          description: `Withdrawal request of ₹${amount}`,
          bookingId: "",
          propertyTitle: "Withdrawal",
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newBalance,
        });

        // Withdrawal request document
        transaction.set(doc(reqRef), {
          userId,
          amount,
          status: "pending",
          bankDetails: bankDetails,
          createdAt: serverTimestamp(),
          processedAt: null,
        });
      });

      console.log(
        `Success: requestWithdrawal for ${userId}, amount: ${amount}`,
      );
    } catch (error) {
      console.error("Withdrawal request failed:", error);
      throw error;
    }
  },

  // FUNCTION 6 - subscribeToWalletBalance
  subscribeToWalletBalance(
    userId: string,
    callback: (balance: number) => void,
  ): () => void {
    return onSnapshot(
      doc(db, "wallets", userId),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data().balance ?? 0);
        } else {
          callback(0);
        }
      },
      (error) => {
        console.error("Wallet balance listener error:", error);
        callback(0);
      },
    );
  },

  // FUNCTION 8 - subscribeToWalletTransactions
  subscribeToWalletTransactions(
    userId: string,
    callback: (transactions: any[]) => void,
  ): () => void {
    return onSnapshot(
      query(
        collection(db, "walletTransactions"),
        where("userId", "==", userId),

      ),
      (snap) => {
        const transactions = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        transactions.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        callback(transactions);
      },
      (error) => {
        console.error("Wallet transactions listener error:", error);
        callback([]);
      },
    );
  },

  // Added for Profile.tsx stats until fully refactored
  async getWallet(userId: string) {
    const walletRef = doc(db, "wallets", userId);
    const snap = await getDoc(walletRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...data,
        availableBalance: data.balance ?? 0, // Map balance to availableBalance for UI
      };
    }
    return { balance: 0, availableBalance: 0, pendingBalance: 0 };
  },

  async updateBankAccount(userId: string, bankAccount: any) {
    const walletRef = doc(db, "wallets", userId);
    await updateDoc(walletRef, {
      bankAccount,
      updatedAt: serverTimestamp(),
    });
  },

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    const q = query(
      collection(db, "walletTransactions"),
      where("userId", "==", userId),
      limit(100),
    );
    const snap = await getDocs(q);
    let transactions = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      reason: d.data().description,
    })) as WalletTransaction[];
    transactions.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    return transactions;
  },

  async getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    return this.getTransactions(userId);
  },

  // FUNCTION - getAllTransactions (no userId filter, for admin)
  async getAllTransactions(): Promise<WalletTransaction[]> {
    const q = query(
      collection(db, "walletTransactions"),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      reason: d.data().description,
    })) as WalletTransaction[];
  },

  subscribeToAllTransactions(
    callback: (transactions: any[]) => void,
  ): () => void {
    return onSnapshot(
      query(
        collection(db, "walletTransactions"),
        orderBy("createdAt", "desc"),

      ),
      (snap) => {
        const transactions = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        transactions.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        callback(transactions);
      },
      (error) => {
        console.error("All transactions listener error:", error);
        callback([]);
      },
    );
  },

  async getAllPendingSettlements(): Promise<WalletTransaction[]> {
    const q = query(
      collection(db, "walletTransactions"),
      where("walletProcessed", "==", true), // Assuming processed ones are candidates for display in admin
      orderBy("createdAt", "desc"),
      limit(100),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      reason: d.data().description,
    })) as WalletTransaction[];
  },

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    const q = query(
      collection(db, "withdrawalRequests"),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      requestedAt: d.data().createdAt,
      bankAccount: d.data().bankDetails, // Map bankDetails to bankAccount for UI
    })) as WithdrawalRequest[];
  },

  async markSettlementComplete(transactionId: string) {
    // In this simplified model, settlements are auto-completed.
    // This method exists for UI compatibility.
    console.log("Marking settlement complete:", transactionId);
    return true;
  },

  async processWithdrawal(requestId: string, status: "completed" | "rejected") {
    const reqRef = doc(db, "withdrawalRequests", requestId);
    await updateDoc(reqRef, {
      status,
      processedAt: serverTimestamp(),
    });
    return true;
  },

  subscribeToPendingSettlements(
    callback: (settlements: WalletTransaction[]) => void,
  ): () => void {
    const q = query(
      collection(db, "walletTransactions"),
      where("walletProcessed", "==", true),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    return onSnapshot(
      q,
      (snap) => {
        const settlements = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          reason: d.data().description,
        })) as WalletTransaction[];
        callback(settlements);
      },
      (error) => {
        console.error("Pending settlements listener error:", error);
        callback([]);
      },
    );
  },

  subscribeToWithdrawalRequests(
    callback: (requests: WithdrawalRequest[]) => void,
  ): () => void {
    const q = query(
      collection(db, "withdrawalRequests"),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    return onSnapshot(
      q,
      (snap) => {
        const requests = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          requestedAt: d.data().createdAt,
          bankAccount: d.data().bankDetails,
        })) as WithdrawalRequest[];
        callback(requests);
      },
      (error) => {
        console.error("Withdrawal requests listener error:", error);
        callback([]);
      },
    );
  },

  async processPenaltyDeduction(
    ownerId: string,
    amount: number,
    bookingId: string,
    propertyTitle: string,
  ): Promise<void> {
    try {
      const adminId = await this.getAdminId();
      await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, "wallets", ownerId);
        const adminWalletRef = doc(db, "wallets", adminId);
        const txnRef = collection(db, "walletTransactions");

        const walletSnap = await transaction.get(walletRef);
        const adminSnap = await transaction.get(adminWalletRef);
        const ownerBal = walletSnap.exists() ? (walletSnap.data().balance ?? 0) : 0;
        const adminBal = adminSnap.exists() ? (adminSnap.data().balance ?? 0) : 0;
        const deduction = Math.min(amount, Math.max(ownerBal, 0));
        if (deduction <= 0) return;

        const newOwnerBalance = ownerBal - deduction;
        const newAdminBalance = adminBal + deduction;

        transaction.set(walletRef, { userId: ownerId, balance: newOwnerBalance, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(adminWalletRef, { userId: adminId, balance: newAdminBalance, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(doc(txnRef), {
          userId: ownerId,
          type: "debit",
          amount: deduction,
          description: `Penalty deduction - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance,
        });
        transaction.set(doc(txnRef), {
          userId: adminId,
          type: "credit",
          amount: deduction,
          description: `Penalty collected - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance,
        });
      });
      console.log(`Penalty deduction: ${amount} from owner ${ownerId} for booking ${bookingId}`);
    } catch (error) {
      console.error("Penalty deduction failed:", error);
    }
  },

  // Used by partnerService.backfillPartnerData to credit partner wallets
  // for bookings that were created before partner resolution was fixed.
  async creditPartnerWalletForBackfill(
    partnerId: string,
    bookingId: string,
    amount: number,
    propertyTitle: string,
    bookingAmount: number,
  ) {
    const walletRef = doc(db, "wallets", partnerId);
    const txnRef = collection(db, "walletTransactions");

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(walletRef);
      const currentBalance = snap.exists() ? (snap.data().balance ?? 0) : 0;
      const newBalance = currentBalance + amount;

      transaction.set(
        walletRef,
        {
          userId: partnerId,
          balance: newBalance,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(doc(txnRef), {
        userId: partnerId,
        type: "credit",
        amount,
        description: `Referral commission - ${propertyTitle}`,
        bookingId,
        propertyTitle,
        bookingAmount,
        walletProcessed: true,
        createdAt: serverTimestamp(),
        balanceAfter: newBalance,
      });
    });
  },
};
