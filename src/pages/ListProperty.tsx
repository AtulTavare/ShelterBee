import { DotLottiePlayer } from '@dotlottie/react-player';
import { showToast } from '../utils/toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, UploadCloud, MapPin, IndianRupee, Home, FileText, ChevronRight, ChevronLeft, Info, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import imageCompression from 'browser-image-compression';

const COMPULSORY_AMENITIES = ['24/7 Water Supply', '24/7 Electricity Supply', 'Clean Bathrooms', 'Sleeping Essentials (Pillow, Bed, Mattress)'];
const AMENITIES_LIST = ['WiFi', 'AC', 'TV', 'Geyser', 'Washing Machine', 'Fridge', 'Kitchen Access', 'Power Backup', 'Lift', 'Parking', 'Gym', 'Swimming Pool', 'Housekeeping', 'Meals Provided', 'RO Water', 'Balcony', 'Attached Bathroom', 'Study Table', 'Cupboard'];
const SECURITY_FEATURES = ['CCTV Surveillance', 'Security Guard', 'Biometric Entry', 'Fire Extinguisher', 'Emergency Exit', 'First Aid Kit'];

import { propertyService } from '../services/propertyService';
import { storage } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { emailService } from '../services/emailService';
import { emailTemplates } from '../services/emailTemplates';
import { OTPModal, generateOTP, storeOTP, sendOTPEmail } from '../components/OTPModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ListProperty() {
  const [step, setStep] = useState(1);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    current: number;
    status: string;
    fileStatuses: Record<string, string>;
  }>({
    total: 0,
    current: 0,
    status: '',
    fileStatuses: {}
  });
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  
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
    securityFeatures: [] as string[],
    otherAmenities: '',
    aadhaarFront: null as File | null,
    aadhaarBack: null as File | null,
    propertyProof: null as File | null,
    termsAccepted: false,
    // New fields
    guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    gender: [] as string[],
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM',
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdminEdit, setIsAdminEdit] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false);
  const [resubmitAgreed, setResubmitAgreed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    const propertyIdToUse = editId ? editId.trim() : null;
    const adminEditParam = params.get('adminEdit') === 'true';
    
    if (adminEditParam) {
      setIsAdminEdit(true);
    }
    
    if (propertyIdToUse) {
      setIsEditMode(true);
      setPropertyId(propertyIdToUse);
      console.log(`DIAGNOSTIC - Edit Mode Init: ID="${propertyIdToUse}", AdminEdit=${adminEditParam}`);
      fetchPropertyData(propertyIdToUse);
    }
  }, []);

  const fetchPropertyData = async (id: string) => {
    const property = await propertyService.getPropertyById(id);
    if (property) {
      setFormData({
        title: property.title,
        type: property.type,
        area: property.area,
        address: property.address,
        price: property.pricePerDay.toString(),
        photos: property.photos.map(() => null), // Use nulls as placeholders for existing photos
        description: property.description,
        weProvideCompulsoryAmenities: true,
        amenities: property.amenities.filter(a => !COMPULSORY_AMENITIES.includes(a) && !SECURITY_FEATURES.includes(a)),
        securityFeatures: property.amenities.filter(a => SECURITY_FEATURES.includes(a)),
        otherAmenities: '',
        aadhaarFront: null,
        aadhaarBack: null,
        propertyProof: null,
        termsAccepted: true,
        guests: property.guests || 4,
        bedrooms: property.bedrooms || 1,
        beds: property.beds || 1,
        bathrooms: property.bathrooms || 1,
        gender: property.gender || [],
        checkInTime: property.checkInTime || '12:00 PM',
        checkOutTime: property.checkOutTime || '11:00 AM',
      });
      // Store existing photos to show them
      (window as any)._existingPhotos = property.photos;
    }
  };

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
      if (formData.gender.length === 0) {
        showToast("Please select at least one gender specification.", "error");
        return;
      }
      if (!formData.checkInTime || !formData.checkOutTime) {
        showToast("Please specify check-in and check-out timings.", "error");
        return;
      }
    } else if (step === 3) {
      if (!isEditMode && formData.photos.length !== 5) {
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
      if (!isEditMode && !isAdminEdit && (!formData.aadhaarFront || !formData.aadhaarBack || !formData.propertyProof)) {
        showToast("Please upload all required documents.", "error");
        return;
      }
    }
    setStep(s => Math.min(s + 1, 6));
  };
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const uploadToCloudinary = async (file: File, folder: string, fileName: string, isDocument: boolean = false): Promise<string> => {
    try {
      let finalFile: Blob | File = file;
      const otherParams: Record<string, string> = {};

      if (!isDocument) {
        // Step 1: Light Compression for Photos
        setUploadProgress(prev => ({
          ...prev,
          fileStatuses: { ...prev.fileStatuses, [fileName]: 'Optimizing...' }
        }));
        
        finalFile = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          initialQuality: 0.9
        });
        
        otherParams.quality = 'auto:good';
      } else {
        // No compression for documents - clarify for verification
        setUploadProgress(prev => ({
          ...prev,
          fileStatuses: { ...prev.fileStatuses, [fileName]: 'Preparing...' }
        }));
        
        otherParams.quality = 'auto:best';
        otherParams.flags = 'preserve_transparency';
      }
      
      // Step 2: Get signature from server
      setUploadProgress(prev => ({
        ...prev,
        fileStatuses: { ...prev.fileStatuses, [fileName]: 'Signing...' }
      }));
      
      const sigRes = await fetch('/api/cloudinary-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder })
      });
      
      if (!sigRes.ok) {
        const sigError = await sigRes.json().catch(() => ({ error: 'Unknown server error' }));
        console.error("Cloudinary Signature API Error:", sigError);
        throw new Error(sigError.error || 'Failed to get upload signature - Server error');
      }
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

      if (!cloudName || !apiKey || !signature) {
        throw new Error("Cloudinary configuration missing on server. Check environment variables.");
      }
      
      // Step 3: Upload directly to Cloudinary
      setUploadProgress(prev => ({
        ...prev,
        fileStatuses: { ...prev.fileStatuses, [fileName]: 'Uploading...' }
      }));
      
      const formData = new FormData();
      formData.append('file', finalFile);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('folder', folder);
      
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({ error: { message: 'Network or parsing error' } }));
        console.error("Cloudinary Upload API Error:", errorData);
        throw new Error(errorData.error?.message || 'Cloudinary upload failed - check API key and Cloud name');
      }
      
      const data = await uploadRes.json();
      
      setUploadProgress(prev => ({
        ...prev,
        current: prev.current + 1,
        fileStatuses: { ...prev.fileStatuses, [fileName]: 'Done ✓' }
      }));
      
      return data.secure_url;
    } catch (error: any) {
      console.error(`Error uploading ${fileName}:`, error);
      setUploadProgress(prev => ({
        ...prev,
        fileStatuses: { ...prev.fileStatuses, [fileName]: 'Failed ✗' }
      }));
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth', { state: { returnTo: '/list-property' } });
      return;
    }
    
    if (profile?.emailVerified === false && !isAdminEdit) {
      setShowVerificationPopup(true);
      return;
    }
    
    setIsSubmitting(true);
    const propertyName = formData.title.replace(/[^a-zA-Z0-9]/g, '_') || 'property';
    const userName = profile?.displayName?.replace(/[^a-zA-Z0-9]/g, '_') || user.uid;
    
    const imagesFolder = `shelterbee_v2/users/${userName}/${propertyName}/images`;
    const docsFolder = `shelterbee_v2/users/${userName}/kyc`;

    try {
      // Prepare files to upload with specific types for optimization
      const filesToUpload: { file: File; folder: string; name: string; key: string; isDocument: boolean }[] = [];
      
      formData.photos.forEach((file, index) => {
        if (file) {
          filesToUpload.push({ 
            file, 
            folder: imagesFolder, 
            name: `Photo ${index + 1}`,
            key: `photo_${index}`,
            isDocument: false
          });
        }
      });

      if (formData.aadhaarFront) {
        filesToUpload.push({ file: formData.aadhaarFront, folder: docsFolder, name: 'Aadhaar Front', key: 'aadhaarFront', isDocument: true });
      }
      if (formData.aadhaarBack) {
        filesToUpload.push({ file: formData.aadhaarBack, folder: docsFolder, name: 'Aadhaar Back', key: 'aadhaarBack', isDocument: true });
      }
      if (formData.propertyProof) {
        filesToUpload.push({ file: formData.propertyProof, folder: docsFolder, name: 'Property Proof', key: 'propertyProof', isDocument: true });
      }

      setUploadProgress({
        total: filesToUpload.length,
        current: 0,
        status: 'Starting uploads...',
        fileStatuses: {}
      });

      const results: Record<string, string> = {};
      const existingPhotos = (window as any)._existingPhotos || [];
      
      // Batch uploads in groups of 3
      for (let i = 0; i < filesToUpload.length; i += 3) {
        const batch = filesToUpload.slice(i, i + 3);
        setUploadProgress(prev => ({ ...prev, status: `Uploading batch ${Math.floor(i/3) + 1}...` }));
        
        const batchResults = await Promise.all(
          batch.map(item => uploadToCloudinary(item.file, item.folder, item.name, item.isDocument))
        );
        
        batch.forEach((item, index) => {
          results[item.key] = batchResults[index];
        });
      }

      // Construct final URLs
      const finalPhotoUrls = formData.photos.map((file, index) => {
        if (file) return results[`photo_${index}`];
        return existingPhotos[index] || null;
      }).filter(Boolean) as string[];

      let existingProperty = null;
      if (isEditMode && propertyId) {
        existingProperty = await propertyService.getPropertyById(propertyId);
      }

      const propertyData = {
        ownerId: user.uid,
        title: formData.title || 'Untitled Property',
        type: formData.type || 'Room',
        area: formData.area || 'Unknown Area',
        address: formData.address || 'Address not provided',
        pricePerDay: Number(formData.price) || 0,
        deposit: Number(formData.price) * 2,
        photos: finalPhotoUrls,
        amenities: [...COMPULSORY_AMENITIES, ...formData.amenities, ...formData.securityFeatures],
        description: formData.description || 'No description provided.',
        aadhaarFront: results['aadhaarFront'] || (isEditMode ? existingProperty?.aadhaarFront : ''),
        aadhaarBack: results['aadhaarBack'] || (isEditMode ? existingProperty?.aadhaarBack : ''),
        propertyProof: results['propertyProof'] || (isEditMode ? existingProperty?.propertyProof : ''),
        guests: formData.guests,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.bathrooms,
        gender: formData.gender,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        submissionType: isEditMode 
          ? (existingProperty?.status === 'Rejected' ? 'resubmission' : 'changes approval') 
          : 'new listing' as any,
      };

      if (isEditMode && propertyId) {
        try {
          console.log(`DIAGNOSTIC: Attempting UPDATE. Document ID: "${propertyId}", User UID: "${user.uid}", AdminEdit: ${isAdminEdit}`);
          
          // Remove ownerId and submissionType from update to avoid immutable field or schema errors
          const { ownerId, submissionType, ...updateData } = propertyData;
          
          await propertyService.updateProperty(propertyId, {
            ...updateData,
            status: isAdminEdit ? 'Approved' : 'Pending',
            updatedAt: serverTimestamp(),
          });
          console.log("DIAGNOSTIC: Update successful");
          if (isAdminEdit) {
            showToast("Property updated successfully!", "success");
            navigate('/admin-secret-dashboard');
            return;
          }
          showToast("Property updates submitted for approval!", "success");
        } catch (updateErr: any) {
          console.error("DIAGNOSTIC: Update failed", updateErr);
          throw new Error(`Update failed for ID "${propertyId}": ${updateErr.message}`);
        }
      } else {
        try {
          console.log(`DIAGNOSTIC: Attempting CREATE. User UID: "${user.uid}"`);
          await propertyService.addProperty(propertyData);
          console.log("DIAGNOSTIC: Create successful");
          showToast("Property listed successfully! Waiting for approval.", "success");
        } catch (createErr: any) {
          console.error("DIAGNOSTIC: Create failed", createErr);
          throw new Error(`Create failed: ${createErr.message}`);
        }
      }

      if (profile && user.email) {
        const emailContent = emailTemplates.getPropertySubmission(profile.displayName || 'Owner', profile.gender || 'Other');
        emailService.sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html
        }).catch(err => console.error("Email failed:", err));
      }
      
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Submission error:", error);
      showToast(error.message || "An error occurred during submission.", "error");
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
      title: "Tell us more about your place",
      description: "Decide how you want to charge. You can set a price per day or per month. Don't forget to include a security deposit if required to protect your property.",
      icon: <IndianRupee className="w-10 h-10 text-primary mb-6" />
    },
    {
      title: "Showcase your space",
      description: "Upload high-quality photos to make your listing stand out.\n\nRules:\n• 1st image: Best view of the property.\n• Next 3 images: External & Internal views.\n• 5th image: Toilet/Bathroom.\n• Formats: PNG, JPG, JPEG only.\n• Max size: 5MB per image.\n\nAll 5 images are compulsory for approval.",
      icon: <UploadCloud className="w-10 h-10 text-primary mb-6" />
    },
    {
      title: "Tell us property features & rules",
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
            onClick={() => navigate('/profile#favourites')}
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
      <div className="bg-surface px-4 md:px-8 py-4 border-b border-outline-variant sticky top-[64px] md:top-[80px] z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`text-[10px] md:text-xs font-semibold ${step >= i ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                Step {i}
              </div>
            ))}
          </div>
          <div className="h-1.5 md:h-2 bg-surface-variant rounded-full overflow-hidden">
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
        <div className="lg:w-5/12 p-6 md:p-8 lg:p-16 bg-surface-container-lowest lg:border-r border-outline-variant flex flex-col justify-start pt-12 md:pt-24 lg:pt-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={`detail-${step}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-start">
                <div className="scale-75 md:scale-100 origin-left">
                  {stepDetails[step - 1].icon}
                </div>
                <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-on-surface mb-3 md:mb-6 leading-tight">
                  {stepDetails[step - 1].title}
                </h1>
                <p className="text-xs md:text-base lg:text-lg text-on-surface-variant whitespace-pre-line leading-relaxed">
                  {stepDetails[step - 1].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Inputs */}
        <div className="lg:w-7/12 p-6 md:p-8 lg:p-16 flex flex-col justify-between overflow-y-auto">
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
                      <option value="Hostel">Hostel</option>
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
                  <div className="grid grid-cols-1 gap-6">
                    {[ 
                      { label: 'Guests', key: 'guests' },
                      { label: 'Bedrooms', key: 'bedrooms' },
                      { label: 'Beds', key: 'beds' },
                      { label: 'Bathrooms', key: 'bathrooms' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl">
                        <span className="font-bold text-on-surface text-sm">{item.label}</span>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setFormData(prev => ({ ...prev, [item.key]: Math.max(1, (prev as any)[item.key] - 1) }))}
                            className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold w-4 text-center">{(formData as any)[item.key]}</span>
                          <button 
                            onClick={() => setFormData(prev => ({ ...prev, [item.key]: (prev as any)[item.key] + 1 }))}
                            className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <label className="block text-sm font-bold text-on-surface mb-4">Allowed Gender</label>
                    <div className="grid grid-cols-3 gap-3 mb-8">
                      {[
                        { id: 'Male', icon: 'male' },
                        { id: 'Female', icon: 'female' },
                        { id: 'Other', icon: 'transgender' }
                      ].map((g) => (
                        <button
                          key={g.id}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              gender: prev.gender.includes(g.id) 
                                ? prev.gender.filter(x => x !== g.id)
                                : [...prev.gender, g.id]
                            }));
                          }}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${ 
                            formData.gender.includes(g.id) 
                              ? 'border-primary bg-primary-container/20 text-primary' 
                              : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">{g.icon}</span>
                          <span className="text-[10px] font-bold">{g.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Check-in time</label>
                      <input 
                        type="text" 
                        value={formData.checkInTime} 
                        onChange={e => setFormData({...formData, checkInTime: e.target.value})}
                        className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface"
                        placeholder="e.g. 12:00 PM"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Check-out time</label>
                      <input 
                        type="text" 
                        value={formData.checkOutTime} 
                        onChange={e => setFormData({...formData, checkOutTime: e.target.value})}
                        className="w-full border border-outline-variant rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest text-on-surface"
                        placeholder="e.g. 11:00 AM"
                      />
                    </div>
                  </div>

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
                        <div key={`photo-${index}`} className="relative aspect-square bg-surface-container rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center overflow-hidden hover:bg-surface-container-high transition-colors">
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
                          {file && file instanceof Blob ? (
                            <div className="absolute inset-0 w-full h-full">
                              <img src={URL.createObjectURL(file)} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-white font-bold text-sm">Change Photo</span>
                              </div>
                            </div>
                          ) : (window as any)._existingPhotos?.[index] ? (
                            <div className="absolute inset-0 w-full h-full">
                              <img src={(window as any)._existingPhotos[index]} alt={`Existing ${index}`} className="w-full h-full object-cover" />
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
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {AMENITIES_LIST.map(amenity => (
                        <label key={amenity} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.amenities.includes(amenity) ? 'border-primary bg-primary-container/20' : 'border-outline-variant hover:bg-surface-container'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={formData.amenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity)}
                          />
                          <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 flex-shrink-0 ${formData.amenities.includes(amenity) ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                            {formData.amenities.includes(amenity) && <CheckCircle2 className="w-3 h-3 text-on-primary" />}
                          </div>
                          <span className={`text-sm font-medium ${formData.amenities.includes(amenity) ? 'text-on-primary-container' : 'text-on-surface'}`}>{amenity}</span>
                        </label>
                      ))}
                    </div>

                    <label className="block text-sm font-medium text-on-surface mb-4">Security Features</label>
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {SECURITY_FEATURES.map(feature => (
                        <label key={feature} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.securityFeatures.includes(feature) ? 'border-primary bg-primary-container/20' : 'border-outline-variant hover:bg-surface-container'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={formData.securityFeatures.includes(feature)}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                securityFeatures: prev.securityFeatures.includes(feature)
                                  ? prev.securityFeatures.filter(f => f !== feature)
                                  : [...prev.securityFeatures, feature]
                              }));
                            }}
                          />
                          <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 flex-shrink-0 ${formData.securityFeatures.includes(feature) ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                            {formData.securityFeatures.includes(feature) && <CheckCircle2 className="w-3 h-3 text-on-primary" />}
                          </div>
                          <span className={`text-sm font-medium ${formData.securityFeatures.includes(feature) ? 'text-on-primary-container' : 'text-on-surface'}`}>{feature}</span>
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
          <div className="max-w-xl w-full mx-auto mt-6 md:mt-12 pt-4 md:pt-6 border-t border-outline-variant flex justify-between items-center gap-3 md:gap-4">
            <button 
              onClick={handlePrev}
              disabled={step === 1}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 font-medium px-4 md:px-6 py-2.5 md:py-3 rounded-xl transition-colors ${step === 1 ? 'text-on-surface-variant/50 cursor-not-allowed' : 'text-on-surface hover:bg-surface-container-high bg-surface-container-lowest border border-outline-variant'}`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            
            {step < 6 ? (
              <button 
                onClick={handleNext}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 font-bold px-4 md:px-8 py-2.5 md:py-3 rounded-xl bg-on-secondary-fixed text-white hover:bg-on-secondary-fixed/90 transition-colors shadow-lg"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => (isEditMode && !isAdminEdit) ? setShowResubmitConfirm(true) : handleSubmit(new Event('submit') as any)}
                disabled={!formData.termsAccepted || isSubmitting}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 font-bold px-4 md:px-8 py-2.5 md:py-3 rounded-xl shadow-lg transition-colors ${formData.termsAccepted && !isSubmitting ? 'bg-primary text-on-primary hover:bg-primary/90' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'}`}
              >
                {isSubmitting ? 'Submitting...' : (isAdminEdit ? 'Save Details' : (isEditMode ? 'Resubmit' : 'Submit Listing'))} <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resubmit Confirmation Modal */}
      <AnimatePresence>
        {showResubmitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResubmitConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 text-center border border-slate-100">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-3xl">verified_user</span>
              </div>
              <h3 className="text-2xl font-bold text-[#1E1B4B] mb-4">Confirm Resubmission</h3>
              <p className="text-[#64748B] mb-6 text-sm leading-relaxed">
                Your property will be sent to the admin dashboard for verification. Only after successful verification your property will be updated with the changes on website.
              </p>
              
              <label className="flex items-start gap-3 cursor-pointer p-4 border border-outline-variant rounded-xl hover:bg-slate-50 transition-colors mb-8 text-left">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                  checked={resubmitAgreed}
                  onChange={(e) => setResubmitAgreed(e.target.checked)}
                />
                <span className="text-xs font-medium text-on-surface">
                  I agree that the information provided is accurate and I understand it will be reviewed by admin.
                </span>
              </label>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowResubmitConfirm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowResubmitConfirm(false);
                    handleSubmit(new Event('submit') as any);
                  }}
                  disabled={!resubmitAgreed || isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-on-primary font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  Resubmit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                Please verify your email before listing a property.
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
              setShowOTPModal(false);
              showToast("Email verified successfully!", "success");
              // Optionally, we could auto-submit the listing here
              // handleSubmit(new Event('submit') as any);
            } catch (err) {
              console.error("Error updating user verification:", err);
              showToast("Failed to update verification status.", "error");
            }
          }
        }} 
      />
      <AnimatePresence>
        {isSubmitting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="w-64 h-64">
                <DotLottiePlayer
                  src="https://lottie.host/91f9f628-b5ab-4ea9-bfa4-862211e3b137/X75GVjGtxX.lottie"
                  autoplay
                  loop
                />
              </div>
              <motion.p 
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-white text-xl font-bold mt-4 tracking-wide"
              >
                uploading images please wait ...
              </motion.p>
            </motion.div>
            <style>{`
              body { overflow: hidden !important; }
            `}</style>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
