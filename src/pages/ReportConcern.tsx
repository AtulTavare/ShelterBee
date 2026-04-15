import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  User, 
  Mail, 
  Phone, 
  Send,
  ShieldAlert,
  Info
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { showToast } from '../utils/toast';
import { emailService } from '../services/emailService';

export default function ReportConcern() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    subject: '',
    description: '',
    urgency: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.description) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        ...formData,
        type: 'report_concern',
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      // Send email to support
      await emailService.sendEmail({
        to: 'support@shelterbee.com',
        subject: `New Concern Reported: ${formData.subject}`,
        text: `Name: ${formData.name}\nEmail: ${formData.email}\nContact: ${formData.contact}\nUrgency: ${formData.urgency}\nSubject: ${formData.subject}\n\nDescription:\n${formData.description}`,
        html: `<p><strong>Name:</strong> ${formData.name}</p><p><strong>Email:</strong> ${formData.email}</p><p><strong>Contact:</strong> ${formData.contact}</p><p><strong>Urgency:</strong> ${formData.urgency}</p><p><strong>Subject:</strong> ${formData.subject}</p><p><strong>Description:</strong><br/>${formData.description.replace(/\n/g, '<br/>')}</p>`,
        replyTo: formData.email
      });

      showToast("Your concern has been reported. Our security team will investigate immediately.", "success");
      setFormData({ name: '', email: '', contact: '', subject: '', description: '', urgency: 'medium' });
    } catch (error) {
      console.error("Error reporting concern:", error);
      showToast("Failed to submit report. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 text-red-600 mb-6"
          >
            <ShieldAlert className="w-10 h-10" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-[#1E1B4B] mb-4"
          >
            Report a Concern
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 max-w-2xl mx-auto text-lg"
          >
            If you've encountered any serious issues with the platform, a property, or a host, please let us know. We take your safety and trust seriously.
          </motion.p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-10 flex gap-4 items-start">
              <Info className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
              <p className="text-amber-800 text-sm leading-relaxed">
                Please provide as much detail as possible, including booking IDs or property names if applicable. Our team will review your report and contact you via the details provided.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="+91 00000 00000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Urgency Level</label>
                <select 
                  value={formData.urgency}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all appearance-none"
                >
                  <option value="low">Low - General Feedback</option>
                  <option value="medium">Medium - Issue with stay/host</option>
                  <option value="high">High - Safety/Security concern</option>
                  <option value="critical">Critical - Immediate attention required</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Subject *</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Detailed Description *</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all h-40 resize-none"
                  placeholder="Please describe the problem in detail..."
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Report...' : (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
