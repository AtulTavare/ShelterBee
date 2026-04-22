import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">1. Data Collection</h2>
              <p>We collect personal information (name, contact, payment) to facilitate bookings and improve our services.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">2. Data Usage</h2>
              <p>Your data is used for booking confirmations, customer support, and platform improvements.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">3. Security</h2>
              <p>We use industry-standard security measures to protect your personal data.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">4. Third Parties</h2>
              <p>Data may be shared with hosts and payment partners to complete bookings.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#161338] mb-2">5. User Rights</h2>
              <p>You have the right to access and update your personal information through your profile.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
