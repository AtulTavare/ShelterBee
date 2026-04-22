import React from 'react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">Terms of Use</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">1. Acceptance of Terms</h2>
              <p>By accessing and using ShelterBee, you agree to comply with and be bound by these Terms of Use.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">2. Services</h2>
              <p>ShelterBee acts as a technology platform connecting guests with host-managed properties. We do not own or manage properties directly.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">3. User Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">4. Booking and Payments</h2>
              <p>Bookings are confirmed only after payment is processed. All transactions are secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">5. Limitation of Liability</h2>
              <p>ShelterBee is not liable for issues arising from host negligence or property conditions.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">6. Modifications</h2>
              <p>We reserve the right to update these terms at any time.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
