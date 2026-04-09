import React from 'react';

export default function CancellationandRefundPolicy() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">Cancellation and Refund Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6" dangerouslySetInnerHTML={{ __html: `
<p><strong>a. Guest Cancellation Before Check-in</strong><br/>
Guests may cancel their booking through the ShelterBee Platform prior to the scheduled check-in time. Refund eligibility will depend on the timing of the cancellation and the applicable property policy.</p>

<p><strong>b. Full Refund Eligibility</strong><br/>
If a channel partner cancels the booking, the guest may be eligible for a full refund of the booking amount.</p>

<p><strong>c. Partial Refund</strong><br/>
If a guest cancels a booking more than twenty-four (24) hours before the scheduled check-in time, the guest may be eligible for a partial refund of seventy-five percent (75%) of the booking amount, as determined by ShelterBee or the Channel Partner, after deduction of applicable charges.</p>
<p>If a guest cancels the booking between twenty-four (24) hours and six (6) hours before the scheduled check-in time, the guest may be eligible for a refund of fifty percent (50%) of the booking amount, as determined by ShelterBee or the Channel Partner, after deduction of applicable charges.</p>
<p>If a guest cancels the booking within six (6) hours of the scheduled check-in time or after the check-in time, no refund shall be provided.</p>
<table class="w-full text-left border-collapse my-4">
<thead><tr><th class="border-b py-2">Cancellation Time</th><th class="border-b py-2">Refund</th></tr></thead>
<tbody>
<tr><td class="py-2">More than 24 hrs</td><td class="py-2">75%</td></tr>
<tr><td class="py-2">24 hrs – 6 hrs</td><td class="py-2">50%</td></tr>
<tr><td class="py-2">0 – 6 hrs</td><td class="py-2">No refund</td></tr>
</tbody>
</table>

<p><strong>d. No-Show Policy</strong><br/>
If the guest fails to check in at the booked property without prior cancellation (“No-Show”), the booking amount may be considered non-refundable.</p>

<p><strong>e. Host Cancellation</strong><br/>
In the event that a Channel Partner or property host cancels a confirmed booking, ShelterBee may assist the guest in finding alternative accommodation. If no suitable alternative is available, the guest may be entitled to a full refund of the booking amount.</p>

<p><strong>f. Early Check-Out</strong><br/>
If a guest chooses to check out earlier than the scheduled check-out date, the unused portion of the stay may not be refundable unless otherwise determined by the Channel Partner or ShelterBee.</p>

<p><strong>g. Refund Processing Time</strong><br/>
Approved refunds shall be processed through the original payment method used for the booking. The refund processing time may vary depending on the payment provider or banking institution but typically may take between five (5) to ten (10) business days.</p>

<p><strong>h. Platform Charges</strong><br/>
ShelterBee reserves the right to retain applicable platform service fees, convenience fees, or payment processing charges in case of cancellations or refunds, where permitted by applicable law.</p>

<p><strong>i. Force Majeure (situations that are outside anyone’s control)</strong><br/>
In circumstances beyond the reasonable control of ShelterBee, such as natural disasters, government restrictions, pandemics, or other force majeure events, ShelterBee may review cancellation requests on a case-by-case basis.</p>

<p><strong>j. Refund Disputes</strong><br/>
Any disputes regarding refunds must be reported to ShelterBee within a reasonable time after the booking date. ShelterBee reserves the right to review and make the final decision regarding refund eligibility in accordance with this policy.</p>

<p><strong>k. Policy Updates</strong><br/>
ShelterBee reserves the right to modify or update this Cancellation and Refund Policy at any time. Continued use of the ShelterBee Platform shall constitute acceptance of the updated policy.</p>
` }} />
      </div>
    </div>
  );
}
