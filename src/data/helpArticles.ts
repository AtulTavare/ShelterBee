import React from 'react';
import { Shield, CreditCard, MapPin, Key, HelpCircle, BookOpen, UserCheck, LayoutDashboard, FileText, CheckCircle } from 'lucide-react';

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  iconName: string;
  bgColor: string;
  textColor: string;
}

export const helpArticles: Article[] = [
  {
    id: 'how-to-book-stay',
    title: "How to Book a Stay on ShelterBee",
    excerpt: "A simple step-by-step guide to finding and booking your perfect stay.",
    content: `
      <h2>The Booking Process</h2>
      <p>Booking a stay on ShelterBee is designed to be quick and secure. Follow these simple steps:</p>
      <ol>
        <li><strong>Search:</strong> Use our search bar to find properties in your desired area.</li>
        <li><strong>Select Dates:</strong> Choose your check-in and check-out dates on the property page.</li>
        <li><strong>Book Now:</strong> Click the "Book Now" button to proceed.</li>
        <li><strong>Payment:</strong> Complete the payment securely through our integrated gateway.</li>
      </ol>
      <p>Once the payment is successful, your booking is confirmed instantly!</p>
    `,
    category: "Bookings",
    readTime: "3 min read",
    iconName: 'BookOpen',
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600"
  },
  {
    id: 'cancellation-policy',
    title: "Understanding Cancellation & Refunds",
    excerpt: "Learn about our flexible cancellation policies and how refunds are processed.",
    content: `
      <h2>Cancellation Guidelines</h2>
      <p>We understand that plans can change. Our cancellation policy is designed to be fair to both guests and hosts.</p>
      <ul>
        <li><strong>Timing Matters:</strong> Refund eligibility depends on how early you cancel relative to your check-in time.</li>
        <li><strong>Policy Specifics:</strong> Always check the specific cancellation policy listed on the property page before booking.</li>
      </ul>
      <p>Refunds are typically processed back to your original payment method within 5-7 business days.</p>
    `,
    category: "Policies",
    readTime: "4 min read",
    iconName: 'Shield',
    bgColor: "bg-rose-50",
    textColor: "text-rose-600"
  },
  {
    id: 'stay-details-access',
    title: "When and How to Get Stay Details",
    excerpt: "Information on when you'll receive the exact location and owner contact info.",
    content: `
      <h2>Accessing Your Stay Information</h2>
      <p>To protect the privacy and security of our hosts, full property details are shared after booking confirmation.</p>
      <ul>
        <li><strong>Confirmation:</strong> Immediately after booking, you'll see the property's general area.</li>
        <li><strong>Full Disclosure:</strong> Exact location, owner contact information, and specific check-in instructions are shared securely before your arrival.</li>
      </ul>
    `,
    category: "Guest Experience",
    readTime: "3 min read",
    iconName: 'MapPin',
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600"
  },
  {
    id: 'payment-safety',
    title: "Payment Safety & Troubleshooting",
    excerpt: "What to do if your payment fails and how we keep your transactions secure.",
    content: `
      <h2>Secure Transactions</h2>
      <p>Your security is our top priority. All payments are processed through encrypted, industry-standard gateways.</p>
      <ul>
        <li><strong>Failed Payments:</strong> If a payment fails, you can retry using the same or a different method.</li>
        <li><strong>Confirmation:</strong> Remember, a booking is only confirmed once the payment succeeds.</li>
        <li><strong>No Hidden Fees:</strong> The total price you see before payment is exactly what you pay.</li>
      </ul>
    `,
    category: "Payments",
    readTime: "5 min read",
    iconName: 'CreditCard',
    bgColor: "bg-amber-50",
    textColor: "text-amber-600"
  },
  {
    id: 'become-a-host',
    title: "How to List Your Property (Become a Host)",
    excerpt: "Start your hosting journey with ShelterBee in just a few clicks.",
    content: `
      <h2>Hosting Made Easy</h2>
      <p>Ready to share your space? Here's how to get started:</p>
      <ol>
        <li><strong>Become Host:</strong> Click the "Become Host" button in your dashboard or navigation.</li>
        <li><strong>Fill Details:</strong> Provide accurate information about your property, including amenities and rules.</li>
        <li><strong>Submit:</strong> Send your listing for approval. Our team will verify the details within 24-48 hours.</li>
      </ol>
    `,
    category: "Hosting",
    readTime: "4 min read",
    iconName: 'UserCheck',
    bgColor: "bg-blue-50",
    textColor: "text-blue-600"
  },
  {
    id: 'property-verification',
    title: "Property Verification & Approval",
    excerpt: "Why properties get rejected and how to ensure yours goes live quickly.",
    content: `
      <h2>The Verification Process</h2>
      <p>Every property on ShelterBee undergoes a strict verification process to maintain trust.</p>
      <ul>
        <li><strong>Common Rejection Reasons:</strong> Incorrect information, poor quality photos, or missing documentation.</li>
        <li><strong>Resubmission:</strong> If rejected, you can always edit your details and resubmit for approval.</li>
        <li><strong>Documentation:</strong> Be prepared to provide ID proof and property ownership documents.</li>
      </ul>
    `,
    category: "Hosting",
    readTime: "5 min read",
    iconName: 'CheckCircle',
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600"
  },
  {
    id: 'managing-bookings',
    title: "Managing Your Bookings as an Owner",
    excerpt: "Tips on using your dashboard to track and accept guest requests.",
    content: `
      <h2>Owner Dashboard</h2>
      <p>Your dashboard is your command center for managing your property holdings.</p>
      <ul>
        <li><strong>Track Requests:</strong> View all incoming booking requests in real-time.</li>
        <li><strong>Manage Status:</strong> Easily accept or track the progress of each booking.</li>
        <li><strong>Get Paid:</strong> Payments are typically released after the guest successfully checks in.</li>
      </ul>
    `,
    category: "Hosting",
    readTime: "4 min read",
    iconName: 'LayoutDashboard',
    bgColor: "bg-purple-50",
    textColor: "text-purple-600"
  }
];
