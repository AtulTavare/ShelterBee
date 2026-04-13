import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  Mail, 
  Phone, 
  User,
  Send
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { showToast } from '../utils/toast';

const visitorFaqs = [
  {
    question: "How do I book a stay?",
    answer: "Search → select dates → click “Book Now” → complete payment"
  },
  {
    question: "Can I cancel my booking?",
    answer: "Yes, based on stay’s cancellation policy and refund depends on timing."
  },
  {
    question: "When will I get full stays details?",
    answer: "After booking confirmation. Location, contact information, name of owner shared before check-in."
  },
  {
    question: "What if my payment fails?",
    answer: "Retry or use another method. Booking is not confirmed until payment succeeds."
  },
  {
    question: "Is it safe to book?",
    answer: "Yes, stays are verified before approval. Basic safety checks are done."
  },
  {
    question: "Can I contact the owner?",
    answer: "Yes, after booking confirmation. Details will be shared securely."
  },
  {
    question: "Are there any hidden charges?",
    answer: "No hidden charges. Total price shown before payment."
  },
  {
    question: "What if stay is not available after booking?",
    answer: "You’ll get refund or alternate property option. Support will assist you."
  }
];

const ownerFaqs = [
  {
    question: "How do I list my property?",
    answer: "Click “Become host” → fill details → submit for approval"
  },
  {
    question: "When will my property go live?",
    answer: "After admin verification. Usually within 24–48 hours."
  },
  {
    question: "Why was my property rejected?",
    answer: "Due to incorrect info, poor quality stay presentation, or verification issues. You can edit and resubmit again for approval."
  },
  {
    question: "How do I get bookings?",
    answer: "Once live, guests can find and book your property. You will be get notified when guest book your property."
  },
  {
    question: "When do I get paid?",
    answer: "After guest check-in, you get paid."
  },
  {
    question: "Can I edit my property later?",
    answer: "Yes, you can update details anytime. Some changes may need approval (documentation, address information)."
  },
  {
    question: "Do I need to provide documents?",
    answer: "Yes, ID proof and property proof required for verification and trust."
  },
  {
    question: "How do I manage bookings?",
    answer: "Use dashboard to view and manage requests. Accept or track bookings easily."
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openVisitorIndex, setOpenVisitorIndex] = useState<number | null>(null);
  const [openOwnerIndex, setOpenOwnerIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    issue: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredVisitorFaqs = visitorFaqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOwnerFaqs = ownerFaqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.issue) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        ...formData,
        type: 'help_query',
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      showToast("Your query has been submitted. Our team will contact you soon!", "success");
      setFormData({ name: '', email: '', contact: '', issue: '' });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast("Failed to submit query. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      {/* Hero Section */}
      <section className="bg-[#1E1B4B] py-20 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-extrabold text-white mb-6"
          >
            How can we help you?
          </motion.h1>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for questions, policies, or help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700"
            />
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 space-y-16">
        {/* Visitor FAQs */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E1B4B] mb-8 text-center">Regarding Stay Bookings</h2>
          <div className="space-y-4">
            {filteredVisitorFaqs.length > 0 ? (
              filteredVisitorFaqs.map((faq, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                  <button 
                    onClick={() => setOpenVisitorIndex(openVisitorIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-bold text-[#1E1B4B]">{faq.question}</span>
                    {openVisitorIndex === index ? <ChevronUp className="text-amber-500" /> : <ChevronDown className="text-slate-400" />}
                  </button>
                  {openVisitorIndex === index && (
                    <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </motion.div>
              ))
            ) : null}
          </div>
        </div>

        {/* Owner FAQs */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1E1B4B] mb-8 text-center">Regarding Property Holdings</h2>
          <div className="space-y-4">
            {filteredOwnerFaqs.length > 0 ? (
              filteredOwnerFaqs.map((faq, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                  <button 
                    onClick={() => setOpenOwnerIndex(openOwnerIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-bold text-[#1E1B4B]">{faq.question}</span>
                    {openOwnerIndex === index ? <ChevronUp className="text-amber-500" /> : <ChevronDown className="text-slate-400" />}
                  </button>
                  {openOwnerIndex === index && (
                    <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </motion.div>
              ))
            ) : null}
          </div>
        </div>

        {filteredVisitorFaqs.length === 0 && filteredOwnerFaqs.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No results found for "{searchQuery}". Try a different search term.
          </div>
        )}
      </section>

      {/* Contact Form Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-[#1E1B4B] p-10 text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Have a query other than this?</h2>
              <p className="text-indigo-100 mb-8 leading-relaxed">
                Feel free to contact us. Write about your problem, our team will contact you back & try best to resolve it.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-amber-400" />
                  </div>
                  <span>support@shelterbee.com</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-amber-400" />
                  </div>
                  <span>+91 86559 33724</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <span>Live Chat (10 AM - 7 PM)</span>
                </div>
              </div>
            </div>

            <div className="p-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Describe your issue</label>
                  <textarea 
                    value={formData.issue}
                    onChange={(e) => setFormData({...formData, issue: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm h-32 resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-[#1E1B4B] font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Query
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
