import React from 'react';

export default function PaymentPolicy() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8 text-center">Cancellation and Refund Policy</h1>
        
        <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
              <h3 className="font-bold text-red-900 mb-2">More than 24 hours</h3>
              <p className="text-3xl font-black text-red-600">75% Refund</p>
              <p className="text-sm text-red-700 mt-1">of the booking amount</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="font-bold text-orange-900 mb-2">24 to 6 hours</h3>
              <p className="text-3xl font-black text-orange-600">50% Refund</p>
              <p className="text-sm text-orange-700 mt-1">of the booking amount</p>
            </div>
            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Within 6 hours / After check-in</h3>
              <p className="text-3xl font-black text-slate-600">No Refund</p>
            </div>
            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">No-show</h3>
              <p className="text-3xl font-black text-slate-600">No Refund</p>
            </div>
          </div>

          <section className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-2">Host Cancellation</h2>
            <p className="text-green-800">In case the host cancels the booking, the guest is eligible for a <strong>Full Refund</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#161338] mb-4">Refund Processing</h2>
            <p>Refunds will be processed within <strong>5-10 business days</strong> to the original payment method.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
