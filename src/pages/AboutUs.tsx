import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Users, 
  ShieldCheck, 
  Zap, 
  Heart, 
  Globe, 
  Handshake,
  Target,
  Eye
} from 'lucide-react';

const AboutUs = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  } as any;

  useEffect(() => {
    document.title = 'About Us - ShelterBee'
  }, [])

  const values = [
    {
      icon: <Heart className="w-8 h-8 text-rose-500" />,
      title: "Comfort First",
      description: "We believe every stay should feel warm, welcoming, and stress-free.",
      bgColor: "bg-rose-50"
    },
    {
      icon: <Handshake className="w-8 h-8 text-blue-500" />,
      title: "Trust & Transparency",
      description: "We build strong relationships with both guests and hosts through honesty, clear pricing, and reliable service.",
      bgColor: "bg-blue-50"
    },
    {
      icon: <Globe className="w-8 h-8 text-emerald-500" />,
      title: "Community Connection",
      description: "ShelterBee is more than a booking platform—it’s a growing community where people share spaces and experiences.",
      bgColor: "bg-emerald-50"
    },
    {
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      title: "Simplicity & Innovation",
      description: "We focus on simple technology and innovative solutions that make booking and hosting easy.",
      bgColor: "bg-amber-50"
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-indigo-500" />,
      title: "Safety & Reliability",
      description: "We prioritize safe stays and dependable service so guests can book with confidence.",
      bgColor: "bg-indigo-50"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#1E1B4B] mb-6 tracking-tight">
              About <span className="text-amber-500">ShelterBee</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              ShelterBee is a modern platform designed to make finding comfortable and reliable short-term stays simple and convenient.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-bold uppercase tracking-wider">
                <Home className="w-4 h-4" />
                Our Story
              </div>
              <h2 className="text-3xl font-bold text-[#1E1B4B]">Inspired by Nature, Built for Comfort</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed text-lg">
                <p>
                  Inspired by the idea of a bee finding the perfect place to rest, ShelterBee connects travelers, students, and working professionals with carefully selected homes that offer comfort, safety, and a welcoming environment.
                </p>
                <p>
                  We believe that a place to stay should feel more than just temporary—it should feel like a small shelter where you can relax, recharge, and feel at home. ShelterBee works closely with property owners to ensure that every listing provides a quality experience, transparent pricing, and a smooth booking process.
                </p>
                <p>
                  At ShelterBee, we focus on simplicity, reliability, and comfort—so every stay feels just right.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://picsum.photos/seed/shelterbee-home/800/800" 
                  alt="Comfortable Home" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#1E1B4B] text-white p-8 rounded-2xl shadow-xl hidden md:block max-w-xs">
                <p className="text-lg font-medium italic">"Every stay should feel like a small shelter where you can relax and feel at home."</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[#1E1B4B] mb-4">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                To make finding comfortable and trustworthy short-term stays simple and accessible for everyone. ShelterBee aims to connect travelers, students, and professionals with welcoming homes while creating a reliable platform for hosts to share their spaces with confidence.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[#1E1B4B] mb-4">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                To become a trusted global platform for modern stays where people can easily discover safe, comfortable, and affordable places to live, work, and travel—anywhere and anytime.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1E1B4B] mb-4">Our Values</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              The principles that guide everything we do at ShelterBee.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {values.map((value, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="p-8 rounded-3xl border border-slate-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-2xl ${value.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {value.icon}
                </div>
                <h4 className="text-xl font-bold text-[#1E1B4B] mb-3">{value.title}</h4>
                <p className="text-slate-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1E1B4B] to-[#312E81] rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to find your next shelter?</h2>
              <p className="text-indigo-100 mb-10 text-lg max-w-2xl mx-auto">
                Whether you are traveling for work, study, or leisure, ShelterBee helps you find a place that fits your journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/stays" 
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-[#1E1B4B] font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20"
                >
                  Explore Stays
                </a>
                <a 
                  href="/learn-to-host" 
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all backdrop-blur-sm"
                >
                  Become a Host
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
