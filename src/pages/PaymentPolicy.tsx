import React from 'react';

export default function PaymentPolicy() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">Payment Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6" dangerouslySetInnerHTML={{ __html: `
<p><strong>a. Collection of Payments</strong><br/>
All payments for bookings made through the ShelterBee Platform may be collected by ShelterBee on behalf of the Channel Partner through the payment systems integrated with the platform.</p>

<p><strong>b. Platform Commission</strong><br/>
For each successful booking made through the ShelterBee Platform, ShelterBee shall be entitled to charge a commission of twenty five percent (25%) of the total booking value or such other commission percentage as may be mutually agreed between ShelterBee and the Channel Partner.</p>

<p><strong>c. Settlement to Channel Partner</strong><br/>
After deduction of the applicable commission and any applicable taxes or charges, the remaining booking amount shall be transferred to the Channel Partner within a reasonable period of time after the guest’s check-in or completion of the stay, in accordance with ShelterBee’s settlement policy.</p>

<p><strong>d. Taxes and Compliance</strong><br/>
The Channel Partner shall be responsible for complying with all applicable tax laws and regulations relating to the accommodation services provided, including but not limited to Goods and Services Tax (GST) or other statutory taxes where applicable.</p>

<p><strong>e. Refunds and Adjustments</strong><br/>
In the event of booking cancellations, refunds, disputes, or chargebacks, ShelterBee reserves the right to adjust or deduct the corresponding amount from the settlement payable to the Channel Partner.</p>

<p><strong>f. Payment Processing Services</strong><br/>
ShelterBee may utilize third-party payment service providers to process payments and settlements on the ShelterBee Platform. The Channel Partner agrees to comply with the terms and policies of such payment service providers.</p>
` }} />
      </div>
    </div>
  );
}
