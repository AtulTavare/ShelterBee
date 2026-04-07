import { showToast } from '../utils/toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, UploadCloud, MapPin, IndianRupee, Home, FileText, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const COMPULSORY_AMENITIES = ['24/7 Water Supply', 'Hot Water', '24/7 Electricity'];
const AMENITIES_LIST = ['AC', 'WiFi', 'Attached Bathroom', 'Meals Included', 'Parking', 'Laundry', 'TV', 'Geyser'];

import { propertyService } from '../services/propertyService';
import { storage } from '../firebase';

export default function ListProperty() {
  const [step, setStep] = useState(1);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth?mode=login', { state: { returnTo: '/list-property' } });
      } else if (profile?.role === 'visitor') {
        navigate('/');
      }
    }
  }, [user, profile, loading, navigate]);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'Room',
    area: '',
    address: '',
    price: '',
    photos: [] as File[],
    description: '',
    weProvideCompulsoryAmenities: false,
    amenities: [] as string[],
    otherAmenities: '',
    aadhaarFront: null as File | null,
    aadhaarBack: null as File | null,
    propertyProof: null as File | null,
    termsAccepted: false,
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.type || !formData.area || !formData.address) {
        showToast("Please fill in all fields in Step 1.", "error");
        return;
      }
    } else if (step === 2) {
      if (!formData.price) {
        showToast("Please enter the rent per day.", "error");
        return;
      }
    } else if (step === 3) {
      if (formData.photos.length !== 5) {
        showToast("Please upload exactly 5 images.", "error");
        return;
      }
      if (!formData.description) {
        showToast("Please provide a property description.", "error");
        return;
      }
    } else if (step === 4) {
      if (!formData.weProvideCompulsoryAmenities) {
        showToast("Please confirm that you provide the compulsory amenities.", "error");
        return;
      }
    } else if (step === 5) {
      if (!formData.aadhaarFront || !formData.aadhaarBack || !formData.propertyProof) {
        showToast("Please upload all required documents.", "error");
        return;
      }
    }
    setStep(s => Math.min(s + 1, 6));
  };
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const toggleAmenity = (amenity: string, isCompulsory: boolean = false) => {
    if (isCompulsory) {
      setFormData(prev => ({
        ...prev,
        compulsoryAmenities: prev.compulsoryAmenities.includes(amenity)
          ? prev.compulsoryAmenities.filter(a => a !== amenity)
          : [...prev.compulsoryAmenities, amenity]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        amenities: prev.amenities.includes(amenity)
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      }));
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.6 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth', { state: { returnTo: '/list-property' } });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Compress and convert photos to Base64 in parallel
      const photoUploadPromises = formData.photos.map(async (file) => {
        if (file) {
          return await compressImage(file);
        }
        return null;
      });
      
      const photoUrls = await Promise.all(photoUploadPromises);
      const uploadedPhotoUrls = photoUrls.filter(url => url !== null) as string[];

      // Compress and convert documents to Base64 in parallel
      const docUploadPromises = [];
      
      let aadhaarFrontUrl = '';
      if (formData.aadhaarFront) {
        docUploadPromises.push(
          compressImage(formData.aadhaarFront).then(url => {
            aadhaarFrontUrl = url;
          })
        );
      }

      let aadhaarBackUrl = '';
      if (formData.aadhaarBack) {
        docUploadPromises.push(
          compressImage(formData.aadhaarBack).then(url => {
            aadhaarBackUrl = url;
          })
        );
      }

      let propertyProofUrl = '';
      if (formData.propertyProof) {
        docUploadPromises.push(
          compressImage(formData.propertyProof).then(url => {
            propertyProofUrl = url;
          })
        );
      }

      await Promise.all(docUploadPromises);

      await propertyService.addProperty({
        ownerId: user.uid,
        title: formData.title || 'Untitled Property',
        type: formData.type || 'Room',
        area: formData.area || 'Unknown Area',
        address: formData.address || 'Address not provided',
        pricePerDay: Number(formData.price) || 0,
        deposit: 0,
        photos: uploadedPhotoUrls,
        amenities: [...COMPULSORY_AMENITIES, ...formData.amenities],
        description: formData.description || 'No description provided.',
        aadhaarFront: aadhaarFrontUrl,
        aadhaarBack: aadhaarBackUrl,
        propertyProof: propertyProofUrl,
      });
      
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting property:", error);
      showToast("An error occurred during submission. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepDetails = [
    {
      title: "Let's start with the basics",
      description: "Tell us what kind of place you're listing and where it's located. A catchy title helps attract more guests and gives them a clear idea of what to expect.",
      icon: <Home className="w-10 h-10 text-primary mb-6" />
    },
    {
      title: "Set your price",
      description: "Decide how you want to charge. You can set a price per day or per month. Don't forget to include a security deposit if required to protect your property.",
      icon: <IndianRupee className="w-10 h-10 text-primary mb-6" />
    },
    {
      title: "Showcase your space",
      description: "Upload high-quality photos to make your listing stand out.\n\nRules:\n• 1st image: External view of the property.\n• Next 3 images: Internal views.\n• 5th image: Toilet/Bathroom.\n• Formats: PNG, JPG, JPEG only.\n• Max size: 5MB per image.\n\nAll 5 images are compulsory for approval.",
      icon: <UploadCloud className="w-10 h-10 text-primary mb-6" />
    },
    {
      title: "Describe your property",
      description: "Highlight what makes your place special. Select the amenities you offer, and feel free to add any other amenities not listed to give guests a complete picture.",
      icon: <FileText className="w-10 h-10 text-primary mb-6" />
    },
    {
      title: "Verify your identity",
      description: "Upload your Aadhaar card and property proof. These documents are strictly for admin verification to ensure a safe community and will never be shared publicly.",
      icon: <CheckCircle2 className="w-10 h-10 text-primary mb-6" />
    },
    {
      title: "Terms & Conditions",
      description: "Please read and accept our terms and conditions, and payment policies before submitting your property.",
      icon: <Info className="w-10 h-10 text-primary mb-6" />
    }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container-lowest rounded-3xl shadow-xl max-w-md w-full p-8 text-center border border-outline-variant"
        >
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-on-primary-container" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-4">Property Submitted!</h2>
          <p className="text-on-surface-variant mb-8">Your property has been submitted for verification. We'll notify you once it's approved by our admin team.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-on-secondary-fixed hover:bg-on-secondary-fixed/90 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background flex flex-col">
      {/* Progress Bar at the top */}
      <div className="bg-surface px-8 py-4 border-b border-outline-variant sticky top-[80px] z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`text-xs font-semibold ${step >= i ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                Step {i}
              </div>
            ))}
          </div>
          <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Left Side: Details */}
        <div className="lg:w-5/12 p-8 lg:p-16 bg-surface-container-lowest lg:border-r border-outline-variant flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`detail-${step}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {stepDetails[step - 1].icon}
              <h1 className="text-3xl lg:text-4xl font-extrabold text-on-surface mb-6 leading-tight">
                {stepDetails[step - 1].title}
              </h1>
              <p className="text-on-surface-variant text-lg whitespace-pre-line leading-relaxed">
                {stepDetails[step - 1].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Inputs */}
        <div className="lg:w-7/12 p-8 lg:p-16 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-xl w-full mx-auto flex-1">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Property Name</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface"
                      placeholder="e.g. Cozy Room near Tech Park"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Property Type</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface"
                    >
                      <option value="Room">Room</option>
                      <option value="PG">PG</option>
                      <option value="Full Flat">Full Flat</option>
                      <option value="Full Property">Full Property</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Short Area Name</label>
                    <input 
                      type="text" 
                      value={formData.area}
                      onChange={e => setFormData({...formData, area: e.target.value})}
                      className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface"
                      placeholder="e.g. Koramangala"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Exact Address <span className="text-xs text-on-surface-variant font-normal ml-2">(Private - only shown after booking)</span></label>
                    <textarea 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      rows={3}
                      className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface"
                      placeholder="Enter full address with landmark and pincode"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">
                      Daily Rent (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <IndianRupee className="h-5 w-5 text-on-surface-variant" />
                      </div>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        className="w-full border border-outline-variant rounded-xl pl-12 pr-4 py-4 text-lg font-bold focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <p className="text-sm text-on-surface-variant mb-4">Please upload exactly 5 photos of your property.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4].map(index => {
                      const labels = ['External View', 'Internal View 1', 'Internal View 2', 'Internal View 3', 'Toilet/Bathroom'];
                      const file = formData.photos[index];
                      return (
                        <div key={index} className="relative aspect-square bg-surface-container rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center overflow-hidden hover:bg-surface-container-high transition-colors">
                          <input 
                            type="file" 
                            accept=".png, .jpg, .jpeg" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const newPhotos = [...formData.photos];
                                newPhotos[index] = e.target.files[0];
                                setFormData({...formData, photos: newPhotos});
                              }
                            }}
                          />
                          {file ? (
                            <div className="absolute inset-0 w-full h-full">
                              <img src={URL.createObjectURL(file)} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white font-bold text-sm">Change Photo</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 flex flex-col items-center">
                              <UploadCloud className="w-8 h-8 text-on-surface-variant/50 mb-2" />
                              <span className="text-xs font-bold text-on-surface">{labels[index]}</span>
                              <span className="text-[10px] text-on-surface-variant mt-1">Click to upload</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-on-surface mb-2">Property Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface h-32 resize-none"
                      placeholder="Describe your property, its surroundings, and what makes it special..."
                    ></textarea>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-4">Compulsory Amenities</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      {COMPULSORY_AMENITIES.map(amenity => (
                        <div key={amenity} className="flex items-center p-3 border border-primary bg-primary-container/20 rounded-xl">
                          <div className="w-5 h-5 rounded border border-primary bg-primary flex items-center justify-center mr-3 flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-on-primary" />
                          </div>
                          <span className="text-sm font-medium text-on-primary-container">{amenity}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-error font-medium mb-4">* These amenities must be provided by the property owner.</p>
                    
                    <label className="flex items-start gap-3 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl cursor-pointer hover:bg-surface-container transition-colors mb-8">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                          checked={formData.weProvideCompulsoryAmenities}
                          onChange={(e) => setFormData({...formData, weProvideCompulsoryAmenities: e.target.checked})}
                        />
                      </div>
                      <span className="text-sm font-bold text-on-surface">We provide these amenities</span>
                    </label>

                    <label className="block text-sm font-medium text-on-surface mb-4">Selective Amenities</label>
                    <div className="grid grid-cols-2 gap-3">
                      {AMENITIES_LIST.map(amenity => (
                        <label key={amenity} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.amenities.includes(amenity) ? 'border-primary bg-primary-container/20' : 'border-outline-variant hover:bg-surface-container'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={formData.amenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity, false)}
                          />
                          <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 flex-shrink-0 ${formData.amenities.includes(amenity) ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                            {formData.amenities.includes(amenity) && <CheckCircle2 className="w-3 h-3 text-on-primary" />}
                          </div>
                          <span className={`text-sm font-medium ${formData.amenities.includes(amenity) ? 'text-on-primary-container' : 'text-on-surface'}`}>{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Other Amenities</label>
                    <input 
                      type="text" 
                      value={formData.otherAmenities}
                      onChange={e => setFormData({...formData, otherAmenities: e.target.value})}
                      className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface"
                      placeholder="e.g. Balcony, Power Backup, RO Water"
                    />
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    <div className="border border-outline-variant rounded-2xl p-6 bg-surface-container">
                      <h3 className="font-bold text-on-surface mb-2">Aadhaar Card</h3>
                      <p className="text-sm text-on-surface-variant mb-4">Upload front and back of your Aadhaar card.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <input 
                            type="file" 
                            accept=".png, .jpg, .jpeg, .pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setFormData({...formData, aadhaarFront: e.target.files?.[0] || null})}
                          />
                          <button className={`w-full bg-surface-container-lowest border ${formData.aadhaarFront ? 'border-primary text-primary' : 'border-outline-variant text-on-surface'} px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2`}>
                            {formData.aadhaarFront ? <CheckCircle2 className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />} 
                            {formData.aadhaarFront ? 'Front Uploaded' : 'Upload Front'}
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept=".png, .jpg, .jpeg, .pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setFormData({...formData, aadhaarBack: e.target.files?.[0] || null})}
                          />
                          <button className={`w-full bg-surface-container-lowest border ${formData.aadhaarBack ? 'border-primary text-primary' : 'border-outline-variant text-on-surface'} px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2`}>
                            {formData.aadhaarBack ? <CheckCircle2 className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />} 
                            {formData.aadhaarBack ? 'Back Uploaded' : 'Upload Back'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border border-outline-variant rounded-2xl p-6 bg-surface-container">
                      <h3 className="font-bold text-on-surface mb-2">Property Proof</h3>
                      <p className="text-sm text-on-surface-variant mb-4">Upload electricity bill of past month or ownership of the property.</p>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept=".png, .jpg, .jpeg, .pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => setFormData({...formData, propertyProof: e.target.files?.[0] || null})}
                        />
                        <button className={`w-full bg-surface-container-lowest border ${formData.propertyProof ? 'border-primary text-primary' : 'border-outline-variant text-on-surface'} px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2`}>
                          {formData.propertyProof ? <CheckCircle2 className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />} 
                          {formData.propertyProof ? 'Proof Uploaded' : 'Upload Document'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="border border-outline-variant rounded-2xl p-6 bg-surface-container-lowest h-[300px] overflow-y-auto text-sm text-on-surface-variant space-y-4">
                    <h3 className="font-bold text-on-surface text-lg">Terms & Conditions</h3>
                    <p>1. <strong>Accuracy of Information:</strong> You agree that all information provided about the property is accurate and up-to-date.</p>
                    <p>2. <strong>Verification:</strong> Shelterbee reserves the right to verify the property details and documents provided. Fake or misleading information will result in immediate rejection.</p>
                    <p>3. <strong>Payment Policies:</strong> All payments will be processed according to Shelterbee's standard payment cycle. Withdrawals are subject to limits and processing times.</p>
                    <p>4. <strong>Guest Relations:</strong> Property owners are expected to maintain a good standard of hospitality and resolve guest issues promptly.</p>
                    <p>5. <strong>Liability:</strong> Shelterbee acts as an intermediary and is not liable for any damages to the property caused by guests.</p>
                    <p>6. <strong>Cancellation:</strong> standard cancellation policies apply to all bookings made through the platform.</p>
                    <p>Please scroll to read all terms carefully. By checking the box below, you acknowledge that you have read and understood these terms.</p>
                  </div>
                  
                  <label className="flex items-start gap-3 cursor-pointer p-4 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-on-surface">
                      I agree to all terms & conditions, payment policies, and confirm that the information provided is accurate.
                    </span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="max-w-xl w-full mx-auto mt-12 pt-6 border-t border-outline-variant flex justify-between items-center">
            <button 
              onClick={handlePrev}
              disabled={step === 1}
              className={`flex items-center gap-2 font-medium px-6 py-3 rounded-xl transition-colors ${step === 1 ? 'text-on-surface-variant/50 cursor-not-allowed' : 'text-on-surface hover:bg-surface-container-high bg-surface-container-lowest border border-outline-variant'}`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            
            {step < 6 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 font-bold px-8 py-3 rounded-xl bg-on-secondary-fixed text-white hover:bg-on-secondary-fixed/90 transition-colors shadow-lg"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={!formData.termsAccepted || isSubmitting}
                className={`flex items-center gap-2 font-bold px-8 py-3 rounded-xl shadow-lg transition-colors ${formData.termsAccepted && !isSubmitting ? 'bg-primary text-on-primary hover:bg-primary/90' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Listing'} <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
