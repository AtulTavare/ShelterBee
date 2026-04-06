import { collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, getDocs, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { emailService } from './emailService';
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
  reason: 'booking_earning' | 'refund' | 'withdrawal' | 'manual_credit' | 'cancellation_deduction';
  amount: number;
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
}

export const walletService = {
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

  async getAllPendingSettlements(): Promise<WalletTransaction[]> {
    const q = query(collection(db, 'walletTransactions'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction)).sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  },

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    const snapshot = await getDocs(collection(db, 'withdrawalRequests'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)).sort((a, b) => {
      const timeA = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : 0;
      const timeB = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : 0;
      return timeB - timeA;
    });
  },

  async processBookingPayment(ownerId: string, amount: number, bookingId: string) {
    await runTransaction(db, async (transaction) => {
      const ownerWalletRef = doc(db, 'wallets', ownerId);
      const ownerWalletSnap = await transaction.get(ownerWalletRef);
      
      let availableBalance = amount;
      if (ownerWalletSnap.exists()) {
        availableBalance += ownerWalletSnap.data().availableBalance || 0;
        transaction.update(ownerWalletRef, {
          availableBalance,
          updatedAt: serverTimestamp()
        });
      } else {
        transaction.set(ownerWalletRef, {
          pendingBalance: 0,
          availableBalance,
          totalWithdrawn: 0,
          bankAccount: null,
          updatedAt: serverTimestamp()
        });
      }

      const txnRef = doc(collection(db, 'walletTransactions'));
      transaction.set(txnRef, {
        userId: ownerId,
        bookingId,
        type: 'credit',
        reason: 'booking_earning',
        amount,
        status: 'completed',
        createdAt: serverTimestamp()
      });
    });
  },

  async processRefund(visitorId: string, ownerId: string, visitorAmount: number, ownerAmount: number, bookingId: string) {
    if (visitorAmount <= 0) return;

    await runTransaction(db, async (transaction) => {
      // 1. Credit visitor wallet (pending)
      const visitorWalletRef = doc(db, 'wallets', visitorId);
      const visitorWalletSnap = await transaction.get(visitorWalletRef);
      
      let visitorPending = visitorAmount;
      if (visitorWalletSnap.exists()) {
        visitorPending += visitorWalletSnap.data().pendingBalance || 0;
        transaction.update(visitorWalletRef, {
          pendingBalance: visitorPending,
          updatedAt: serverTimestamp()
        });
      } else {
        transaction.set(visitorWalletRef, {
          pendingBalance: visitorPending,
          availableBalance: 0,
          totalWithdrawn: 0,
          bankAccount: null,
          updatedAt: serverTimestamp()
        });
      }

      const visitorTxnRef = doc(collection(db, 'walletTransactions'));
      transaction.set(visitorTxnRef, {
        userId: visitorId,
        bookingId,
        type: 'credit',
        reason: 'refund',
        amount: visitorAmount,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Debit owner wallet (deduct from pending or available)
      const ownerWalletRef = doc(db, 'wallets', ownerId);
      const ownerWalletSnap = await transaction.get(ownerWalletRef);
      
      if (ownerWalletSnap.exists()) {
        const ownerData = ownerWalletSnap.data();
        let newPending = ownerData.pendingBalance || 0;
        let newAvailable = ownerData.availableBalance || 0;

        // Try to deduct from pending first, then available
        if (newPending >= ownerAmount) {
          newPending -= ownerAmount;
        } else {
          const remaining = ownerAmount - newPending;
          newPending = 0;
          newAvailable -= remaining; // Could go negative if they already withdrew, which is a platform risk
        }

        transaction.update(ownerWalletRef, {
          pendingBalance: newPending,
          availableBalance: newAvailable,
          updatedAt: serverTimestamp()
        });

        const ownerTxnRef = doc(collection(db, 'walletTransactions'));
        transaction.set(ownerTxnRef, {
          userId: ownerId,
          bookingId,
          type: 'debit',
          reason: 'cancellation_deduction',
          amount: ownerAmount,
          status: 'completed',
          createdAt: serverTimestamp()
        });
      }
    });
  },

  async requestWithdrawal(userId: string, amount: number, bankAccount: any) {
    await runTransaction(db, async (transaction) => {
      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await transaction.get(walletRef);
      
      if (!walletSnap.exists()) throw new Error("Wallet not found");
      
      const data = walletSnap.data();
      if ((data.availableBalance || 0) < amount) {
        throw new Error("Insufficient available balance");
      }

      // Deduct from available balance immediately to lock funds
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

    // Send email notification after transaction completes
    try {
      const user = await userService.getUserProfile(userId);
      if (user && user.email) {
        await emailService.sendEmail({
          to: user.email,
          subject: `Withdrawal Request Received: ₹${amount}`,
          text: `Hello ${user.displayName || 'User'},\n\nWe have received your withdrawal request for ₹${amount} to account ending in ${bankAccount.accountNumber.slice(-4)}.\n\nIt will be processed shortly.\n\nThank you,\nAdmin Team`,
          html: `<p>Hello ${user.displayName || 'User'},</p><p>We have received your withdrawal request for <strong>₹${amount}</strong> to account ending in ${bankAccount.accountNumber.slice(-4)}.</p><p>It will be processed shortly.</p><p>Thank you,<br/>Admin Team</p>`
        });
      }
    } catch (error) {
      console.error("Failed to send withdrawal request email:", error);
    }
  },

  async markSettlementComplete(transactionId: string) {
    await runTransaction(db, async (transaction) => {
      const txnRef = doc(db, 'walletTransactions', transactionId);
      const txnSnap = await transaction.get(txnRef);
      
      if (!txnSnap.exists()) throw new Error("Transaction not found");
      
      const txnData = txnSnap.data();
      if (txnData.status !== 'pending') throw new Error("Transaction is not pending");

      const walletRef = doc(db, 'wallets', txnData.userId);
      const walletSnap = await transaction.get(walletRef);
      
      if (walletSnap.exists()) {
        const walletData = walletSnap.data();
        transaction.update(walletRef, {
          pendingBalance: Math.max(0, (walletData.pendingBalance || 0) - txnData.amount),
          availableBalance: (walletData.availableBalance || 0) + txnData.amount,
          updatedAt: serverTimestamp()
        });
      }

      transaction.update(txnRef, {
        status: 'completed', // Changed from 'available' to 'completed' to match other statuses
        settledAt: serverTimestamp()
      });
    });
  },

  async processWithdrawalRequest(requestId: string, action: 'completed' | 'rejected', rejectionReason?: string) {
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

    // Send email notification after transaction completes
    try {
      const reqRef = doc(db, 'withdrawalRequests', requestId);
      const reqSnap = await getDoc(reqRef);
      if (reqSnap.exists()) {
        const reqData = reqSnap.data();
        const user = await userService.getUserProfile(reqData.userId);
        if (user && user.email) {
          const statusText = action === 'completed' ? 'Processed' : 'Rejected';
          let message = `Your withdrawal request for ₹${reqData.amount} has been ${statusText.toLowerCase()}.`;
          if (action === 'rejected' && rejectionReason) {
            message += `\nReason: ${rejectionReason}`;
          }
          
          await emailService.sendEmail({
            to: user.email,
            subject: `Withdrawal Request ${statusText}: ₹${reqData.amount}`,
            text: `Hello ${user.displayName || 'User'},\n\n${message}\n\nThank you,\nAdmin Team`,
            html: `<p>Hello ${user.displayName || 'User'},</p><p>${message.replace('\n', '<br/>')}</p><p>Thank you,<br/>Admin Team</p>`
          });
        }
      }
    } catch (error) {
      console.error("Failed to send withdrawal processed email:", error);
    }
  }
};
