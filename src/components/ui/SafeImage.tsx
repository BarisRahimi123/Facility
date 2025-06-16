'use client';

import { useState, useEffect } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
}

export function SafeImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  fallbackSrc = '/images/placeholder.png' 
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const handleError = () => {
    console.warn(`Failed to load image: ${src}`);
    setImgSrc(fallbackSrc);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Use regular img tag for better Safari compatibility
  return (
    <>
      {isLoading && (
        <div 
          className={`bg-gray-200 animate-pulse ${className}`}
          style={{ width, height }}
        />
      )}
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </>
  );
} 