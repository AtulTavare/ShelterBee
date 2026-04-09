import fs from 'fs';

const template = (title, content) => `import React from 'react';

export default function ${title.replace(/[^a-zA-Z]/g, '')}() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">${title}</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          ${content}
        </div>
      </div>
    </div>
  );
}
`;

const pages = [
  { name: 'HelpCenter', title: 'Help Center', content: '<p>Welcome to the Help Center. Here you can find answers to frequently asked questions and guides on how to use ShelterBee.</p>' },
  { name: 'ReportConcern', title: 'Report a Concern', content: '<p>If you have any concerns or issues to report, please contact our support team at support@shelterbee.com or use the contact form on our Support page.</p>' },
  { name: 'HostingRules', title: 'Hosting Rules', content: '<p>As a host on ShelterBee, you are expected to maintain high standards of hospitality, cleanliness, and safety. Please review our detailed hosting guidelines in your host dashboard.</p>' },
  { name: 'LearnToHost', title: 'Learn to Host', content: '<p>Discover how to become a successful host on ShelterBee. Learn tips on pricing, creating attractive listings, and providing excellent guest experiences.</p>' },
  { name: 'CompanyDetails', title: 'Company Details', content: '<p>ShelterBee Private Limited<br/>Address: Flat no – 103, B-11-A Wing, Mhada colony, Padegaon power House road, Mahatma Phule chowk, Padegaon, Chhatrapati Sambhajinagar, 431002<br/>Mob no: 8655933724<br/>Email id: shelterbee24.7support@gmail.com</p>' },
];

pages.forEach(page => {
  fs.writeFileSync(`src/pages/${page.name}.tsx`, template(page.title, page.content));
});
