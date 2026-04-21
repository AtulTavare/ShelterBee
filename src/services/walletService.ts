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
        ownerBal += ownerWalletSnap.data().availableBalance || 0;
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
        adminBal += adminWalletSnap.data().availableBalance || 0;
      }
      transaction.set(adminWalletRef, {
        userId: adminId,
        availableBalance: adminBal,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Create Transactions
      const txnsRef = collection(db, 'walletTransactions');
      
      // Owner Credit
      transaction.set(doc(txnsRef), {
        userId: ownerId,
        bookingId,
        type: 'credit',
        reason: 'booking_earning',
        amount: ownerShare,
        description: `Booking received - ${propertyTitle}`,
        propertyTitle,
        bookingAmount,
        platformCommission,
        receivedAmount: ownerShare,
        status: 'completed',
        createdAt: serverTimestamp(),
        balanceAfter: ownerBal
      });

      // Admin Credit
      transaction.set(doc(txnsRef), {
        userId: adminId,
        bookingId,
        type: 'credit',
        reason: 'admin_commission',
        amount: platformCommission,
        description: `Platform commission - ${propertyTitle}`,
        propertyTitle,
        status: 'completed',
        createdAt: serverTimestamp(),
        balanceAfter: adminBal
      });
    });
  },

  async processCancellationWallet(bookingId: string, booking: any, refundPercent: number) {
    const adminId = await this.getAdminId();
    const totalAmount = booking.totalAmount || booking.estimatedCost || 0;
    const refundAmount = totalAmount * (refundPercent / 100);
    const adminShare = totalAmount - refundAmount;
    const propertyTitle = booking.propertyTitle || 'Property';

    await runTransaction(db, async (transaction) => {
      // 1. Deduct 100% from owner (debit always)
      const ownerWalletRef = doc(db, 'wallets', booking.ownerId);
      const ownerWalletSnap = await transaction.get(ownerWalletRef);
      let ownerBal = -totalAmount;
      if (ownerWalletSnap.exists()) {
        ownerBal += ownerWalletSnap.data().availableBalance || 0;
      }
      transaction.set(ownerWalletRef, {
        userId: booking.ownerId,
        availableBalance: ownerBal,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. Refund to visitor (if refundPercent > 0)
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

      // 3. Remaining to admin
      const adminWalletRef = doc(db, 'wallets', adminId);
      const adminWalletSnap = await transaction.get(adminWalletRef);
      let adminBal = adminShare;
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
        bookingId,
        type: 'debit',
        reason: 'cancellation_deduction',
        amount: totalAmount,
        description: `Booking cancelled - ${propertyTitle}`,
        status: 'completed',
        createdAt: serverTimestamp(),
        balanceAfter: ownerBal
      });

      // Visitor Transaction (if refund > 0)
      if (refundAmount > 0) {
        transaction.set(doc(txnsRef), {
          userId: booking.visitorId,
          bookingId,
          type: 'credit',
          reason: 'refund',
          amount: refundAmount,
          description: `Refund received - ${propertyTitle} (${refundPercent}% refund)`,
          status: 'completed',
          createdAt: serverTimestamp(),
          balanceAfter: visitorBal
        });
      }

      // Admin Transaction
      transaction.set(doc(txnsRef), {
        userId: adminId,
        bookingId,
        type: 'credit',
        reason: 'admin_commission',
        amount: adminShare,
        description: `Cancelled booking commission - ${propertyTitle}`,
        status: 'completed',
        createdAt: serverTimestamp(),
        balanceAfter: adminBal
      });
    });

    // Update booking document
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancellationTime: serverTimestamp(),
      refundPercentage: refundPercent,
      refundAmount: refundAmount,
      updatedAt: serverTimestamp()
    });
  },

  async requestWithdrawal(userId: string, amount: number, bankAccount: any) {
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

    const totalToday = todaysWithdrawals.filter(r => r.status !== 'rejected').reduce((sum, r) => sum + r.amount, 0);
    if (totalToday + amount > 10000) {
      throw new Error(`Daily limit reached: Maximum ₹10,000 per day. Remaining limit: ₹${10000 - totalToday}`);
    }

    await runTransaction(db, async (transaction) => {
      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await transaction.get(walletRef);
      
      if (!walletSnap.exists()) throw new Error("Wallet not found");
      
      const data = walletSnap.data();
      if ((data.availableBalance || 0) < amount) {
        throw new Error("Insufficient available balance");
      }

      // Deduct from available balance immediately
      transaction.update(walletRef, {
        availableBalance: data.availableBalance - amount,
        updatedAt: serverTimestamp()
      });

      const txnRef = doc(collection(db, 'walletTransactions'));
      transaction.set(txnRef, {
        userId,
        type: 'debit',
        reason: 'withdrawal',
        amount,
        description: `Withdrawal to - ${bankAccount.bankName} (Ac: ...${bankAccount.accountNumber.slice(-4)})`,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      const reqRef = doc(collection(db, 'withdrawalRequests'));
      transaction.set(reqRef, {
        userId,
        amount,
        bankAccount,
        status: 'pending',
        requestedAt: serverTimestamp(),
        transactionId: txnRef.id
      });
    });

    // Send email notification
    try {
      const user = await userService.getUserProfile(userId);
      if (user && user.email) {
        await emailService.sendEmail({
          to: user.email,
          subject: `Withdrawal Request Received: ₹${amount}`,
          html: `<h1>Withdrawal Request</h1><p>Your request for ₹${amount} is under processing. It will be credited within 3-4 working days.</p>`
        });
      }
    } catch (error) {
      console.error("Failed to send withdrawal request email:", error);
    }
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
