import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { bookingService, Booking } from '../services/bookingService';
import { CheckCircle2, ChevronLeft, Home, History } from 'lucide-react';

export default function BookingSuccess() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    const fetch = async () => {
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data);
      setLoading(false);
    };
    fetch();
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-[#F9F9F9] pt-24 pb-12 px-4 font-sans">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 sm:p-12 shadow-lg shadow-slate-200/50 border border-slate-100 text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="text-3xl font-black text-[#1A1A2E] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Booking Confirmed!
          </h1>
          <p className="text-slate-500 font-medium mb-8">
            Your booking has been successfully confirmed
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : booking ? (
            <div className="space-y-4 mb-8 text-left">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Booking ID</span>
                  <span className="text-sm font-bold text-[#1A1A2E] font-mono">{bookingId}</span>
                </div>
                <div className="h-px bg-slate-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Property</span>
                  <span className="text-sm font-bold text-[#1A1A2E]">{booking.propertyTitle || 'Property'}</span>
                </div>
                <div className="h-px bg-slate-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
                  <span className="text-xl font-black text-emerald-600">₹{(booking.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 mb-8">Booking details not found.</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/profile#history')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-[#1E1B4B] text-white rounded-2xl font-black hover:bg-[#312E81] transition-all shadow-lg shadow-indigo-200"
            >
              <History className="w-5 h-5" />
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-8 py-4 text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
