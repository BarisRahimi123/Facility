/**
 * Utilities for managing auth cache
 */

/**
 * Clear all cached authentication data
 * This prevents stale data issues between logins
 */
export function clearAuthCache() {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear user cache
    localStorage.removeItem('facilitycore_user');
    
    // Clear ALL Supabase-specific items more aggressively
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('sb-') ||
        key.includes('session')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also clear session storage
    sessionStorage.clear();
    
    // Clear cookies that might be accessible via JavaScript
    if (document.cookie) {
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
        if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        }
      });
    }
    
    console.log('Auth cache cleared completely');
  } catch (error) {
    console.error('Error clearing auth cache:', error);
  }
}

/**
 * Get cached user data if available
 */
export function getCachedUser() {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem('facilitycore_user');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error reading cached user:', error);
  }
  
  return null;
}

/**
 * Save user data to cache
 */
export function cacheUser(user: any) {
  if (typeof window === 'undefined' || !user) return;
  
  try {
    localStorage.setItem('facilitycore_user', JSON.stringify(user));
    console.log('User cached:', user.email);
  } catch (error) {
    console.error('Error caching user:', error);
  }
}



