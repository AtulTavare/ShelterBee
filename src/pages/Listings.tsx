import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyService } from '../services/propertyService';
import PropertyCard from '../components/PropertyCard';
import FilterBar from '../components/FilterBar';

const getAmenityIcon = (amenity: string) => {
  const lower = amenity.toLowerCase();
  if (lower.includes('wifi') || lower.includes('wi-fi')) return 'wifi';
  if (lower.includes('ac') || lower.includes('air condition')) return 'ac_unit';
  if (lower.includes('pool')) return 'pool';
  if (lower.includes('gym') || lower.includes('fitness')) return 'fitness_center';
  if (lower.includes('park')) return 'local_parking';
  if (lower.includes('secur')) return 'security';
  if (lower.includes('meal') || lower.includes('food')) return 'restaurant';
  if (lower.includes('laundr') || lower.includes('wash')) return 'local_laundry_service';
  if (lower.includes('furnish')) return 'chair';
  if (lower.includes('power') || lower.includes('backup')) return 'battery_charging_full';
  return 'check_circle';
};

export default function Listings() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await propertyService.getApprovedProperties();
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const maxPropertyPrice = useMemo(() => properties.length > 0 ? Math.max(...properties.map(p => p.pricePerDay || 0), 50000) : 50000, [properties]);
  const maxDepositPrice = useMemo(() => properties.length > 0 ? Math.max(...properties.map(p => p.deposit || 0), 150000) : 150000, [properties]);
  
  const [priceRange, setPriceRange] = useState<number>(50000);
  const [depositRange, setDepositRange] = useState<number>(150000);

  useEffect(() => {
    if (properties.length > 0) {
      setPriceRange(maxPropertyPrice);
      setDepositRange(maxDepositPrice);
    }
  }, [maxPropertyPrice, maxDepositPrice, properties.length]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState('Highest Rated');

  const [favorites, setFavorites] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(4);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Slideshow State
  const topProperties = useMemo(() => properties.filter(p => p.rating && p.rating >= 4.5).slice(0, 5), [properties]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (topProperties.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % topProperties.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [topProperties.length]);

  const allAmenities = ['Wi-Fi', 'Gym', 'Pool', 'Parking', 'AC', 'Security', 'Meals Included', 'Laundry'];
  const allTypes = ['Full Flat', 'PG', 'Room', 'Hostel'];
  const allAreas = useMemo(() => Array.from(new Set(properties.map(p => p.area).filter(Boolean))), [properties]);

  const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  useEffect(() => {
    let filtered = properties.filter(p => {
      if (showFavoritesOnly && !favorites.includes(p.id)) return false;
      if (priceRange < maxPropertyPrice && (p.pricePerDay || 0) > priceRange) return false;
      if (depositRange < maxDepositPrice && (p.deposit || 0) > depositRange) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) return false;
      if (selectedAreas.length > 0 && !selectedAreas.includes(p.area)) return false;
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every(a => p.amenities && p.amenities.includes(a));
        if (!hasAllAmenities) return false;
      }
      if (dateRange.from) {
        const availableDate = p.availableFrom ? new Date(p.availableFrom) : (p.createdAt?.toDate ? p.createdAt.toDate() : new Date());
        // If the property is available after the requested check-in date, filter it out
        if (availableDate > dateRange.from) return false;
      }
      return true;
    });

    if (sortBy === 'Highest Rated') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'Price: Low to High') {
      filtered.sort((a, b) => (a.pricePerDay || 0) - (b.pricePerDay || 0));
    } else if (sortBy === 'Newest First') {
      filtered.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
        return timeB - timeA;
      });
    }

    setFilteredProperties(filtered);
    setVisibleCount(4);
  }, [properties, priceRange, depositRange, selectedAmenities, selectedTypes, selectedAreas, dateRange, sortBy, showFavoritesOnly, favorites, maxPropertyPrice, maxDepositPrice]);

  return (
    <div className="bg-surface text-on-surface min-h-screen font-sans">
      {/* Main Content */}
      <main className="pt-0">
        {/* Hero Slideshow */}
        <section className="relative h-screen w-full overflow-hidden mb-12">
          <div className="relative h-full w-full overflow-hidden group bg-black">
            <AnimatePresence mode="wait">
              {topProperties.length > 0 && (
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <motion.img 
                    className="absolute inset-0 w-full h-full object-cover opacity-80" 
                    alt={topProperties[currentSlide].title} 
                    src={topProperties[currentSlide].photos[0]}
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.05 }}
                    transition={{ duration: 5, ease: "linear" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-on-secondary-fixed/90 via-on-secondary-fixed/40 to-transparent"></div>
                  <div className="relative h-full flex flex-col justify-center px-16 max-w-4xl">
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                    >
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        Featured Listing
                      </span>
                      <h1 className="text-6xl font-extrabold text-white leading-tight tracking-tight mb-4">
                        {topProperties[currentSlide].title}
                      </h1>
                      <p className="text-xl text-white/80 max-w-xl mb-8 leading-relaxed">
                        {topProperties[currentSlide].description}
                      </p>
                      <div className="flex gap-4">
                        <Link to={`/property/${topProperties[currentSlide].id}`} className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 shadow-2xl active:scale-95 transition-all">
                          View Details
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Navigation Indicators */}
            <div className="absolute bottom-10 left-16 flex gap-3 z-10">
              {topProperties.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className="relative h-1.5 rounded-full overflow-hidden transition-all bg-white/30"
                  style={{ width: idx === currentSlide ? '48px' : '48px' }}
                >
                  {idx === currentSlide && (
                    <motion.div 
                      className="absolute top-0 left-0 bottom-0 bg-primary-container"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Top Filters Section */}
        <FilterBar
          dateRange={dateRange}
          setDateRange={setDateRange}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          maxPropertyPrice={maxPropertyPrice}
          depositRange={depositRange}
          setDepositRange={setDepositRange}
          maxDeposit={maxDepositPrice}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          selectedAmenities={selectedAmenities}
          setSelectedAmenities={setSelectedAmenities}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
          onClearAll={() => {
            setPriceRange(maxPropertyPrice);
            setDepositRange(maxDepositPrice);
            setSelectedAmenities([]);
            setSelectedTypes([]);
            setSelectedAreas([]);
            setDateRange({ from: undefined, to: undefined });
            setShowFavoritesOnly(false);
          }}
        />

        {/* Discovery Grid */}
        <div className="px-8 pb-24 max-w-7xl mx-auto mt-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <section className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-on-secondary-fixed tracking-tight">Top Stays for You</h2>
                  <p className="text-on-surface-variant font-medium">Showing {filteredProperties.length} results matching your criteria</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-outline-variant/10">
                  <span className="text-sm font-bold text-on-surface-variant">Sort by:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border-none text-sm font-bold focus:ring-0 cursor-pointer p-0 pr-8 bg-transparent"
                  >
                    <option>Highest Rated</option>
                    <option>Price: Low to High</option>
                    <option>Newest First</option>
                  </select>
                </div>
              </div>
              {/* Cards Grid */}
              {filteredProperties.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-16 text-center flex flex-col items-center justify-center border border-outline-variant/10 shadow-sm">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-primary">search_off</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-on-secondary-fixed mb-4 tracking-tight">No properties found</h3>
                  <p className="text-on-surface-variant max-w-md mb-8">We couldn't find any properties matching your current filters. Try adjusting your criteria.</p>
                  <button 
                    onClick={() => {
                      setPriceRange(maxPropertyPrice);
                      setDepositRange(maxDepositPrice);
                      setSelectedAmenities([]);
                      setSelectedTypes([]);
                      setSelectedAreas([]);
                      setDateRange({ from: undefined, to: undefined });
                      setShowFavoritesOnly(false);
                    }}
                    className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProperties.slice(0, visibleCount).map((property, index) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      featured={index === 0}
                      newLaunch={index === 2}
                      isFavorite={favorites.includes(property.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}
              {/* View More CTA */}
              {filteredProperties.length > visibleCount && (
                <div className="flex justify-center py-12">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 4)}
                    className="group flex flex-col items-center gap-4 hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-primary-container group-hover:bg-primary group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-3xl">expand_more</span>
                    </div>
                    <span className="text-sm font-bold text-on-secondary-fixed uppercase tracking-widest">Load More Discoveries</span>
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
