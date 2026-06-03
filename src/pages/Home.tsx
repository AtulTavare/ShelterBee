import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyService } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';
import { ChevronDown, ChevronUp, MapPin, Search, X, Check, Building, Users, VenusAndMars } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { showToast, showFavoriteToast } from '../utils/toast';
import { useReferralCode } from '../hooks/useReferralParam';

export default function Home() {
  const { user, profile, updateProfileData } = useAuth();
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [filterType, setFilterType] = useState('Any Type');
  const [occupancy, setOccupancy] = useState<number | 'Any'>('Any');
  const [selectedGender, setSelectedGender] = useState('Any');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isOccupancyDropdownOpen, setIsOccupancyDropdownOpen] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [properties, setProperties] = useState<any[]>([]);
  const navigate = useNavigate();
  const { referralUrl } = useReferralCode();
  const searchRef = useRef<HTMLDivElement>(null);

  const favorites = profile?.favorites || [];

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await propertyService.getApprovedProperties();
        setProperties(data);
        
        // Extract unique areas/locations from approved properties
        const areas = data.map((p: any) => p.area).filter(Boolean);
        // Remove duplicates case-insensitively
        const unique = [...new Set(
          areas.map((a: string) => a.toLowerCase())
        )].map(a => areas.find(
          (orig: string) => orig.toLowerCase() === a
        )) as string[];
        setAvailableLocations(unique);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsTypeDropdownOpen(false);
        setIsOccupancyDropdownOpen(false);
        setIsGenderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isTypeDropdownOpen || isOccupancyDropdownOpen || isGenderDropdownOpen || showSuggestions) {
      setSearchFocused(true);
    } else {
      setSearchFocused(false);
    }
  }, [isTypeDropdownOpen, isOccupancyDropdownOpen, isGenderDropdownOpen, showSuggestions]);

  useEffect(() => {
    document.title = 'Find Verified PGs, Rooms & Short Stay Flats in Maharashtra | ShelterBee';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Browse verified PGs, hostels, furnished rooms and rental properties across Pune, Mumbai, Nashik and Chh. Sambhajinagar. Book short or long term stays instantly on ShelterBee.');
    }
  }, []);


  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) {
      navigate(referralUrl('/login'));
      return;
    }

    const newFavorites = favorites.includes(id) 
      ? favorites.filter(fId => fId !== id) 
      : [...favorites, id];
    
    try {
      await updateProfileData({ favorites: newFavorites });
      if (!favorites.includes(id)) {
        showFavoriteToast(navigate);
      }
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
    const aRating = a.averageRating || a.rating || 0;
    const bRating = b.averageRating || b.rating || 0;
    return bRating - aRating;
  }).slice(0, 4);

  const getNewProperties = () => {
    return properties.filter(p => {
      const createdAt = p.createdAt instanceof Date ? p.createdAt : (p.createdAt?.toDate ? p.createdAt.toDate() : null);
      if (!createdAt) return false;
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).slice(0, 4);
  };
  
  const newPropsList = getNewProperties();

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
    { q: "Can I cancel my booking?", a: `Cancellation & Refund Policy:
- More than 24 hours before check-in: 75% refund
- Between 24 hours and 6 hours before check-in: 50% refund  
- Within 6 hours of check-in or after check-in: No refund
- No-show: Non-refundable
- Host cancellation: Full refund eligible
- Refunds processed in 5-10 business days
- Platform charges may be retained on cancellation` },
    { q: "When will I get full stays details?", a: "After booking confirmation. Location, contact information, name of owner shared before check-in." },
    { q: "How do I list my property?", a: "Click “Become host” → fill details → submit for approval" },
    { q: "When will my property go live?", a: "After admin verification. Usually within 24–48 hours." },
    { q: "Do I need to provide documents?", a: "Yes, ID proof and property proof required for verification and trust." }
  ];

  const handleLocationInput = (value: string) => {
    setLocationInput(value);
    if (value.length >= 1) {
      const filtered = availableLocations.filter(loc =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (location: string) => {
    setLocationInput(location);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (locationInput) params.set('areas', locationInput);
    if (filterType !== 'Any Type') params.set('type', filterType);
    if (occupancy !== 'Any') params.set('occupancy', occupancy.toString());
    if (selectedGender !== 'Any') params.set('gender', selectedGender);
    navigate(referralUrl(`/stays?${params.toString()}`));
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
        .suggestions-dropdown::-webkit-scrollbar { 
          display: none;
        }
        .suggestions-dropdown {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        @media (min-width: 1024px) {
          /* Navbar z-index handled centrally in Navbar.tsx */
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-end min-h-[100vh] px-4 md:px-8 pb-32 md:pb-40 overflow-hidden -mt-20 pt-24 md:pt-20">
        {/* Dark Overlay when search is focused */}
        <AnimatePresence>
          {searchFocused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[15] transition-all duration-300"
              onClick={() => {
                setShowSuggestions(false);
                setIsTypeDropdownOpen(false);
                setIsOccupancyDropdownOpen(false);
                setIsGenderDropdownOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* YouTube Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-black">
          <iframe
            src="https://www.youtube.com/embed/IZpTNq-mfNE?autoplay=1&loop=1&mute=1&controls=0&rel=0&playlist=IZpTNq-mfNE&modestbranding=1&playsinline=1&iv_load_policy=3&start=0&end=300"
            className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
          {/* Dim Overlay */}
          <div className="absolute inset-0 bg-black/60 z-10"></div>
        </div>

        <div 
          ref={searchRef}
          className="relative z-20 w-full max-w-5xl mx-auto flex flex-col items-center text-center"
          style={{
            transform: searchFocused ? 'translateY(-25vh)' : 'translateY(0)',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <h1 className="text-3xl md:text-6xl font-extrabold text-white tracking-tight mb-8 md:mb-8 leading-[1.1] drop-shadow-2xl">
            Find your perfect Stay
          </h1>
          
          {/* Search Bar (Pill Style) */}
          <div className="w-full max-w-2xl bg-white rounded-3xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center p-2 md:p-1.5 relative z-20 border border-gray-200 gap-1 md:gap-0">
            
            {/* Where Typeahead */}
            <div className="flex-[1.2] relative flex flex-col px-5 py-2 md:py-1.5 hover:bg-gray-100 rounded-2xl md:rounded-full transition-colors w-full text-left">
              <label className="text-[10px] md:text-[11px] font-extrabold text-gray-800 tracking-wide uppercase flex items-center gap-1"><MapPin size={14} className="text-gray-500" />Where</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => handleLocationInput(e.target.value)}
                  onFocus={() => {
                    if (locationInput.length >= 1) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Search destinations"
                  className="w-full text-sm mt-0.5 bg-transparent border-none focus:ring-0 focus:outline-none outline-none p-0 text-gray-600 font-medium placeholder-gray-400 truncate pr-6"
                />
                
                {locationInput && (
                  <button
                    onClick={() => {
                      setLocationInput('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="suggestions-dropdown absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] max-h-[200px] overflow-y-auto mt-1 p-2"
                  >
                    {suggestions.length > 0 ? (
                      suggestions.map((location, index) => (
                        <div
                          key={index}
                          onMouseDown={() => handleSelectSuggestion(location)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-xl border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <MapPin size={16} />
                          </div>
                          <span className="text-sm font-bold text-gray-800">
                            {(() => {
                              const index = location.toLowerCase().indexOf(locationInput.toLowerCase());
                              if (index === -1) return location;
                              const before = location.substring(0, index);
                              const match = location.substring(index, index + locationInput.length);
                              const after = location.substring(index + locationInput.length);
                              return (
                                <>
                                  {before}
                                  <span className="text-primary">{match}</span>
                                  {after}
                                </>
                              );
                            })()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-sm text-gray-400 text-center font-medium italic">
                        No locations found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-6 w-px bg-gray-300 hidden md:block mx-1"></div>

            <div className="flex w-full md:w-auto gap-1">
              {/* Type */}
              <div 
                className="flex-[0.8] md:w-28 flex flex-col px-4 py-2 md:py-1.5 hover:bg-gray-100 rounded-2xl md:rounded-full cursor-pointer transition-colors text-left relative"
                onClick={() => setIsTypeDropdownOpen(true)}
              >
                <div className="text-[10px] md:text-[11px] font-extrabold text-gray-800 tracking-wide uppercase flex items-center gap-1"><Building size={14} className="text-gray-500" />Type</div>
                <div className={`text-sm mt-0.5 truncate ${filterType === 'Any Type' ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                  {filterType === 'Any Type' ? 'Any' : filterType}
                </div>
              </div>

              <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

              {/* Occupancy */}
              <div 
                className="flex-[0.8] md:w-28 flex flex-col px-4 py-2 md:py-1.5 hover:bg-gray-100 rounded-2xl md:rounded-full cursor-pointer transition-colors text-left relative"
                onClick={() => setIsOccupancyDropdownOpen(true)}
              >
                <div className="text-[10px] md:text-[11px] font-extrabold text-gray-800 tracking-wide uppercase flex items-center gap-1"><Users size={14} className="text-gray-500" />Guests</div>
                <div className={`text-sm mt-0.5 truncate ${occupancy === 'Any' ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                  {occupancy === 'Any' ? 'Any' : `${occupancy} Guests`}
                </div>
              </div>

              <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

              {/* Gender */}
              <div 
                className="flex-[0.8] md:w-28 flex flex-col px-4 py-2 md:py-1.5 hover:bg-gray-100 rounded-2xl md:rounded-full cursor-pointer transition-colors text-left relative"
                onClick={() => setIsGenderDropdownOpen(true)}
              >
                <div className="text-[10px] md:text-[11px] font-extrabold text-gray-800 tracking-wide uppercase flex items-center gap-1"><VenusAndMars size={14} className="text-gray-500" />Gender</div>
                <div className={`text-sm mt-0.5 truncate ${selectedGender === 'Any' ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>
                  {selectedGender === 'Any' ? 'Any' : selectedGender}
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button 
              onClick={handleSearch}
              className="w-full md:w-12 h-12 rounded-2xl md:rounded-full bg-[#F59E0B] text-[#1A1A2E] flex items-center justify-center hover:bg-[#F59E0B]/90 transition-transform active:scale-95 flex-shrink-0 shadow-md gap-2 md:gap-0"
            >
              <span className="md:hidden font-bold text-sm">Search Stays</span>
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>


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

        {/* Gender Popup Modal */}
        <AnimatePresence>
          {isGenderDropdownOpen && (
            <div className="modal-overlay p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 shadow-2xl backdrop-blur-md"
                onClick={() => setIsGenderDropdownOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="modal-content relative bg-white rounded-[32px] w-full max-w-sm flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#1A1A2E]">Gender</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Filter by gender preference</p>
                  </div>
                  <button 
                    onClick={() => setIsGenderDropdownOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="space-y-1">
                    {[
                      { label: 'Any', value: 'Any' },
                      { label: 'Male ♂️', value: 'Male' },
                      { label: 'Female ♀️', value: 'Female' },
                      { label: 'Other ⚧️', value: 'Other' }
                    ].map((gender) => (
                      <div 
                        key={gender.value}
                        className={`px-5 py-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all duration-200 border-2 ${
                          selectedGender === gender.value 
                            ? 'bg-primary/5 border-primary' 
                            : 'hover:bg-gray-50 border-transparent'
                        }`}
                        onClick={() => {
                          setSelectedGender(gender.value);
                          setIsGenderDropdownOpen(false);
                        }}
                      >
                        <span className={`text-base font-bold ${selectedGender === gender.value ? 'text-primary' : 'text-gray-700'}`}>
                          {gender.label}
                        </span>
                        {selectedGender === gender.value && (
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
      <section className="py-16 md:py-20 px-4 md:px-8 bg-[#F9F9F9]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest border border-amber-200/50 mb-3">Trending Now</span>
              <h2 className="text-2xl md:text-4xl font-black text-[#1A1A2E] tracking-tight">Trending Properties</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Most viewed properties this week.</p>
            </div>
            <Link to={referralUrl('/stays')} className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-slate-100 text-[#1E1B4B] font-black text-xs uppercase tracking-widest hover:bg-[#1E1B4B] hover:text-white transition-all shadow-sm">
              View All <Search className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </section>

      {/* New Listings */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-200/50 mb-3">Just Added</span>
              <h2 className="text-2xl md:text-4xl font-black text-[#1A1A2E] tracking-tight">New Listings</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Fresh properties added recently.</p>
            </div>
            <Link to={referralUrl('/stays?filter=new_last_30_days')} className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-slate-100 text-[#1E1B4B] font-black text-xs uppercase tracking-widest hover:bg-[#1E1B4B] hover:text-white transition-all shadow-sm">
              View All <Search className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newPropsList.map((property, index) => (
              <PropertyCard 
                key={`new-${property.id}-${index}`} 
                property={property} 
                isFavorite={favorites.includes(property.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
            {newPropsList.length === 0 && (
              <p className="text-slate-500 col-span-full text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">No new listings in the last 30 days.</p>
            )}
          </div>
        </div>
      </section>

      {/* Top Properties */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-[#F9F9F9]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest border border-indigo-200/50 mb-3">Top Rated</span>
              <h2 className="text-2xl md:text-4xl font-black text-[#1A1A2E] tracking-tight">Top Properties</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Highest rated stays.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </section>

      {/* Banner Ad */}
      <section className="py-8 md:py-12 px-4 md:px-8 bg-[#F9F9F9]">
        <div className="max-w-7xl mx-auto">
          <img
            src="https://res.cloudinary.com/dtnsxrc2c/image/upload/v1780394832/booking_ad_kc9aba.png"
            alt="Book your stay"
            className="w-full h-auto object-contain rounded-2xl"
          />
        </div>
      </section>

      {/* Most Affordable Properties */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest border border-amber-200/50 mb-3">Budget Friendly</span>
              <h2 className="text-2xl md:text-4xl font-black text-[#1A1A2E] tracking-tight">Most Affordable</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Great stays that fit your budget.</p>
            </div>
            <Link to={referralUrl('/stays?sort=price_asc')} className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-slate-100 text-[#1E1B4B] font-black text-xs uppercase tracking-widest hover:bg-[#1E1B4B] hover:text-white transition-all shadow-sm">
              View All <Search className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </section>



      {/* FAQs Section */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest border border-indigo-200/50 mb-4">Got Questions?</span>
            <h2 className="text-2xl md:text-4xl font-black text-[#1A1A2E] tracking-tight mb-3">Frequently Asked Questions</h2>
            <p className="text-sm md:text-base text-slate-500 font-medium">Everything you need to know about ShelterBee.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-sm transition-shadow">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${openFaq === index ? 'bg-[#1E1B4B] text-white' : 'bg-slate-200 text-slate-500'}`}>{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-black text-[#1A1A2E]">{faq.q}</span>
                  </div>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-[#1E1B4B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5 pl-16 text-sm text-slate-500 font-medium leading-relaxed whitespace-pre-line"
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
