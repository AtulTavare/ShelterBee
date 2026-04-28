import { showToast } from '../utils/toast';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../contexts/AuthContext';
import { OTPModal, generateOTP, storeOTP, sendOTPEmail } from '../components/OTPModal';
import { doc, updateDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { reviewService, Review } from '../services/reviewService';
import { Users, Bed } from 'lucide-react';

import { getAvatarUrl } from '../utils/avatar';
import { auth } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const AMENITIES_LIST = ['WiFi', 'AC', 'TV', 'Geyser', 'Washing Machine', 'Fridge', 'Kitchen Access', 'Power Backup', 'Lift', 'Security', 'Parking', 'Gym', 'Swimming Pool', 'Housekeeping', 'Meals Provided'];

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

    const fetchProperty = async (retryCounter = 1) => {
      try {
        const prop = await propertyService.getPropertyById(id);
        if (prop) {
          setProperty(prop);
        } else {
          showToast("Property not found", "error");
          navigate('/');
        }
      } catch (error: any) {
        console.error('Property load error:', error);
        if (retryCounter > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProperty(retryCounter - 1);
        }
        showToast(error.message || "Failed to load property details", "error");
        navigate('/');
      }
    };

    fetchProperty();

    // Fetch reviews in realtime
    const reviewsQ = query(
      collection(db, 'reviews'),
      where('propertyId', '==', id)
    );

    const unsubscribeReviews = onSnapshot(reviewsQ, (snapshot) => {
      const fetchedReviews = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Review))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reviews');
    });

    return () => unsubscribeReviews();
  }, [id, navigate, loading]);

  useEffect(() => {
    if (property) {
      document.title = `${property.title} - ${property.area} | ShelterBee`
    }
  }, [property])

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
        <section className="grid grid-cols-1 md:grid-cols-12 gap-[6px] h-[260px] md:h-[480px] mb-6 overflow-hidden relative z-0">
          <div className="md:col-span-7 rounded-[12px] overflow-hidden group relative bg-slate-100 h-full">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                alt="Main Property View" 
                className="w-full h-full object-cover absolute inset-0" 
                src={property.photos?.[currentSlide] || 'https://picsum.photos/seed/placeholder/800/600'} 
                referrerPolicy="no-referrer" 
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
            
            {/* Mobile Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 md:hidden">
              {property.photos?.map((_: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${currentSlide === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </div>
          <div className="hidden md:grid md:col-span-5 grid-cols-2 grid-rows-2 gap-[6px] h-full">
            <div className="overflow-hidden group relative">
              <img alt="Interior 1" className="w-full h-full object-cover rounded-tr-[12px]" src={property.photos?.[1] || 'https://picsum.photos/seed/placeholder1/400/300'} referrerPolicy="no-referrer" />
            </div>
            <div className="overflow-hidden group relative">
              <img alt="Interior 2" className="w-full h-full object-cover" src={property.photos?.[2] || 'https://picsum.photos/seed/placeholder2/400/300'} referrerPolicy="no-referrer" />
            </div>
            <div className="overflow-hidden group relative">
              <img alt="Interior 3" className="w-full h-full object-cover" src={property.photos?.[3] || 'https://picsum.photos/seed/placeholder3/400/300'} referrerPolicy="no-referrer" />
            </div>
            <div className="overflow-hidden group relative">
              <img alt="Exterior" className="w-full h-full object-cover rounded-br-[12px]" src={property.photos?.[4] || 'https://picsum.photos/seed/placeholder4/400/300'} referrerPolicy="no-referrer" />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative mt-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 space-y-10">
            {/* Premium Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-[#FFF7ED] text-[#F59E0B] text-[9px] font-extrabold uppercase tracking-widest border border-[#F59E0B]/20">Premium Verified</span>
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl md:text-4xl font-extrabold text-[#1E1B4B] tracking-tight">{property.title}</h1>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-[#64748B] gap-1">
                    <span className="material-symbols-outlined text-lg text-[#F59E0B]">location_on</span>
                    <span className="text-base font-medium">{property.area}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const shareData = {
                        title: property.title,
                        text: `Hey, take a look at this property i found on ShelterBee. check this out !`,
                        url: window.location.href,
                      };
                      
                      if (navigator.share) {
                        navigator.share(shareData).catch(console.error);
                      } else {
                        // Fallback: Copy to clipboard
                        navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
                          .then(() => showToast("Link copied to clipboard!", "success"))
                          .catch(() => showToast("Failed to copy link", "error"));
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-[#1E1B4B] hover:bg-slate-100 transition-all border border-slate-200 group"
                  >
                    <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">share</span>
                    <span className="text-sm font-bold">Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Price Highlight Mobile */}
            <div className="lg:hidden p-4 md:p-6 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 sticky bottom-4 z-40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[8px] md:text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] mb-1">Per Day</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-black text-[#1E1B4B] tracking-tighter">₹{property.pricePerDay}</span>
                    <span className="text-xs md:text-sm font-bold text-[#64748B]">/day</span>
                  </div>
                </div>
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
                  className="bg-[#F59E0B] text-[#1E1B4B] px-6 md:px-8 py-2.5 md:py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-[#F59E0B]/30"
                >
                  {profile?.role === 'owner' 
                    ? (property.ownerId === user?.uid ? 'Edit' : 'List')
                    : 'Book Now'}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#F59E0B] rounded-full"></div>
                <h2 className="text-xl font-extrabold text-[#1E1B4B]">Place Overview</h2>
              </div>
              <p className="text-[#64748B] leading-relaxed text-sm font-medium opacity-90 whitespace-pre-line">
                {property.description.replace(/[*_~`#!]/g, '').replace(/ +/g, ' ').trim()}
              </p>
            </div>

                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-[#F59E0B] rounded-full"></div>
                    <h2 className="text-lg md:text-xl font-extrabold text-[#1E1B4B]">Signature Amenities</h2>
                  </div>
    
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                    {/* Compulsory Amenities - Always Provided */}
                    {['24/7 Water Supply', 'Hot Water', '24/7 Electricity'].map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                        <span className="font-bold text-[10px] md:text-xs uppercase tracking-tight text-[#1E1B4B]">{amenity}</span>
                      </div>
                    ))}
    
                    {/* Selective Amenities - Show all with check/x */}
                    {AMENITIES_LIST.map((amenity) => {
                      const isProvided = property.amenities.includes(amenity);
                      return (
                        <div key={amenity} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${isProvided ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50/30 border-slate-50 opacity-40 grayscale'}`}>
                          <span className={`material-symbols-outlined text-lg ${isProvided ? 'text-emerald-500' : 'text-slate-300'}`}>
                            {isProvided ? 'check_circle' : 'cancel'}
                          </span>
                          <span className={`font-bold text-[10px] md:text-xs uppercase tracking-tight ${isProvided ? 'text-[#1E1B4B]' : 'text-slate-400'}`}>
                            {amenity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

            {/* About Place */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#F59E0B] rounded-full"></div>
                <h2 className="text-lg md:text-xl font-extrabold text-[#1E1B4B]">About Place</h2>
              </div>
              <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm space-y-6 md:space-y-8">
                <div className="space-y-6 md:space-y-8">
                  <div className="flex gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#F59E0B]/5 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#F59E0B] text-base md:text-lg">groups</span>
                    </div>
                    <div className="space-y-3 md:space-y-4 flex-1">
                      <div className="font-bold text-[#1E1B4B] text-[10px] md:text-xs uppercase tracking-wider">Occupancy & Capacity</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 md:gap-y-2 gap-x-12">
                        <div className="flex items-center justify-between py-1.5 md:py-2 border-b border-slate-50">
                          <span className="text-xs md:text-sm font-medium text-[#64748B]">Maximum Residents</span>
                          <span className="text-xs md:text-sm font-bold text-[#1E1B4B]">{property.guests || 4} Persons</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 md:py-2 border-b border-slate-50">
                          <span className="text-xs md:text-sm font-medium text-[#64748B]">Bedrooms Provided</span>
                          <span className="text-xs md:text-sm font-bold text-[#1E1B4B]">{property.bedrooms || 1} Rooms</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 md:py-2 border-b border-slate-50">
                          <span className="text-xs md:text-sm font-medium text-[#64748B]">Total Beds</span>
                          <span className="text-xs md:text-sm font-bold text-[#1E1B4B]">{property.beds || 1} Beds</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 md:py-2 border-b border-slate-50">
                          <span className="text-xs md:text-sm font-medium text-[#64748B]">Bathrooms</span>
                          <span className="text-xs md:text-sm font-bold text-[#1E1B4B]">{property.bathrooms || 1} Baths</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 md:py-2 border-b border-slate-50">
                          <span className="text-xs md:text-sm font-medium text-[#64748B]">Check-in Timing</span>
                          <span className="text-xs md:text-sm font-bold text-[#1E1B4B]">{property.checkInTime || '12:00 PM'}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 md:py-2 border-b border-slate-50">
                          <span className="text-xs md:text-sm font-medium text-[#64748B]">Check-out Timing</span>
                          <span className="text-xs md:text-sm font-bold text-[#1E1B4B]">{property.checkOutTime || '11:00 AM'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {property.gender && property.gender.length > 0 && (
                    <div className="flex gap-4 pt-8 border-t border-slate-50">
                      <div className="w-10 h-10 rounded-full bg-[#F59E0B]/5 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#F59E0B] text-lg">person_pin</span>
                      </div>
                      <div className="space-y-4 flex-1">
                        <div className="font-bold text-[#1E1B4B] text-xs uppercase tracking-wider">Gender Specifications</div>
                        <div className="flex flex-wrap gap-3">
                          {property.gender.map((g: string) => {
                            let icon = 'groups';
                            let color = 'text-[#F59E0B]';
                            let bgColor = 'bg-slate-50';
                            
                            if (g === 'Male') {
                              icon = 'male';
                              color = 'text-blue-500';
                              bgColor = 'bg-blue-50';
                            }
                            if (g === 'Female') {
                              icon = 'female';
                              color = 'text-pink-500';
                              bgColor = 'bg-pink-50';
                            }
                            if (g === 'Other') {
                              icon = 'transgender';
                              color = 'text-purple-500';
                              bgColor = 'bg-purple-50';
                            }
                            
                            return (
                              <div key={g} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${bgColor} text-[#1E1B4B] border border-slate-100 shadow-sm`}>
                                <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                                <span className="text-xs font-bold uppercase tracking-wider">{g}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                              src={review.visitorAvatar || getAvatarUrl()} 
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
                          <p className="text-white font-bold text-sm">Available to Book</p>
                          
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
                    {/* No longer showing Schedule instant site visit */}
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
                              : 'bg-[#F59E0B] text-[#1E1B4B] shadow-lg shadow-[#F59E0B]/30 hover:bg-amber-400 active:scale-[0.98]'
                        }`}
                      >
                        {profile?.role === 'owner' 
                          ? (property.ownerId === user?.uid ? 'Edit Property' : 'List your own property')
                          : 'Book Now'}
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
                  <h2 className="text-3xl font-extrabold text-[#1E1B4B] mb-4">Regarding Stay Bookings</h2>
                  <p className="text-[#64748B]">Common questions about booking this property.</p>
                </div>
                
                <div className="space-y-4">
                  {[
                    {
                      q: "How do I book a stay?",
                      a: "Search → select dates → click “Book Now” → complete payment"
                    },
                    {
                      q: "Can I cancel my booking?",
                      a: `Cancellation & Refund Policy:
- More than 24 hours before check-in: 75% refund  
- Between 24 hours and 6 hours before check-in: 50% refund
- Within 6 hours of check-in or after check-in: No refund
- No-show: Non-refundable
- Host cancellation: Full refund eligible
- Refunds processed in 5-10 business days
- Platform charges may be retained on cancellation`
                    },
                    {
                      q: "When will I get full stays details?",
                      a: "After booking confirmation. Location, contact information, name of owner shared before check-in."
                    },
                    {
                      q: "What if my payment fails?",
                      a: "Retry or use another method. Booking is not confirmed until payment succeeds."
                    },
                    {
                      q: "Is it safe to book?",
                      a: "Yes, stays are verified before approval. Basic safety checks are done."
                    },
                    {
                      q: "Can I contact the owner?",
                      a: "Yes, after booking confirmation. Details will be shared securely."
                    },
                    {
                      q: "Are there any hidden charges?",
                      a: "No hidden charges. Total price shown before payment."
                    },
                    {
                      q: "What if stay is not available after booking?",
                      a: "You’ll get refund or alternate property option. Support will assist you."
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
          <div className="modal-overlay">
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
              className="modal-content bg-white rounded-3xl p-10 max-w-md shadow-2xl relative z-10 text-center border border-slate-100"
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
            try {
              await updateDoc(doc(db, 'users', user.uid), {
                emailVerified: true
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, 'users');
            }
            setShowOTPModal(false);
            showToast("Email verified successfully!", "success");
          }
        }} 
      />

    </div>
  );
}
