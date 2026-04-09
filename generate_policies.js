import fs from 'fs';

const termsContent = `
<h2>1. Scope of Services</h2>
<ul>
<li>ShelterBee, through the ShelterBee Platform, markets and facilitates bookings for ShelterBee-branded properties that are managed and/or owned by third parties (“Channel Partners”), in accordance with the agreed terms between ShelterBee and such Channel Partners. These arrangements enable Users to avail short-term accommodation and stay-related services (collectively referred to as the “ShelterBee Services”).</li>
<li>The ShelterBee Platform acts solely as a technology platform that connects Users with Channel Partners offering accommodation services. Unless specifically stated otherwise, ShelterBee does not own, control, manage, or operate the listed properties and shall not be responsible for the condition, quality, safety, or suitability of such properties.</li>
<li>The ShelterBee Platform offers its Services to Users through various accommodation categories (collectively referred to as “ShelterBee Products”), which include, but are not limited to, the following:
<ul>
<li>a. ShelterBee Rooms</li>
<li>b. ShelterBee Homes</li>
<li>c. ShelterBee Townhouses</li>
<li>d. ShelterBee Villas</li>
<li>e. ShelterBee Hostels</li>
<li>f. ShelterBee Apartments</li>
<li>g. ShelterBee Paying Guest (PG) Accommodations</li>
</ul>
</li>
</ul>

<h2>2. Eligibility to Use the Platform</h2>
<ul>
<li>The ShelterBee Platform and Services are available only to individuals who are legally capable of entering into binding contracts under applicable laws. By accessing or using the ShelterBee Platform, you represent and warrant that you are at least eighteen (18) years of age and possess the legal authority to enter into this agreement.</li>
<li>Users who are under the age of eighteen (18) may use the ShelterBee Platform only under the supervision and responsibility of a parent or legal guardian.</li>
<li>By using the ShelterBee Platform, you further agree that all information provided by you during registration or at any time thereafter is true, accurate, current, and complete. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
<li>ShelterBee reserves the right to suspend or terminate access to the ShelterBee Platform if it is discovered that a user is not eligible to use the Services or has provided false or misleading information.</li>
</ul>

<h2>3. Using the ShelterBee Platform: Account Registration and Use</h2>
<ul>
<li>ShelterBee makes its Services available to Users through the ShelterBee Platform upon the provision of certain required user information and the creation of an account (“Account”) using a unique login ID and password or any other authentication credentials (collectively referred to as “Account Information”).</li>
<li>In order to access certain features and Services offered on the ShelterBee Platform, you may be required to register and create an Account. You are responsible for maintaining the confidentiality of your Account Information and are fully responsible for all activities that occur under your Account.</li>
<li>You agree to:
<br/>(a) immediately notify ShelterBee of any unauthorized use of your Account Information or any other breach of security; and
<br/>(b) ensure that you log out of your Account at the end of each session when accessing the ShelterBee Platform on a shared or public device.</li>
<li>ShelterBee shall not be liable for any loss or damage arising from your failure to comply with the above obligations. If you surrender your registered mobile number or change your telecom service provider, you are responsible for updating or modifying your Account Information and linking an alternate mobile number to your Account.</li>
<li>You may be held liable for losses incurred by ShelterBee or any other user or visitor to the ShelterBee Platform due to the authorized or unauthorized use of your Account resulting from your failure to keep your Account Information secure and confidential.</li>
<li>The ShelterBee Platform may also permit limited access to certain features for unregistered users. However, at the time of registration, you must ensure that all Account Information provided is complete, accurate, and up to date. The use of another user’s account or Account Information is strictly prohibited.</li>
</ul>

<h2>4. ShelterBee Services</h2>
<ul>
<li>ShelterBee provides an online platform that enables Users to search, discover, and book short-term accommodation offered by third-party property owners or managers (“Channel Partners”). The ShelterBee Platform facilitates the listing of properties, availability of accommodation, and related information to assist Users in making booking decisions.</li>
<li>Through the ShelterBee Platform, Users may access various services including, but not limited to:
<br/>a. Browsing and searching for accommodation options listed on the ShelterBee Platform.
<br/>b. Viewing property details, amenities, pricing, and availability provided by Channel Partners.
<br/>c. Making reservations or booking short-term stays through the ShelterBee Platform.
<br/>d. Accessing customer support services provided by ShelterBee in relation to bookings made through the platform.</li>
<li>ShelterBee acts solely as an intermediary technology platform that connects Users with Channel Partners offering accommodation services. ShelterBee does not own, operate, manage, or control the listed properties unless expressly stated otherwise.</li>
<li>While ShelterBee strives to ensure that the information provided on the ShelterBee Platform is accurate and up to date, ShelterBee does not guarantee the accuracy, completeness, or reliability of property descriptions, pricing, availability, or other information provided by Channel Partners.</li>
<li>ShelterBee reserves the right to modify, suspend, or discontinue any part of the Services or features of the ShelterBee Platform at any time without prior notice.</li>
</ul>

<h2>5. Term and Termination</h2>
<ul>
<li>These Terms of Use shall remain in full force and effect while you access or use the ShelterBee Platform and the Services provided through it.</li>
<li>ShelterBee reserves the right, at its sole discretion, to suspend, restrict, or terminate your access to the ShelterBee Platform or your Account at any time, without prior notice, if it believes that you have violated these Terms of Use, applicable laws, or engaged in any fraudulent, abusive, or unlawful activity.</li>
<li>Users may discontinue the use of the ShelterBee Platform at any time. However, any obligations or liabilities incurred prior to the termination of access shall continue to remain in effect.</li>
<li>Upon termination or suspension of your Account, your right to access and use the ShelterBee Platform and its Services shall immediately cease. ShelterBee shall not be liable for any loss or inconvenience caused due to such suspension or termination in accordance with these Terms.</li>
<li>ShelterBee also reserves the right to remove or restrict access to any content, listing, or property on the ShelterBee Platform that violates these Terms or applicable laws.</li>
</ul>

<h2>6. Terms Specifically Applicable to Customers</h2>
<ul>
<li>The following terms apply specifically to Users who make bookings or reservations for accommodation through the ShelterBee Platform (“Customers”).</li>
</ul>
<p><strong>a. Booking Responsibility</strong><br/>
Customers are responsible for reviewing the property details, amenities, pricing, location, and house rules provided on the ShelterBee Platform before making a booking. By confirming a reservation, the Customer agrees to comply with the applicable property rules and policies of the respective Channel Partner.</p>
<p><strong>b. Accurate Information</strong><br/>
Customers must provide accurate and complete information at the time of booking, including valid identification details where required. Providing false or misleading information may result in cancellation of the booking and suspension of access to the ShelterBee Platform.</p>
<p><strong>c. Check-in Requirements</strong><br/>
Customers must comply with the check-in and check-out timings, identification requirements, and verification procedures specified by the Channel Partner or applicable laws.</p>
<p><strong>d. Use of Property</strong><br/>
Customers agree to use the booked accommodation only for lawful purposes and in a responsible manner. Any damage to the property, violation of house rules, or unlawful activities during the stay may result in immediate termination of the stay and additional charges.</p>
<p><strong>e. Compliance with Laws and Property Rules</strong><br/>
Customers shall comply with all applicable laws, local regulations, and property rules during their stay. ShelterBee shall not be responsible for any violations committed by Customers at the property.</p>
<p><strong>f. Responsibility for Damages</strong><br/>
Customers may be held responsible for any damage, loss, or misuse of the property caused during their stay and may be required to compensate the Channel Partner for such damage.</p>
<p><strong>g. Cancellation and Refunds</strong><br/>
All bookings made through the ShelterBee Platform are subject to the applicable cancellation and refund policies as specified on the ShelterBee Platform or by the respective Channel Partner.</p>

<h2>7. Usage Terms</h2>
<ul>
<li>By accessing or using the ShelterBee Platform, you agree to use the Services only for lawful purposes and in accordance with these Terms of Use.</li>
<li>Users shall not misuse the ShelterBee Platform or engage in any activity that may harm, disrupt, or interfere with the proper functioning of the platform or the Services offered through it.</li>
<li>Without limiting the generality of the above, Users agree that they shall not:
<br/>a. Use the ShelterBee Platform in any manner that violates any applicable law, regulation, or third-party rights.
<br/>b. Attempt to gain unauthorized access to any portion of the ShelterBee Platform, other user accounts, or ShelterBee’s systems or networks.
<br/>c. Upload, transmit, or distribute any harmful software, viruses, malware, or other malicious code that may damage or disrupt the ShelterBee Platform.
<br/>d. Copy, modify, reproduce, distribute, or commercially exploit any part of the ShelterBee Platform or its content without prior written permission from ShelterBee.
<br/>e. Use the ShelterBee Platform for fraudulent activities, misleading transactions, or impersonation of any person or entity.
<br/>f. Interfere with or disrupt the services, servers, or networks connected to the ShelterBee Platform.</li>
<li>ShelterBee reserves the right to investigate and take appropriate action, including suspension or termination of user accounts, if any activity is found to be in violation of these Usage Terms.</li>
</ul>

<h2>8. Prohibited Content</h2>
<ul>
<li>Users shall not upload, post, publish, transmit, or otherwise make available any content on the ShelterBee Platform that is unlawful, harmful, misleading, or otherwise inappropriate.</li>
<li>Without limiting the generality of the above, Users agree not to post or share any content that:
<br/>a. Violates any applicable laws, regulations, or third-party rights.
<br/>b. Contains false, misleading, or fraudulent information regarding any property, service, or listing.
<br/>c. Infringes any intellectual property rights, including copyrights, trademarks, or proprietary rights of any person or entity.
<br/>d. Contains offensive, defamatory, abusive, obscene, or inappropriate material.
<br/>e. Promotes illegal activities or unlawful use of any property listed on the ShelterBee Platform.
<br/>f. Includes viruses, malware, malicious code, or any content intended to disrupt or harm the ShelterBee Platform or its users.</li>
<li>ShelterBee reserves the right, at its sole discretion, to remove, restrict, or disable access to any content that violates these Terms of Use or is otherwise deemed inappropriate, without prior notice.</li>
<li>ShelterBee may also suspend or terminate the account of any User who repeatedly posts or attempts to post prohibited content on the ShelterBee Platform.</li>
</ul>

<h2>9. Communications</h2>
<ul>
<li>By using the ShelterBee Platform and providing your contact details, including your mobile number and email address, you agree to receive communications from ShelterBee related to your use of the Platform and the Services.</li>
<li>Such communications may include, but are not limited to, booking confirmations, transaction details, service updates, account-related notifications, customer support responses, and other important information regarding your use of the ShelterBee Platform.</li>
<li>ShelterBee may also send promotional messages, offers, updates, or marketing communications through email, SMS, phone calls, or other electronic means, in accordance with applicable laws. Users may choose to opt out of receiving promotional communications at any time by following the unsubscribe instructions provided in such communications.</li>
<li>You acknowledge that ShelterBee shall not be responsible for any delays, failures, or interruptions in the delivery of communications caused by telecom service providers, internet service providers, or other third-party service providers.</li>
</ul>

<h2>10. Third-Party Links</h2>
<ul>
<li>The ShelterBee Platform may contain links to third-party websites, services, or resources that are not owned or controlled by ShelterBee. Such links may include, but are not limited to, payment gateway services, map and location services (such as Google Maps), property partner websites, and other external booking or service platforms.</li>
<li>These links are provided solely for the convenience of Users. ShelterBee does not endorse, control, or assume any responsibility for the content, policies, services, or practices of any such third-party websites or services.</li>
<li>Users acknowledge and agree that ShelterBee shall not be responsible or liable, directly or indirectly, for any loss or damage caused or alleged to be caused by or in connection with the use of, or reliance on, any content, products, or services available through such third-party websites or resources.</li>
<li>Users are advised to review the terms of use and privacy policies of any third-party websites before engaging in transactions or sharing personal information on such platforms.</li>
</ul>

<h2>11. ShelterBee Stay Services</h2>
<ul>
<li>ShelterBee Stay Services refer to the accommodation booking services facilitated through the ShelterBee Platform, enabling Users to reserve short-term stays at properties listed by Channel Partners.</li>
</ul>
<p><strong>a. Booking Confirmation</strong><br/>
A booking shall be considered confirmed only after successful completion of the reservation process and receipt of a booking confirmation through the ShelterBee Platform or through official communication from ShelterBee.</p>
<p><strong>b. Check-in and Check-out</strong><br/>
Customers must adhere to the check-in and check-out timings specified by the respective Channel Partner or property listing. Early check-in or late check-out may be subject to availability and additional charges.</p>
<p><strong>c. Identification Requirements</strong><br/>
Customers may be required to present valid government-issued identification at the time of check-in in accordance with applicable laws, local regulations, and property policies.</p>
<p><strong>d. Property Rules</strong><br/>
Customers agree to comply with the house rules, safety regulations, and guidelines established by the Channel Partner or property manager during their stay. Violation of such rules may result in cancellation of the stay without refund.</p>
<p><strong>e. Availability of Services</strong><br/>
ShelterBee strives to ensure the availability of listed properties; however, ShelterBee does not guarantee that all properties or services will always be available. In exceptional circumstances, ShelterBee or the Channel Partner may cancel or modify a booking and provide an alternative arrangement or refund as per the applicable policies.</p>
<p><strong>f. Responsibility During Stay</strong><br/>
Customers are responsible for maintaining the condition of the property during their stay and shall be liable for any damage, loss, or misuse caused to the property or its facilities.</p>
<p><strong>g. Role of ShelterBee</strong><br/>
ShelterBee acts only as a facilitator for accommodation bookings between Customers and Channel Partners. ShelterBee does not directly manage or control the listed properties unless expressly specified.</p>

<h2>13. Indemnification (Compensation for Loss)</h2>
<ul>
<li>You agree to indemnify, defend, and hold harmless ShelterBee, its directors, officers, employees, affiliates, and partners from and against any and all claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising out of or related to:
<br/>a. Your use or misuse of the ShelterBee Platform or the Services.
<br/>b. Your violation of these Terms of Use or any applicable law or regulation.
<br/>c. Any false, inaccurate, or misleading information provided by you.
<br/>d. Any damage, loss, or harm caused to a property, Channel Partner, or any third party during your stay or use of the ShelterBee Platform.
<br/>e. Any dispute between you and a Channel Partner or any other user of the ShelterBee Platform.</li>
<li>ShelterBee reserves the right to assume the exclusive defense and control of any matter subject to indemnification by you, in which case you agree to cooperate fully with ShelterBee in asserting any available defenses.</li>
</ul>

<h2>14. Limitation of Liability</h2>
<ul>
<li>To the maximum extent permitted by applicable law, ShelterBee, its affiliates, directors, employees, partners, or agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with the use of, or inability to use, the ShelterBee Platform or the Services.</li>
<li>ShelterBee acts solely as an intermediary technology platform facilitating bookings between Customers and Channel Partners offering accommodation services. ShelterBee shall not be responsible for the acts, omissions, conduct, representations, or negligence of any Channel Partner, property owner, or other third-party providing services through the ShelterBee Platform.</li>
<li>ShelterBee shall not be liable for any loss, damage, injury, delay, cancellation, service interruption, property condition issues, or other claims arising from the stay at any property listed on the ShelterBee Platform.</li>
<li>In no event shall the total liability of ShelterBee for any claim arising out of or related to the use of the ShelterBee Platform or the Services exceed the amount actually paid by the Customer for the specific booking giving rise to such claim.</li>
<li>Users acknowledge and agree that the limitations of liability set forth in these Terms are reasonable and form an essential basis of the agreement between the User and ShelterBee.</li>
</ul>

<h2>16. Modification of These Terms</h2>
<ul>
<li>ShelterBee reserves the right, at its sole discretion, to modify, amend, or update these Terms of Use at any time without prior notice.</li>
<li>Any such modifications shall become effective immediately upon being published on the ShelterBee Platform. Users are encouraged to review these Terms of Use periodically to remain informed of any updates or changes.</li>
<li>Your continued access to or use of the ShelterBee Platform and the Services after the posting of any modifications shall constitute your acceptance of the revised Terms of Use.</li>
<li>If you do not agree with the updated Terms of Use, you must discontinue the use of the ShelterBee Platform and its Services.</li>
</ul>

<h2>17. General Provisions</h2>
<p><strong>a. Governing Law</strong><br/>
These Terms of Use shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms or the use of the ShelterBee Platform shall be subject to the exclusive jurisdiction of the competent courts in the place where ShelterBee is registered or operates.</p>
<p><strong>b. Severability</strong><br/>
If any provision of these Terms of Use is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be severed from these Terms and the remaining provisions shall continue to remain in full force and effect.</p>
<p><strong>c. Entire Agreement</strong><br/>
These Terms of Use, together with any other policies or guidelines published on the ShelterBee Platform, constitute the entire agreement between the User and ShelterBee regarding the use of the Platform and Services.</p>
<p><strong>d. Waiver</strong><br/>
The failure of ShelterBee to enforce any provision of these Terms shall not be considered a waiver of its right to enforce such provision at any later time.</p>
<p><strong>e. Assignment</strong><br/>
Users may not assign or transfer their rights or obligations under these Terms without the prior written consent of ShelterBee. ShelterBee may assign or transfer its rights or obligations under these Terms to any affiliate or successor entity.</p>

<h2>21. Dispute Resolution</h2>
<p><strong>a. User Responsibility</strong><br/>
Users agree to attempt to resolve any dispute, claim, or controversy arising out of or relating to the use of the ShelterBee Platform or the Services directly with the concerned party (including the Channel Partner or property host) in a fair and reasonable manner.</p>
<p><strong>b. Platform Assistance</strong><br/>
ShelterBee may, at its sole discretion, assist Users and Channel Partners in facilitating communication to resolve disputes related to bookings made through the ShelterBee Platform. However, ShelterBee shall not be obligated to mediate or resolve such disputes.</p>
<p><strong>c. Platform Limitation</strong><br/>
ShelterBee acts only as a technology platform connecting Users with Channel Partners providing accommodation services. ShelterBee shall not be held responsible for disputes arising from property conditions, services provided by Channel Partners, guest behaviour, or any other matters beyond the operation of the ShelterBee Platform.</p>
<p><strong>d. Formal Dispute Process</strong><br/>
In the event that a dispute cannot be resolved informally, the parties agree that the dispute shall be governed and interpreted in accordance with the applicable laws of India.</p>
<p><strong>e. Jurisdiction</strong><br/>
Any legal proceedings arising out of or relating to the use of the ShelterBee Platform shall be subject to the exclusive jurisdiction of the competent courts located in the city where ShelterBee Private Limited is registered.</p>
<p><strong>f. Right to Suspend Accounts</strong><br/>
ShelterBee reserves the right to suspend or terminate the accounts of Users or Channel Partners involved in fraudulent activity, misuse of the platform, or repeated disputes affecting the integrity of the ShelterBee Platform.</p>

<h2>24. Intellectual Property Rights</h2>
<p><strong>a. Ownership of Platform Content</strong><br/>
All content available on the ShelterBee Platform, including but not limited to text, graphics, logos, trademarks, images, software, design, layout, and other materials, are the intellectual property of ShelterBee Private Limited or its licensors and are protected under applicable intellectual property laws.</p>
<p><strong>b. Limited License to Users</strong><br/>
Users are granted a limited, non-exclusive, non-transferable, and revocable license to access and use the ShelterBee Platform solely for personal and lawful purposes in accordance with these Terms of Use.</p>
<p><strong>c. Restrictions on Use</strong><br/>
Users shall not copy, reproduce, distribute, modify, publish, transmit, display, sell, or exploit any content from the ShelterBee Platform without the prior written permission of ShelterBee.</p>
<p><strong>d. Trademark Protection</strong><br/>
The name “ShelterBee”, its logos, branding elements, and other associated marks are the property of ShelterBee Private Limited. Unauthorized use of such trademarks or branding is strictly prohibited.</p>
<p><strong>e. User Content</strong><br/>
Any content uploaded or submitted by Users or Channel Partners on the ShelterBee Platform, including property images, descriptions, or reviews, must not infringe upon the intellectual property rights of any third party. The user submitting such content shall be solely responsible for ensuring that they have the necessary rights or permissions to use such materials.</p>
<p><strong>f. Violation of Intellectual Property Rights</strong><br/>
ShelterBee reserves the right to remove or disable access to any content that is alleged to infringe intellectual property rights and may suspend or terminate the accounts of Users or Channel Partners responsible for such violations.</p>

<h2>25. Governing Law and Jurisdiction</h2>
<p><strong>a. Applicable Law</strong><br/>
These Terms of Use and any disputes arising out of or relating to the ShelterBee Platform or the Services shall be governed by and interpreted in accordance with the laws of India.</p>
<p><strong>b. Jurisdiction</strong><br/>
Subject to the dispute resolution provisions contained in these Terms, the courts located in the jurisdiction where ShelterBee Private Limited is registered shall have exclusive jurisdiction over any legal proceedings arising from or related to the use of the ShelterBee Platform.</p>
<p><strong>c. Compliance with Local Laws</strong><br/>
Users and Channel Partners accessing the ShelterBee Platform from any location shall be responsible for compliance with all applicable local laws and regulations.</p>
<p><strong>d. Severability</strong><br/>
If any provision of these Terms is found to be invalid or unenforceable by a competent court of law, the remaining provisions shall continue to remain valid and enforceable.</p>
`;

