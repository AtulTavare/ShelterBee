import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { bookingService, Booking } from '../services/bookingService';
import { CheckCircle2, ChevronLeft, Home, History, CalendarDays, Users, MapPin, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

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
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 rounded-lg transition-all border border-slate-200 group shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <h1 className="text-sm font-black text-[#1A1A2E]">Booking Confirmed</h1>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
        {/* LEFT - Success Message */}
        <div className="w-full lg:w-1/2 bg-white px-4 sm:px-8 lg:px-12 py-12 lg:py-16 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-lg mx-auto w-full"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-200 mb-8"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl font-black text-[#1A1A2E] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Booking Confirmed!
            </h1>
            <p className="text-base sm:text-lg text-slate-500 font-medium mb-10">
              Your booking has been successfully confirmed. Get ready for your stay!
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : booking ? (
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking ID</span>
                    <span className="text-xs font-bold text-[#1A1A2E] font-mono">{bookingId}</span>
                  </div>
                  <div className="h-px bg-slate-200"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property</span>
                    <span className="text-xs font-bold text-[#1A1A2E]">{booking.propertyTitle || 'Property'}</span>
                  </div>
                  <div className="h-px bg-slate-200"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
                    <span className="text-xl font-black text-emerald-600">₹{(booking.totalPayable || booking.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/profile#history')}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1E1B4B] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#312E81] transition-all shadow-lg shadow-indigo-200 flex-1"
                  >
                    <History className="w-4 h-4" />
                    View My Bookings
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 flex-1"
                  >
                    <Home className="w-4 h-4" />
                    Back to Home
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 mb-8">Booking details not found.</p>
            )}
          </motion.div>
        </div>

        {/* RIGHT - Booking Details */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-800 flex-col justify-center px-8 lg:px-12 py-12 sticky top-0 h-screen overflow-y-auto">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-black/10 blur-3xl"></div>

          <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-sm bg-white/10 rounded-2xl p-5 border border-white/10"
            >
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-4">Your Stay Details</p>
              <div className="space-y-3">
                {booking?.checkIn && booking?.checkOut && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/50 uppercase tracking-wider">Check-in — Check-out</p>
                      <p className="text-xs font-bold text-white">
                        {format(new Date(booking.checkIn), 'MMM dd, yyyy')} — {format(new Date(booking.checkOut), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-wider">Guests</p>
                    <p className="text-xs font-bold text-white">{booking?.guests?.length || 0} Guest(s)</p>
                  </div>
                </div>
                {booking?.propertyTitle && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/50 uppercase tracking-wider">Property</p>
                      <p className="text-xs font-bold text-white">{booking.propertyTitle}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-sm bg-white/10 rounded-2xl p-5 border border-white/10"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Amount Paid</p>
                  <p className="text-[10px] text-white/60 mt-0.5">via Razorpay</p>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-white/60" />
                  <span className="text-2xl font-black text-white">₹{(booking?.totalPayable || booking?.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* MOBILE - Details */}
        <div className="lg:hidden bg-emerald-50/80 px-4 sm:px-8 py-6 border-t border-slate-200">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Stay Details</p>
              {booking?.checkIn && booking?.checkOut && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Check-in — Check-out</span>
                  <span className="font-bold text-[#1A1A2E]">{format(new Date(booking.checkIn), 'MMM dd')} — {format(new Date(booking.checkOut), 'MMM dd')}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Guests</span>
                <span className="font-bold text-[#1A1A2E]">{booking?.guests?.length || 0} Guest(s)</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-black text-emerald-600">₹{(booking?.totalPayable || booking?.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
