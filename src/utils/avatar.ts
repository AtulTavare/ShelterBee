
export const getAvatarUrl = (gender?: string): string => {
  if (gender === 'Female') {
    return 'https://res.cloudinary.com/dtnsxrc2c/image/upload/v1777286775/profile_image_female_dwddfi.jpg';
  }
  if (gender === 'Other') {
    return 'https://res.cloudinary.com/dtnsxrc2c/image/upload/v1777286773/profile_image_other_cwyzsi.jpg';
  }
  // Default: male
  return 'https://res.cloudinary.com/dtnsxrc2c/image/upload/v1777286774/profile_image_male_u0v9qm.jpg';
};
