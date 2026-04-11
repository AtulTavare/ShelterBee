import { showToast } from '../utils/toast';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAreaInfo } from '../services/geminiService';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../contexts/AuthContext';
import { OTPModal, generateOTP, storeOTP, sendOTPEmail } from '../components/OTPModal';
import { doc, updateDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { reviewService, Review } from '../services/reviewService';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  
  const [property, setProperty] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [featureRatings, setFeatureRatings] = useState({
    cleanliness: 0,
    safety: 0,
    ownerBehavior: 0,
    comfort: 0
  });
  const [areaInfo, setAreaInfo] = useState<{text: string, grounding: any[]} | null>(null);
  const [loadingAreaInfo, setLoadingAreaInfo] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (property?.photos?.length) {
        setCurrentSlide((prev) => (prev + 1) % property.photos.length);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [property]);

  useEffect(() => {
    if (loading || !id) return;

    const fetchProperty = async () => {
      try {
        const prop = await propertyService.getPropertyById(id);
        if (prop) {
          // Append demo images from Unsplash
          const demoImages = [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600607687931-cecebd808ce3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80"
          ];
          
          const photos = prop.photos || [];
          const enhancedProp = {
            ...prop,
            photos: [...photos, ...demoImages.slice(0, Math.max(0, 5 - photos.length))]
          };
          
          setProperty(enhancedProp);
          
          // Fetch area info from Gemini
          if (prop.area) {
            setLoadingAreaInfo(true);
            getAreaInfo(prop.area).then(info => {
              if (info) setAreaInfo(info);
              setLoadingAreaInfo(false);
            });
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        navigate('/');
      }
    };

    fetchProperty();

    // Fetch reviews in realtime
    const reviewsQ = query(
      collection(db, 'reviews'),
      where('propertyId', '==', id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeReviews = onSnapshot(reviewsQ, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(fetchedReviews);

      if (fetchedReviews.length > 0) {
        const total = fetchedReviews.reduce((acc, rev) => acc + rev.rating, 0);
        setAverageRating(Number((total / fetchedReviews.length).toFixed(1)));

        const features = fetchedReviews.reduce((acc, rev) => {
          acc.cleanliness += rev.ratings.cleanliness;
          acc.safety += rev.ratings.safety;
          acc.ownerBehavior += rev.ratings.ownerBehavior;
          acc.comfort += rev.ratings.comfort;
          return acc;
        }, { cleanliness: 0, safety: 0, ownerBehavior: 0, comfort: 0 });

        setFeatureRatings({
          cleanliness: Number((features.cleanliness / fetchedReviews.length).toFixed(1)),
          safety: Number((features.safety / fetchedReviews.length).toFixed(1)),
          ownerBehavior: Number((features.ownerBehavior / fetchedReviews.length).toFixed(1)),
          comfort: Number((features.comfort / fetchedReviews.length).toFixed(1))
        });
      }
    });

    return () => unsubscribeReviews();
  }, [id, navigate, loading]);

  if (!property) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div 
      className="min-h-screen bg-[#FDFDFD] text-[#0F172A]"
      style={{
        '--color-primary': '#F59E0B',
        '--color-on-primary': '#FFFFFF',
        '--color-primary-container': '#FFF7ED',
        '--color-on-primary-container': '#7C2D12',
        '--color-secondary': '#1E1B4B',
        '--color-on-secondary': '#FFFFFF',
        '--color-surface': '#FFFFFF',
        '--color-on-surface': '#0F172A',
        '--color-surface-variant': '#F8FAFC',
        '--color-on-surface-variant': '#64748B',
        '--color-outline': '#E2E8F0',
        '--color-background': '#FDFDFD'
      } as React.CSSProperties}
    >
      <div className="pt-8 pb-20 px-4 md:px-6 max-w-7xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-[#64748B] hover:text-[#1E1B4B] font-bold transition-colors"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          Back to Listings
        </button>

        {/* Dynamic Hero Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-2 h-[350px] md:h-[450px] mb-8">
          <div className="md:col-span-7 rounded-3xl overflow-hidden group relative bg-slate-100">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                alt="Main Property View" 
                className="w-full h-full object-cover bento-img absolute inset-0" 
                src={property.photos?.[currentSlide] || 'https://picsum.photos/seed/placeholder/800/600'} 
                referrerPolicy="no-referrer" 
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
          </div>
          <div className="md:col-span-5 grid grid-cols-2 grid-rows-2 gap-2">
            <div className="rounded-3xl overflow-hidden group relative">
              <img alt="Interior 1" className="w-full h-full object-cover bento-img" src={property.photos?.[1] || 'https://picsum.photos/seed/placeholder1/400/300'} referrerPolicy="no-referrer" />
            </div>
            <div className="rounded-3xl overflow-hidden group relative">
              <img alt="Interior 2" className="w-full h-full object-cover bento-img" src={property.photos?.[2] || 'https://picsum.photos/seed/placeholder2/400/300'} referrerPolicy="no-referrer" />
            </div>
            <div className="rounded-3xl overflow-hidden group relative">
              <img alt="Interior 3" className="w-full h-full object-cover bento-img" src={property.photos?.[3] || 'https://picsum.photos/seed/placeholder3/400/300'} referrerPolicy="no-referrer" />
            </div>
            <div className="rounded-3xl overflow-hidden group relative">
              <img alt="Exterior" className="w-full h-full object-cover bento-img" src={property.photos?.[4] || 'https://picsum.photos/seed/placeholder4/400/300'} referrerPolicy="no-referrer" />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 space-y-10">
            {/* Premium Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-[#FFF7ED] text-[#F59E0B] text-[9px] font-extrabold uppercase tracking-widest border border-[#F59E0B]/20">Premium Verified</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-[#1E1B4B] text-[9px] font-extrabold uppercase tracking-widest border border-slate-200">Managed by Shelterbee</span>
              </div>
              <div className="space-y-1.5">
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">{property.title}</h1>
                <div className="flex items-center text-[#64748B] gap-1">
                  <span className="material-symbols-outlined text-lg text-[#F59E0B]">location_on</span>
                  <span className="text-base font-medium">{property.area}</span>
                </div>
              </div>
            </div>

            {/* Price Highlight Mobile */}
            <div className="lg:hidden p-6 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50">
              <div className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] mb-1">Per Day</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-[#1E1B4B] tracking-tighter">₹{property.pricePerDay}</span>
                <span className="text-base font-bold text-[#64748B]">/day</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest">Base Price</span>
                <span className="text-xs font-bold text-[#1E1B4B]">₹{property.pricePerDay}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#F59E0B] rounded-full"></div>
                <h2 className="text-xl font-extrabold text-[#1E1B4B]">Property Overview</h2>
              </div>
              <p className="text-[#64748B] leading-relaxed text-sm font-medium opacity-90 whitespace-pre-line">
                {property.description.replace(/[*_~`#!]/g, '').replace(/ +/g, ' ').trim()}
              </p>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#F59E0B] rounded-full"></div>
                <h2 className="text-xl font-extrabold text-[#1E1B4B]">Signature Amenities</h2>
                <div className="flex flex-wrap gap-[20px]">
                  {property.amenities.map((amenity: string, idx: number) => {
                    const lower = amenity.toLowerCase();
                    let icon = 'check_circle';
                    if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) icon = 'wifi';
                    else if (lower.includes('ac') || lower.includes('air conditioning') || lower.includes('a/c')) icon = 'ac_unit';
                    else if (lower.includes('pool') || lower.includes('swimming')) icon = 'pool';
                    else if (lower.includes('gym') || lower.includes('fitness')) icon = 'fitness_center';
                    else if (lower.includes('parking') || lower.includes('garage')) icon = 'local_parking';
                    else if (lower.includes('kitchen')) icon = 'kitchen';
                    else if (lower.includes('tv') || lower.includes('television')) icon = 'tv';
                    else if (lower.includes('washer') || lower.includes('laundry')) icon = 'local_laundry_service';
                    else if (lower.includes('security') || lower.includes('guard') || lower.includes('cctv')) icon = 'security';
                    else if (lower.includes('balcony') || lower.includes('patio')) icon = 'balcony';
                    else if (lower.includes('pet')) icon = 'pets';
                    else if (lower.includes('elevator') || lower.includes('lift')) icon = 'elevator';
                    else if (lower.includes('heating') || lower.includes('heater')) icon = 'hvac';
                    else if (lower.includes('workspace') || lower.includes('desk')) icon = 'desk';
                    else if (lower.includes('water') || lower.includes('purifier')) icon = 'water_drop';
                    else if (lower.includes('power') || lower.includes('backup')) icon = 'power';
                    else if (lower.includes('bed') || lower.includes('mattress')) icon = 'bed';
                    else if (lower.includes('food') || lower.includes('meal')) icon = 'restaurant';
                    else if (lower.includes('cleaning') || lower.includes('housekeeping')) icon = 'cleaning_services';

                    return (
                      <div key={amenity} className="flex items-center gap-2 text-[#1E1B4B]">
                        <span className="material-symbols-outlined text-[#F59E0B] text-xl">{icon}</span>
                        <span className="font-medium text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* House Rules */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#F59E0B] rounded-full"></div>
                <h2 className="text-xl font-extrabold text-[#1E1B4B]">House Guidelines</h2>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F59E0B]/5 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#F59E0B] text-lg">schedule</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-[#1E1B4B] text-xs uppercase tracking-wider">Check-in / Out</div>
                      <p className="text-xs text-[#64748B] font-medium">In: 12 PM | Out: 11 AM</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F59E0B]/5 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#F59E0B] text-lg">groups</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-[#1E1B4B] text-xs uppercase tracking-wider">Occupancy</div>
                      <p className="text-xs text-[#64748B] font-medium">Maximum 6 residents</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F59E0B]/5 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#F59E0B] text-lg">smoke_free</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-[#1E1B4B] text-xs uppercase tracking-wider">Smoking</div>
                      <p className="text-xs text-[#64748B] font-medium">Strictly prohibited</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F59E0B]/5 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#F59E0B] text-lg">pets</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-[#1E1B4B] text-xs uppercase tracking-wider">Pets</div>
                      <p className="text-xs text-[#64748B] font-medium">Case-by-case approval</p>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-slate-50">
                  <h3 className="font-extrabold text-[#1E1B4B] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">list_alt</span>
                    Mandatory Regulations
                  </h3>
                  <ul className="grid md:grid-cols-2 gap-4 text-sm font-medium text-[#64748B]">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5"></span>
                      Quiet hours: 10 PM - 7 AM
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5"></span>
                      No subletting permitted
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5"></span>
                      Valid ID proof required
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5"></span>
                      Structural changes restricted
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Area Info (Gemini Maps Grounding) */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#F59E0B] rounded-full"></div>
                <h2 className="text-xl font-extrabold text-[#1E1B4B]">About {property.area}</h2>
              </div>
              
              {loadingAreaInfo ? (
                <div className="animate-pulse flex space-x-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded"></div>
                    <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                  </div>
                </div>
              ) : areaInfo ? (
                <div className="bg-[#1E1B4B]/5 rounded-2xl p-6 border border-[#1E1B4B]/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#1E1B4B]/10 rounded-full blur-2xl -mr-8 -mt-8" />
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="bg-[#1E1B4B]/10 p-2 rounded-lg mt-1 shadow-sm">
                      <span className="material-symbols-outlined text-[#1E1B4B] text-xl">explore</span>
                    </div>
                    <div className="text-[#64748B] leading-relaxed text-sm font-medium">
                      {areaInfo.text}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[#64748B] italic bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-sm">No area information available at the moment.</p>
              )}
            </div>

            {/* Premium Locked Section */}
            {!isUnlocked && (
              <section className="mt-20">
                <div className="relative p-1 md:p-1.5 rounded-[3rem] indigo-gradient shadow-2xl overflow-hidden group">
                  {/* Abstract Glow */}
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#F59E0B]/20 blur-[120px] rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                  
                  <div className="relative bg-[#1E1B4B]/80 backdrop-blur-xl rounded-[2.8rem] p-10 md:p-16">
                    <div className="max-w-5xl mx-auto flex flex-col items-center gap-16 text-center">
                      <div className="space-y-8">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                          <span className="material-symbols-outlined text-[#F59E0B] text-xl">lock</span>
                          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Restricted Data</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">Owner Identity & <br/>Contact Information</h2>
                        <p className="text-xl text-white/60 leading-relaxed font-medium">
                          For the security and privacy of our hosts, direct contact details are locked. Unlock to get the owner's phone number, email, and exact apartment floor number.
                        </p>
                        <div className="flex items-center justify-center gap-6 pt-4">
                          <div className="flex -space-x-3">
                            <div className="w-12 h-12 rounded-full border-4 border-[#1E1B4B] bg-slate-300 ring-2 ring-[#F59E0B]/20"></div>
                            <div className="w-12 h-12 rounded-full border-4 border-[#1E1B4B] bg-slate-400 flex items-center justify-center text-xs font-bold text-white ring-2 ring-[#F59E0B]/20">VS</div>
                            <div className="w-12 h-12 rounded-full border-4 border-[#1E1B4B] bg-[#F59E0B] flex items-center justify-center text-xs font-black text-[#1E1B4B] ring-2 ring-[#F59E0B]/20">+100</div>
                          </div>
                          <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Joined by 124 users this month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Unlocked Content */}
            {isUnlocked && (
              <section className="mt-20">
                <div className="relative p-1 md:p-1.5 rounded-[3rem] bg-white shadow-2xl overflow-hidden border border-slate-100">
                  <div className="relative bg-white rounded-[2.8rem] p-10 md:p-16">
                    <div className="max-w-5xl mx-auto flex flex-col items-center gap-16 text-center">
                      <div className="space-y-8">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                          <span className="material-symbols-outlined text-[#F59E0B] text-xl">lock_open</span>
                          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F59E0B]">Unlocked Data</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-[#1E1B4B] leading-tight tracking-tight">Owner Identity & <br/>Contact Information</h2>
                        <div className="space-y-4">
                          <p className="text-sm text-[#64748B] font-bold uppercase tracking-wider mb-2">Exact Address</p>
                          <p className="text-[#1E1B4B] font-medium text-lg leading-relaxed">{property.address}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                          <a href="tel:+919876543210" className="flex items-center justify-center gap-2 bg-[#F59E0B] text-white hover:bg-[#F59E0B]/90 px-6 py-3 rounded-xl font-bold transition-colors shadow-md w-full sm:w-auto">
                            <span className="material-symbols-outlined">call</span>
                            Call Owner
                          </a>
                          <a 
                            href={`https://wa.me/919876543210?text=${encodeURIComponent(`hello ${property.ownerName || 'Sir'} sir, i just booked your ${property.title} with the ShelterBee. please let me know correct time to visit the property.`)}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md w-full sm:w-auto"
                          >
                            <span className="material-symbols-outlined">chat</span>
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Reviews & Ratings Section */}
            <section className="mt-20 border-t border-slate-200 pt-16">
              <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                  <h2 className="text-3xl font-extrabold text-[#1E1B4B] mb-4">Guest Reviews & Ratings</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[#F59E0B] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-4xl font-black text-[#1E1B4B]">{averageRating || '0.0'}</span>
                    </div>
                    <div className="text-[#64748B] font-medium">
                      Based on {reviews.length} verified reviews
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                  {/* Feature Ratings */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-[#1E1B4B] mb-6">Ratings by Feature</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                      {[
                        { label: "Cleanliness", score: featureRatings.cleanliness },
                        { label: "Safety & Security", score: featureRatings.safety },
                        { label: "Owner Behavior", score: featureRatings.ownerBehavior },
                        { label: "Comfort", score: featureRatings.comfort },
                      ].map((feature) => (
                        <div key={feature.label} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#64748B]">{feature.label}</span>
                          <div className="flex items-center gap-3 w-1/2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#1E1B4B] rounded-full" 
                                style={{ width: `${(feature.score / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-[#1E1B4B] w-6 text-right">{feature.score || '0.0'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.length === 0 ? (
                      <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-[#64748B]">No reviews yet for this property.</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-4">
                            <img 
                              src={review.visitorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.visitorName}&backgroundColor=b6e3f4`} 
                              alt={review.visitorName} 
                              className="w-12 h-12 rounded-full bg-slate-100" 
                              referrerPolicy="no-referrer" 
                            />
                            <div>
                              <h4 className="font-bold text-[#1E1B4B]">{review.visitorName}</h4>
                              <p className="text-xs text-[#64748B]">{review.date}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1">
                              <span className="text-sm font-bold text-[#1E1B4B]">{review.rating}</span>
                              <span className="material-symbols-outlined text-[#F59E0B] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            </div>
                          </div>
                          <p className="text-sm text-[#64748B] leading-relaxed">{review.text}</p>
                          {review.reply && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border-l-4 border-[#1E1B4B]">
                              <p className="text-xs font-bold text-[#1E1B4B] mb-1">Owner's Response:</p>
                              <p className="text-xs text-[#64748B] italic">{review.reply}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {reviews.length > 4 && (
                  <div className="mt-10 text-center">
                    <button className="px-6 py-3 rounded-xl border-2 border-[#1E1B4B] text-[#1E1B4B] font-bold hover:bg-[#1E1B4B] hover:text-white transition-colors">
                      Show all {reviews.length} reviews
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Pricing & Unlock */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Pricing Header */}
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/20">
                <div className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] mb-1">Per Day</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-[#1E1B4B] tracking-tighter">₹{property.pricePerDay}</span>
                  <span className="text-base font-bold text-[#64748B]">/day</span>
                </div>
              </div>

              {/* Sticky Unlock Card */}
              <div className="indigo-gradient rounded-2xl p-6 border border-white/5 shadow-xl space-y-6 overflow-hidden relative">
                {/* Subtle Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] uppercase font-black tracking-[0.2em] text-white/50">Price Details</span>
                    <div className="px-2.5 py-0.5 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                      <span className="text-[#F59E0B] font-black text-lg">₹{property.pricePerDay}/day</span>
                    </div>
                  </div>

                  {user ? (
                    <div className="space-y-4 mb-4">
                      <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
                        <div className="w-10 h-10 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[#F59E0B]">verified_user</span>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">Ready to Book</p>
                          <p className="text-white/60 text-xs">Complete the steps to unlock owner details.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/10 rounded-xl p-6 backdrop-blur-md border border-white/10 mb-4 text-center">
                      <span className="material-symbols-outlined text-[#F59E0B] text-4xl mb-2">lock</span>
                      <h4 className="text-white font-bold mb-2">Login to Book</h4>
                      <p className="text-white/70 text-xs mb-4">Please log in or register to select dates and unlock owner details.</p>
                    </div>
                  )}

                  <ul className="space-y-3 mb-5">
                    <li className="flex items-center gap-2 text-xs font-semibold text-white/90">
                      <div className="w-5 h-5 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#F59E0B] text-[12px] font-bold">check</span>
                      </div>
                      Direct Phone & WhatsApp
                    </li>
                    <li className="flex items-center gap-2 text-xs font-semibold text-white/90">
                      <div className="w-5 h-5 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#F59E0B] text-[12px] font-bold">check</span>
                      </div>
                      Schedule instant site visit
                    </li>
                    <li className="flex items-center gap-2 text-xs font-semibold text-white/90">
                      <div className="w-5 h-5 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#F59E0B] text-[12px] font-bold">check</span>
                      </div>
                      Verified Owner Contact
                    </li>
                  </ul>

                      <button 
                        onClick={() => {
                          if (!user) {
                            navigate('/auth?mode=login', { state: { returnTo: `/property/${id}` } });
                            return;
                          }
                          if (profile?.emailVerified === false) {
                            setShowVerificationPopup(true);
                            return;
                          }
                          if (profile?.role === 'owner') {
                            if (property.ownerId === user.uid) {
                              navigate('/profile?tab=favourites');
                            } else {
                              navigate('/list-property');
                            }
                            return;
                          }
                          navigate(`/book/${id}`);
                        }}
                        className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                          !user
                            ? 'bg-[#F59E0B] text-[#1E1B4B] shadow-lg shadow-[#F59E0B]/30 hover:bg-amber-400 active:scale-[0.98]'
                            : profile?.role === 'owner'
                              ? 'bg-[#F59E0B] text-[#1E1B4B] shadow-lg shadow-[#F59E0B]/30 hover:bg-amber-400 active:scale-[0.98]'
                              : isUnlocked 
                                ? 'bg-white/20 text-white/50 cursor-not-allowed'
                                : 'bg-[#F59E0B] text-[#1E1B4B] shadow-lg shadow-[#F59E0B]/30 hover:bg-amber-400 active:scale-[0.98]'
                        }`}
                        disabled={user && isUnlocked && profile?.role !== 'owner'}
                      >
                        {profile?.role === 'owner' 
                          ? (property.ownerId === user?.uid ? 'Edit Property' : 'List your own property')
                          : (isUnlocked ? 'Contact Unlocked' : 'Book Now')}
                      </button>

                  <div className="mt-4 flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md border border-white/10">
                      <span className="material-symbols-outlined text-[#F59E0B] text-[10px]">verified_user</span>
                      {/* Removed 100% Refundable Guarantee */}
                    </div>
                    <p className="text-[8px] text-white/40 text-center uppercase tracking-tighter">Secure Stripe Payment • Encrypted Data</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-20 border-t border-slate-200 pt-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-[#1E1B4B] mb-4">Frequently Asked Questions</h2>
              <p className="text-[#64748B]">Everything you need to know about booking and staying with Shelterbee.</p>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  q: "What is the platform fee for?",
                  a: "The platform fee is a one-time charge to unlock the direct contact details of the property owner and secure your booking intent. It also covers our verification process to ensure a safe transaction."
                },
                {
                  q: "Is the platform fee refundable?",
                  a: "Yes, the platform fee is 100% refundable if you visit the property and decide not to proceed with the rent/lease, or if the owner cancels the viewing."
                },
                {
                  q: "How do I contact the owner after paying?",
                  a: "Once the payment is successful, the owner's exact address, phone number, and a direct WhatsApp link will be instantly revealed on this page."
                },
                {
                  q: "Can I visit the property before paying the rent?",
                  a: "Absolutely! The booking process here is to secure a verified visit and direct contact. You only pay the actual rent to the owner after you have visited and approved the property."
                }
              ].map((faq) => (
                <div key={faq.q} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h4 className="text-lg font-bold text-[#1E1B4B] mb-2">{faq.q}</h4>
                  <p className="text-[#64748B] text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Verification Popup */}
      <AnimatePresence>
        {showVerificationPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowVerificationPopup(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl relative z-10 text-center border border-slate-100"
            >
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="material-symbols-outlined text-4xl">mark_email_unread</span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#1E1B4B] mb-4">Verification Required</h3>
              <p className="text-[#64748B] mb-8 text-sm leading-relaxed">
                Please verify your email before booking a property.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowVerificationPopup(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    setShowVerificationPopup(false);
                    if (user?.email) {
                      const otp = generateOTP();
                      storeOTP(otp, user.email);
                      await sendOTPEmail(user.email, otp);
                      setShowOTPModal(true);
                    }
                  }}
                  className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-[#1E1B4B] font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Verify Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <OTPModal 
        isOpen={showOTPModal} 
        onClose={() => setShowOTPModal(false)} 
        email={user?.email || ''} 
        onSuccess={async () => {
          if (user) {
            await updateDoc(doc(db, 'users', user.uid), {
              emailVerified: true
            });
            setShowOTPModal(false);
            showToast("Email verified successfully!", "success");
          }
        }} 
      />

    </div>
  );
}
