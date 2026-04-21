import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyService } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';
import { ChevronDown, ChevronUp, MapPin, Search, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, profile, updateProfileData } = useAuth();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [isAreaPopupOpen, setIsAreaPopupOpen] = useState(false);
  const [filterType, setFilterType] = useState('Any Type');
  const [occupancy, setOccupancy] = useState<number | 'Any'>('Any');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isOccupancyDropdownOpen, setIsOccupancyDropdownOpen] = useState(false);
  const [topFilter, setTopFilter] = useState<'ratings' | 'reviews'>('ratings');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [properties, setProperties] = useState<any[]>([]);
  const navigate = useNavigate();

  const favorites = profile?.favorites || [];

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

  useEffect(() => {
    if (isAreaPopupOpen || isTypeDropdownOpen || isOccupancyDropdownOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAreaPopupOpen, isTypeDropdownOpen, isOccupancyDropdownOpen]);

  const availableAreas = useMemo(() => {
    const areas = properties.map(p => p.area).filter(Boolean);
    return Array.from(new Set(areas));
  }, [properties]);

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    const newFavorites = favorites.includes(id) 
      ? favorites.filter(fId => fId !== id) 
      : [...favorites, id];
    
    try {
      await updateProfileData({ favorites: newFavorites });
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  const propertyTypes = ['Any Type', 'Room', 'PG', 'Hostel', 'Full Flat', 'Full Property'];

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

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedAreas.length > 0) params.set('areas', selectedAreas.join(','));
    if (filterType !== 'Any Type') params.set('type', filterType);
    if (occupancy !== 'Any') params.set('occupancy', occupancy.toString());
    navigate(`/stays?${params.toString()}`);
  };

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
        @media (min-width: 1024px) {
          /* Navbar z-index handled centrally in Navbar.tsx */
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-end min-h-[100vh] px-4 md:px-8 pb-12 md:pb-16 overflow-hidden -mt-20 pt-24 md:pt-20">
        {/* YouTube Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-black">
          <iframe
            src="https://www.youtube.com/embed/IZpTNq-mfNE?autoplay=1&loop=1&mute=1&controls=0&rel=0&playlist=IZpTNq-mfNE&modestbranding=1&playsinline=1&iv_load_policy=3&start=0&end=70"
            className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
          {/* Dim Overlay */}
          <div className="absolute inset-0 bg-black/60 z-10"></div>
        </div>

        <div className="relative z-20 w-full max-w-5xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-6xl font-extrabold text-white tracking-tight mb-8 md:mb-8 leading-[1.1] drop-shadow-2xl">
            Find your perfect Stay
          </h1>
          
          {/* Search Bar (Pill Style) */}
          <div className="w-full max-w-xl bg-white rounded-3xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center p-2 md:p-1.5 relative z-20 border border-gray-200 gap-1 md:gap-0">
            
            {/* Where */}
            <div 
              className="flex-1 flex flex-col px-5 py-2 md:py-1.5 hover:bg-gray-100 rounded-2xl md:rounded-full cursor-pointer transition-colors w-full text-left"
              onClick={() => setIsAreaPopupOpen(true)}
            >
              <label className="text-[10px] md:text-[11px] font-extrabold text-gray-800 tracking-wide uppercase">Where</label>
              <div className={`text-sm mt-0.5 truncate ${selectedAreas.length === 0 ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                {selectedAreas.length > 0 ? selectedAreas.join(', ') : 'Search destinations'}
              </div>
            </div>

            <div className="h-6 w-px bg-gray-300 hidden md:block mx-1"></div>

            <div className="flex w-full md:w-auto gap-2">
              {/* Type */}
              <div 
                className="flex-1 md:w-32 flex flex-col px-5 py-2 md:py-1.5 hover:bg-gray-100 rounded-2xl md:rounded-full cursor-pointer transition-colors text-left relative"
                onClick={() => setIsTypeDropdownOpen(true)}
              >
                <div className="text-[10px] md:text-[11px] font-extrabold text-gray-800 tracking-wide uppercase">Type</div>
                <div className={`text-sm mt-0.5 truncate ${filterType === 'Any Type' ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                  {filterType === 'Any Type' ? 'Any' : filterType}
                </div>
              </div>

              <div className="h-6 w-px bg-gray-300 hidden md:block mx-1"></div>

              {/* Occupancy */}
              <div 
                className="flex-1 md:w-32 flex flex-col px-5 py-2 md:py-1.5 hover:bg-gray-100 rounded-2xl md:rounded-full cursor-pointer transition-colors text-left relative"
                onClick={() => setIsOccupancyDropdownOpen(true)}
              >
                <div className="text-[10px] md:text-[11px] font-extrabold text-gray-800 tracking-wide uppercase">Guests</div>
                <div className={`text-sm mt-0.5 truncate ${occupancy === 'Any' ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                  {occupancy === 'Any' ? 'Any' : `${occupancy} Guests`}
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button 
              onClick={handleSearch}
              className="w-full md:w-12 h-12 rounded-2xl md:rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 flex-shrink-0 shadow-md gap-2 md:gap-0"
            >
              <span className="md:hidden font-bold text-sm">Search Stays</span>
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-select Area Popup */}
        <AnimatePresence>
          {isAreaPopupOpen && (
            <div className="modal-overlay p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 shadow-2xl backdrop-blur-md"
                onClick={() => setIsAreaPopupOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="modal-content relative bg-white rounded-[32px] w-full max-w-md flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#1A1A2E]">Select Destinations</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Select multiple areas to search</p>
                  </div>
                  <button 
                    onClick={() => setIsAreaPopupOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                  {availableAreas.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic">No areas found.</div>
                  ) : (
                    <div className="space-y-1">
                      {availableAreas.map((area) => (
                        <div 
                          key={area}
                          className={`group px-5 py-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all duration-200 border-2 ${
                            selectedAreas.includes(area) 
                              ? 'bg-primary/5 border-primary' 
                              : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                          }`}
                          onClick={() => {
                            setSelectedAreas(prev => 
                              prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
                            );
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-colors ${selectedAreas.includes(area) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                              <MapPin size={18} />
                            </div>
                            <span className={`text-base font-bold transition-colors ${selectedAreas.includes(area) ? 'text-primary' : 'text-gray-700'}`}>
                              {area}
                            </span>
                          </div>
                          {selectedAreas.includes(area) && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <button 
                    onClick={() => setIsAreaPopupOpen(false)}
                    className="w-full py-4 bg-[#1A1A2E] text-white rounded-2xl font-bold hover:bg-[#2A2A3E] transition-all transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                  >
                    {selectedAreas.length > 0 ? `Apply ${selectedAreas.length} Areas` : 'Select Areas'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Property Type Popup Modal */}
        <AnimatePresence>
          {isTypeDropdownOpen && (
            <div className="modal-overlay p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 shadow-2xl backdrop-blur-md"
                onClick={() => setIsTypeDropdownOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="modal-content relative bg-white rounded-[32px] w-full max-w-sm flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#1A1A2E]">Property Type</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Filter by stay category</p>
                  </div>
                  <button 
                    onClick={() => setIsTypeDropdownOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="space-y-1">
                    {propertyTypes.map((type) => (
                      <div 
                        key={type}
                        className={`px-5 py-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all duration-200 border-2 ${
                          filterType === type 
                            ? 'bg-primary/5 border-primary' 
                            : 'hover:bg-gray-50 border-transparent'
                        }`}
                        onClick={() => {
                          setFilterType(type);
                          setIsTypeDropdownOpen(false);
                        }}
                      >
                        <span className={`text-base font-bold ${filterType === type ? 'text-primary' : 'text-gray-700'}`}>
                          {type}
                        </span>
                        {filterType === type && (
                          <Check className="w-5 h-5 text-primary" strokeWidth={3} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Occupancy Popup Modal */}
        <AnimatePresence>
          {isOccupancyDropdownOpen && (
            <div className="modal-overlay p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 shadow-2xl backdrop-blur-md"
                onClick={() => setIsOccupancyDropdownOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="modal-content relative bg-white rounded-[32px] w-full max-w-sm flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#1A1A2E]">Guests</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">How many people are staying?</p>
                  </div>
                  <button 
                    onClick={() => setIsOccupancyDropdownOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    {['Any', 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <div 
                        key={num}
                        className={`px-5 py-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all duration-200 border-2 ${
                          occupancy === num 
                            ? 'bg-primary/5 border-primary' 
                            : 'hover:bg-gray-50 border-transparent'
                        }`}
                        onClick={() => {
                          setOccupancy(num as any);
                          setIsOccupancyDropdownOpen(false);
                        }}
                      >
                        <span className={`text-base font-bold ${occupancy === num ? 'text-primary' : 'text-gray-700'}`}>
                          {num === 'Any' ? 'Any Occupancy' : `${num} Guest${typeof num === 'number' && num > 1 ? 's' : ''}`}
                        </span>
                        {occupancy === num && (
                          <Check className="w-5 h-5 text-primary" strokeWidth={3} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Trending Properties */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-xl md:text-4xl font-extrabold text-[#1A1A2E] tracking-tight">Trending Properties</h2>
            <p className="text-xs md:text-base text-gray-500 mt-1 md:mt-2 font-medium">Most viewed properties this week.</p>
          </div>
          <Link to="/stays" className="flex items-center gap-2 text-primary font-extrabold hover:gap-4 transition-all text-sm md:text-base">
            View All <Search className="w-4 h-4" />
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
      <section className="py-12 md:py-16 px-4 md:px-8 bg-surface-container-low border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-xl md:text-4xl font-extrabold text-[#1A1A2E] tracking-tight">New Listings</h2>
            <p className="text-xs md:text-base text-gray-500 mt-1 md:mt-2 font-medium">Fresh properties added recently.</p>
          </div>
          <Link to="/stays" className="flex items-center gap-2 text-primary font-extrabold hover:gap-4 transition-all text-sm md:text-base">
            View All <Search className="w-4 h-4" />
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
      <section className="py-12 md:py-16 px-4 md:px-8 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-xl md:text-4xl font-extrabold text-[#1A1A2E] tracking-tight">Top Properties</h2>
            <p className="text-xs md:text-base text-gray-500 mt-1 md:mt-2 font-medium">Highest rated and most reviewed.</p>
          </div>
          <div className="flex bg-[#F1F3F5] rounded-2xl p-1.5 w-full md:w-auto overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setTopFilter('ratings')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap ${topFilter === 'ratings' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              By Ratings
            </button>
            <button 
              onClick={() => setTopFilter('reviews')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap ${topFilter === 'reviews' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
      <section className="py-12 md:py-16 px-4 md:px-8 bg-surface-container-low border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-xl md:text-4xl font-extrabold text-[#1A1A2E] tracking-tight">Most Affordable</h2>
            <p className="text-xs md:text-base text-gray-500 mt-1 md:mt-2 font-medium">Great stays that fit your budget.</p>
          </div>
          <Link to="/stays" className="flex items-center gap-2 text-primary font-extrabold hover:gap-4 transition-all text-sm md:text-base">
            View All <Search className="w-4 h-4" />
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
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1A1A2E] tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-500 font-medium text-lg">Everything you need to know about Shelterbee.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-bold text-[#1A1A2E] text-lg">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-6 h-6 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-8 pb-6 text-gray-500 font-medium leading-relaxed"
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
