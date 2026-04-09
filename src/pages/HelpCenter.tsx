import React from 'react';

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">Help Center</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <p>Welcome to the Help Center. Here you can find answers to frequently asked questions and guides on how to use ShelterBee.</p>
        </div>
      </div>
    </div>
  );
}
