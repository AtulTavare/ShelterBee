
import { format } from 'date-fns';

const LOGO_URL = "https://res.cloudinary.com/dtnsxrc2c/image/upload/q_auto/f_auto/v1775077949/shelterbee_logo_q0gz87.jpg";

const baseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1A1A2E; line-height: 1.6; margin: 0; padding: 0; background-color: #F9FAFB; }
    .wrapper { background-color: #F9FAFB; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 40px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #E5E7EB; }
    .content { margin-bottom: 40px; font-size: 16px; color: #374151; }
    .footer { text-align: center; border-top: 1px solid #F3F4F6; padding-top: 30px; }
    .logo { max-width: 140px; border-radius: 12px; margin-bottom: 15px; }
    .footer-text { font-size: 12px; color: #9CA3AF; margin-bottom: 10px; }
    .highlight { color: #1E1B4B; font-weight: 700; }
    .details-box { background-color: #F8FAFC; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #F1F5F9; }
    .detail-item { margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px; }
    .detail-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .detail-label { font-size: 13px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
    .detail-value { font-size: 14px; font-weight: 700; color: #1E1B4B; }
    .button { display: inline-block; padding: 14px 28px; background-color: #1E1B4B; color: #FFFFFF !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 20px; }
    h1 { font-size: 24px; font-weight: 800; color: #1E1B4B; margin-top: 0; margin-bottom: 20px; }
    p { margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p class="footer-text">Thank you for partnering with ShelterBee</p>
        <img src="${LOGO_URL}" alt="ShelterBee Logo" class="logo">
        <p style="font-size: 10px; color: #D1D5DB; margin-top: 10px;">&copy; 2024 ShelterBee Private Limited. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  getPropertyApproval: (ownerName: string, propertyName: string, address: string) => {
    const content = `
      <h1>Congratulations! 🎉</h1>
      <p>Hello <span class="highlight">${ownerName}</span>,</p>
      <p>Your property <span class="highlight">"${propertyName} & ${address}"</span> has been successfully approved and is now live on ShelterBee.</p>
      <p>Guests can now view and book your property on the platform.</p>
      <p>You can manage bookings and availability from your dashboard anytime.</p>
      <a href="https://shelterbee.com/profile?tab=dashboard" class="button">Go to Dashboard</a>
    `;
    return {
      subject: `Property Approved: ${propertyName} is now Live! 🚀`,
      html: baseLayout(content)
    };
  },

  getPropertyRejection: (ownerName: string, propertyName: string, reason: string) => {
    const content = `
      <h1>Property Listing Update</h1>
      <p>Hello <span class="highlight">${ownerName}</span>,</p>
      <p>Thank you for submitting your property <span class="highlight">${propertyName}</span> with us.</p>
      <p>After reviewing your listing, we regret to inform you that we are unable to proceed with it at this time.</p>
      <div class="details-box">
        <p class="detail-label" style="margin-bottom: 8px;">Reason for Rejection:</p>
        <p style="color: #EF4444; font-weight: 600; margin: 0;">${reason}</p>
      </div>
      <p>We truly appreciate your interest in partnering with us. You’re welcome to make the necessary updates and re-submit your listing for review anytime.</p>
      <p>If you need any guidance or support, feel free to reach out — we’ll be happy to assist you.</p>
      <p>Thank you for your understanding.</p>
      <p>— shelterBee</p>
    `;
    return {
      subject: `Update regarding your property listing: ${propertyName}`,
      html: baseLayout(content)
    };
  },

  getBookingConfirmationGuest: (guestName: string, propertyName: string, checkIn: Date, checkOut: Date, guests: number, amount: number, address: string) => {
    const content = `
      <h1>Booking Confirmed! 😊</h1>
      <p>Hello <span class="highlight">${guestName}</span>,</p>
      <p>Thank you for booking with us! Your stay has been successfully confirmed.</p>
      <div class="details-box">
        <div class="detail-item">
          <span class="detail-label">📍 Property Name</span>
          <span class="detail-value">${propertyName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">📅 Check-in</span>
          <span class="detail-value">${format(checkIn, 'MMM dd, yyyy • hh:mm a')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">📅 Check-out</span>
          <span class="detail-value">${format(checkOut, 'MMM dd, yyyy • hh:mm a')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">👥 Guests</span>
          <span class="detail-value">${guests}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">💰 Total Amount</span>
          <span class="detail-value">₹${amount}</span>
        </div>
      </div>
      <p><span class="highlight">📌 Address:</span> ${address}</p>
      <p>Please carry a valid ID at check-in.</p>
      <p>If you need any assistance, feel free to message or call us anytime.</p>
      <p>We look forward to hosting you!</p>
      <p>— ShelterBee</p>
      <p style="font-size: 12px; margin-top: 20px;"><a href="https://shelterbee.com/refund-policy" style="color: #64748B;">*refund and cancellation policy</a></p>
    `;
    return {
      subject: `Booking Confirmed: Your stay at ${propertyName} 🏠`,
      html: baseLayout(content)
    };
  },

  getBookingAlertOwner: (propertyName: string, guestName: string, guestContact: string, checkIn: Date, checkOut: Date, nights: number, guests: number, bookingId: string, totalAmount: number, commission: number, payout: number, specialRequests?: string) => {
    const content = `
      <h1>New Booking Alert 🚨</h1>
      <p>Property: <span class="highlight">${propertyName}</span></p>
      <div class="details-box">
        <h3 style="font-size: 14px; margin-bottom: 15px; color: #1E1B4B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Guest Details</h3>
        <div class="detail-item">
          <span class="detail-label">Name</span>
          <span class="detail-value">${guestName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Contact</span>
          <span class="detail-value">${guestContact}</span>
        </div>
      </div>
      <div class="details-box">
        <h3 style="font-size: 14px; margin-bottom: 15px; color: #1E1B4B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Stay Details</h3>
        <div class="detail-item">
          <span class="detail-label">Check-in</span>
          <span class="detail-value">${format(checkIn, 'MMM dd, yyyy • hh:mm a')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Check-out</span>
          <span class="detail-value">${format(checkOut, 'MMM dd, yyyy • hh:mm a')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Nights</span>
          <span class="detail-value">${nights}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Guests</span>
          <span class="detail-value">${guests}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Booking ID</span>
          <span class="detail-value">${bookingId}</span>
        </div>
      </div>
      <div class="details-box">
        <h3 style="font-size: 14px; margin-bottom: 15px; color: #1E1B4B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Financials</h3>
        <div class="detail-item">
          <span class="detail-label">Total Booking Value</span>
          <span class="detail-value">₹${totalAmount}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Commission (25%)</span>
          <span class="detail-value">₹${commission}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Owner Payout</span>
          <span class="detail-value" style="color: #059669;">₹${payout}</span>
        </div>
      </div>
      <div class="details-box">
        <h3 style="font-size: 14px; margin-bottom: 15px; color: #1E1B4B; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Notes</h3>
        <p class="text-sm"><strong>Special Requests:</strong> ${specialRequests || 'None'}</p>
        <p class="text-sm"><strong>Check-in Time Confirmed:</strong> Yes</p>
      </div>
      <p>Please prepare the property accordingly.</p>
      <p>For any questions, feel free to reach out.</p>
      <p>— shelterBee</p>
    `;
    return {
      subject: `New Booking Alert: ${guestName} booked ${propertyName} 🚨`,
      html: baseLayout(content)
    };
  },

  getReviewNotification: (ownerName: string, propertyName: string, guestName: string, rating: number, reviewText: string) => {
    const stars = '⭐'.repeat(rating);
    const content = `
      <h1>New Review Received! ⭐</h1>
      <p>Hello <span class="highlight">${ownerName}</span>,</p>
      <p>A guest has just submitted a review for your property <span class="highlight">${propertyName}</span>.</p>
      <div class="details-box">
        <div class="detail-item">
          <span class="detail-label">Guest Name</span>
          <span class="detail-value">${guestName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Rating</span>
          <span class="detail-value">${stars} (${rating}/5)</span>
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #E2E8F0;">
          <p class="detail-label" style="margin-bottom: 8px;">Review:</p>
          <p style="font-style: italic; color: #4B5563;">"${reviewText}"</p>
        </div>
      </div>
      <p>Reviews help build trust with future guests. You can view and reply to this review from your dashboard.</p>
      <a href="https://shelterbee.com/profile?tab=dashboard" class="button">View Review</a>
    `;
    return {
      subject: `New ${rating}-Star Review for ${propertyName} ⭐`,
      html: baseLayout(content)
    };
  },

  getPaymentNotification: (userName: string, amount: number, type: string, bookingId?: string) => {
    const content = `
      <h1>Payment Successful ✅</h1>
      <p>Hello <span class="highlight">${userName}</span>,</p>
      <p>This is to confirm that your payment of <span class="highlight">₹${amount}</span> has been successfully processed.</p>
      <div class="details-box">
        <div class="detail-item">
          <span class="detail-label">Transaction Type</span>
          <span class="detail-value">${type}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Amount</span>
          <span class="detail-value">₹${amount}</span>
        </div>
        ${bookingId ? `
        <div class="detail-item">
          <span class="detail-label">Booking ID</span>
          <span class="detail-value">${bookingId}</span>
        </div>
        ` : ''}
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="detail-value" style="color: #059669;">Success</span>
        </div>
      </div>
      <p>You can view your transaction history in your profile wallet.</p>
      <p>— shelterBee</p>
    `;
    return {
      subject: `Payment Confirmation: ₹${amount} received ✅`,
      html: baseLayout(content)
    };
  },

  getRefundNotification: (userName: string, amount: number, bookingId: string, reason: string) => {
    const content = `
      <h1>Refund Processed 💰</h1>
      <p>Hello <span class="highlight">${userName}</span>,</p>
      <p>We have processed a refund of <span class="highlight">₹${amount}</span> to your wallet for Booking ID: <span class="highlight">#${bookingId}</span>.</p>
      <div class="details-box">
        <div class="detail-item">
          <span class="detail-label">Refund Amount</span>
          <span class="detail-value">₹${amount}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Reason</span>
          <span class="detail-value">${reason}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="detail-value" style="color: #059669;">Completed</span>
        </div>
      </div>
      <p>The amount has been credited to your ShelterBee wallet and can be used for future bookings or withdrawn.</p>
      <p>— shelterBee</p>
    `;
    return {
      subject: `Refund Processed: ₹${amount} credited to your wallet 💰`,
      html: baseLayout(content)
    };
  },

  getPropertySubmission: (ownerName: string, gender: string) => {
    const salutation = gender === 'Female' ? 'Mrs.' : 'Mr.';
    const content = `
      <h1>Property Listing Submitted! 🏠</h1>
      <p>Hello <span class="highlight">${salutation} ${ownerName}</span>,</p>
      <p>We got your new property details to list on ShelterBee, your property will be live after verification.</p>
      <div class="details-box">
        <p>We will notify you once our team verify your property documents. Then you can see your property available for bookings on the platform website.</p>
        <p>Your property is currently under verification. We will notify you after your property is successfully approved.</p>
      </div>
      <p>Thank you for choosing ShelterBee!</p>
      <p>— shelterBee</p>
    `;
    return {
      subject: `Property Listing Submitted Successfully! 🏠`,
      html: baseLayout(content)
    };
  },

  getBookingRejection: (guestName: string, propertyName: string, reason: string) => {
    const content = `
      <h1>Booking Update</h1>
      <p>Hello <span class="highlight">${guestName}</span>,</p>
      <p>We regret to inform you that your booking for <span class="highlight">"${propertyName}"</span> has been rejected by the property owner.</p>
      <div class="details-box">
        <p class="detail-label" style="margin-bottom: 8px;">Reason for Rejection:</p>
        <p style="color: #EF4444; font-weight: 600; margin: 0;">${reason}</p>
      </div>
      <p>Any amount paid will be refunded to your wallet shortly.</p>
      <p>Feel free to explore other properties on ShelterBee.</p>
      <p>— shelterBee</p>
    `;
    return {
      subject: `Booking Update: ${propertyName}`,
      html: baseLayout(content)
    };
  },

  getBookingConfirmationWithVisit: (guestName: string, propertyName: string, visitTime: string) => {
    const content = `
      <h1>Booking Confirmed! 🎉</h1>
      <p>Hello <span class="highlight">${guestName}</span>,</p>
      <p>Great news! Your booking for <span class="highlight">"${propertyName}"</span> has been confirmed by the owner.</p>
      <div class="details-box">
        <p class="detail-label" style="margin-bottom: 8px;">Scheduled Property Visit:</p>
        <p style="color: #1E1B4B; font-weight: 700; margin: 0;">${visitTime}</p>
      </div>
      <p>Please make sure to be available at the property during the scheduled time.</p>
      <p>We look forward to hosting you!</p>
      <p>— shelterBee</p>
    `;
    return {
      subject: `Booking Confirmed: ${propertyName} 🎉`,
      html: baseLayout(content)
    };
  },

  getBookingCancellationByVisitor: (ownerName: string, propertyName: string, guestName: string, reason: string) => {
    const content = `
      <h1>Booking Cancelled</h1>
      <p>Hello <span class="highlight">${ownerName}</span>,</p>
      <p>We are writing to inform you that the booking for <span class="highlight">"${propertyName}"</span> by <span class="highlight">${guestName}</span> has been cancelled by the visitor.</p>
      <div class="details-box">
        <p class="detail-label" style="margin-bottom: 8px;">Reason for Cancellation:</p>
        <p style="color: #64748B; font-style: italic; margin: 0;">"${reason}"</p>
      </div>
      <p>The booking amount has been adjusted in your wallet accordingly.</p>
      <p>— shelterBee</p>
    `;
    return {
      subject: `Booking Cancelled: ${propertyName}`,
      html: baseLayout(content)
    };
  }
};
