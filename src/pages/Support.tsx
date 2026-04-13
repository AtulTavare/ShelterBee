import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { emailService } from '../services/emailService';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageSquare, Gavel, Shield, Banknote, RefreshCcw, MessageCircleQuestion, ArrowRight } from 'lucide-react';

export default function Support() {
  const [formData, setFormData] = useState({ fullName: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.subject || !formData.message) return;
    
    setIsSubmitting(true);
    try {
      // Save to Firestore
      await addDoc(collection(db, 'support_inquiries'), {
        ...formData,
        createdAt: new Date().toISOString()
      });

      // Send email to support
      await emailService.sendEmail({
        to: 'support@shelterbee.com',
        subject: `New Support Inquiry: ${formData.subject}`,
        text: `Name: ${formData.fullName}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`,
        html: `<p><strong>Name:</strong> ${formData.fullName}</p><p><strong>Email:</strong> ${formData.email}</p><p><strong>Subject:</strong> ${formData.subject}</p><p><strong>Message:</strong><br/>${formData.message.replace(/\n/g, '<br/>')}</p>`,
        replyTo: formData.email,
        from: `"${formData.fullName}" <service@shelterbee.com>`
      });

      setSubmitSuccess(true);
      setFormData({ fullName: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-900 pb-20">
      {/* Hero Section */}
      <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#161338] rounded-[2.5rem] p-8 lg:p-16 flex flex-col lg:flex-row gap-12 lg:gap-24 relative overflow-hidden">
          {/* Background decorative elements if any */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none"></div>
          
          <div className="lg:w-1/2 flex flex-col justify-center z-10">
            <h1 className="text-4xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
              How can we<br />help you<br />today?
            </h1>
            <p className="text-lg text-gray-300 mb-12 max-w-md leading-relaxed">
              Our dedicated concierge team is standing by to assist you with your real estate journey and investment portfolio.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2A2B52] flex items-center justify-center shrink-0">
                  <Mail className="text-[#F59E0B]" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Email Support</h3>
                  <p className="text-gray-400">concierge@shelterbee.com</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2A2B52] flex items-center justify-center shrink-0">
                  <Phone className="text-[#F59E0B]" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Direct Line</h3>
                  <p className="text-gray-400">+1 (888) 450-SAFFRON</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2A2B52] flex items-center justify-center shrink-0">
                  <MessageSquare className="text-[#F59E0B]" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Live Chat Hours</h3>
                  <p className="text-gray-400">Mon - Fri: 08:00 - 20:00 EST</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 z-10">
            <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-2xl">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-4 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#F59E0B]/50 transition-all text-gray-800 placeholder-gray-400"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-4 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#F59E0B]/50 transition-all text-gray-800 placeholder-gray-400"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-4 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#F59E0B]/50 transition-all text-gray-800 placeholder-gray-400"
                    placeholder="Investment Inquiry"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-4 rounded-xl bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#F59E0B]/50 transition-all text-gray-800 placeholder-gray-400 resize-none"
                    placeholder="How can we assist you with your real estate needs?"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-lg mt-2"
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
                {submitSuccess && (
                  <p className="text-green-600 text-sm font-medium text-center mt-4">Thank you! Your request has been sent.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Policies & Guidelines Section */}
      <section id="policies" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#161338] mb-4 tracking-tight">Policies & Guidelines</h2>
          <div className="w-16 h-1.5 bg-[#F59E0B] rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-start h-full">
            <div className="w-12 h-12 bg-[#FDF6ED] rounded-2xl flex items-center justify-center mb-6">
              <Gavel className="text-[#8B5A2B]" size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#161338] mb-3">Terms & Conditions</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
              Fundamental rules governing the use of our platform and real estate services.
            </p>
            <Link to="/terms" className="text-[#8B5A2B] font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:text-[#F59E0B] transition-colors mt-auto">
              READ FULL POLICY <ArrowRight size={16} />
            </Link>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-start h-full">
            <div className="w-12 h-12 bg-[#FDF6ED] rounded-2xl flex items-center justify-center mb-6">
              <Shield className="text-[#8B5A2B]" size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#161338] mb-3">Privacy Policy</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
              How we protect your sensitive data and personal investment information.
            </p>
            <Link to="/privacy" className="text-[#8B5A2B] font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:text-[#F59E0B] transition-colors mt-auto">
              READ FULL POLICY <ArrowRight size={16} />
            </Link>
          </div>
          
          {/* Card 3 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-start h-full">
            <div className="w-12 h-12 bg-[#FDF6ED] rounded-2xl flex items-center justify-center mb-6">
              <Banknote className="text-[#8B5A2B]" size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#161338] mb-3">Payment Policy</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
              Details regarding escrow services, transaction fees, and fund management.
            </p>
            <Link to="/payment-policy" className="text-[#8B5A2B] font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:text-[#F59E0B] transition-colors mt-auto">
              READ FULL POLICY <ArrowRight size={16} />
            </Link>
          </div>
          
          {/* Card 4 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-start h-full">
            <div className="w-12 h-12 bg-[#FDF6ED] rounded-2xl flex items-center justify-center mb-6">
              <RefreshCcw className="text-[#8B5A2B]" size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#161338] mb-3">Refund Policy</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
              Clear guidelines for capital withdrawals and reservation cancellations.
            </p>
            <Link to="/refund-policy" className="text-[#8B5A2B] font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:text-[#F59E0B] transition-colors mt-auto">
              READ FULL POLICY <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-12">
        <div className="bg-[#F3F4F6] rounded-[2.5rem] p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <MessageCircleQuestion className="text-[#8B5A2B]" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#161338] mb-2">Looking for quick answers?</h3>
              <p className="text-gray-500">Explore our comprehensive Knowledge Base for instant solutions.</p>
            </div>
          </div>
          <Link to="/help-center" className="bg-white text-[#161338] font-bold py-4 px-8 rounded-xl shadow-sm hover:shadow-md transition-all whitespace-nowrap border border-gray-100">
            Visit FAQ Center
          </Link>
        </div>
      </section>
    </div>
  );
}
