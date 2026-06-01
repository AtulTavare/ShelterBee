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
  id?: string; // Added
  userId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  reason?: string; // Added for UI
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

      await runTransaction(db, async (transaction) => {
        const ownerWalletRef = doc(db, "wallets", ownerUid);
        const adminWalletRef = doc(db, "wallets", adminUid);
        const bookingRef = doc(db, "bookings", bookingId);
        const txnRef = collection(db, "walletTransactions");

        const ownerSnap = await transaction.get(ownerWalletRef);
        const adminSnap = await transaction.get(adminWalletRef);

        const ownerBal = ownerSnap.exists()
          ? (ownerSnap.data().balance ?? 0)
          : 0;
        const adminBal = adminSnap.exists()
          ? (adminSnap.data().balance ?? 0)
          : 0;

        const newOwnerBalance = ownerBal + ownerCredit;
        const newAdminBalance = adminBal + adminCredit;

        transaction.set(
          ownerWalletRef,
          {
            userId: ownerUid,
            balance: newOwnerBalance,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        transaction.set(
          adminWalletRef,
          {
            userId: adminUid,
            balance: newAdminBalance,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        // Owner transaction record
        transaction.set(doc(txnRef), {
          userId: ownerUid,
          type: "credit",
          amount: ownerCredit,
          description: `New booking - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          platformCommission: adminCredit,
          receivedAmount: ownerCredit,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance,
        });

        // Admin transaction record
        transaction.set(doc(txnRef), {
          userId: adminUid,
          type: "credit",
          amount: adminCredit,
          description: `Platform commission - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance,
        });

        // Partner commission
        if (partnerId && partnerCredit > 0) {
          const partnerWalletRef = doc(db, "wallets", partnerId);
          const partnerSnap = await transaction.get(partnerWalletRef);
          const partnerBal = partnerSnap.exists()
            ? (partnerSnap.data().balance ?? 0)
            : 0;
          const newPartnerBalance = partnerBal + partnerCredit;

          transaction.set(
            partnerWalletRef,
            {
              userId: partnerId,
              balance: newPartnerBalance,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );

          transaction.set(doc(txnRef), {
            userId: partnerId,
            type: "credit",
            amount: partnerCredit,
            description: `Referral commission - ${propertyTitle}`,
            bookingId,
            propertyTitle,
            bookingAmount,
            walletProcessed: true,
            createdAt: serverTimestamp(),
            balanceAfter: newPartnerBalance,
          });
        }

        // Update booking
        transaction.update(bookingRef, {
          walletProcessed: true,
          updatedAt: serverTimestamp(),
        });
      });

      console.log(
        `Success: processBookingWallet for ${bookingId}. Owner: +${ownerCredit}, Admin: +${adminCredit}${partnerId ? `, Partner: +${partnerCredit}` : ''}`,
      );
    } catch (error) {
      console.error("Wallet failed for booking:", bookingId, error);
      throw error;
    }
  },

  // FUNCTION 3 - processOwnerRejectionWallet
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
      const ownerDebit = bookingAmount * 0.80;
      const partnerDebit = partnerId ? bookingAmount * 0.05 : 0;
      const adminReversal = partnerId ? bookingAmount * 0.15 : bookingAmount * 0.20;

      await runTransaction(db, async (transaction) => {
        const ownerWalletRef = doc(db, "wallets", ownerUid);
        const adminWalletRef = doc(db, "wallets", adminUid);
        const visitorWalletRef = doc(db, "wallets", visitorUid);
        const bookingRef = doc(db, "bookings", bookingId);
        const txnRef = collection(db, "walletTransactions");

        // ALL READS
        const ownerSnap = await transaction.get(ownerWalletRef);
        const adminSnap = await transaction.get(adminWalletRef);
        const visitorSnap = await transaction.get(visitorWalletRef);

        const ownerBal = ownerSnap.exists()
          ? (ownerSnap.data().balance ?? 0)
          : 0;
        const adminBal = adminSnap.exists()
          ? (adminSnap.data().balance ?? 0)
          : 0;
        const visitorBal = visitorSnap.exists()
          ? (visitorSnap.data().balance ?? 0)
          : 0;

        const newOwnerBalance = ownerBal - ownerDebit;
        const newAdminBalance = adminBal - adminReversal;
        const newVisitorBalance = visitorBal + visitorRefund;

        // ALL WRITES
        transaction.set(
          ownerWalletRef,
          {
            userId: ownerUid,
            balance: newOwnerBalance,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        transaction.set(
          adminWalletRef,
          {
            userId: adminUid,
            balance: newAdminBalance,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        transaction.set(
          visitorWalletRef,
          {
            userId: visitorUid,
            balance: newVisitorBalance,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        // Owner transaction
        transaction.set(doc(txnRef), {
          userId: ownerUid,
          type: "debit",
          amount: ownerDebit,
          description: `Booking rejected - refund issued - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance,
        });

        // Admin transaction (reversal)
        transaction.set(doc(txnRef), {
          userId: adminUid,
          type: "debit",
          amount: adminReversal,
          description: `Commission reversed - booking rejected - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance,
        });

        // Partner reversal
        if (partnerId && partnerDebit > 0) {
          const partnerWalletRef = doc(db, "wallets", partnerId);
          const partnerSnap = await transaction.get(partnerWalletRef);
          const partnerBal = partnerSnap.exists()
            ? (partnerSnap.data().balance ?? 0)
            : 0;
          const newPartnerBalance = partnerBal - partnerDebit;

          transaction.set(
            partnerWalletRef,
            {
              userId: partnerId,
              balance: newPartnerBalance,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );

          transaction.set(doc(txnRef), {
            userId: partnerId,
            type: "debit",
            amount: partnerDebit,
            description: `Commission reversed - booking rejected - ${propertyTitle}`,
            bookingId,
            propertyTitle,
            bookingAmount,
            walletProcessed: true,
            createdAt: serverTimestamp(),
            balanceAfter: newPartnerBalance,
          });
        }

        // Visitor transaction
        transaction.set(doc(txnRef), {
          userId: visitorUid,
          type: "credit",
          amount: visitorRefund,
          description: `Refund - booking rejected by owner - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          refundPercentage: 100,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newVisitorBalance,
        });

        // Update booking
        transaction.update(bookingRef, {
          walletProcessed: true,
          updatedAt: serverTimestamp(),
        });
      });

      console.log(
        `Success: processOwnerRejectionWallet for ${bookingId}. Owner: -${ownerDebit}, Admin: -${adminReversal}${partnerId ? `, Partner: -${partnerDebit}` : ''}, Visitor: +${visitorRefund}`,
      );
    } catch (error) {
      console.error("Rejection wallet failed:", error);
      throw error;
    }
  },

  // FUNCTION 4 - processCancellationWallet
  async processCancellationWallet(
    booking: any,
    refundPercent: number,
    partnerId?: string,
  ): Promise<void> {
    try {
      const adminUid = await this.getAdminId();
      const bookingAmount = booking.totalAmount;
      const refundAmount = bookingAmount * (refundPercent / 100);
      const ownerDebit = bookingAmount * 0.80;
      const partnerDebit = partnerId ? bookingAmount * 0.05 : 0;
      const adminGets = ownerDebit + partnerDebit - refundAmount;

      await runTransaction(db, async (transaction) => {
        const ownerWalletRef = doc(db, "wallets", booking.ownerId);
        const adminWalletRef = doc(db, "wallets", adminUid);
        const visitorWalletRef = doc(db, "wallets", booking.visitorId);
        const bookingRef = doc(db, "bookings", booking.id);
        const txnRef = collection(db, "walletTransactions");

        // 1. ALL READS FIRST
        const ownerSnap = await transaction.get(ownerWalletRef);
        const adminSnap = await transaction.get(adminWalletRef);
        const visitorSnap = await transaction.get(visitorWalletRef);

        const ownerBal = ownerSnap.exists()
          ? (ownerSnap.data().balance ?? 0)
          : 0;
        const adminBal = adminSnap.exists()
          ? (adminSnap.data().balance ?? 0)
          : 0;
        const visitorBal = visitorSnap.exists()
          ? (visitorSnap.data().balance ?? 0)
          : 0;

        // 2. CALCULATE NEW BALANCES
        const newOwnerBalance = ownerBal - bookingAmount;
        let newAdminBalance = adminBal;
        let newVisitorBalance = visitorBal;

        // 3. ALL WRITES SECURELY
        // Update Owner Wallet
        transaction.set(
          ownerWalletRef,
          {
            userId: booking.ownerId,
            balance: newOwnerBalance,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        // Owner transaction
        transaction.set(doc(txnRef), {
          userId: booking.ownerId,
          type: "debit",
          amount: bookingAmount,
          description: `Booking cancelled by visitor - ${booking.propertyTitle}`,
          bookingId: booking.id,
          propertyTitle: booking.propertyTitle,
          bookingAmount: bookingAmount,
          refundPercentage: refundPercent,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance,
        });

        // Visitor refund
        if (refundPercent > 0) {
          newVisitorBalance = visitorBal + refundAmount;
          transaction.set(
            visitorWalletRef,
            {
              userId: booking.visitorId,
              balance: newVisitorBalance,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );

          transaction.set(doc(txnRef), {
            userId: booking.visitorId,
            type: "credit",
            amount: refundAmount,
            description: `Refund ${refundPercent}% - ${booking.propertyTitle}`,
            bookingId: booking.id,
            propertyTitle: booking.propertyTitle,
            bookingAmount: bookingAmount,
            refundPercentage: refundPercent,
            walletProcessed: true,
            createdAt: serverTimestamp(),
            balanceAfter: newVisitorBalance,
          });
        }

        // Partner reversal
        if (partnerId && partnerDebit > 0) {
          const partnerWalletRef = doc(db, "wallets", partnerId);
          const partnerSnap = await transaction.get(partnerWalletRef);
          const partnerBal = partnerSnap.exists()
            ? (partnerSnap.data().balance ?? 0)
            : 0;
          const newPartnerBalance = partnerBal - partnerDebit;

          transaction.set(
            partnerWalletRef,
            {
              userId: partnerId,
              balance: newPartnerBalance,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );

          transaction.set(doc(txnRef), {
            userId: partnerId,
            type: "debit",
            amount: partnerDebit,
            description: `Commission reversed - booking cancelled - ${booking.propertyTitle}`,
            bookingId: booking.id,
            propertyTitle: booking.propertyTitle,
            bookingAmount: bookingAmount,
            refundPercentage: refundPercent,
            walletProcessed: true,
            createdAt: serverTimestamp(),
            balanceAfter: newPartnerBalance,
          });
        }

        // Admin gets
        if (adminGets > 0) {
          newAdminBalance = adminBal + adminGets;
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
            type: "credit",
            amount: adminGets,
            description: `Cancellation charge - ${booking.propertyTitle}`,
            bookingId: booking.id,
            propertyTitle: booking.propertyTitle,
            walletProcessed: true,
            createdAt: serverTimestamp(),
            balanceAfter: newAdminBalance,
          });
        }

        // Update booking
        transaction.update(bookingRef, {
          walletProcessed: true,
          updatedAt: serverTimestamp(),
        });
      });

      console.log(
        `Success: processCancellationWallet for ${booking.id}. Owner: -${bookingAmount}, Visitor: +${refundAmount}${partnerId ? `, Partner: -${partnerDebit}` : ''}, Admin: +${adminGets}`,
      );
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
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "withdrawalRequests"),
        where("userId", "==", userId),
      );
      const snap = await getDocs(q);
      const todayRequests = snap.docs.filter((d) => {
        const createdAt = d.data().createdAt?.toMillis?.() || 0;
        return createdAt >= today.getTime();
      });
      if (todayRequests.length >= 2) {
        throw new Error("Daily withdrawal limit reached. Maximum 2 per day.");
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

  // FUNCTION 7 - subscribeToWalletTransactions
  subscribeToWalletTransactions(
    userId: string,
    callback: (transactions: any[]) => void,
  ): () => void {
    return onSnapshot(
      query(
        collection(db, "walletTransactions"),
        where("userId", "==", userId),
        limit(50),
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
