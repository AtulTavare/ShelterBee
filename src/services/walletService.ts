import { collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, getDocs, orderBy, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { emailService } from './emailService';
import { emailTemplates } from './emailTemplates';
import { userService } from './userService';

export interface Wallet {
  id: string; // userId
  pendingBalance: number;
  availableBalance: number;
  totalWithdrawn: number;
  bankAccount: {
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
    branchName: string;
    bankName: string;
    verified: boolean;
  } | null;
  updatedAt: any;
}

export interface WalletTransaction {
  id?: string;
  userId: string;
  bookingId?: string;
  type: 'credit' | 'debit';
  reason: 'booking_payment' | 'booking_earning' | 'refund' | 'withdrawal' | 'manual_credit' | 'cancellation_deduction' | 'admin_commission';
  amount: number;
  description: string;
  propertyTitle?: string;
  platformCommission?: number;
  bookingAmount?: number;
  receivedAmount?: number;
  balanceAfter?: number;
  status: 'pending' | 'available' | 'completed' | 'rejected';
  createdAt: any;
  settledAt?: any;
}

export interface WithdrawalRequest {
  id?: string;
  userId: string;
  amount: number;
  bankAccount: {
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
    branchName: string;
    bankName: string;
  };
  status: 'pending' | 'completed' | 'rejected';
  rejectionReason?: string;
  requestedAt: any;
  processedAt?: any;
  transactionId?: string;
}

export const walletService = {
  async getAdminId(): Promise<string> {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    if (snap.empty) return 'platform_admin';
    return snap.docs[0].id;
  },

  async getWallet(userId: string): Promise<Wallet> {
    const walletRef = doc(db, 'wallets', userId);
    const walletSnap = await getDoc(walletRef);
    
    if (walletSnap.exists()) {
      return { id: walletSnap.id, ...walletSnap.data() } as Wallet;
    } else {
      // Create default wallet
      const newWallet: Omit<Wallet, 'id'> = {
        pendingBalance: 0,
        availableBalance: 0,
        totalWithdrawn: 0,
        bankAccount: null,
        updatedAt: serverTimestamp()
      };
      await setDoc(walletRef, newWallet);
      return { id: userId, ...newWallet } as Wallet;
    }
  },

  async updateBankAccount(userId: string, bankAccount: Wallet['bankAccount']) {
    const walletRef = doc(db, 'wallets', userId);
    await updateDoc(walletRef, {
      bankAccount,
      updatedAt: serverTimestamp()
    });
  },

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    const q = query(collection(db, 'walletTransactions'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction)).sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  },

  async getWithdrawalRequests(userId?: string): Promise<WithdrawalRequest[]> {
    const coll = collection(db, 'withdrawalRequests');
    const q = userId ? query(coll, where('userId', '==', userId)) : query(coll);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)).sort((a, b) => {
      const timeA = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : 0;
      const timeB = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : 0;
      return timeB - timeA;
    });
  },

  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await this.getWallet(userId);
    return wallet.availableBalance;
  },

  async getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    return this.getTransactions(userId);
  },

  async processBookingWallet(bookingId: string, bookingAmount: number, ownerId: string, visitorId: string, propertyTitle: string) {
    const adminId = await this.getAdminId();
    const platformCommission = bookingAmount * 0.25;
    const ownerShare = bookingAmount * 0.75;

    await runTransaction(db, async (transaction) => {
      // 1. Credit owner (75%)
      const ownerWalletRef = doc(db, 'wallets', ownerId);
      const ownerWalletSnap = await transaction.get(ownerWalletRef);
      let ownerBal = ownerShare;
      if (ownerWalletSnap.exists()) {
        const data = ownerWalletSnap.data();
        ownerBal += (data.availableBalance || 0);
      }
      transaction.set(ownerWalletRef, {
        userId: ownerId,
        availableBalance: ownerBal,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. Credit admin (25%)
      const adminWalletRef = doc(db, 'wallets', adminId);
      const adminWalletSnap = await transaction.get(adminWalletRef);
      let adminBal = platformCommission;
      if (adminWalletSnap.exists()) {
        const data = adminWalletSnap.data();
        adminBal += (data.availableBalance || 0);
      }
      transaction.set(adminWalletRef, {
        userId: adminId,
        availableBalance: adminBal,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Create Transactions
      const txnsRef = collection(db, 'walletTransactions');
      
      // Owner Transaction
      transaction.set(doc(txnsRef), {
        userId: ownerId,
        type: 'credit',
        amount: ownerShare,
        description: `Booking accepted - ${propertyTitle}`,
        bookingId,
        propertyTitle,
        bookingAmount,
        platformCommission,
        receivedAmount: ownerShare,
        createdAt: serverTimestamp(),
        balanceAfter: ownerBal
      });

      // Admin Transaction
      transaction.set(doc(txnsRef), {
        userId: adminId,
        type: 'credit',
        amount: platformCommission,
        description: `Platform commission - ${propertyTitle}`,
        bookingId,
        propertyTitle,
        bookingAmount,
        createdAt: serverTimestamp(),
        balanceAfter: adminBal
      });
    });
  },

  async processOwnerRejectionWallet(bookingId: string, bookingAmount: number, ownerId: string, visitorId: string, propertyTitle: string) {
    const adminId = await this.getAdminId();
    const paymentPartnerCharge = bookingAmount * 0.05;
    const visitorRefund = bookingAmount * 0.95;

    await runTransaction(db, async (transaction) => {
      // 1. Visitor wallet: +95% credit
      const visitorWalletRef = doc(db, 'wallets', visitorId);
      const visitorWalletSnap = await transaction.get(visitorWalletRef);
      let visitorBal = visitorRefund;
      if (visitorWalletSnap.exists()) {
        visitorBal += visitorWalletSnap.data().availableBalance || 0;
      }
      transaction.set(visitorWalletRef, {
        userId: visitorId,
        availableBalance: visitorBal,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. Admin wallet: +5% credit
      const adminWalletRef = doc(db, 'wallets', adminId);
      const adminWalletSnap = await transaction.get(adminWalletRef);
      let adminBal = paymentPartnerCharge;
      if (adminWalletSnap.exists()) {
        adminBal += adminWalletSnap.data().availableBalance || 0;
      }
      transaction.set(adminWalletRef, {
        userId: adminId,
        availableBalance: adminBal,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const txnsRef = collection(db, 'walletTransactions');

      // Visitor Transaction
      transaction.set(doc(txnsRef), {
        userId: visitorId,
        type: 'credit',
        amount: visitorRefund,
        description: `Booking rejected by owner - 95% refund - ${propertyTitle}`,
        bookingId,
        propertyTitle,
        bookingAmount,
        refundPercentage: 95,
        createdAt: serverTimestamp(),
        balanceAfter: visitorBal
      });

      // Admin Transaction
      transaction.set(doc(txnsRef), {
        userId: adminId,
        type: 'credit',
        amount: paymentPartnerCharge,
        description: `Rejection payment partner charge - ${propertyTitle}`,
        bookingId,
        propertyTitle,
        bookingAmount,
        createdAt: serverTimestamp(),
        balanceAfter: adminBal
      });
    });
  },

  async processCancellationWallet(bookingId: string, booking: any, refundPercent: number) {
    const adminId = await this.getAdminId();
    const bookingAmount = booking.totalAmount;
    const propertyTitle = booking.propertyTitle || 'Property';
    
    // CASE A: Booking was 'confirmed' (owner had accepted)
    if (booking.status === 'confirmed') {
      const refundAmount = bookingAmount * (refundPercent / 100);
      const remainingToAdmin = bookingAmount - refundAmount;

      await runTransaction(db, async (transaction) => {
        // 1. Owner wallet: -100% debit
        const ownerWalletRef = doc(db, 'wallets', booking.ownerId);
        const ownerWalletSnap = await transaction.get(ownerWalletRef);
        let ownerBal = -bookingAmount;
        if (ownerWalletSnap.exists()) {
          ownerBal += ownerWalletSnap.data().availableBalance || 0;
        }
        transaction.set(ownerWalletRef, {
          userId: booking.ownerId,
          availableBalance: ownerBal,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // 2. Visitor wallet: +refundAmount
        let visitorBal = 0;
        if (refundAmount > 0) {
          const visitorWalletRef = doc(db, 'wallets', booking.visitorId);
          const visitorWalletSnap = await transaction.get(visitorWalletRef);
          visitorBal = refundAmount;
          if (visitorWalletSnap.exists()) {
            visitorBal += visitorWalletSnap.data().availableBalance || 0;
          }
          transaction.set(visitorWalletRef, {
            userId: booking.visitorId,
            availableBalance: visitorBal,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        // 3. Admin wallet: +remainingToAdmin
        const adminWalletRef = doc(db, 'wallets', adminId);
        const adminWalletSnap = await transaction.get(adminWalletRef);
        let adminBal = remainingToAdmin;
        if (adminWalletSnap.exists()) {
          adminBal += adminWalletSnap.data().availableBalance || 0;
        }
        transaction.set(adminWalletRef, {
          userId: adminId,
          availableBalance: adminBal,
          updatedAt: serverTimestamp()
        }, { merge: true });

        const txnsRef = collection(db, 'walletTransactions');

        // Owner Transaction
        transaction.set(doc(txnsRef), {
          userId: booking.ownerId,
          type: 'debit',
          amount: bookingAmount,
          description: `Booking cancelled by visitor - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          refundPercentage: refundPercent,
          createdAt: serverTimestamp(),
          balanceAfter: ownerBal
        });

        // Visitor Transaction
        if (refundAmount > 0) {
          transaction.set(doc(txnsRef), {
            userId: booking.visitorId,
            type: 'credit',
            amount: refundAmount,
            description: `Refund - ${refundPercent}% - ${propertyTitle}`,
            bookingId,
            propertyTitle,
            bookingAmount,
            refundPercentage: refundPercent,
            createdAt: serverTimestamp(),
            balanceAfter: visitorBal
          });
        }

        // Admin Transaction
        if (remainingToAdmin > 0) {
          transaction.set(doc(txnsRef), {
            userId: adminId,
            type: 'credit',
            amount: remainingToAdmin,
            description: `Cancellation - ${propertyTitle}`,
            bookingId,
            propertyTitle,
            createdAt: serverTimestamp(),
            balanceAfter: adminBal
          });
        }
      });
    } 
    // CASE B: Booking was 'pending_owner' (owner never accepted)
    else if (booking.status === 'pending_owner') {
      await runTransaction(db, async (transaction) => {
        // Give visitor 100% refund directly
        const visitorWalletRef = doc(db, 'wallets', booking.visitorId);
        const visitorWalletSnap = await transaction.get(visitorWalletRef);
        let visitorBal = bookingAmount;
        if (visitorWalletSnap.exists()) {
          visitorBal += visitorWalletSnap.data().availableBalance || 0;
        }
        transaction.set(visitorWalletRef, {
          userId: booking.visitorId,
          availableBalance: visitorBal,
          updatedAt: serverTimestamp()
        }, { merge: true });

        const txnsRef = collection(db, 'walletTransactions');

        // Visitor Transaction
        transaction.set(doc(txnsRef), {
          userId: booking.visitorId,
          type: 'credit',
          amount: bookingAmount,
          description: `Booking cancelled - Full refund - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          refundPercentage: 100,
          createdAt: serverTimestamp(),
          balanceAfter: visitorBal
        });
      });
    }

    // Update booking document (for completion)
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
  },

  async requestWithdrawal(userId: string, amount: number, bankAccount: any) {
    if (amount < 100) {
      throw new Error("Minimum withdrawal amount is ₹100");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const requests = await this.getWithdrawalRequests(userId);
    const todaysWithdrawals = requests.filter(r => 
      r.requestedAt && 
      r.requestedAt.toDate() >= today
    );

    if (todaysWithdrawals.length >= 2) {
      throw new Error("Withdrawal limit reached. Max 2 per day.");
    }

    await runTransaction(db, async (transaction) => {
      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await transaction.get(walletRef);
      
      if (!walletSnap.exists()) throw new Error("Wallet not found");
      
      const data = walletSnap.data();
      const currentBalance = data.availableBalance || 0;
      
      if (currentBalance < amount) {
        throw new Error("Insufficient available balance");
      }

      // Deduct from available balance immediately
      transaction.update(walletRef, {
        availableBalance: currentBalance - amount,
        updatedAt: serverTimestamp()
      });

      const txnRef = doc(collection(db, 'walletTransactions'));
      transaction.set(txnRef, {
        userId,
        type: 'debit',
        amount,
        description: `Withdrawal request of ₹${amount}`,
        bookingId: '',
        propertyTitle: '',
        bookingAmount: 0,
        platformCommission: 0,
        receivedAmount: 0,
        refundPercentage: 0,
        createdAt: serverTimestamp(),
        balanceAfter: currentBalance - amount
      });

      const reqRef = doc(collection(db, 'withdrawalRequests'));
      transaction.set(reqRef, {
        userId,
        amount,
        status: 'pending',
        bankDetails: bankAccount,
        createdAt: serverTimestamp(),
        processedAt: null
      });
    });
  },

  async getAllWithdrawalRequests() {
    const q = query(collection(db, 'withdrawalRequests'), orderBy('requestedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as WithdrawalRequest[];
  },

  async getAllPendingSettlements() {
    const q = query(collection(db, 'walletTransactions'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as WalletTransaction[];
  },

  async markSettlementComplete(transactionId: string) {
    await updateDoc(doc(db, 'walletTransactions', transactionId), { status: 'completed' });
  },

  async processWithdrawal(requestId: string, action: 'completed' | 'rejected', rejectionReason?: string) {
    await runTransaction(db, async (transaction) => {
      const reqRef = doc(db, 'withdrawalRequests', requestId);
      const reqSnap = await transaction.get(reqRef);
      
      if (!reqSnap.exists()) throw new Error("Request not found");
      
      const reqData = reqSnap.data();
      if (reqData.status !== 'pending') throw new Error("Request is not pending");

      const walletRef = doc(db, 'wallets', reqData.userId);
      const walletSnap = await transaction.get(walletRef);

      if (action === 'completed') {
        if (walletSnap.exists()) {
          const walletData = walletSnap.data();
          transaction.update(walletRef, {
            totalWithdrawn: (walletData.totalWithdrawn || 0) + reqData.amount,
            updatedAt: serverTimestamp()
          });
        }
        
        if (reqData.transactionId) {
          const txnRef = doc(db, 'walletTransactions', reqData.transactionId);
          transaction.update(txnRef, {
            status: 'completed',
            settledAt: serverTimestamp()
          });
        }
      } else if (action === 'rejected') {
        // Refund the available balance
        if (walletSnap.exists()) {
          const walletData = walletSnap.data();
          transaction.update(walletRef, {
            availableBalance: (walletData.availableBalance || 0) + reqData.amount,
            updatedAt: serverTimestamp()
          });
        }
        
        if (reqData.transactionId) {
          const txnRef = doc(db, 'walletTransactions', reqData.transactionId);
          transaction.update(txnRef, {
            status: 'rejected',
            settledAt: serverTimestamp()
          });
        }
      }

      transaction.update(reqRef, {
        status: action,
        rejectionReason: rejectionReason || null,
        processedAt: serverTimestamp()
      });
    });

    // Send email notification
    try {
      const reqSnap = await getDoc(doc(db, 'withdrawalRequests', requestId));
      const reqData = reqSnap.data();
      const user = await userService.getUserProfile(reqData!.userId);
      if (user && user.email) {
        const statusText = action === 'completed' ? 'Processed' : 'Rejected';
        await emailService.sendEmail({
          to: user.email,
          subject: `Withdrawal Request ${statusText}: ₹${reqData!.amount}`,
          html: `<h1>Withdrawal Request ${statusText}</h1><p>Your withdrawal of ₹${reqData!.amount} has been ${statusText.toLowerCase()}.${action === 'rejected' ? ` Reason: ${rejectionReason}` : ''}</p>`
        });
      }
    } catch (error) {
      console.error("Failed to send withdrawal processed email:", error);
    }
  }
};
