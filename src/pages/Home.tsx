import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyService } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

  const propertyTypes = ['Any Type', 'Flat', 'PG', 'Room', 'Hostel'];

  // Helper to get 4 properties (duplicate if needed for UI demonstration)
  const getFourProperties = () => {
    if (properties.length === 0) return [];
    const props = [...properties];
    let counter = 0;
    while (props.length < 4) {
      props.push({ ...props[0], id: `${props[0].id}-dup-${counter++}` });
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
  
  // Ensure we have 4 for sortedTopProps too
  const getFourSortedProps = () => {
    if (sortedTopProps.length === 0) return [];
    const props = [...sortedTopProps];
    let counter = 0;
    while (props.length < 4) {
      props.push({ ...props[0], id: `${props[0].id}-dup-top-${counter++}` });
    }
    return props.slice(0, 4);
  };
  
  const fourSortedProps = getFourSortedProps();

  const faqs = [
    { q: "How do I book a stay?", a: "Search → select dates → click “Book Now” → complete payment" },
    { q: "Can I cancel my booking?", a: "Yes, based on stay’s cancellation policy and refund depends on timing." },
    { q: "When will I get full stays details?", a: "After booking confirmation. Location, contact information, name of owner shared before check-in." },
    { q: "How do I list my property?", a: "Click “Become host” → fill details → submit for approval" },
    { q: "When will my property go live?", a: "After admin verification. Usually within 24–48 hours." },
    { q: "Do I need to provide documents?", a: "Yes, ID proof and property proof required for verification and trust." }
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
      <section className="relative flex flex-col items-center justify-end min-h-[100vh] px-4 md:px-8 pb-12 md:pb-16 overflow-hidden -mt-20 pt-20">
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

        <div className="relative z-20 w-full max-w-5xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 md:mb-8 leading-[1.1] drop-shadow-2xl">
            Find your perfect Stay
          </h1>
          
          {/* Search Bar (Pill Style) */}
          <div className="w-full max-w-xl bg-white rounded-full shadow-2xl flex flex-col md:flex-row items-center p-1.5 relative z-20 border border-gray-200">
            
            {/* Where */}
            <div className="flex-1 flex flex-col px-5 py-1.5 hover:bg-gray-100 rounded-full cursor-text transition-colors w-full text-left">
              <label className="text-[11px] font-extrabold text-gray-800 tracking-wide">Where</label>
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm text-gray-600 placeholder:text-gray-400 p-0 outline-none w-full mt-0.5"
                placeholder="Search destinations"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-6 w-px bg-gray-300 hidden md:block mx-1"></div>

            {/* Type */}
            <div 
              className="flex-1 flex flex-col px-5 py-1.5 hover:bg-gray-100 rounded-full cursor-pointer transition-colors w-full text-left relative"
              onClick={() => setIsTypeDropdownOpen(true)}
            >
              <div className="text-[11px] font-extrabold text-gray-800 tracking-wide">Type</div>
              <div className={`text-sm mt-0.5 truncate ${filterType === 'Any Type' ? 'text-gray-400' : 'text-gray-600'}`}>
                {filterType === 'Any Type' ? 'Add property type' : filterType}
              </div>
            </div>

            {/* Search Button */}
            <button 
              onClick={() => navigate('/listings')}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 flex-shrink-0 ml-1 shadow-md"
            >
              <span className="material-symbols-outlined text-lg md:text-xl">search</span>
            </button>
          </div>
        </div>

        {/* Property Type Popup Modal */}
        <AnimatePresence>
          {isTypeDropdownOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsTypeDropdownOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden z-10 flex flex-col"
              >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-800">Select Property Type</h3>
                  <button 
                    onClick={() => setIsTypeDropdownOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <div className="p-2">
                  {propertyTypes.map((type) => (
                    <div 
                      key={type}
                      className="px-4 py-3 my-1 hover:bg-gray-50 rounded-xl cursor-pointer text-gray-700 text-sm font-medium transition-colors flex items-center justify-between"
                      onClick={() => {
                        setFilterType(type);
                        setIsTypeDropdownOpen(false);
                      }}
                    >
                      {type}
                      {filterType === type && <span className="material-symbols-outlined text-primary text-sm">check</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
              key={`trending-${property.id}-${index}`} 
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
              key={`new-${property.id}-${index}`} 
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
          {fourSortedProps.map((property, index) => (
            <PropertyCard 
              key={`top-${property.id}-${index}`} 
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
              key={`affordable-${property.id}-${index}`} 
              property={property} 
              verified={true} 
              isFavorite={favorites.includes(property.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
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
              <div key={faq.q} className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
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

    </div>
  );
}
