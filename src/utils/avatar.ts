
export const getAvatarUrl = (seed: string, gender?: string, role?: string) => {
  const normalizedGender = gender?.toLowerCase() || 'male';
  const normalizedRole = role?.toLowerCase() || 'visitor';

  if (normalizedRole === 'owner') {
    return normalizedGender === 'female'
      ? 'https://res.cloudinary.com/dtnsxrc2c/image/upload/q_auto/f_auto/v1776021648/2151107459_cdbxpo.jpg'
      : 'https://res.cloudinary.com/dtnsxrc2c/image/upload/q_auto/f_auto/v1776021643/27470334_7309681_vw7rsz.jpg';
  } else {
    return normalizedGender === 'female'
      ? 'https://res.cloudinary.com/dtnsxrc2c/image/upload/q_auto/f_auto/v1776021831/visitor_female_qlikie.jpg'
      : 'https://res.cloudinary.com/dtnsxrc2c/image/upload/q_auto/f_auto/v1776021655/2151419548_xwdb8t.jpg';
  }
};
