import React from 'react';
import { Calendar, Wifi, Dumbbell, Waves, Car, AirVent, ShieldCheck, Utensils, WashingMachine, Heart } from 'lucide-react';

interface FilterBarProps {
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: React.Dispatch<React.SetStateAction<{ from: Date | undefined; to: Date | undefined }>>;
  priceRange: number;
  setPriceRange: React.Dispatch<React.SetStateAction<number>>;
  maxPropertyPrice: number;
  depositRange: number;
  setDepositRange: React.Dispatch<React.SetStateAction<number>>;
  maxDeposit: number;
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
  depositRange,
  setDepositRange,
  maxDeposit,
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
  const toggleType = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Add dates';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toDateString = (date: Date | undefined) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (id: string) => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          (input as any).showPicker();
        } else {
          input.click();
        }
      } catch (err) {
        console.error("Error showing date picker:", err);
        input.click(); // Fallback to click
      }
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-white py-4 px-4 sm:px-8 shadow-sm border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#EBEBEB] p-4">
        
        {/* Wrapping Container */}
        <div className="flex flex-wrap items-center gap-y-4 gap-x-6 w-full">
          {/* Dates Section */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative group">
              <div 
                onClick={() => handleDateClick('check-in-input')}
                className="flex items-center gap-2 h-12 px-4 rounded-xl border border-gray-200 hover:border-amber-500 transition-all cursor-pointer bg-white shadow-sm group-hover:shadow-md"
              >
                <Calendar size={16} className="text-amber-600" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold leading-none mb-1">Check-in</span>
                  <span className="text-sm font-bold text-[#1A1A2E] leading-none">{formatDate(dateRange.from)}</span>
                </div>
              </div>
              <input 
                id="check-in-input"
                type="date" 
                min={toDateString(new Date())}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                value={toDateString(dateRange.from)}
                onChange={(e) => {
                  if (!e.target.value) {
                    setDateRange({ from: undefined, to: undefined });
                    return;
                  }
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  const fromDate = new Date(year, month - 1, day);
                  setDateRange({ ...dateRange, from: fromDate });
                }}
              />
            </div>

            <div className="relative group">
              <div 
                onClick={() => handleDateClick('check-out-input')}
                className="flex items-center gap-2 h-12 px-4 rounded-xl border border-gray-200 hover:border-amber-500 transition-all cursor-pointer bg-white shadow-sm group-hover:shadow-md"
              >
                <Calendar size={16} className="text-amber-600" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold leading-none mb-1">Check-out</span>
                  <span className="text-sm font-bold text-[#1A1A2E] leading-none">{formatDate(dateRange.to)}</span>
                </div>
              </div>
              <input 
                id="check-out-input"
                type="date" 
                min={dateRange.from ? toDateString(new Date(dateRange.from.getTime() + 86400000)) : toDateString(new Date())}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                value={toDateString(dateRange.to)}
                onChange={(e) => {
                  if (!e.target.value) {
                    setDateRange({ ...dateRange, to: undefined });
                    return;
                  }
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  const toDate = new Date(year, month - 1, day);
                  setDateRange({ ...dateRange, to: toDate });
                }}
              />
            </div>
          </div>

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

          {/* Max Deposit Slider */}
          <div className="flex flex-col justify-center w-48">
            <span className="text-[10px] uppercase tracking-widest text-[#8B6914] font-medium mb-1.5">Max Deposit: ₹{depositRange.toLocaleString()}</span>
            <input 
              type="range" 
              min="0" 
              max={maxDeposit} 
              step="1000"
              value={depositRange}
              onChange={(e) => setDepositRange(Number(e.target.value))}
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
    </div>
  );
}
