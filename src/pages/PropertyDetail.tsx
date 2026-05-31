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
import { Users, Bed, ChevronLeft } from 'lucide-react';

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
      document.title = `${property.title} in ${property.area} ${property.city || ''} | ShelterBee`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `${property.type} available for short and long term stay in ${property.area}. Verified property on ShelterBee — browse amenities, pricing, and availability.`);
      }
    }
  }, [property]);

  if (!property) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#0F172A]">
      <div className="pt-8 pb-20 px-4 md:px-6 max-w-7xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 text-[#64748B] hover:text-[#1E1B4B] font-bold transition-all hover:shadow-md group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">Back to Listings</span>
        </button>

        {/* Dynamic Hero Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-1.5 h-[260px] md:h-[480px] mb-8 rounded-3xl overflow-hidden relative z-0 shadow-lg shadow-slate-200/30">
          <div className="md:col-span-7 overflow-hidden group relative bg-slate-100 h-full">
            <AnimatePresence mode="wait">
              <motion.img 
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.8 }}
                alt={`${property.title} - ${property.type} for rent in ${property.area}`} 
                className="w-full h-full object-cover absolute inset-0" 
                src={property.photos?.[currentSlide] || 'https://picsum.photos/seed/placeholder/800/600'} 
                referrerPolicy="no-referrer" 
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10"></div>
            
            {/* Mobile Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 md:hidden">
              {property.photos?.map((_: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${currentSlide === idx ? 'bg-white w-5' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
          <div className="hidden md:grid md:col-span-5 grid-cols-2 grid-rows-2 gap-1.5 h-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`overflow-hidden group relative ${i === 1 ? 'rounded-tr-2xl' : ''} ${i === 4 ? 'rounded-br-2xl' : ''}`}>
                <img alt={`${property.title} - ${property.type} for rent in ${property.area}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={property.photos?.[i] || `https://picsum.photos/seed/placeholder${i}/400/300`} referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 space-y-8">
            {/* Premium Header */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-[9px] font-extrabold uppercase tracking-widest border border-amber-200/50 shadow-sm">Premium Verified</span>
                  {property.type && (
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase tracking-widest border border-indigo-200/50">{property.type}</span>
                  )}
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
                      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
                        .then(() => showToast("Link copied to clipboard!", "success"))
                        .catch(() => showToast("Failed to copy link", "error"));
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-[#1E1B4B] hover:bg-slate-100 transition-all border border-slate-200 group shrink-0"
                >
                  <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">share</span>
                  <span className="text-sm font-bold">Share</span>
                </button>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-[#1A1A2E] tracking-tight mb-2">{property.title}</h1>
              <div className="flex items-center text-[#64748B] gap-1">
                <span className="material-symbols-outlined text-lg text-amber-500">location_on</span>
                <span className="text-sm font-medium">{property.area}</span>
              </div>
            </div>

            {/* Price Highlight Mobile */}
            <div className="lg:hidden bg-white rounded-2xl p-4 md:p-5 shadow-lg shadow-slate-200/50 border border-slate-100 sticky bottom-4 z-40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[8px] md:text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] mb-1">Per Day</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-black text-[#1A1A2E] tracking-tighter">₹{property.pricePerDay}</span>
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
                  className="bg-gradient-to-r from-[#1E1B4B] to-indigo-800 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:from-[#312E81] hover:to-indigo-900 transition-all active:scale-[0.98]"
                >
                  {profile?.role === 'owner' 
                    ? (property.ownerId === user?.uid ? 'Edit' : 'List')
                    : 'Book Now'}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-indigo-700 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white text-lg">description</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1A1A2E]">Place Overview</h2>
                  <p className="text-xs text-slate-400 font-medium">About this property</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm font-medium whitespace-pre-line">
                {property.description.replace(/[*_~`#!]/g, '').replace(/ +/g, ' ').trim()}
              </p>
            </div>

            {/* Signature Amenities */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white text-lg">stars</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1A1A2E]">Signature Amenities</h2>
                  <p className="text-xs text-slate-400 font-medium">Everything included with your stay</p>
                </div>
              </div>
  
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Compulsory Amenities - Always Provided */}
                {['24/7 Water Supply', 'Hot Water', '24/7 Electricity'].map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
                    <span className="font-bold text-[10px] md:text-xs uppercase tracking-tight text-emerald-800">{amenity}</span>
                  </div>
                ))}

                {/* Selective Amenities - Show all with check/x */}
                {AMENITIES_LIST.map((amenity) => {
                  const isProvided = property.amenities.includes(amenity);
                  return (
                    <div key={amenity} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${isProvided ? 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200' : 'bg-slate-50/30 border-slate-50 opacity-40 grayscale'}`}>
                      <span className={`material-symbols-outlined text-lg ${isProvided ? 'text-emerald-500' : 'text-slate-300'}`}>
                        {isProvided ? 'check_circle' : 'cancel'}
                      </span>
                      <span className={`font-bold text-[10px] md:text-xs uppercase tracking-tight ${isProvided ? 'text-[#1A1A2E]' : 'text-slate-400'}`}>
                        {amenity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* About Place */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-indigo-700 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white text-lg">info</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1A1A2E]">About Place</h2>
                  <p className="text-xs text-slate-400 font-medium">Property details & specifications</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="font-black text-[#1A1A2E] text-[10px] uppercase tracking-wider">Occupancy & Capacity</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Maximum Residents', value: `${property.guests || 4} Persons` },
                        { label: 'Bedrooms Provided', value: `${property.bedrooms || 1} Rooms` },
                        { label: 'Total Beds', value: `${property.beds || 1} Beds` },
                        { label: 'Bathrooms', value: `${property.bathrooms || 1} Baths` },
                        { label: 'Check-in Timing', value: property.checkInTime || '12:00 PM' },
                        { label: 'Check-out Timing', value: property.checkOutTime || '11:00 AM' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-xs font-medium text-slate-500">{item.label}</span>
                          <span className="text-xs font-black text-[#1A1A2E]">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {property.gender && property.gender.length > 0 && (
                  <div className="flex gap-4 pt-6 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Bed className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="font-black text-[#1A1A2E] text-[10px] uppercase tracking-wider">Gender Specifications</div>
                      <div className="flex flex-wrap gap-2">
                        {property.gender.map((g: string) => {
                          let icon = 'groups';
                          let color = 'text-amber-600';
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
                            <div key={g} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${bgColor} border border-slate-100 shadow-sm`}>
                              <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                              <span className="text-xs font-black uppercase tracking-wider text-[#1A1A2E]">{g}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews & Ratings Section */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1A1A2E]">Guest Reviews & Ratings</h2>
                  <p className="text-xs text-slate-400 font-medium">Based on {reviews.length} verified reviews</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-[#1A1A2E]">{averageRating || '0.0'}</span>
                  <div className="flex">
                    {[1,2,3,4,5].map((star) => (
                      <span key={star} className={`material-symbols-outlined text-lg ${star <= Math.round(averageRating || 0) ? 'text-amber-500' : 'text-slate-200'}`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Feature Ratings */}
                <div>
                  <h3 className="text-sm font-black text-[#1A1A2E] mb-4 uppercase tracking-wider">Ratings by Feature</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Cleanliness", score: featureRatings.cleanliness },
                      { label: "Safety & Security", score: featureRatings.safety },
                      { label: "Owner Behavior", score: featureRatings.ownerBehavior },
                      { label: "Comfort", score: featureRatings.comfort },
                    ].map((feature) => (
                      <div key={feature.label} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                        <span className="text-xs font-medium text-slate-500">{feature.label}</span>
                        <div className="flex items-center gap-3 flex-1 ml-4">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#1E1B4B] to-indigo-600 rounded-full" 
                              style={{ width: `${(feature.score / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-black text-[#1A1A2E] w-6 text-right">{feature.score || '0.0'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">rate_review</span>
                      <p className="text-slate-500 font-medium">No reviews yet for this property.</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <img 
                            src={review.visitorAvatar || getAvatarUrl()} 
                            alt={review.visitorName} 
                            className="w-10 h-10 rounded-full bg-slate-100 ring-2 ring-slate-50" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-black text-[#1A1A2E]">{review.visitorName}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">{review.date}</p>
                          </div>
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-lg">
                            <span className="text-xs font-black text-amber-700">{review.rating}</span>
                            <span className="material-symbols-outlined text-amber-500 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{review.text}</p>
                        {review.reply && (
                          <div className="p-4 bg-indigo-50/50 rounded-xl border-l-4 border-[#1E1B4B]">
                            <p className="text-[10px] font-black text-[#1A1A2E] mb-1 uppercase tracking-wider">Owner's Response</p>
                            <p className="text-xs text-slate-600 italic">{review.reply}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {reviews.length > 4 && (
                <div className="mt-6 text-center">
                  <button className="px-6 py-3 rounded-xl border-2 border-[#1E1B4B] text-[#1E1B4B] font-black text-xs uppercase tracking-widest hover:bg-[#1E1B4B] hover:text-white transition-all">
                    Show all {reviews.length} reviews
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Sticky Pricing & Unlock */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Pricing Card */}
              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/20 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Per Day</span>
                  <span className="px-2 py-0.5 bg-amber-50 rounded-md border border-amber-100">
                    <span className="text-amber-700 text-[9px] font-black uppercase">Best Price</span>
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-[#1A1A2E] tracking-tighter">₹{property.pricePerDay}</span>
                  <span className="text-base font-bold text-slate-400">/night</span>
                </div>
              </div>

              {/* Book Now Card */}
              <div className="bg-gradient-to-br from-[#1E1B4B] to-indigo-800 rounded-3xl p-6 shadow-xl border border-white/10 overflow-hidden relative">
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-400 text-xl">home</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-sm">Book Your Stay</p>
                      <p className="text-white/50 text-[10px] font-medium">Secure your spot now</p>
                    </div>
                  </div>

                  {user ? (
                    <div className="mb-5">
                      <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <div className="w-9 h-9 rounded-xl bg-emerald-400/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-emerald-400 text-lg">verified_user</span>
                        </div>
                        <p className="text-white text-xs font-bold">Available to Book</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10 mb-5 text-center">
                      <span className="material-symbols-outlined text-amber-400 text-3xl mb-2">lock</span>
                      <h4 className="text-white font-black text-sm mb-1">Login to Book</h4>
                      <p className="text-white/60 text-[11px] font-medium">Please log in or register to select dates and unlock owner details.</p>
                    </div>
                  )}

                  <div className="space-y-2.5 mb-5">
                    {[
                      { icon: 'check', text: 'Direct Phone & WhatsApp' },
                      { icon: 'check', text: 'Verified Owner Contact' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-amber-400 text-[12px] font-bold">{item.icon}</span>
                        </div>
                        <span className="text-xs font-semibold text-white/90">{item.text}</span>
                      </div>
                    ))}
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
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-gradient-to-r from-amber-400 to-amber-500 text-[#1E1B4B] shadow-lg shadow-amber-500/30 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98]"
                  >
                    {profile?.role === 'owner' 
                      ? (property.ownerId === user?.uid ? 'Edit Property' : 'List your own property')
                      : 'Book Now'}
                  </button>

                  <div className="mt-4 flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                      <span className="material-symbols-outlined text-amber-400 text-[10px]">verified_user</span>
                    </div>
                    <p className="text-[7px] text-white/40 text-center uppercase tracking-tighter">Secure Stripe Payment • Encrypted Data</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

            {/* FAQ Section */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mt-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-black text-[#1A1A2E] mb-2">Regarding Stay Bookings</h2>
                <p className="text-sm text-slate-400 font-medium">Common questions about booking this property.</p>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-3">
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
                    a: "You'll get refund or alternate property option. Support will assist you."
                  }
                ].map((faq, i) => (
                  <details key={faq.q} className="group bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <summary className="flex items-center justify-between p-4 md:p-5 cursor-pointer list-none">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-700 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                        <h4 className="text-sm font-black text-[#1A1A2E]">{faq.q}</h4>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform text-lg">expand_more</span>
                    </summary>
                    <div className="px-4 md:px-5 pb-4 md:pb-5">
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{faq.a}</p>
                    </div>
                  </details>
                ))}
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
