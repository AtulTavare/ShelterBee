import React from 'react';

export default function CompanyDetails() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">Company Details</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <p className="flex items-start gap-3">
            <span className="font-bold text-[#161338] min-w-[120px]">Company:</span>
            <span>ShelterBee Private Limited</span>
          </p>
          <p className="flex items-start gap-3">
            <span className="font-bold text-[#161338] min-w-[120px]">Address:</span>
            <span>Flat no – 103, B-11-A Wing, Mhada colony, Padegaon power House road, Mahatma Phule chowk, Padegaon, Chhatrapati Sambhajinagar – 431002</span>
          </p>
          <p className="flex items-start gap-3">
            <span className="font-bold text-[#161338] min-w-[120px]">Mobile:</span>
            <span>8655933724</span>
          </p>
          <p className="flex items-start gap-3">
            <span className="font-bold text-[#161338] min-w-[120px]">Email:</span>
            <a href="mailto:shelterbee24.7support@gmail.com" className="text-amber-600 hover:underline">shelterbee24.7support@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
