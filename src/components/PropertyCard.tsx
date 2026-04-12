import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface PropertyCardProps {
  property: any;
  featured?: boolean;
  topRated?: boolean;
  verified?: boolean;
  trending?: boolean;
  newLaunch?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, id: string) => void;
  key?: React.Key;
}

export default function PropertyCard({ 
  property, 
  featured, 
  topRated, 
  verified, 
  trending, 
  newLaunch,
  isFavorite = false,
  onToggleFavorite
}: PropertyCardProps) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/property/${property.id}`)}
      className="group bg-white rounded-2xl overflow-hidden border border-outline-variant/5 shadow-sm hover:shadow-xl hover:shadow-indigo-900/10 transition-all duration-500 flex flex-col cursor-pointer h-full"
    >
      <div className="relative h-48 overflow-hidden">
        <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={property.title} src={property.photos[0]} referrerPolicy="no-referrer" />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold text-on-secondary-fixed flex items-center gap-1 shadow-md">
          <span className="material-symbols-outlined text-amber-500 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          {property.rating || '4.8'} ({property.reviewCount || 0})
        </div>
        {(verified || featured) && (
          <div className="absolute bottom-3 left-3 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
            Verified
          </div>
        )}
        {(newLaunch || trending) && (
          <div className="absolute top-3 left-3 bg-primary-container text-on-primary-container text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
            New
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-on-secondary-fixed group-hover:text-primary transition-colors line-clamp-1">{property.title}</h3>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleFavorite) onToggleFavorite(e, property.id);
            }}
            className={`material-symbols-outlined cursor-pointer transition-colors text-lg ${isFavorite ? 'text-red-500' : 'text-on-surface-variant hover:text-red-500'}`}
            style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-medium mb-3">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <span className="line-clamp-1">{property.area}</span>
        </div>
        <div className="flex gap-3 mb-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Rent</span>
            <span className="text-base font-extrabold text-on-secondary-fixed">₹{property.pricePerDay}<small className="text-[10px] font-bold">/day</small></span>
          </div>
          <div className="w-px h-6 bg-surface-container-high self-center"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Type</span>
            <span className="text-base font-extrabold text-on-secondary-fixed">{property.type}</span>
          </div>
        </div>
        <div className="mt-auto pt-3 border-t border-surface-container-high flex justify-between items-center">
          <div className="flex -space-x-1.5">
            {property.amenities.slice(0, 3).map((amenity: string, i: number) => (
              <div key={i} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold ${i === 0 ? 'bg-gradient-to-br from-[#855300] to-[#F59E0B] text-white' : i === 1 ? 'bg-indigo-100 text-indigo-900' : 'bg-green-100 text-green-900'}`} title={amenity}>
                {amenity.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="px-3 py-1.5 bg-surface text-on-secondary-fixed font-bold text-xs rounded-lg border border-outline-variant/20 hover:bg-primary-container hover:text-on-primary-container transition-all">View Details</span>
        </div>
      </div>
    </div>
  );
}
