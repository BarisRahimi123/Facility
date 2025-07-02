'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Field } from '@/types/field';

// Set the access token from environment variable
if (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
}

interface MapboxMapProps {
  fields?: Field[];
  center?: [number, number];
  zoom?: number;
  onFieldClick?: (field: Field) => void;
  onFieldDoubleClick?: (field: Field) => void;
  showAerialOverlays?: boolean;
}

export function MapboxMap({ 
  fields = [], 
  center = [-119.7871, 36.7378], // Default to Fresno, CA
  zoom = 12,
  onFieldClick,
  onFieldDoubleClick,
  showAerialOverlays = true
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(center[0]);
  const [lat, setLat] = useState(center[1]);
  const [mapZoom, setMapZoom] = useState(zoom);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if token is available
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      console.error('Mapbox token not found. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file');
      return;
    }

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Use satellite view for field visualization
      center: [lng, lat],
      zoom: mapZoom,
      pitch: 0,
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Update coordinates on move
    map.current.on('move', () => {
      if (!map.current) return;
      setLng(Number(map.current.getCenter().lng.toFixed(4)));
      setLat(Number(map.current.getCenter().lat.toFixed(4)));
      setMapZoom(Number(map.current.getZoom().toFixed(2)));
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []); // Only run once on mount

  // Add field markers and aerial overlays
  useEffect(() => {
    if (!map.current || !fields.length) return;

    // Wait for map to load
    map.current.on('load', () => {
      if (!map.current) return;

      // Remove existing markers and sources
      const markers = document.getElementsByClassName('mapboxgl-marker');
      while (markers[0]) {
        markers[0].remove();
      }

      // Remove existing aerial overlay sources
      fields.forEach((field) => {
        const sourceId = `aerial-overlay-${field.id}`;
        if (map.current!.getSource(sourceId)) {
          if (map.current!.getLayer(sourceId)) {
            map.current!.removeLayer(sourceId);
          }
          map.current!.removeSource(sourceId);
        }
      });

      const bounds = new mapboxgl.LngLatBounds();
      let markersAdded = 0;

      // Add markers and overlays for each field
      fields.forEach((field) => {
        if (!field.latitude || !field.longitude) return;

        const { latitude, longitude } = field;

        // Add aerial image overlay if available
        if (showAerialOverlays && field.aerial_image_url && field.aerial_image_bounds) {
          try {
            const sourceId = `aerial-overlay-${field.id}`;
            const bounds = field.aerial_image_bounds;
            
            // Add raster source for aerial image
            map.current!.addSource(sourceId, {
              type: 'image',
              url: field.aerial_image_url,
              coordinates: [
                [bounds.west, bounds.north], // top-left
                [bounds.east, bounds.north], // top-right
                [bounds.east, bounds.south], // bottom-right
                [bounds.west, bounds.south]  // bottom-left
              ]
            });

            // Add layer for aerial overlay
            map.current!.addLayer({
              id: sourceId,
              type: 'raster',
              source: sourceId,
              paint: {
                'raster-opacity': 0.8
              }
            });
          } catch (error) {
            console.error('Error adding aerial overlay for field:', field.name, error);
          }
        }

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-field-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#8b5cf6';
        el.style.border = '3px solid #ffffff';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '16px';
        el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        el.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

        // Add field type emoji
        const getFieldIcon = (type: string) => {
          switch (type) {
            case 'soccer':
            case 'football':
              return '⚽';
            case 'basketball':
              return '🏀';
            case 'tennis':
              return '🎾';
            case 'baseball':
              return '⚾';
            case 'pool':
              return '🏊';
            case 'track':
              return '🏃';
            default:
              return '🏟️';
          }
        };

        el.innerHTML = getFieldIcon(field.type);

        // Create compact summary popup content for single-click
        const summaryPopupContent = `
          <div class="field-summary-popup" style="padding: 12px; min-width: 200px; max-width: 240px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 20px; margin-right: 8px;">${getFieldIcon(field.type)}</span>
              <div>
                <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff;">${field.name}</h4>
                <p style="margin: 0; font-size: 12px; color: #d1d5db;">${field.type} • ${field.surface_type?.replace('_', ' ') || 'Standard'}</p>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; font-size: 11px; color: #d1d5db;">
              <div>💰 $${field.hourly_rate}/hr</div>
              <div>📅 $${field.daily_rate}/day</div>
              ${field.capacity ? `<div>👥 ${field.capacity}</div>` : '<div></div>'}
              ${field.dimensions ? `<div>📏 ${field.dimensions}</div>` : '<div></div>'}
            </div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 8px;">
              ${field.has_lighting ? '<span style="background: #fbbf24; color: #92400e; padding: 1px 4px; border-radius: 8px; font-size: 9px;">💡</span>' : ''}
              ${field.has_parking ? '<span style="background: #10b981; color: #065f46; padding: 1px 4px; border-radius: 8px; font-size: 9px;">🚗</span>' : ''}
              ${field.ada_compliant ? '<span style="background: #3b82f6; color: #1e40af; padding: 1px 4px; border-radius: 8px; font-size: 9px;">♿</span>' : ''}
            </div>
            
            <div style="text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #374151; padding-top: 6px;">
              Double-click for details
            </div>
          </div>
        `;

        // Create summary popup (for single-click)
        const summaryPopup = new mapboxgl.Popup({ 
          offset: 30,
          className: 'field-summary-popup',
          maxWidth: '240px',
          closeButton: true,
          closeOnClick: false
        }).setHTML(summaryPopupContent);

        // Add marker to map
        const marker = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current!);

        // Add to bounds
        bounds.extend([longitude, latitude]);
        markersAdded++;

        // Store popup reference for this marker
        let currentHoverPopup: mapboxgl.Popup | null = null;

        // Hover effects
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
          el.style.boxShadow = '0 6px 12px rgba(139, 92, 246, 0.5)';
          
          // Create and show hover popup
          currentHoverPopup = new mapboxgl.Popup({ 
            offset: 15,
            className: 'field-hover-popup',
            closeButton: false,
            closeOnClick: false,
            closeOnMove: false
          })
          .setLngLat([longitude, latitude])
          .setHTML(`
            <div class="field-hover-tooltip" style="padding: 8px; min-width: 160px; background: rgba(17, 24, 39, 0.95); border: 1px solid #374151; border-radius: 8px; backdrop-filter: blur(8px);">
              <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 16px; margin-right: 6px;">${getFieldIcon(field.type)}</span>
                <div>
                  <h4 style="margin: 0; font-size: 13px; font-weight: 600; color: #ffffff;">${field.name}</h4>
                  <p style="margin: 0; font-size: 10px; color: #d1d5db; text-transform: capitalize;">${field.type} • ${field.surface_type?.replace('_', ' ') || 'Standard'}</p>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; font-size: 10px; color: #d1d5db;">
                <div>💰 $${field.hourly_rate}/hr</div>
                <div>📅 $${field.daily_rate}/day</div>
                ${field.capacity ? `<div>👥 ${field.capacity}</div>` : '<div></div>'}
                ${field.dimensions ? `<div>📏 ${field.dimensions}</div>` : '<div></div>'}
              </div>
              
              <div style="display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 6px;">
                ${field.has_lighting ? '<span style="background: #fbbf24; color: #92400e; padding: 1px 4px; border-radius: 6px; font-size: 8px;">💡</span>' : ''}
                ${field.has_parking ? '<span style="background: #10b981; color: #065f46; padding: 1px 4px; border-radius: 6px; font-size: 8px;">🚗</span>' : ''}
                ${field.ada_compliant ? '<span style="background: #3b82f6; color: #1e40af; padding: 1px 4px; border-radius: 6px; font-size: 8px;">♿</span>' : ''}
              </div>
              
              <div style="text-align: center; font-size: 9px; color: #6b7280; border-top: 1px solid #374151; padding-top: 4px;">
                Click for summary • Double-click for details
              </div>
            </div>
          `)
          .addTo(map.current!);
        });

        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          if (currentHoverPopup) {
            currentHoverPopup.remove();
            currentHoverPopup = null;
          }
        });

        // Handle click interactions with proper timing
        let clickCount = 0;
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          clickCount++;
          
          // Close hover popup if open
          if (currentHoverPopup) {
            currentHoverPopup.remove();
            currentHoverPopup = null;
          }
          
          if (clickCount === 1) {
            // Single click - show summary popup after delay
            clickTimeoutRef.current = setTimeout(() => {
              if (clickCount === 1) {
                // Single click confirmed - show summary popup
                summaryPopup.setLngLat([longitude, latitude]).addTo(map.current!);
                
                if (onFieldClick) {
                  onFieldClick(field);
                }
              }
              clickCount = 0;
            }, 300); // 300ms delay to detect double-click
          } else if (clickCount === 2) {
            // Double click - clear timeout and open detailed view
            if (clickTimeoutRef.current) {
              clearTimeout(clickTimeoutRef.current);
              clickTimeoutRef.current = null;
            }
            
            // Close any open popups
            summaryPopup.remove();
            
            // Open detailed field view
            if (onFieldDoubleClick) {
              onFieldDoubleClick(field);
            }
            
            clickCount = 0;
          }
        });

        // Prevent popup from interfering with double-click
        el.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          e.preventDefault();
        });
      });

      // Fit map to show all fields
      if (markersAdded > 0) {
        map.current!.fitBounds(bounds, {
          padding: 50,
          maxZoom: 16
        });
      }
    });
  }, [fields, onFieldClick, onFieldDoubleClick, showAerialOverlays]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Show placeholder if no token
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400 p-8">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-white mb-2">Mapbox Token Required</h4>
          <p className="text-sm max-w-md mb-4">
            To display the field map, add your Mapbox access token to the <code className="bg-gray-900 px-2 py-1 rounded">.env.local</code> file:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 text-left">
            <code className="text-xs text-purple-400">
              NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-token-here
            </code>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Get a free token at <a href="https://account.mapbox.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">mapbox.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-gray-300">
        Lng: {lng} | Lat: {lat} | Zoom: {mapZoom}
      </div>
      <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-gray-300">
        Showing {fields.length} field{fields.length !== 1 ? 's' : ''}
        {showAerialOverlays && fields.some(f => f.aerial_image_url) && (
          <span className="ml-2 text-purple-400">• Aerial overlays enabled</span>
        )}
      </div>
      <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-gray-300">
        💡 Single-click: Summary • Double-click: Details
      </div>
    </div>
  );
} 