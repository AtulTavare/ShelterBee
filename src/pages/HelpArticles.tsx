import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Shield, 
  CreditCard, 
  MapPin, 
  Key,
  HelpCircle
} from 'lucide-react';

const articles = [
  {
    id: 1,
    title: "Understanding our Cancellation & Refund Policy",
    excerpt: "Learn about the timelines and refund percentages for different cancellation scenarios on ShelterBee.",
    category: "Policies",
    readTime: "5 min read",
    icon: <Shield className="w-6 h-6 text-indigo-500" />,
    bgColor: "bg-indigo-50"
  },
  {
    id: 2,
    title: "How to Securely Pay for Your Booking",
    excerpt: "A step-by-step guide on using our integrated payment gateway and keeping your financial data safe.",
    category: "Payments",
    readTime: "4 min read",
    icon: <CreditCard className="w-6 h-6 text-amber-500" />,
    bgColor: "bg-amber-50"
  },
  {
    id: 3,
    title: "Finding the Perfect Location for Your Stay",
    excerpt: "Tips on using our map features and filters to find a stay that fits your commute and lifestyle.",
    category: "Search",
    readTime: "6 min read",
    icon: <MapPin className="w-6 h-6 text-emerald-500" />,
    bgColor: "bg-emerald-50"
  },
  {
    id: 4,
    title: "Check-in & Check-out: What You Need to Know",
    excerpt: "Everything about timing, identity verification, and coordinating with your host for a smooth arrival.",
    category: "Guest Experience",
    readTime: "3 min read",
    icon: <Key className="w-6 h-6 text-rose-500" />,
    bgColor: "bg-rose-50"
  },
  {
    id: 5,
    title: "Resolving Disputes with Your Host",
    excerpt: "Our process for handling disagreements and how we ensure a fair outcome for both parties.",
    category: "Support",
    readTime: "7 min read",
    icon: <HelpCircle className="w-6 h-6 text-blue-500" />,
    bgColor: "bg-blue-50"
  },
  {
    id: 6,
    title: "Safety Standards for ShelterBee Properties",
    excerpt: "The criteria we use to verify properties and the safety measures we require from our hosts.",
    category: "Safety",
    readTime: "5 min read",
    icon: <Shield className="w-6 h-6 text-emerald-500" />,
    bgColor: "bg-emerald-50"
  }
];

export default function HelpArticles() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-wider mb-4"
          >
            <BookOpen className="w-4 h-4" />
            Knowledge Base
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-[#1E1B4B] mb-6"
          >
            Help Articles
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto"
          >
            In-depth guides and solutions to help you make the most of your ShelterBee experience.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <motion.div 
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-2xl ${article.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {article.icon}
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{article.category}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <Clock className="w-3 h-3" />
                  {article.readTime}
                </div>
              </div>

              <h3 className="text-xl font-bold text-[#1E1B4B] mb-4 group-hover:text-indigo-600 transition-colors">
                {article.title}
              </h3>
              
              <p className="text-slate-600 leading-relaxed mb-8">
                {article.excerpt}
              </p>

              <div className="flex items-center text-sm font-bold text-indigo-600 group-hover:gap-2 transition-all">
                Read Article
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Newsletter / Stay Updated */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 bg-[#1E1B4B] rounded-[3rem] p-12 text-center text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Can't find what you're looking for?</h2>
            <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
              Our support team is always ready to help. Visit our Help Center to submit a query or chat with us.
            </p>
            <a 
              href="/help-center" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-[#1E1B4B] font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20"
            >
              Visit Help Center
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