const privacyContent = `
<ul>
<li>ShelterBee respects the privacy of its Users and is committed to protecting the personal information shared through the ShelterBee Platform. By accessing or using the ShelterBee Platform, you agree to the collection, use, storage, and processing of your personal information in accordance with applicable laws and the ShelterBee Privacy Policy.</li>
<li>ShelterBee may collect certain information from Users, including but not limited to name, contact details, identification information, booking details, and payment-related information, for the purpose of providing and improving the Services offered through the ShelterBee Platform.</li>
<li>Such information may be used for purposes including user verification, booking management, customer support, communication of service updates, and compliance with legal or regulatory requirements.</li>
<li>ShelterBee implements reasonable security measures to safeguard user information; however, no method of electronic transmission or storage is completely secure. While ShelterBee strives to protect personal information, it cannot guarantee absolute security of the information transmitted through the ShelterBee Platform.</li>
<li>Users are encouraged to review the ShelterBee Privacy Policy for detailed information regarding how personal data is collected, used, stored, and protected.</li>
<li>This Privacy Policy describes how ShelterBee Private Limited (“ShelterBee”, “we”, “us”, “our”) collects, uses, stores, and protects the personal information of users (“User”, “you”, “your”) who access or use the ShelterBee website, mobile application, or related services (collectively referred to as the “ShelterBee Platform”).</li>
<li>By accessing or using the ShelterBee Platform, you agree to the collection and use of information in accordance with this Privacy Policy.</li>
</ul>

<h3>a. Information We Collect</h3>
<p>ShelterBee may collect different types of information from Users, including but not limited to:</p>
<ul>
<li><strong>a. Personal Information:</strong> Name, phone number, email address, postal address, and identification details provided during registration or booking.</li>
<li><strong>b. Booking Information:</strong> Details related to property bookings, travel dates, payment details, and accommodation preferences.</li>
<li><strong>c. Identity Verification Information:</strong> Government-issued identification details where required for booking verification or compliance with applicable laws.</li>
<li><strong>d. Technical Information:</strong> IP address, device information, browser type, operating system, and usage data collected automatically when Users access the ShelterBee Platform.</li>
<li><strong>e. Communication Data:</strong> Information shared when Users contact customer support, send emails, or communicate through the ShelterBee Platform.</li>
</ul>

<h3>b. How We Use Your Information</h3>
<p>ShelterBee may use the collected information for the following purposes:</p>
<ul>
<li>a. To create and manage user accounts on the ShelterBee Platform.</li>
<li>b. To process bookings and facilitate accommodation services.</li>
<li>c. To communicate booking confirmations, updates, and service notifications.</li>
<li>d. To provide customer support and resolve user inquiries or disputes.</li>
<li>e. To improve platform functionality, services, and user experience.</li>
<li>f. To comply with legal obligations and regulatory requirements.</li>
<li>g. To send promotional communications, offers, or service updates where permitted by applicable laws.</li>
</ul>

<h3>c. Sharing of Information</h3>
<p>ShelterBee may share user information in the following circumstances:</p>
<ul>
<li><strong>a. With Channel Partners / Property Hosts:</strong> To facilitate accommodation bookings and enable property check-in and verification.</li>
<li><strong>b. With Service Providers:</strong> With trusted third-party service providers such as payment processors, technology providers, or customer support services that assist in operating the ShelterBee Platform.</li>
<li><strong>c. Legal Compliance:</strong> Where required by law, regulation, court order, or government authority.</li>
<li><strong>d. Business Transfers:</strong> In connection with mergers, acquisitions, restructuring, or sale of assets involving ShelterBee.</li>
</ul>
<p>ShelterBee does not sell or rent personal information to third parties for their independent marketing purposes.</p>

<h3>d. Data Security</h3>
<p>ShelterBee implements reasonable technical and organizational measures to protect user information from unauthorized access, misuse, loss, or alteration. However, no method of electronic transmission or storage is completely secure, and ShelterBee cannot guarantee absolute security of the information transmitted through the ShelterBee Platform.</p>

<h3>e. Data Retention</h3>
<p>ShelterBee may retain personal information for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.</p>

<h3>f. User Rights</h3>
<p>Users may have the right to:</p>
<ul>
<li>a. Access or review their personal information.</li>
<li>b. Request correction of inaccurate information.</li>
<li>c. Request deletion of personal data where permitted by applicable laws.</li>
<li>d. Opt out of receiving promotional communications from ShelterBee.</li>
</ul>
<p>Requests related to personal data may be submitted to ShelterBee through the contact details provided below.</p>

<h3>g. Cookies and Tracking Technologies</h3>
<p>The ShelterBee Platform may use cookies and similar technologies to enhance user experience, analyze platform usage, and improve services. Users may manage cookie preferences through their browser settings.</p>

<h3>h. Third-Party Links</h3>
<p>The ShelterBee Platform may contain links to third-party websites or services. ShelterBee is not responsible for the privacy practices or content of such external websites. Users are advised to review the privacy policies of such third parties.</p>

<h3>i. Children’s Privacy</h3>
<p>The ShelterBee Platform is not intended for individuals under the age of eighteen (18). ShelterBee does not knowingly collect personal information from minors without appropriate parental or guardian consent.</p>

<h3>j. Changes to this Privacy Policy</h3>
<p>ShelterBee reserves the right to update or modify this Privacy Policy from time to time. Any changes will become effective upon being posted on the ShelterBee Platform. Users are encouraged to review this Privacy Policy periodically.</p>

<h3>k. Contact Information</h3>
<p>If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal information, you may contact ShelterBee through the official contact details provided on the ShelterBee Platform.</p>
<p><strong>Details for contact:</strong><br/>
Address: Flat no – 103, B-11-A Wing, Mhada colony, Padegaon power House road, Mahatma Phule chowk, Padegaon, Chhatrapati Sambhajinagar, 431002<br/>
Mob no: 8655933724<br/>
Email id: shelterbee24.7support@gmail.com</p>
`;

const refundContent = `
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
`;

const paymentContent = `
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
`;

const template = (title, content) => `import React from 'react';

export default function ${title.replace(/[^a-zA-Z]/g, '')}() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm">
        <h1 className="text-4xl font-extrabold text-[#161338] mb-8">${title}</h1>
        <div className="prose prose-lg max-w-none text-gray-600 space-y-6" dangerouslySetInnerHTML={{ __html: \`${content}\` }} />
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/Terms.tsx', template('Terms & Conditions', termsContent));
fs.writeFileSync('src/pages/Privacy.tsx', template('Privacy Policy', privacyContent));
fs.writeFileSync('src/pages/RefundPolicy.tsx', template('Cancellation and Refund Policy', refundContent));
fs.writeFileSync('src/pages/PaymentPolicy.tsx', template('Payment Policy', paymentContent));
