'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search, CheckCircle, RefreshCw } from 'lucide-react';

interface AddressInputProps {
  streetAddress: string;
  zipCode: string;
  onAddressChange: (address: { streetAddress: string; zipCode: string; city: string; state: string; latitude?: number; longitude?: number; full_address?: string }) => void;
  className?: string;
}

export function AddressInput({ streetAddress, zipCode, onAddressChange, className }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [fullAddress, setFullAddress] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{ lat?: number; lng?: number }>({});
  const [geocodingError, setGeocodingError] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Enhanced geocoding with better error handling
  const geocodeAddress = async (address: string) => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      setGeocodingError('Mapbox token not configured');
      return null;
    }

    try {
      setGeocodingError('');
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=5&country=US&types=address`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.features || [];
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingError('Failed to geocode address');
      return [];
    }
  };

  // Auto-geocode when both street address and zip code are provided
  const performAutoGeocode = async () => {
    if (!streetAddress || !zipCode || zipCode.length < 5) return;

    setIsGeocoding(true);
    setGeocodingError('');

    const fullQuery = `${streetAddress}, ${zipCode}`;
    const results = await geocodeAddress(fullQuery);
    
    if (results && results.length > 0) {
      const result = results[0];
      const [longitude, latitude] = result.center;
      
      // Extract address components more carefully
      const placeName = result.place_name;
      const addressParts = placeName.split(', ');
      
      // Try to extract components from context or properties
      let city = '';
      let state = '';
      
      // Look for city in context
      if (result.context) {
        const cityContext = result.context.find((c: any) => c.id.startsWith('place'));
        if (cityContext) city = cityContext.text;
        
        const stateContext = result.context.find((c: any) => c.id.startsWith('region'));
        if (stateContext) state = stateContext.short_code?.replace('US-', '') || stateContext.text;
      }
      
      // Fallback to parsing place_name
      if (!city || !state) {
        if (addressParts.length >= 3) {
          city = city || addressParts[1];
          const stateZip = addressParts[2];
          state = state || stateZip.split(' ')[0];
        }
      }
      
      const resolvedAddress = {
        streetAddress,
        zipCode,
        city,
        state,
        latitude,
        longitude,
        full_address: placeName
      };
      
      setFullAddress(placeName);
      setCoordinates({ lat: latitude, lng: longitude });
      onAddressChange(resolvedAddress);
    } else {
      setGeocodingError('Could not find this address. Please verify the street address and ZIP code.');
    }
    
    setIsGeocoding(false);
  };

  // Trigger auto-geocoding when both fields are filled
  useEffect(() => {
    if (streetAddress && zipCode && zipCode.length === 5) {
      // Debounce the geocoding
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        performAutoGeocode();
      }, 500);
    } else {
      setFullAddress('');
      setCoordinates({});
      setGeocodingError('');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [streetAddress, zipCode]);

  const handleStreetAddressChange = async (value: string) => {
    onAddressChange({ streetAddress: value, zipCode, city: '', state: '' });

    // Show suggestions for partial addresses
    if (value.length > 3) {
      setIsLoading(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        const results = await geocodeAddress(value);
        setSuggestions(results || []);
        setShowSuggestions((results || []).length > 0);
        setIsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  const handleZipCodeChange = (value: string) => {
    // Only allow numeric input for ZIP code
    const numericValue = value.replace(/\D/g, '').slice(0, 5);
    onAddressChange({ streetAddress, zipCode: numericValue, city: '', state: '' });
  };

  const selectSuggestion = (suggestion: any) => {
    const [longitude, latitude] = suggestion.center;
    const placeName = suggestion.place_name;
    const addressParts = placeName.split(', ');
    
    // Extract components
    const street = addressParts[0] || '';
    let city = '';
    let state = '';
    let zip = '';
    
    // Extract from context if available
    if (suggestion.context) {
      const cityContext = suggestion.context.find((c: any) => c.id.startsWith('place'));
      if (cityContext) city = cityContext.text;
      
      const stateContext = suggestion.context.find((c: any) => c.id.startsWith('region'));
      if (stateContext) state = stateContext.short_code?.replace('US-', '') || stateContext.text;
      
      const postalContext = suggestion.context.find((c: any) => c.id.startsWith('postcode'));
      if (postalContext) zip = postalContext.text;
    }
    
    // Fallback parsing
    if (!city || !state || !zip) {
      if (addressParts.length >= 3) {
        city = city || addressParts[1];
        const stateZip = addressParts[2];
        const zipMatch = stateZip.match(/\d{5}/);
        zip = zip || (zipMatch ? zipMatch[0] : '');
        state = state || stateZip.split(' ')[0];
      }
    }

    const resolvedAddress = {
      streetAddress: street,
      zipCode: zip,
      city,
      state,
      latitude,
      longitude,
      full_address: placeName
    };

    setFullAddress(placeName);
    setCoordinates({ lat: latitude, lng: longitude });
    onAddressChange(resolvedAddress);

    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Street Address */}
        <div className="space-y-2 relative">
          <Label htmlFor="street_address" className="text-muted-foreground flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Street Address
          </Label>
          <div className="relative">
            <Input
              id="street_address"
              value={streetAddress}
              onChange={(e) => handleStreetAddressChange(e.target.value)}
              placeholder="123 Main Street"
              className="bg-input border-border text-foreground pr-10"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
            {!isLoading && streetAddress && (
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
          </div>
          
          {/* Address Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-accent cursor-pointer text-foreground border-b border-border last:border-b-0"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{suggestion.text}</div>
                      <div className="text-xs text-muted-foreground">{suggestion.place_name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ZIP Code */}
        <div className="space-y-2">
          <Label htmlFor="zip_code" className="text-muted-foreground">ZIP Code</Label>
          <Input
            id="zip_code"
            value={zipCode}
            onChange={(e) => handleZipCodeChange(e.target.value)}
            placeholder="12345"
            maxLength={5}
            className="bg-input border-border text-foreground"
          />
        </div>

        {/* Auto-Geocoding Status */}
        {streetAddress && zipCode && (
          <div className="space-y-3">
            {isGeocoding && (
              <Card className="bg-muted/50 border-border">
                <CardContent className="p-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <span>Looking up address...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isGeocoding && fullAddress && (
              <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm font-medium text-green-700 dark:text-green-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span>Address Found</span>
                    </div>
                    <div className="text-foreground">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Full Address:</div>
                      <div className="text-base font-semibold bg-background/80 p-3 rounded-lg border border-border">
                        {fullAddress}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isGeocoding && geocodingError && (
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-destructive">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{geocodingError}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={performAutoGeocode}
                      className="text-xs h-7"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isGeocoding && !fullAddress && !geocodingError && zipCode.length === 5 && (
              <Card className="bg-muted/50 border-border">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>Enter both street address and ZIP code to auto-complete</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={performAutoGeocode}
                      disabled={!streetAddress || zipCode.length < 5}
                      className="text-xs h-7"
                    >
                      <Search className="w-3 h-3 mr-1" />
                      Find
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 