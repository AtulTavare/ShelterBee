import React from 'react';

export default function PaymentPolicy() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8 text-center">Cancellation and Refund Policy</h1>
        
        <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">a. Guest Cancellation Before Check-in</h2>
            <p>Guests may cancel their booking through the ShelterBee Platform prior to the scheduled check-in time. Refund eligibility will depend on the timing of the cancellation and the applicable property policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">b. Full Refund Eligibility</h2>
            <p>If a channel partner cancels the booking, the guest may be eligible for a full refund of the booking amount.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">c. Partial Refund</h2>
            <p>If a guest cancels a booking more than twenty-four (24) hours before the scheduled check-in time, the guest may be eligible for a partial refund of seventy-five percent (75%) of the booking amount, as determined by ShelterBee or the Channel Partner, after deduction of applicable charges.</p>
            <p>If a guest cancels the booking between twenty-four (24) hours and six (6) hours before the scheduled check-in time, the guest may be eligible for a refund of fifty percent (50%) of the booking amount, as determined by ShelterBee or the Channel Partner, after deduction of applicable charges.</p>
            <p>If a guest cancels the booking within six (6) hours of the scheduled check-in time or after the check-in time, no refund shall be provided.</p>
            
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cancellation Time</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Refund</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">More than 24 hrs</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">75%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">24 hrs – 6 hrs</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">50%</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">0 – 6 hrs</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">d. No-Show Policy</h2>
            <p>If the guest fails to check in at the booked property without prior cancellation (“No-Show”), the booking amount may be considered non-refundable.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">e. Host Cancellation</h2>
            <p>In the event that a Channel Partner or property host cancels a confirmed booking, ShelterBee may assist the guest in finding alternative accommodation. If no suitable alternative is available, the guest may be entitled to a full refund of the booking amount.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">f. Early Check-Out</h2>
            <p>If a guest chooses to check out earlier than the scheduled check-out date, the unused portion of the stay may not be refundable unless otherwise determined by the Channel Partner or ShelterBee.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">g. Refund Processing Time</h2>
            <p>Approved refunds shall be processed through the original payment method used for the booking. The refund processing time may vary depending on the payment provider or banking institution but typically may take between five (5) to ten (10) business days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">h. Platform Charges</h2>
            <p>ShelterBee reserves the right to retain applicable platform service fees, convenience fees, or payment processing charges in case of cancellations or refunds, where permitted by applicable law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">i. Force Majeure (situations that are outside anyone’s control)</h2>
            <p>In circumstances beyond the reasonable control of ShelterBee, such as natural disasters, government restrictions, pandemics, or other force majeure events, ShelterBee may review cancellation requests on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">j. Refund Disputes</h2>
            <p>Any disputes regarding refunds must be reported to ShelterBee within a reasonable time after the booking date. ShelterBee reserves the right to review and make the final decision regarding refund eligibility in accordance with this policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#161338] mb-4">k. Policy Updates</h2>
            <p>ShelterBee reserves the right to modify or update this Cancellation and Refund Policy at any time. Continued use of the ShelterBee Platform shall constitute acceptance of the updated policy.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
