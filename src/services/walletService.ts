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
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Wallet {
  userId: string;
  balance: number;
  updatedAt: any;
}

export interface WalletTransaction {
  id?: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  bookingId: string;
  propertyTitle: string;
  bookingAmount: number;
  platformCommission?: number;
  receivedAmount?: number;
  refundPercentage?: number;
  refundAmount?: number;
  paymentPartnerCharge?: number;
  scenario: string;
  createdAt: any;
  balanceAfter: number;
}

let cachedAdminUid: string | null = null;

export const walletService = {
  // HELPER - getOrCreateWallet
  async getOrCreateWallet(
    userId: string, 
    t: Transaction
  ): Promise<{ref: DocumentReference, balance: number}> {
    const walletRef = doc(db, 'wallets', userId);
    const walletSnap = await t.get(walletRef);
    
    if (walletSnap.exists()) {
      return { ref: walletRef, balance: walletSnap.data().balance ?? 0 };
    } else {
      const initialData = {
        userId,
        balance: 0,
        updatedAt: serverTimestamp()
      };
      t.set(walletRef, initialData);
      return { ref: walletRef, balance: 0 };
    }
  },

  // HELPER - findAdminUid
  async findAdminUid(): Promise<string> {
    if (cachedAdminUid) return cachedAdminUid;
    
    const q = query(collection(db, 'users'), where('role', '==', 'admin'), limit(1));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      // Create a fallback admin ID if none found to prevent crashes, 
      // but in a real app this should be pre-configured
      return 'system_admin';
    }
    
    cachedAdminUid = snap.docs[0].id;
    return cachedAdminUid;
  },

  // FUNCTION 1 - processBookingWallet (SCENARIO 1)
  async processBookingWallet(
    bookingId: string,
    bookingAmount: number,
    ownerUid: string,
    visitorUid: string,
    propertyTitle: string
  ): Promise<void> {
    try {
      const adminUid = await this.findAdminUid();
      
      await runTransaction(db, async (t) => {
        const ownerWallet = await this.getOrCreateWallet(ownerUid, t);
        const adminWallet = await this.getOrCreateWallet(adminUid, t);
        const bookingRef = doc(db, 'bookings', bookingId);
        
        const ownerCredit = bookingAmount * 0.75;
        const adminCredit = bookingAmount * 0.25;
        
        const newOwnerBalance = ownerWallet.balance + ownerCredit;
        const newAdminBalance = adminWallet.balance + adminCredit;
        
        // Update balances
        t.update(ownerWallet.ref, { 
          balance: newOwnerBalance, 
          updatedAt: serverTimestamp() 
        });
        t.update(adminWallet.ref, { 
          balance: newAdminBalance, 
          updatedAt: serverTimestamp() 
        });
        
        // Transaction records
        const txnRef = collection(db, 'walletTransactions');
        
        // Owner Record
        t.set(doc(txnRef), {
          userId: ownerUid,
          type: 'credit',
          amount: ownerCredit,
          description: `New booking received - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          platformCommission: adminCredit,
          receivedAmount: ownerCredit,
          scenario: 'booking_created',
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance
        });
        
        // Admin Record
        t.set(doc(txnRef), {
          userId: adminUid,
          type: 'credit',
          amount: adminCredit,
          description: `Platform commission - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          scenario: 'booking_created',
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance
        });

        console.log('Admin wallet update:', {
          type: 'credit',
          amount: adminCredit,
          balanceAfter: newAdminBalance
        });
        
        // Mark booking as processed
        t.update(bookingRef, { walletProcessed: true });
      });
      
      console.log(`processBookingWallet success for ${bookingId}`);
    } catch (err: any) {
      console.error('processBookingWallet failed:', { bookingId, error: err.message });
      // Update booking to mark as failed if it wasn't a transaction-level failsafe
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { walletProcessed: false });
      } catch (e) {}
      throw err;
    }
  },

  // FUNCTION 2 - processOwnerRejectionWallet (SCENARIO 3)
  async processOwnerRejectionWallet(
    bookingId: string,
    bookingAmount: number,
    ownerUid: string,
    visitorUid: string,
    propertyTitle: string
  ): Promise<void> {
    try {
      const adminUid = await this.findAdminUid();
      const paymentPartnerCharge = bookingAmount * 0.05;
      const visitorRefund = bookingAmount * 0.95;
      const ownerReversal = bookingAmount * 0.75;
      const adminReversal = bookingAmount * 0.25;
      
      await runTransaction(db, async (t) => {
        const ownerWallet = await this.getOrCreateWallet(ownerUid, t);
        const adminWallet = await this.getOrCreateWallet(adminUid, t);
        const visitorWallet = await this.getOrCreateWallet(visitorUid, t);
        const bookingRef = doc(db, 'bookings', bookingId);
        
        const newOwnerBalance = ownerWallet.balance - ownerReversal;
        const newAdminBalance = adminWallet.balance - adminReversal + paymentPartnerCharge;
        const newVisitorBalance = visitorWallet.balance + visitorRefund;
        
        // Update balances
        t.update(ownerWallet.ref, { balance: newOwnerBalance, updatedAt: serverTimestamp() });
        t.update(adminWallet.ref, { balance: newAdminBalance, updatedAt: serverTimestamp() });
        t.update(visitorWallet.ref, { balance: newVisitorBalance, updatedAt: serverTimestamp() });
        
        const txnRef = collection(db, 'walletTransactions');
        
        // 1. Owner Debit
        t.set(doc(txnRef), {
          userId: ownerUid,
          type: 'debit',
          amount: ownerReversal,
          description: `Booking rejected - amount reversed - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          scenario: 'owner_rejected',
          createdAt: serverTimestamp(),
          balanceAfter: newOwnerBalance
        });
        
        // 2. Admin Debit (Reverse commission)
        const adminBalanceAfterDebit = adminWallet.balance - adminReversal;
        t.set(doc(txnRef), {
          userId: adminUid,
          type: 'debit',
          amount: adminReversal,
          description: `Commission reversed - booking rejected by owner - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          scenario: 'owner_rejected',
          createdAt: serverTimestamp(),
          balanceAfter: adminBalanceAfterDebit
        });

        console.log('Admin wallet update:', {
          type: 'debit',
          amount: adminReversal,
          balanceAfter: adminBalanceAfterDebit
        });
        
        // 3. Admin Credit (Payment partner charge)
        t.set(doc(txnRef), {
          userId: adminUid,
          type: 'credit',
          amount: paymentPartnerCharge,
          description: `Payment partner charge - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          paymentPartnerCharge,
          scenario: 'owner_rejected',
          createdAt: serverTimestamp(),
          balanceAfter: newAdminBalance
        });

        console.log('Admin wallet update:', {
          type: 'credit',
          amount: paymentPartnerCharge,
          balanceAfter: newAdminBalance
        });
        
        // 4. Visitor Credit
        t.set(doc(txnRef), {
          userId: visitorUid,
          type: 'credit',
          amount: visitorRefund,
          description: `Refund 95% - booking rejected by owner - ${propertyTitle}`,
          bookingId,
          propertyTitle,
          bookingAmount,
          refundPercentage: 95,
          refundAmount: visitorRefund,
          scenario: 'owner_rejected',
          createdAt: serverTimestamp(),
          balanceAfter: newVisitorBalance
        });
        
        t.update(bookingRef, { walletProcessed: true });
      });
      
      console.log(`processOwnerRejectionWallet success for ${bookingId}`);
    } catch (err: any) {
      console.error('processOwnerRejectionWallet failed:', { bookingId, error: err.message });
      throw err;
    }
  },

  // FUNCTION 3 - processCancellationWallet (SCENARIO 4 and 5)
  async processCancellationWallet(
    booking: any,
    refundPercent: number,
    wasAccepted: boolean
  ): Promise<void> {
    const bookingAmount = booking.totalAmount;
    const ownerUid = booking.ownerId;
    const visitorUid = booking.visitorId;
    const propertyTitle = booking.propertyTitle;
    const bookingId = booking.id;

    try {
      const adminUid = await this.findAdminUid();
      
      await runTransaction(db, async (t) => {
        const ownerWallet = await this.getOrCreateWallet(ownerUid, t);
        const visitorWallet = await this.getOrCreateWallet(visitorUid, t);
        const adminWallet = await this.getOrCreateWallet(adminUid, t);
        const bookingRef = doc(db, 'bookings', bookingId);
        const txnRef = collection(db, 'walletTransactions');

        if (wasAccepted) {
          // SCENARIO 4: Visitor cancels CONFIRMED booking
          const refundAmount = bookingAmount * (refundPercent / 100);
          const adminGets = bookingAmount - refundAmount;
          
          const newOwnerBalance = ownerWallet.balance - bookingAmount;
          const newVisitorBalance = visitorWallet.balance + refundAmount;
          const newAdminBalance = adminWallet.balance + adminGets;

          t.update(ownerWallet.ref, { balance: newOwnerBalance, updatedAt: serverTimestamp() });
          if (refundAmount > 0) {
            t.update(visitorWallet.ref, { balance: newVisitorBalance, updatedAt: serverTimestamp() });
          }
          if (adminGets > 0) {
            t.update(adminWallet.ref, { balance: newAdminBalance, updatedAt: serverTimestamp() });
          }

          // Owner Transaction
          t.set(doc(txnRef), {
            userId: ownerUid,
            type: 'debit',
            amount: bookingAmount,
            description: `Booking cancelled by visitor - ${propertyTitle}`,
            bookingId,
            propertyTitle,
            bookingAmount,
            scenario: 'visitor_cancelled',
            createdAt: serverTimestamp(),
            balanceAfter: newOwnerBalance
          });

          // Visitor Transaction
          if (refundAmount > 0) {
            t.set(doc(txnRef), {
              userId: visitorUid,
              type: 'credit',
              amount: refundAmount,
              description: `Refund ${refundPercent}% - ${propertyTitle}`,
              bookingId,
              propertyTitle,
              bookingAmount,
              refundPercentage: refundPercent,
              refundAmount: refundAmount,
              scenario: 'visitor_cancelled',
              createdAt: serverTimestamp(),
              balanceAfter: newVisitorBalance
            });
          }

          // Admin Transaction
          if (adminGets > 0) {
            t.set(doc(txnRef), {
              userId: adminUid,
              type: 'credit',
              amount: adminGets,
              description: `Cancellation charge - ${propertyTitle}`,
              bookingId,
              propertyTitle,
              bookingAmount,
              scenario: 'visitor_cancelled',
              createdAt: serverTimestamp(),
              balanceAfter: newAdminBalance
            });
            console.log('Admin wallet update:', {
              type: 'credit',
              amount: adminGets,
              balanceAfter: newAdminBalance
            });
          }
        } else {
          // SCENARIO 5: Visitor cancels PENDING_OWNER booking
          const ownerReversal = bookingAmount * 0.75;
          const adminReversal = bookingAmount * 0.25;
          const visitorRefund = bookingAmount;

          const newOwnerBalance = ownerWallet.balance - ownerReversal;
          const newAdminBalance = adminWallet.balance - adminReversal;
          const newVisitorBalance = visitorWallet.balance + visitorRefund;

          t.update(ownerWallet.ref, { balance: newOwnerBalance, updatedAt: serverTimestamp() });
          t.update(adminWallet.ref, { balance: newAdminBalance, updatedAt: serverTimestamp() });
          t.update(visitorWallet.ref, { balance: newVisitorBalance, updatedAt: serverTimestamp() });

          // 1. Owner Debit
          t.set(doc(txnRef), {
            userId: ownerUid,
            type: 'debit',
            amount: ownerReversal,
            description: `Booking cancelled - amount reversed - ${propertyTitle}`,
            bookingId,
            propertyTitle,
            bookingAmount,
            scenario: 'pending_cancelled',
            createdAt: serverTimestamp(),
            balanceAfter: newOwnerBalance
          });

          // 2. Admin Debit
          t.set(doc(txnRef), {
            userId: adminUid,
            type: 'debit',
            amount: adminReversal,
            description: `Commission reversed - cancellation - ${propertyTitle}`,
            bookingId,
            propertyTitle,
            bookingAmount,
            scenario: 'pending_cancelled',
            createdAt: serverTimestamp(),
            balanceAfter: newAdminBalance
          });
          console.log('Admin wallet update:', {
            type: 'debit',
            amount: adminReversal,
            balanceAfter: newAdminBalance
          });

          // 3. Visitor Credit
          t.set(doc(txnRef), {
            userId: visitorUid,
            type: 'credit',
            amount: visitorRefund,
            description: `Refund 100% - ${propertyTitle}`,
            bookingId,
            propertyTitle,
            bookingAmount,
            refundPercentage: 100,
            refundAmount: visitorRefund,
            scenario: 'pending_cancelled',
            createdAt: serverTimestamp(),
            balanceAfter: newVisitorBalance
          });
        }

        t.update(bookingRef, { walletProcessed: true });
      });

      console.log(`processCancellationWallet success for ${bookingId}`);
    } catch (err: any) {
      console.error('processCancellationWallet failed:', { bookingId, error: err.message });
      throw err;
    }
  },

  // FUNCTION 4 - requestWithdrawal (SCENARIO 6)
  async requestWithdrawal(
    userId: string,
    amount: number,
    bankDetails: any
  ): Promise<void> {
    try {
      if (amount < 100) throw new Error('Minimum withdrawal amount is ₹100');

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'withdrawalRequests'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay))
      );
      const snap = await getDocs(q);
      if (snap.size >= 2) throw new Error('Daily withdrawal limit of 2 reached');

      await runTransaction(db, async (t) => {
        const wallet = await this.getOrCreateWallet(userId, t);
        
        if (wallet.balance < amount) throw new Error('Insufficient balance');

        const newBalance = wallet.balance - amount;
        
        t.update(wallet.ref, { balance: newBalance, updatedAt: serverTimestamp() });

        const txnRef = collection(db, 'walletTransactions');
        const reqRef = collection(db, 'withdrawalRequests');

        // Transaction Record
        const txnDocRef = doc(txnRef);
        t.set(txnDocRef, {
          userId,
          type: 'debit',
          amount,
          description: 'Withdrawal requested - bank transfer in 3-4 working days',
          bookingId: 'N/A',
          propertyTitle: 'Withdrawal',
          bookingAmount: 0,
          scenario: 'withdrawal',
          status: 'pending', // Added for UI compatibility
          createdAt: serverTimestamp(),
          balanceAfter: newBalance
        });

        // Withdrawal Request Document
        t.set(doc(reqRef), {
          userId,
          amount,
          status: 'pending',
          bankDetails,
          transactionId: txnDocRef.id, // Store reference
          createdAt: serverTimestamp(),
          processedAt: null
        });
      });

      console.log(`requestWithdrawal success for ${userId}, amount: ${amount}`);
    } catch (err: any) {
      console.error('requestWithdrawal failed:', { userId, amount, error: err.message });
      throw err;
    }
  },

  // FUNCTION 5 - subscribeToWalletBalance
  subscribeToWalletBalance(
    userId: string,
    callback: (balance: number) => void
  ): () => void {
    return onSnapshot(
      doc(db, 'wallets', userId),
      (snap) => callback(snap.exists() ? snap.data().balance ?? 0 : 0),
      (error) => {
        console.error('Balance listener error:', error);
        callback(0);
      }
    );
  },

  // FUNCTION 6 - subscribeToWalletTransactions
  subscribeToWalletTransactions(
    userId: string,
    callback: (transactions: any[]) => void,
    limitCount: number = 20
  ): () => void {
    return onSnapshot(
      query(
        collection(db, 'walletTransactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      ),
      (snap) => {
        const txns = snap.docs.map(d => ({
          id: d.id, ...d.data()
        }));
        callback(txns);
      },
      (error) => {
        console.error('Transaction listener error:', error);
        callback([]);
      }
    );
  },

  // Backward compatibility helpers for UI
  async getWalletTransactions(userId: string) {
    const q = query(
      collection(db, 'walletTransactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getWallet(userId: string) {
    const docRef = doc(db, 'wallets', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return { ...data, availableBalance: data.balance };
    }
    return { balance: 0, availableBalance: 0 };
  },

  // Admin specific subscriptions
  subscribeToPendingSettlements(callback: (settlements: any[]) => void): () => void {
    // Current "pending settlements" are just transactions where commission was earned?
    // User logic: query where walletProcessed == true
    const q = query(
      collection(db, 'walletTransactions'),
      where('scenario', '==', 'booking_created'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error('Pending settlements listener error:', error);
      callback([]);
    });
  },

  subscribeToWithdrawalRequests(callback: (requests: any[]) => void): () => void {
    return onSnapshot(
      query(collection(db, 'withdrawalRequests'), orderBy('createdAt', 'desc'), limit(100)),
      (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data(), bankAccount: d.data().bankDetails }))),
      (error) => {
        console.error('Withdrawal requests listener error:', error);
        callback([]);
      }
    );
  },

  async processWithdrawal(requestId: string, status: 'completed' | 'rejected'): Promise<void> {
    if (status === 'completed') {
      await this.approveWithdrawal(requestId);
    } else {
      await this.rejectWithdrawal(requestId, 'Request denied by admin');
    }
  },

  async approveWithdrawal(requestId: string): Promise<void> {
    await runTransaction(db, async (t) => {
      const ref = doc(db, 'withdrawalRequests', requestId);
      const snap = await t.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      
      t.update(ref, { status: 'completed', processedAt: serverTimestamp() });
      
      if (data.transactionId) {
        t.update(doc(db, 'walletTransactions', data.transactionId), { status: 'completed' });
      }
    });
  },

  async rejectWithdrawal(requestId: string, reason: string): Promise<void> {
    const ref = doc(db, 'withdrawalRequests', requestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    
    await runTransaction(db, async (t) => {
       const wallet = await this.getOrCreateWallet(data.userId, t);
       const newBalance = wallet.balance + data.amount;
       t.update(wallet.ref, { balance: newBalance, updatedAt: serverTimestamp() });
       t.update(ref, { status: 'rejected', rejectionReason: reason, processedAt: serverTimestamp() });
       
       if (data.transactionId) {
         t.update(doc(db, 'walletTransactions', data.transactionId), { status: 'rejected' });
       }
       
       const txnRef = collection(db, 'walletTransactions');
       t.set(doc(txnRef), {
         userId: data.userId,
         type: 'credit',
         amount: data.amount,
         description: `Withdrawal rejected - refund issued: ${reason}`,
         bookingId: 'N/A',
         propertyTitle: 'Withdrawal Refund',
         bookingAmount: 0,
         scenario: 'withdrawal_rejected',
         createdAt: serverTimestamp(),
         balanceAfter: newBalance
       });
    });
  }
};
