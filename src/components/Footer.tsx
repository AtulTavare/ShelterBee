import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-on-secondary-fixed w-full py-12 px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/dtnsxrc2c/image/upload/q_auto/f_auto/v1775077949/shelterbee_logo_q0gz87.jpg" alt="Shelterbee Logo" className="h-8 w-auto rounded" referrerPolicy="no-referrer" />
            <span className="text-primary-container text-2xl font-bold tracking-tighter">Shelterbee</span>
          </div>
          <p className="text-on-surface-variant text-xs uppercase tracking-widest">© {new Date().getFullYear()} Shelterbee. The Radiant Estate.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-on-surface-variant hover:text-primary-container transition-colors text-xs uppercase tracking-widest hover:underline decoration-primary-container underline-offset-4" href="#">Privacy Policy</a>
          <a className="text-on-surface-variant hover:text-primary-container transition-colors text-xs uppercase tracking-widest hover:underline decoration-primary-container underline-offset-4" href="#">Terms of Service</a>
          <a className="text-on-surface-variant hover:text-primary-container transition-colors text-xs uppercase tracking-widest hover:underline decoration-primary-container underline-offset-4" href="#">Cookie Settings</a>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer">
            <span className="material-symbols-outlined text-xl">share</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer">
            <span className="material-symbols-outlined text-xl">language</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
