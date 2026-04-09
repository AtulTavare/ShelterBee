import React from "react";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

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
    title: "Support",
    links: [
      { name: "Help Center", href: "/help-center" },
      { name: "Help Articles", href: "/help-center" },
      { name: "Terms & Conditions", href: "/terms" },
      { name: "Payments & Refund Policies", href: "/refund-policy" },
      { name: "Cancellation Policies", href: "/refund-policy" },
      { name: "Report a Concern", href: "/report-concern" },
    ],
  },
  {
    title: "Hosting",
    links: [
      { name: "Become a Host", href: "/list-property" },
      { name: "Hosting Rules", href: "/hosting-rules" },
      { name: "Learn to Host", href: "/learn-to-host" },
      { name: "Terms & Conditions", href: "/terms" },
      { name: "Payment Policies", href: "/payment-policy" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <Instagram className="w-5 h-5" />, href: "#", label: "Instagram" },
  { icon: <Facebook className="w-5 h-5" />, href: "#", label: "Facebook" },
  { icon: <Twitter className="w-5 h-5" />, href: "#", label: "Twitter" },
  { icon: <Linkedin className="w-5 h-5" />, href: "#", label: "LinkedIn" },
];

const defaultLegalLinks = [
  { name: "Company Details", href: "/company-details" },
  { name: "Privacy Policy", href: "/privacy" },
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
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-outline-variant/30 py-8 text-xs font-medium text-on-surface-variant md:flex-row md:items-center md:text-left">
          <p className="order-2 lg:order-1">{copyright}</p>
          <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row md:gap-6">
            {legalLinks.map((link, idx) => (
              <li key={idx} className="hover:text-primary transition-colors">
                <a href={link.href}> {link.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
