import React, { useState } from 'react';
import { Calendar, Wifi, Dumbbell, Waves, Car, AirVent, ShieldCheck, Utensils, WashingMachine, Heart, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-day-picker/dist/style.css';

interface FilterBarProps {
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: React.Dispatch<React.SetStateAction<{ from: Date | undefined; to: Date | undefined }>>;
  priceRange: number;
  setPriceRange: React.Dispatch<React.SetStateAction<number>>;
  maxPropertyPrice: number;
  selectedTypes: string[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedAmenities: string[];
  setSelectedAmenities: React.Dispatch<React.SetStateAction<string[]>>;
  occupancy: number | 'Any';
  setOccupancy: React.Dispatch<React.SetStateAction<number | 'Any'>>;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;
  onClearAll: () => void;
}

const allTypes = ['Full Flat', 'PG', 'Room', 'Hostel'];
const allAmenities = [
  { name: 'Wi-Fi', icon: Wifi },
  { name: 'Gym', icon: Dumbbell },
  { name: 'Pool', icon: Waves },
  { name: 'Parking', icon: Car },
  { name: 'AC', icon: AirVent },
  { name: 'Security', icon: ShieldCheck },
  { name: 'Meals Included', icon: Utensils },
  { name: 'Laundry', icon: WashingMachine },
];

export default function FilterBar({
  dateRange,
  setDateRange,
  priceRange,
  setPriceRange,
  maxPropertyPrice,
  selectedTypes,
  setSelectedTypes,
  selectedAmenities,
  setSelectedAmenities,
  occupancy,
  setOccupancy,
  showFavoritesOnly,
  setShowFavoritesOnly,
  onClearAll
}: FilterBarProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Add date';
    return format(date, 'MMM d');
  };

  return (
    <div className="sticky top-[64px] md:top-[80px] z-40 w-full bg-white py-4 px-4 sm:px-8 shadow-sm border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#EBEBEB] p-4">
        
        {/* Mobile Filter Trigger */}
        <div className="md:hidden flex items-center justify-between w-full">
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#6B4F1E] text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-900/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            Apply Filters
          </button>
          <button 
            onClick={onClearAll}
            className="text-xs font-bold text-[#8B6914] hover:underline"
          >
            Clear All
          </button>
        </div>

        {/* Desktop Filter Container */}
        <div className="hidden md:flex flex-nowrap md:flex-wrap items-center gap-y-4 gap-x-4 md:gap-x-6 w-full overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
          {/* Dates Section */}
          <div className="flex shrink-0 items-center gap-2">
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="flex items-center gap-3 h-12 px-5 rounded-xl border border-gray-200 hover:border-amber-500 transition-all cursor-pointer bg-white shadow-sm hover:shadow-md"
            >
              <Calendar size={18} className="text-amber-600" />
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold leading-none mb-1">Check-in</span>
                  <span className="text-sm font-bold text-[#1A1A2E] leading-none">{formatDate(dateRange.from)}</span>
                </div>
                <div className="w-px h-6 bg-gray-200"></div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold leading-none mb-1">Check-out</span>
                  <span className="text-sm font-bold text-[#1A1A2E] leading-none">{formatDate(dateRange.to)}</span>
                </div>
              </div>
            </button>
          </div>

          <AnimatePresence>
            {isCalendarOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => setIsCalendarOpen(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-white rounded-3xl shadow-2xl p-6 z-10 max-w-md w-full"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Select Dates</h3>
                    <button 
                      onClick={() => setIsCalendarOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="flex justify-center mb-6 bg-gray-50 rounded-2xl p-4">
                    <DayPicker
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        if (range) {
                          setDateRange({ from: range.from, to: range.to });
                        } else {
                          setDateRange({ from: undefined, to: undefined });
                        }
                      }}
                      disabled={{ before: new Date() }}
                      className="border-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined });
                        setIsCalendarOpen(false);
                      }}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={() => setIsCalendarOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="hidden md:block w-px h-8 bg-[#EBEBEB]"></div>

          {/* Max Rent Slider */}
          <div className="flex flex-col justify-center w-48">
            <span className="text-[10px] uppercase tracking-widest text-[#8B6914] font-medium mb-1.5">Max Rent: ₹{priceRange.toLocaleString()}</span>
            <input 
              type="range" 
              min="0" 
              max={maxPropertyPrice} 
              step="500"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full h-1 bg-[#EBEBEB] rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: '#8B6914',
              }}
            />
          </div>

          <div className="hidden md:block w-px h-8 bg-[#EBEBEB]"></div>

          {/* Occupancy */}
          <div className="flex flex-col justify-center w-32">
            <span className="text-[10px] uppercase tracking-widest text-[#8B6914] font-medium mb-1.5">Guests: {occupancy === 'Any' ? 'Any' : occupancy}</span>
            <select 
              value={occupancy}
              onChange={(e) => setOccupancy(e.target.value === 'Any' ? 'Any' : Number(e.target.value))}
              className="h-9 px-3 rounded-xl border border-[#D4C5A9] text-sm font-bold bg-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-[#1A1A2E]"
            >
              <option value="Any">Any</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} Guests</option>
              ))}
            </select>
          </div>

          <div className="hidden md:block w-px h-8 bg-[#EBEBEB]"></div>

          {/* Property Types */}
          <div className="flex flex-wrap items-center gap-2">
            {allTypes.map(type => {
              const isSelected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`h-9 px-4 rounded-full text-sm font-semibold transition-colors border flex items-center justify-center whitespace-nowrap
                    ${isSelected 
                      ? 'bg-[#6B4F1E] text-white border-[#6B4F1E]' 
                      : 'bg-white text-[#222222] border-[#D4C5A9] hover:bg-[#F5EFE6]'
                    }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          <div className="hidden md:block w-px h-8 bg-[#EBEBEB]"></div>

          {/* Amenities */}
          <div className="flex flex-wrap items-center gap-2">
            {allAmenities.map(amenity => {
              const isSelected = selectedAmenities.includes(amenity.name);
              const Icon = amenity.icon;
              return (
                <button
                  key={amenity.name}
                  onClick={() => toggleAmenity(amenity.name)}
                  className={`h-9 px-4 rounded-full text-sm font-semibold transition-colors border flex items-center justify-center gap-2 whitespace-nowrap
                    ${isSelected 
                      ? 'bg-[#6B4F1E] text-white border-[#6B4F1E]' 
                      : 'bg-white text-[#222222] border-[#D4C5A9] hover:bg-[#F5EFE6]'
                    }`}
                >
                  <Icon size={14} className={isSelected ? 'text-white' : 'text-[#6B4F1E]'} />
                  {amenity.name}
                </button>
              );
            })}
          </div>

          <div className="hidden md:block w-px h-8 bg-[#EBEBEB]"></div>

          {/* Favorites Toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`h-9 px-4 rounded-full text-sm font-semibold transition-colors border flex items-center justify-center gap-2 whitespace-nowrap
              ${showFavoritesOnly 
                ? 'bg-[#6B4F1E] text-white border-[#6B4F1E]' 
                : 'bg-white text-[#222222] border-[#D4C5A9] hover:bg-[#F5EFE6]'
              }`}
          >
            <Heart size={14} className={showFavoritesOnly ? 'fill-white text-white' : 'text-[#6B4F1E]'} />
            Favorites
          </button>

          {/* Clear All */}
          <button 
            onClick={onClearAll}
            className="text-sm font-semibold text-[#8B6914] hover:underline whitespace-nowrap ml-auto"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white w-full max-h-[90vh] rounded-t-[2.5rem] shadow-2xl z-10 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-extrabold text-[#1A1A2E]">Filters</h3>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Dates Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Dates</h4>
                  <button 
                    onClick={() => {
                      setIsMobileFilterOpen(false);
                      setIsCalendarOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50/50"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar size={20} className="text-amber-600" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-[#1A1A2E]">
                          {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Check-in & Check-out</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">edit_calendar</span>
                  </button>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Maximum Rent</h4>
                    <span className="text-lg font-black text-[#8B6914]">₹{priceRange.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={maxPropertyPrice} 
                    step="500"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#8B6914]"
                  />
                </div>

                {/* Occupancy */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Guests / Occupancy</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setOccupancy('Any')}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all ${occupancy === 'Any' ? 'bg-[#6B4F1E] text-white border-[#6B4F1E]' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                      Any
                    </button>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <button 
                        key={num}
                        onClick={() => setOccupancy(num)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all ${occupancy === num ? 'bg-[#6B4F1E] text-white border-[#6B4F1E]' : 'bg-white text-gray-600 border-gray-200'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Types */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Property Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {allTypes.map(type => {
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border
                            ${isSelected 
                              ? 'bg-[#6B4F1E] text-white border-[#6B4F1E]' 
                              : 'bg-white text-gray-600 border-gray-200'
                            }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amenities</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {allAmenities.map(amenity => {
                      const isSelected = selectedAmenities.includes(amenity.name);
                      const Icon = amenity.icon;
                      return (
                        <button
                          key={amenity.name}
                          onClick={() => toggleAmenity(amenity.name)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold transition-all
                            ${isSelected 
                              ? 'bg-[#6B4F1E] text-white border-[#6B4F1E]' 
                              : 'bg-white text-gray-600 border-gray-200'
                            }`}
                        >
                          <Icon size={18} className={isSelected ? 'text-white' : 'text-[#6B4F1E]'} />
                          {amenity.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Favorites */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Other</h4>
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all
                      ${showFavoritesOnly 
                        ? 'bg-[#6B4F1E] text-white border-[#6B4F1E]' 
                        : 'bg-white text-gray-600 border-gray-200'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Heart size={20} className={showFavoritesOnly ? 'fill-white text-white' : 'text-[#6B4F1E]'} />
                      <span>Show Favorites Only</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${showFavoritesOnly ? 'bg-white/20' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showFavoritesOnly ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4 shrink-0">
                <button 
                  onClick={() => {
                    onClearAll();
                    setIsMobileFilterOpen(false);
                  }}
                  className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-white transition-all"
                >
                  Reset All
                </button>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-[2] py-4 rounded-2xl bg-[#6B4F1E] text-white font-bold shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
