import React from "react";
import { Facebook, Instagram, Linkedin, Twitter, ArrowUpRight } from "lucide-react";

interface Footer7Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
  }>;
}

const defaultSections = [
  {
    title: "Company",
    links: [
      { name: "About Us", href: "/about-us" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Company Details", href: "/company-details" },
    ],
  },
  {
    title: "Terms & Policies",
    links: [
      { name: "Terms & Conditions", href: "/terms" },
      { name: "Hosting terms & rules", href: "/hosting-rules" },
      { name: "Payments & Refund Policies", href: "/payment-policy" },
      { name: "Cancellation Policies", href: "/refund-policy" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Help Center", href: "/help-center" },
      { name: "Help Articles", href: "/help-articles" },
      { name: "Report a Concern", href: "/report-concern" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <Instagram className="w-5 h-5" />, href: "https://www.instagram.com/shelterbee_4_you", label: "Instagram" },
  { icon: <Facebook className="w-5 h-5" />, href: "https://www.facebook.com/share/1BQoUFoHto/", label: "Facebook" },
  { icon: <Twitter className="w-5 h-5" />, href: "https://x.com/ShelterBee8426", label: "Twitter" },
  { icon: <Linkedin className="w-5 h-5" />, href: "#", label: "LinkedIn" },
];

const defaultLegalLinks = [
];

export const Footer7 = ({
  logo = {
    url: "/",
    src: "https://res.cloudinary.com/dtnsxrc2c/image/upload/q_auto/f_auto/v1775077949/shelterbee_logo_q0gz87.jpg",
    alt: "logo",
    title: "Shelterbee",
  },
  sections = defaultSections,
  description = "A platform where you find a perfect stay which is as good as like your another home",
  socialLinks = defaultSocialLinks,
  copyright = `© ${new Date().getFullYear()} Shelterbee. All rights reserved.`,
  legalLinks = defaultLegalLinks,
}: Footer7Props) => {
  return (
    <section className="py-16 bg-surface border-t border-outline-variant/30">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
            {/* Logo */}
            <div className="flex items-center gap-2 lg:justify-start">
              <a href={logo.url}>
                <img
                  src={logo.src}
                  alt={logo.alt}
                  title={logo.title}
                  className="h-8 rounded"
                  referrerPolicy="no-referrer"
                />
              </a>
              <h2 className="text-xl font-bold text-on-surface">{logo.title}</h2>
            </div>
            <p className="max-w-[70%] text-sm text-on-surface-variant">
              {description}
            </p>
            <ul className="flex items-center space-x-6 text-on-surface-variant">
              {socialLinks.map((social, idx) => (
                <li key={idx} className="font-medium hover:text-primary transition-colors">
                  <a href={social.href} aria-label={social.label}>
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold text-on-surface">{section.title}</h3>
                <ul className="space-y-3 text-sm text-on-surface-variant">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-6 border-t border-outline-variant/30 py-8 text-xs font-medium text-on-surface-variant md:flex-row md:items-center">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p>{copyright}</p>
            <ul className="flex gap-4 md:gap-6">
              {legalLinks.map((link, idx) => (
                <li key={idx} className="hover:text-primary transition-colors">
                  <a href={link.href}> {link.name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-center md:ml-auto md:justify-end gap-2 font-bold whitespace-nowrap">
            <span>Designed & Powered by</span>
            <a 
              href="https://infinityinnovations.framer.ai/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="group flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
            >
              <span className="underline decoration-red-600/30 underline-offset-4">INFINITY INNOVATIONS</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
