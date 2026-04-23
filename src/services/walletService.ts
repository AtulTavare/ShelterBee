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
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

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
  type: 'credit' | 'debit';
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
  status: 'pending' | 'completed' | 'rejected';
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
  async getOrCreateWallet(userId: string, transaction?: Transaction): Promise<number> {
    const walletRef = doc(db, 'wallets', userId);
    
    if (transaction) {
      const walletSnap = await transaction.get(walletRef);
      if (walletSnap.exists()) {
        return walletSnap.data().balance ?? 0;
      } else {
        transaction.set(walletRef, {
          userId,
          balance: 0,
          pendingBalance: 0,
          updatedAt: serverTimestamp()
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
          updatedAt: serverTimestamp()
        });
        return 0;
      }
    }
  },

  // Helper to find admin
  async getAdminId(): Promise<string> {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    if (snap.empty) return 'platform_admin'; // Fallback
    return snap.docs[0].id;
  },

  // FUNCTION 2 - processBookingWallet
  async processBookingWallet(
    bookingId: string, 
    bookingAmount: number, 
    ownerUid: string, 
    visitorUid: string, 
    propertyTitle: string
  ): Promise<void> {
    try {
      const adminUid = await this.getAdminId();
      const ownerCredit = bookingAmount * 0.75;
      const adminCredit = bookingAmount * 0.25;

      await runTransaction(db, async (transaction) => {
        // Get or create wallets
        const ownerBal = await this.getOrCreateWallet(ownerUid, transaction);
        const adminBal = await this.getOrCreateWallet(adminUid, transaction);

        const newOwnerBalance = ownerBal + ownerCredit;
        const newAdminBalance = adminBal + adminCredit;

        const ownerWalletRef = doc(db, 'wallets', ownerUid);
        const adminWalletRef = doc(db, 'wallets', adminUid);
        const bookingRef = doc(db, 'bookings', bookingId);
        const txnRef = collection(db, 'walletTransactions');

        // Update wallets
        transaction.update(ownerWalletRef, {
          balance: newOwnerBalance,
          updatedAt: serverTimestamp()
        });

        transaction.update(adminWalletRef, {
          balance: newAdminBalance,
          updatedAt: serverTimestamp()
        });

        // Owner transaction record
        transaction.set(doc(txnRef), {
          userId: ownerUid,
          type: 'credit',
          amount: ownerCredit,
          description: `New booking - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          platformCommission: adminCredit,
          receivedAmount: ownerCredit,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance
        });

        // Admin transaction record
        transaction.set(doc(txnRef), {
          userId: adminUid,
          type: 'credit',
          amount: adminCredit,
          description: `Platform commission - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance
        });

        // Update booking
        transaction.update(bookingRef, {
          walletProcessed: true,
          updatedAt: serverTimestamp()
        });
      });

      console.log(`Success: processBookingWallet for ${bookingId}. Owner: +${ownerCredit}, Admin: +${adminCredit}`);
    } catch (error) {
      console.error('Wallet failed for booking:', bookingId, error);
      throw error;
    }
  },

  // FUNCTION 3 - processOwnerRejectionWallet
  async processOwnerRejectionWallet(
    bookingId: string,
    bookingAmount: number,
    ownerUid: string,
    visitorUid: string,
    propertyTitle: string
  ): Promise<void> {
    try {
      const adminUid = await this.getAdminId();
      const paymentPartnerCharge = bookingAmount * 0.05;
      const visitorRefund = bookingAmount * 0.95;
      const ownerDebit = bookingAmount * 0.75;
      const adminReversal = bookingAmount * 0.25;

      await runTransaction(db, async (transaction) => {
        const ownerBal = await this.getOrCreateWallet(ownerUid, transaction);
        const adminBal = await this.getOrCreateWallet(adminUid, transaction);
        const visitorBal = await this.getOrCreateWallet(visitorUid, transaction);

        const newOwnerBalance = ownerBal - ownerDebit;
        // Net admin = -25% (reversal) + 5% (charge) = -20%
        const adminBalanceAfterDebit = adminBal - adminReversal;
        const newAdminBalance = adminBalanceAfterDebit + paymentPartnerCharge;
        const newVisitorBalance = visitorBal + visitorRefund;

        const ownerWalletRef = doc(db, 'wallets', ownerUid);
        const adminWalletRef = doc(db, 'wallets', adminUid);
        const visitorWalletRef = doc(db, 'wallets', visitorUid);
        const bookingRef = doc(db, 'bookings', bookingId);
        const txnRef = collection(db, 'walletTransactions');

        // Update wallets
        transaction.update(ownerWalletRef, {
          balance: newOwnerBalance,
          updatedAt: serverTimestamp()
        });

        transaction.update(adminWalletRef, {
          balance: newAdminBalance,
          updatedAt: serverTimestamp()
        });

        transaction.update(visitorWalletRef, {
          balance: newVisitorBalance,
          updatedAt: serverTimestamp()
        });

        // Owner transaction
        transaction.set(doc(txnRef), {
          userId: ownerUid,
          type: 'debit',
          amount: ownerDebit,
          description: `Booking rejected - refund issued - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance
        });

        // Admin transaction 1 (reversal)
        transaction.set(doc(txnRef), {
          userId: adminUid,
          type: 'debit',
          amount: adminReversal,
          description: `Commission reversed - booking rejected - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: adminBalanceAfterDebit
        });

        // Admin transaction 2 (charge)
        transaction.set(doc(txnRef), {
          userId: adminUid,
          type: 'credit',
          amount: paymentPartnerCharge,
          description: `Payment partner charge - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance
        });

        // Visitor transaction
        transaction.set(doc(txnRef), {
          userId: visitorUid,
          type: 'credit',
          amount: visitorRefund,
          description: `Refund - booking rejected by owner - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          refundPercentage: 95,
          paymentPartnerCharge: paymentPartnerCharge,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newVisitorBalance
        });

        // Update booking
        transaction.update(bookingRef, {
          walletProcessed: true,
          updatedAt: serverTimestamp()
        });
      });

      console.log(`Success: processOwnerRejectionWallet for ${bookingId}. Owner: -${ownerDebit}, Admin Net: -${adminReversal - paymentPartnerCharge}, Visitor: +${visitorRefund}`);
    } catch (error) {
      console.error('Rejection wallet failed:', error);
      throw error;
    }
  },

  // FUNCTION 4 - processCancellationWallet
  async processCancellationWallet(
    booking: any,
    refundPercent: number
  ): Promise<void> {
    try {
      const adminUid = await this.getAdminId();
      const bookingAmount = booking.totalAmount;
      const refundAmount = bookingAmount * (refundPercent / 100);
      const adminGets = bookingAmount - refundAmount;
      const ownerDebit = bookingAmount; // Assuming owner gets 100% of debit reversal? Or should it be owner payout reversal?
      // Request says: "Owner wallet: -100% debit ALWAYS"
      // This means we take back the full booking amount from owner's balance? 
      // If we credited 75% initially, -100% means we take back 75%? Or 100%?
      // "Owner wallet: -100% debit ALWAYS" implies taking back the full potential revenue or reversing the credit.
      // Usually it means taking back what was given.
      // If owner was given 75%, -100% of the totalAmount would put them in negative if they didn't have enough.
      // Let's assume -bookingAmount to be safe as per "100% debit ALWAYS".

      await runTransaction(db, async (transaction) => {
        const ownerBal = await this.getOrCreateWallet(booking.ownerId, transaction);
        const adminBal = await this.getOrCreateWallet(adminUid, transaction);
        
        const newOwnerBalance = ownerBal - bookingAmount;
        let newAdminBalance = adminBal;
        let newVisitorBalance = 0;

        const ownerWalletRef = doc(db, 'wallets', booking.ownerId);
        const adminWalletRef = doc(db, 'wallets', adminUid);
        const bookingRef = doc(db, 'bookings', booking.id);
        const txnRef = collection(db, 'walletTransactions');

        // Update Owner Wallet
        transaction.update(ownerWalletRef, {
          balance: newOwnerBalance,
          updatedAt: serverTimestamp()
        });

        // Owner transaction
        transaction.set(doc(txnRef), {
          userId: booking.ownerId,
          type: 'debit',
          amount: bookingAmount,
          description: `Booking cancelled by visitor - ${booking.propertyTitle}`,
          bookingId: booking.id,
          propertyTitle: booking.propertyTitle,
          bookingAmount: bookingAmount,
          refundPercentage: refundPercent,
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance
        });

        // Visitor refund
        if (refundPercent > 0) {
          const visitorBal = await this.getOrCreateWallet(booking.visitorId, transaction);
          newVisitorBalance = visitorBal + refundAmount;
          const visitorWalletRef = doc(db, 'wallets', booking.visitorId);
          transaction.update(visitorWalletRef, {
            balance: newVisitorBalance,
            updatedAt: serverTimestamp()
          });

          transaction.set(doc(txnRef), {
            userId: booking.visitorId,
            type: 'credit',
            amount: refundAmount,
            description: `Refund ${refundPercent}% - ${booking.propertyTitle}`,
            bookingId: booking.id,
            propertyTitle: booking.propertyTitle,
            bookingAmount: bookingAmount,
            refundPercentage: refundPercent,
            walletProcessed: true,
            createdAt: serverTimestamp(),
            balanceAfter: newVisitorBalance
          });
        }

        // Admin gets
        if (adminGets > 0) {
          newAdminBalance = adminBal + adminGets;
          transaction.update(adminWalletRef, {
            balance: newAdminBalance,
            updatedAt: serverTimestamp()
          });

          transaction.set(doc(txnRef), {
            userId: adminUid,
            type: 'credit',
            amount: adminGets,
            description: `Cancellation charge - ${booking.propertyTitle}`,
            bookingId: booking.id,
            propertyTitle: booking.propertyTitle,
            walletProcessed: true,
            createdAt: serverTimestamp(),
            balanceAfter: newAdminBalance
          });
        }

        // Update booking
        transaction.update(bookingRef, {
          walletProcessed: true,
          updatedAt: serverTimestamp()
        });
      });

      console.log(`Success: processCancellationWallet for ${booking.id}. Owner: -${bookingAmount}, Visitor: +${refundAmount}, Admin: +${adminGets}`);
    } catch (error) {
      console.error('Cancellation wallet failed:', error);
      throw error;
    }
  },

  // FUNCTION 5 - requestWithdrawal
  async requestWithdrawal(
    userId: string,
    amount: number,
    bankDetails: object
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'withdrawalRequests'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(today))
      );
      const snap = await getDocs(q);
      if (snap.size >= 2) {
        throw new Error("Daily withdrawal limit reached. Maximum 2 per day.");
      }

      await runTransaction(db, async (transaction) => {
        const walletBal = await this.getOrCreateWallet(userId, transaction);
        if (walletBal < amount) {
          throw new Error("Insufficient balance for withdrawal.");
        }

        const newBalance = walletBal - amount;
        const walletRef = doc(db, 'wallets', userId);
        const txnRef = collection(db, 'walletTransactions');
        const reqRef = collection(db, 'withdrawalRequests');

        // Deduct from wallet
        transaction.update(walletRef, {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });

        // Debit transaction record
        transaction.set(doc(txnRef), {
          userId,
          type: 'debit',
          amount,
          description: `Withdrawal request of ₹${amount}`,
          bookingId: '',
          propertyTitle: 'Withdrawal',
          walletProcessed: true,
          createdAt: serverTimestamp(),
          balanceAfter: newBalance
        });

        // Withdrawal request document
        transaction.set(doc(reqRef), {
          userId,
          amount,
          status: 'pending',
          bankDetails: bankDetails,
          createdAt: serverTimestamp(),
          processedAt: null
        });
      });

      console.log(`Success: requestWithdrawal for ${userId}, amount: ${amount}`);
    } catch (error) {
      console.error('Withdrawal request failed:', error);
      throw error;
    }
  },

  // FUNCTION 6 - subscribeToWalletBalance
  subscribeToWalletBalance(
    userId: string,
    callback: (balance: number) => void
  ): () => void {
    return onSnapshot(
      doc(db, 'wallets', userId),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data().balance ?? 0);
        } else {
          callback(0);
        }
      },
      (error) => {
        console.error('Wallet balance listener error:', error);
        callback(0);
      }
    );
  },

  // FUNCTION 7 - subscribeToWalletTransactions
  subscribeToWalletTransactions(
    userId: string,
    callback: (transactions: any[]) => void
  ): () => void {
    return onSnapshot(
      query(
        collection(db, 'walletTransactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      ),
      (snap) => {
        const transactions = snap.docs.map(d => ({
          id: d.id, ...d.data()
        }));
        callback(transactions);
      },
      (error) => {
        console.error('Wallet transactions listener error:', error);
        callback([]);
      }
    );
  },

  // Added for Profile.tsx stats until fully refactored
  async getWallet(userId: string) {
    const walletRef = doc(db, 'wallets', userId);
    const snap = await getDoc(walletRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...data,
        availableBalance: data.balance ?? 0 // Map balance to availableBalance for UI
      };
    }
    return { balance: 0, availableBalance: 0, pendingBalance: 0 };
  },

  async updateBankAccount(userId: string, bankAccount: any) {
    const walletRef = doc(db, 'wallets', userId);
    await updateDoc(walletRef, {
      bankAccount,
      updatedAt: serverTimestamp()
    });
  },

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    const q = query(
      collection(db, 'walletTransactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      reason: d.data().description // Map description to reason for UI
    })) as WalletTransaction[];
  },

  async getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    return this.getTransactions(userId);
  },

  async getAllPendingSettlements(): Promise<WalletTransaction[]> {
    const q = query(
      collection(db, 'walletTransactions'),
      where('walletProcessed', '==', true), // Assuming processed ones are candidates for display in admin
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      reason: d.data().description
    })) as WalletTransaction[];
  },

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    const q = query(
      collection(db, 'withdrawalRequests'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      requestedAt: d.data().createdAt,
      bankAccount: d.data().bankDetails // Map bankDetails to bankAccount for UI
    })) as WithdrawalRequest[];
  },

  async markSettlementComplete(transactionId: string) {
    // In this simplified model, settlements are auto-completed. 
    // This method exists for UI compatibility.
    console.log('Marking settlement complete:', transactionId);
    return true;
  },

  async processWithdrawal(requestId: string, status: 'completed' | 'rejected') {
    const reqRef = doc(db, 'withdrawalRequests', requestId);
    await updateDoc(reqRef, {
      status,
      processedAt: serverTimestamp()
    });
    return true;
  },

  subscribeToPendingSettlements(callback: (settlements: WalletTransaction[]) => void): () => void {
    const q = query(
      collection(db, 'walletTransactions'),
      where('walletProcessed', '==', true),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snap) => {
      const settlements = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        reason: d.data().description
      })) as WalletTransaction[];
      callback(settlements);
    }, (error) => {
      console.error('Pending settlements listener error:', error);
      callback([]);
    });
  },

  subscribeToWithdrawalRequests(callback: (requests: WithdrawalRequest[]) => void): () => void {
    const q = query(
      collection(db, 'withdrawalRequests'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snap) => {
      const requests = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        requestedAt: d.data().createdAt,
        bankAccount: d.data().bankDetails
      })) as WithdrawalRequest[];
      callback(requests);
    }, (error) => {
      console.error('Withdrawal requests listener error:', error);
      callback([]);
    });
  }
};
