import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Clock, 
  Calendar, 
  Share2, 
  Shield, 
  CreditCard, 
  MapPin, 
  Key, 
  HelpCircle,
  UserCheck,
  LayoutDashboard,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { helpArticles } from '../data/helpArticles';

const iconMap: { [key: string]: React.ReactNode } = {
  Shield: <Shield className="w-6 h-6" />,
  CreditCard: <CreditCard className="w-6 h-6" />,
  MapPin: <MapPin className="w-6 h-6" />,
  Key: <Key className="w-6 h-6" />,
  HelpCircle: <HelpCircle className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
  UserCheck: <UserCheck className="w-6 h-6" />,
  LayoutDashboard: <LayoutDashboard className="w-6 h-6" />,
  CheckCircle: <CheckCircle className="w-6 h-6" />
};

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const article = helpArticles.find(a => a.id === id);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <h1 className="text-2xl font-bold text-[#1E1B4B] mb-4">Article not found</h1>
        <button 
          onClick={() => navigate('/help-articles')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/help-articles')}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Articles
        </button>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl ${article.bgColor} ${article.textColor} flex items-center justify-center`}>
              {iconMap[article.iconName]}
            </div>
            <div>
              <span className={`text-xs font-bold ${article.textColor} uppercase tracking-widest`}>{article.category}</span>
              <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.readTime}
                </div>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Updated April 2026
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E1B4B] leading-tight mb-6">
            {article.title}
          </h1>
          
          <p className="text-xl text-slate-600 leading-relaxed italic border-l-4 border-indigo-200 pl-6">
            {article.excerpt}
          </p>
        </header>

        {/* Article Content */}
        <article className="prose prose-slate prose-indigo max-w-none">
          <div 
            className="text-slate-700 leading-relaxed space-y-6 text-lg"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* Footer / Share */}
        <footer className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Was this helpful?</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 font-bold transition-colors border border-slate-100">
                Yes
              </button>
              <button className="px-4 py-2 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold transition-colors border border-slate-100">
                No
              </button>
            </div>
          </div>
          
          <button className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            <Share2 className="w-5 h-5" />
            Share Article
          </button>
        </footer>

        {/* Next Read */}
        <section className="mt-20">
          <h3 className="text-2xl font-bold text-[#1E1B4B] mb-8">Related Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {helpArticles
              .filter(a => a.id !== article.id && a.category === article.category)
              .slice(0, 2)
              .map(related => (
                <div 
                  key={related.id}
                  onClick={() => navigate(`/help-articles/${related.id}`)}
                  className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <h4 className="font-bold text-[#1E1B4B] group-hover:text-indigo-600 transition-colors mb-2">{related.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2">{related.excerpt}</p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
