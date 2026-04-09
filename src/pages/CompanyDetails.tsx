import React from 'react';

export default function CompanyDetails() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">Company Details</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <p><strong>ShelterBee Private Limited</strong></p>
          <p>Address: Flat no – 103, B-11-A Wing, Mhada colony, Padegaon power House road, Mahatma Phule chowk, Padegaon, Chhatrapati Sambhajinagar, 431002</p>
          <p>Mob no: 8655933724</p>
          <p>Email id: shelterbee24.7support@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
