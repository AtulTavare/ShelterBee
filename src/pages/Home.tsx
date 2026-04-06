import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyService } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Any Type');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [topFilter, setTopFilter] = useState<'ratings' | 'reviews'>('ratings');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await propertyService.getApprovedProperties();
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };
    fetchProperties();
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const propertyTypes = ['Any Type', 'Flat', 'PG', 'Room'];

  // Helper to get 4 properties (duplicate if needed for UI demonstration)
  const getFourProperties = () => {
    if (properties.length === 0) return [];
    const props = [...properties];
    while (props.length < 4) {
      props.push({ ...props[0], id: props[0].id + Math.random().toString() });
    }
    return props.slice(0, 4);
  };

  const fourProps = getFourProperties();

  const sortedTopProps = [...properties].sort((a, b) => {
    if (topFilter === 'ratings') {
      return (b.rating || 0) - (a.rating || 0);
    } else {
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    }
  }).slice(0, 4);

  const reviews = [
    { id: 1, name: "Rahul S.", role: "Tenant", text: "Found the perfect PG near my college within 2 days. The process was super smooth!", rating: 5, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=b6e3f4" },
    { id: 2, name: "Priya M.", role: "Property Owner", text: "Listed my flat and got verified tenants in a week. Great platform for owners.", rating: 5, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffdfbf" },
    { id: 3, name: "Amit K.", role: "Tenant", text: "The verified properties feature saved me from a lot of scams. Highly recommended.", rating: 4, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit&backgroundColor=c0aede" },
    { id: 4, name: "Sneha R.", role: "Tenant", text: "Loved the UI and the ease of finding affordable rooms in Aurangabad.", rating: 5, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha&backgroundColor=d1d4f9" },
    { id: 5, name: "Vikram D.", role: "Property Owner", text: "Managing my listings and bookings is a breeze with Shelterbee.", rating: 5, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram&backgroundColor=b6e3f4" },
    { id: 6, name: "Anjali T.", role: "Tenant", text: "Best rental platform I've used. The support team is very responsive.", rating: 5, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali&backgroundColor=ffdfbf" },
  ];

  const faqs = [
    { q: "How do I book a property?", a: "You can book a property by navigating to the property details page and clicking the 'Book Now' button. You will need to be logged in to complete the booking." },
    { q: "Is the security deposit refundable?", a: "Yes, the security deposit is fully refundable at the end of your tenure, subject to no damages to the property as per the agreement." },
    { q: "Are the properties verified?", a: "Absolutely. We physically verify all properties listed with the 'Verified' badge to ensure they match the photos and descriptions." },
    { q: "Can I list my own property?", a: "Yes! Click on the 'Admin' or 'Profile' section to access the property listing form. It takes less than 5 minutes to list your space." },
    { q: "What documents are required for renting?", a: "Typically, you will need a government-issued ID (like Aadhaar or PAN card) and a passport-sized photograph for the rental agreement." },
    { q: "Are there any brokerage charges?", a: "Shelterbee charges zero brokerage on properties listed directly by owners. For agent-listed properties, a nominal fee may apply, which is clearly mentioned." }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .scroll-track {
          display: flex;
          width: 200%;
          animation: scroll 40s linear infinite;
        }
        .scroll-container:hover .scroll-track {
          animation-duration: 80s;
        }
        @keyframes blinkGlow {
          0%, 100% { box-shadow: 0 0 0px transparent; border-color: var(--color-outline-variant); }
          50% { box-shadow: 0 0 20px rgba(133, 83, 0, 0.4); border-color: var(--color-primary); color: var(--color-primary); }
        }
        .pill-glow-1 { animation: blinkGlow 3s infinite 0s; }
        .pill-glow-2 { animation: blinkGlow 3s infinite 1s; }
        .pill-glow-3 { animation: blinkGlow 3s infinite 2s; }
      `}</style>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[100vh] px-8 overflow-hidden -mt-20 pt-20">
        {/* YouTube Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-black">
          <iframe
            src="https://www.youtube.com/embed/IZpTNq-mfNE?autoplay=1&loop=1&mute=1&controls=0&showinfo=0&rel=0&playlist=IZpTNq-mfNE&modestbranding=1&playsinline=1&start=50"
            className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
          {/* Dim Overlay */}
          <div className="absolute inset-0 bg-black/60 z-10"></div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-6 shadow-lg">#1 PREMIUM RENTALS IN MAHARASHTRA</span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 max-w-4xl leading-[1.1] drop-shadow-xl">
            Find your perfect Stay in <span className="text-amber-400 underline decoration-amber-400/50 underline-offset-8">Aurangabad.</span>
          </h1>
          
          {/* Search Bar */}
          <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-2 relative z-20">
            <div className="flex-1 flex items-center px-4 w-full">
              <span className="material-symbols-outlined text-gray-500 mr-3">location_on</span>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 font-medium placeholder:text-gray-500 py-4 outline-none" 
                placeholder="Locality, Landmark or Building" 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
            <div className="flex-1 flex items-center px-4 w-full relative">
              <span className="material-symbols-outlined text-gray-500 mr-3">home_work</span>
              <div 
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 font-medium cursor-pointer outline-none py-4 flex justify-between items-center"
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              >
                {filterType}
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              <AnimatePresence>
                {isTypeDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 text-left"
                  >
                    {propertyTypes.map((type) => (
                      <div 
                        key={type}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-800 font-medium transition-colors"
                        onClick={() => {
                          setFilterType(type);
                          setIsTypeDropdownOpen(false);
                        }}
                      >
                        {type}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => navigate('/listings')}
              className="w-full md:w-auto bg-amber-500 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">search</span>
              Search
            </button>
          </div>
          
          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <button className="pill-glow-1 flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold transition-all hover:bg-white/20 hover:border-white/40 shadow-lg">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>apartment</span>
              Flat
            </button>
            <button className="pill-glow-2 flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold transition-all hover:bg-white/20 hover:border-white/40 shadow-lg">
              <span className="material-symbols-outlined">group</span>
              PG
            </button>
            <button className="pill-glow-3 flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold transition-all hover:bg-white/20 hover:border-white/40 shadow-lg">
              <span className="material-symbols-outlined">bed</span>
              Room
            </button>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-on-secondary-fixed py-8">
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-center md:justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">500+</p>
              <p className="text-secondary-container text-sm font-medium">Verified Properties</p>
            </div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>sentiment_very_satisfied</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">10k+</p>
              <p className="text-secondary-container text-sm font-medium">Happy Residents</p>
            </div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>security</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">100% Secure</p>
              <p className="text-secondary-container text-sm font-medium">Agreement Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Properties */}
      <section className="py-16 px-8 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-secondary-fixed tracking-tight">Trending Properties</h2>
            <p className="text-on-secondary-fixed-variant mt-2 font-medium">Most viewed properties this week.</p>
          </div>
          <Link to="/listings" className="hidden md:flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all">
            View All <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {fourProps.map((property, index) => (
            <PropertyCard 
              key={`trending-${index}`} 
              property={property} 
              featured={index === 0} 
              isFavorite={favorites.includes(property.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* New Listings */}
      <section className="py-16 px-8 bg-surface-container-low border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-secondary-fixed tracking-tight">New Listings</h2>
            <p className="text-on-secondary-fixed-variant mt-2 font-medium">Fresh properties added recently.</p>
          </div>
          <Link to="/listings" className="hidden md:flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all">
            View All <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {fourProps.map((property, index) => (
            <PropertyCard 
              key={`new-${index}`} 
              property={property} 
              isFavorite={favorites.includes(property.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* Top Properties */}
      <section className="py-16 px-8 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-secondary-fixed tracking-tight">Top Properties</h2>
            <p className="text-on-secondary-fixed-variant mt-2 font-medium">Highest rated and most reviewed.</p>
          </div>
          <div className="flex bg-surface-container rounded-xl p-1">
            <button 
              onClick={() => setTopFilter('ratings')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${topFilter === 'ratings' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              By Ratings
            </button>
            <button 
              onClick={() => setTopFilter('reviews')}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${topFilter === 'reviews' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              By Reviews
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {sortedTopProps.map((property, index) => (
            <PropertyCard 
              key={`top-${index}`} 
              property={property} 
              topRated={true} 
              isFavorite={favorites.includes(property.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* Most Affordable Properties */}
      <section className="py-16 px-8 bg-surface-container-low border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-secondary-fixed tracking-tight">Most Affordable</h2>
            <p className="text-on-secondary-fixed-variant mt-2 font-medium">Great stays that fit your budget.</p>
          </div>
          <Link to="/listings" className="hidden md:flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all">
            View All <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {fourProps.map((property, index) => (
            <PropertyCard 
              key={`affordable-${index}`} 
              property={property} 
              verified={true} 
              isFavorite={favorites.includes(property.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 bg-on-secondary-fixed overflow-hidden scroll-container relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/20 blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-8 mb-16 text-center relative z-10">
          <span className="text-primary-container font-black text-sm uppercase tracking-widest mb-4 block">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">What Our Users Say</h2>
          <p className="text-secondary-container mt-4 font-medium text-lg max-w-2xl mx-auto">Trusted by thousands of tenants and owners across Maharashtra.</p>
        </div>
        
        <div className="relative z-10">
          <div className="scroll-track gap-8 px-4">
            {[...reviews, ...reviews].map((review, index) => (
              <div key={`${review.id}-${index}`} className="w-[400px] flex-shrink-0 bg-surface-container-lowest/95 backdrop-blur-md rounded-[2rem] p-8 shadow-2xl border border-white/10 relative group hover:-translate-y-2 transition-transform duration-300">
                <span className="material-symbols-outlined absolute top-6 right-8 text-6xl text-primary/10 font-serif rotate-180 group-hover:text-primary/20 transition-colors">format_quote</span>
                
                <div className="flex items-center gap-1 mb-6 relative z-10">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-tertiary text-tertiary drop-shadow-sm" />
                  ))}
                </div>
                
                <p className="text-on-surface text-[1.1rem] font-medium mb-8 leading-relaxed relative z-10">"{review.text}"</p>
                
                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-outline-variant/30 relative z-10">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-container shadow-md bg-surface-container">
                    <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-extrabold text-on-surface text-lg">{review.name}</p>
                    <p className="text-sm font-medium text-primary">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Localities Bento Grid */}
      <section className="py-24 px-8 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-on-secondary-fixed tracking-tight">Popular Localities</h2>
            <p className="text-on-secondary-fixed-variant mt-3 max-w-2xl mx-auto font-medium text-lg">Discover the best neighborhoods in Aurangabad tailored to your lifestyle.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-[800px] md:h-[600px]">
            {/* Large Locality Card */}
            <div className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden group">
              <img alt="Cidco Area" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvfEDEjT1VYthqMqcG4VXW7URDtfL6ajfrVcSSAfGIsVlsakwjP8631LYwI5V0iq8HbAUJudy8rl9Hr2WZ1lQ3nOdd6jQoJuLfPuOFnI--HkYEOL1rm51vW7gCs_zSYjaj038lhq4BnFgtjJY0l0mfRFD19oBpWTepGFarZ9mkGL_SdXOFmJpbPN1ofxhfPBvUr4p0F5JHPnjBo5lQcXexbTZjcAfDYv0V0aQEcvlwBIkfDU9rTdNig2mhSvTfwc5PBD6B_JyQ0nc"/>
              <div className="absolute inset-0 bg-gradient-to-t from-on-secondary-fixed/90 via-on-secondary-fixed/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-10">
                <span className="text-primary-container font-black text-sm uppercase tracking-widest mb-2 block">Most Searched Area</span>
                <h3 className="text-white text-4xl font-extrabold mb-4">Cidco</h3>
                <p className="text-white/80 max-w-sm mb-6">The heart of the city with the best connectivity, shopping malls, and premium corporate offices.</p>
                <button className="bg-white text-on-secondary-fixed px-6 py-3 rounded-xl font-bold flex items-center gap-2 group/btn">
                  Explore Area <span className="material-symbols-outlined group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>
            
            {/* Locality Card 2 */}
            <div className="md:col-span-2 bg-secondary-fixed/40 rounded-3xl p-8 flex items-center justify-between group hover:bg-secondary-fixed/60 transition-all cursor-pointer">
              <div className="flex flex-col">
                <div className="w-14 h-14 bg-on-secondary-fixed rounded-2xl flex items-center justify-center text-white mb-6">
                  <span className="material-symbols-outlined text-3xl">school</span>
                </div>
                <h3 className="text-2xl font-extrabold text-on-secondary-fixed mb-1">Osmanpura</h3>
                <p className="text-on-secondary-fixed-variant font-medium">Area has most of the PG's.</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-on-secondary-fixed">120+</p>
                <p className="text-on-secondary-fixed-variant text-sm font-bold">PGs Available</p>
              </div>
            </div>
            
            {/* Locality Card 3 */}
            <div className="md:col-span-1 bg-primary-fixed/30 rounded-3xl p-8 flex flex-col justify-between group hover:bg-primary-fixed/50 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white mb-6">
                <span className="material-symbols-outlined text-3xl">park</span>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-on-secondary-fixed mb-1">Garkheda</h3>
                <p className="text-on-secondary-fixed-variant font-medium text-sm">Area with most number of listings.</p>
              </div>
            </div>
            
            {/* Locality Card 4 */}
            <div className="md:col-span-1 bg-on-surface-variant/5 rounded-3xl p-8 flex flex-col justify-between group hover:bg-on-surface-variant/10 transition-all cursor-pointer">
              <div className="w-14 h-14 bg-on-surface-variant rounded-2xl flex items-center justify-center text-white mb-6">
                <span className="material-symbols-outlined text-3xl">factory</span>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-on-secondary-fixed mb-1">Waluj</h3>
                <p className="text-on-secondary-fixed-variant font-medium text-sm">Properties near to industrial area.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-24 px-8 bg-surface-container-low">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight">Frequently Asked Questions</h2>
            <p className="text-on-surface-variant mt-3 font-medium text-lg">Everything you need to know about Shelterbee.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-bold text-on-surface text-lg">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5 text-on-surface-variant leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="py-24 px-8 bg-surface">
        <div className="max-w-4xl mx-auto bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-5/12 bg-primary p-10 text-on-primary flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-extrabold mb-4">Get in Touch</h2>
              <p className="text-on-primary/80 mb-8">Have a question that wasn't answered in our FAQs? Drop us a message and our team will get back to you within 24 hours.</p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-on-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <span>support@shelterbee.com</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-on-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <span>+91 98765 43210</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:w-7/12 p-10">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">First Name</label>
                  <input type="text" className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Last Name</label>
                  <input type="text" className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Email Address</label>
                <input type="email" className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Message</label>
                <textarea rows={4} className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface" placeholder="How can we help you?"></textarea>
              </div>
              <button type="button" className="w-full bg-on-secondary-fixed text-white font-bold py-4 rounded-xl hover:bg-on-secondary-fixed/90 transition-colors">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
