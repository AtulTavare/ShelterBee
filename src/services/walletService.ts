import { supabaseClient as supabase } from '../supabase';

export interface Wallet {
  user_id: string;
  balance: number;
  last_updated_at?: any;
}

export interface WalletTransaction {
  id?: string;
  user_id: string;
  booking_id?: string;
  amount: number;
  type: 'credit' | 'debit';
  reason?: string;
  created_at?: any;
  status?: string;
}

export interface WithdrawalRequest {
  id?: string;
  user_id: string;
  amount: number;
  bankAccount: any;
  status: string;
  requested_at?: any;
  transaction_id?: string;
}

export const walletService = {
  async getWallet(userId: string): Promise<Wallet> {
    const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
    if (error) {
      // Not found: create default wallet
      const { data: created, error: err2 } = await supabase.from('wallets').insert({ user_id: userId, balance: 0, last_updated_at: new Date() }).select('*').single();
      if (err2) throw err2;
      return created as Wallet;
    }
    if (data) return data as Wallet;
    // Fallback create
    const { data: created, error: err3 } = await supabase.from('wallets').insert({ user_id: userId, balance: 0, last_updated_at: new Date() }).select('*').single();
    if (err3) throw err3;
    return created as Wallet;
  },

  async updateBankAccount(userId: string, bankAccount: Wallet['last_updated_at']) {
    await supabase.from('wallets').update({ bankAccount, last_updated_at: new Date() }).eq('user_id', userId);
  },

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    const { data, error } = await supabase.from('wallet_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as WalletTransaction[];
  },

  async getAllPendingSettlements(): Promise<WalletTransaction[]> {
    const { data, error } = await supabase.from('wallet_transactions').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as WalletTransaction[];
  },

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    const { data, error } = await supabase.from('withdrawal_requests').select('*').order('requested_at', { ascending: false });
    if (error) throw error;
    return (data || []) as WithdrawalRequest[];
  },

  async processBookingPayment(ownerId: string, amount: number, bookingId: string) {
    const wallet = await this.getWallet(ownerId);
    const newBalance = (wallet.balance || 0) + amount;
    await supabase.from('wallets').update({ balance: newBalance, last_updated_at: new Date() }).eq('user_id', ownerId);
    await supabase.from('wallet_transactions').insert({ user_id: ownerId, booking_id: bookingId, amount, type: 'credit', reason: 'booking_earning', created_at: new Date(), status: 'completed' } as any);
  },

  async processRefund(visitorId: string, ownerId: string, visitorAmount: number, ownerAmount: number, bookingId: string) {
    if (visitorAmount <= 0) return;
    // Credit visitor
    const vWallet = await this.getWallet(visitorId);
    const vBalance = (vWallet.balance || 0) + visitorAmount;
    await supabase.from('wallets').update({ balance: vBalance, last_updated_at: new Date() }).eq('user_id', visitorId);
    await supabase.from('wallet_transactions').insert({ user_id: visitorId, booking_id: bookingId, amount: visitorAmount, type: 'credit', reason: 'refund', created_at: new Date(), status: 'completed' } as any);

    // Debit owner
    const oWallet = await this.getWallet(ownerId);
    const oBalance = (oWallet.balance || 0) - ownerAmount;
    await supabase.from('wallets').update({ balance: oBalance, last_updated_at: new Date() }).eq('user_id', ownerId);
    await supabase.from('wallet_transactions').insert({ user_id: ownerId, booking_id: bookingId, amount: ownerAmount, type: 'debit', reason: 'cancellation_deduction', created_at: new Date(), status: 'completed' } as any);
  },

  async requestWithdrawal(userId: string, amount: number, bankAccount: any) {
    const wallet = await this.getWallet(userId);
    const avail = wallet.balance || 0;
    if (avail < amount) throw new Error('Insufficient balance');
    const newBalance = avail - amount;
    await supabase.from('wallets').update({ balance: newBalance, last_updated_at: new Date() }).eq('user_id', userId);
    const txnRes = await supabase.from('wallet_transactions').insert({ user_id: userId, amount, type: 'debit', reason: 'withdrawal', created_at: new Date(), status: 'pending' } as any);
    const txnId = (txnRes.data && txnRes.data[0]?.id) || null;
    await supabase.from('withdrawal_requests').insert({ user_id: userId, amount, bankAccount, status: 'pending', requested_at: new Date(), transaction_id: txnId } as any);
  },

  async markSettlementComplete(transactionId: string) {
    // No-op in this simplified implementation
  },

  async processWithdrawalRequest(requestId: string, action: 'completed' | 'rejected', rejectionReason?: string) {
    // No-op in this simplified implementation
  }
};
