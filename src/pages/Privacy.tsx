import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <p>At ShelterBee, we value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>
          
          <h2 className="text-2xl font-bold text-[#161338] mt-10">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, such as when you create an account, list a property, or make a booking. This may include:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Name, email address, and contact details.</li>
            <li>Profile information and photographs.</li>
            <li>Payment information (processed securely by our partners).</li>
            <li>Government-issued identification for verification purposes.</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#161338] mt-10">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide and improve our services, including:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Facilitating bookings and communications between guests and hosts.</li>
            <li>Verifying identities and maintaining a safe community.</li>
            <li>Processing payments and preventing fraud.</li>
            <li>Sending you updates, security alerts, and support messages.</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#161338] mt-10">3. Information Sharing</h2>
          <p>We do not sell your personal information. We share your data only as necessary to provide our services, such as sharing guest details with hosts for confirmed bookings, or with service providers who help us operate our platform.</p>

          <h2 className="text-2xl font-bold text-[#161338] mt-10">4. Data Security</h2>
          <p>We implement industry-standard security measures to protect your data from unauthorized access, alteration, or destruction. However, no method of transmission over the internet is 100% secure.</p>

          <h2 className="text-2xl font-bold text-[#161338] mt-10">5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. You can manage your profile settings within your account or contact us for assistance.</p>

          <h2 className="text-2xl font-bold text-[#161338] mt-10">6. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our platform.</p>

          <h2 className="text-2xl font-bold text-[#161338] mt-10">7. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@shelterbee.com.</p>
        </div>
      </div>
    </div>
  );
}
