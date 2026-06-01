import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const STORAGE_KEY = 'shelterbee_referral';

export function useReferralCode(): { referralUrl: (path: string) => string } {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem(STORAGE_KEY, ref);
    }
  }, [location]);

  const referralUrl = (path: string): string => {
    const ref = localStorage.getItem(STORAGE_KEY);
    if (!ref) return path;

    if (path.includes('ref=')) return path;

    if (path === '/auth' || path.startsWith('/auth?') || path === '/host-auth' || path.startsWith('/host-auth?')) return path;

    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}ref=${encodeURIComponent(ref)}`;
  };

  return { referralUrl };
}
