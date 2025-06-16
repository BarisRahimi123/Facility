'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// Make sure there's a default context value to prevent errors in server components
const defaultContextValue = {
  currentFacility: null,
  setCurrentFacility: () => {},
  facilities: [],
  setFacilities: () => {},
  loading: true
};

interface Facility {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  [key: string]: any;
}

interface FacilityContextType {
  currentFacility: Facility | null;
  setCurrentFacility: (facility: Facility | null) => void;
  facilities: Facility[];
  setFacilities: (facilities: Facility[]) => void;
  loading: boolean;
}

// Create context with default value
const FacilityContext = createContext<FacilityContextType>(defaultContextValue);

export function useFacility() {
  return useContext(FacilityContext);
}

export function FacilityProvider({ children }: { children: ReactNode }) {
  const [currentFacility, setCurrentFacility] = useState<Facility | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Load facilities on mount
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .order('name');
          
        if (error) {
          console.error('Error loading facilities:', error);
          // Use mock data if there's an error (for development)
          setFacilities([
            { id: 'fac-1', name: 'Washington Elementary'},
            { id: 'fac-2', name: 'Central Office Building'},
            { id: 'fac-3', name: 'West Community Center'},
          ]);
        } else {
          setFacilities(data || []);
        }
      } catch (err) {
        console.error('Error in fetchFacilities:', err);
        // Fallback mock data
        setFacilities([
          { id: 'fac-1', name: 'Washington Elementary'},
          { id: 'fac-2', name: 'Central Office Building'},
          { id: 'fac-3', name: 'West Community Center'},
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
    
    // Try to load the last selected facility from localStorage
    if (typeof window !== 'undefined') {
      const savedFacility = localStorage.getItem('currentFacility');
      if (savedFacility) {
        try {
          setCurrentFacility(JSON.parse(savedFacility));
        } catch (e) {
          console.error('Error parsing saved facility:', e);
        }
      }
    }
  }, []);

  // Update localStorage when currentFacility changes
  useEffect(() => {
    if (currentFacility && typeof window !== 'undefined') {
      localStorage.setItem('currentFacility', JSON.stringify(currentFacility));
    }
  }, [currentFacility]);

  const value = {
    currentFacility,
    setCurrentFacility,
    facilities,
    setFacilities,
    loading
  };

  return (
    <FacilityContext.Provider value={value}>
      {children}
    </FacilityContext.Provider>
  );
} 