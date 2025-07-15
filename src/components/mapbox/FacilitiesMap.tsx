'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geocodeAddresses } from '@/utils/geocoding';
import { useTheme } from 'next-themes';
import type { Field } from '@/types/field';
import type { Facility } from '@/types/facility';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, Satellite, Moon, Sun, Layers } from 'lucide-react';

// Set the access token from environment variable
if (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
}

interface FacilitiesMapProps {
  facilities?: Facility[];
  fields?: Field[];
  center?: [number, number];
  zoom?: number;
  onFacilityClick?: (facility: Facility) => void;
  onFieldClick?: (field: Field) => void;
  onFieldDoubleClick?: (field: Field) => void;
}

type MapStyle = 'streets' | 'satellite' | 'terrain' | 'dark' | 'light';

export function FacilitiesMap({ 
  facilities = [], 
  fields = [],
  center = [-119.7871, 36.7378], // Default to Fresno, CA
  zoom = 10,
  onFacilityClick,
  onFieldClick,
  onFieldDoubleClick
}: FacilitiesMapProps) {
  const { theme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>('streets');
  const [lng, setLng] = useState(center[0]);
  const [lat, setLat] = useState(center[1]);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [geocodedFacilities, setGeocodedFacilities] = useState(() => new Map<string, any>());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [hoverTooltip, setHoverTooltip] = useState<{
    content: string;
    x: number;
    y: number;
    visible: boolean;
  }>({ content: '', x: 0, y: 0, visible: false });

  // Helper to create facility popup HTML
  const createFacilityPopupHTML = (props: Record<string, any> | null): string => {
    if (!props) return '';
    return `
      <div class="p-4 bg-card text-card-foreground">
        <h3 class="font-semibold text-lg text-foreground mb-2">${props.name || ''}</h3>
        <p class="text-sm text-muted-foreground mb-2">${props.facility_type || ''}</p>
        <p class="text-sm text-muted-foreground mb-2">${props.address || ''}</p>
        <div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>Size: ${props.square_footage?.toLocaleString() || 'N/A'} sq ft</div>
          <div>Built: ${props.year_built || 'N/A'}</div>
          <div>Status: <span class="text-green-500">${props.status || ''}</span></div>
        </div>
      </div>
    `;
  };

  // Helper to create field popup HTML
  const createFieldPopupHTML = (props: Record<string, any> | null): string => {
    if (!props) return '';
    const fieldAddress = props.full_address || `${props.latitude || ''}, ${props.longitude || ''}`;
    const surfaceType = typeof props.surface_type === 'string' ? props.surface_type.replace('_', ' ') : 'Standard';
    return `
      <div class="p-4 bg-card text-card-foreground">
        <div class="flex items-center mb-2">
          <span class="text-2xl mr-2">${props.icon || ''}</span>
          <div>
            <h3 class="font-semibold text-lg text-foreground">${props.name || ''}</h3>
            <p class="text-sm text-muted-foreground">${props.field_type || ''} • ${surfaceType}</p>
          </div>
        </div>
        <div class="mb-3 p-2 bg-muted/50 rounded-md">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>
            <div class="flex-1">
              <p class="text-xs text-muted-foreground font-medium">Field Location</p>
              <p class="text-xs text-foreground">${fieldAddress}</p>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
          <div>💰 $${props.hourly_rate || '0'}/hr</div>
          <div>📅 $${props.daily_rate || '0'}/day</div>
          ${props.capacity ? `<div>👥 ${props.capacity}</div>` : ''}
          ${props.dimensions ? `<div>📏 ${props.dimensions}</div>` : ''}
        </div>
        <div class="flex flex-wrap gap-1 mb-2">
          ${props.has_lighting ? '<span class="bg-yellow-500 text-yellow-900 px-2 py-1 rounded text-xs">💡 Lighting</span>' : ''}
          ${props.has_parking ? '<span class="bg-green-500 text-green-900 px-2 py-1 rounded text-xs">🚗 Parking</span>' : ''}
          ${props.ada_compliant ? '<span class="bg-blue-500 text-blue-900 px-2 py-1 rounded text-xs">♿ ADA</span>' : ''}
        </div>
        <p class="text-xs text-muted-foreground">Status: <span class="text-green-500">${props.status || ''}</span></p>
        <div class="text-center mt-3 pt-2 border-t border-border">
          <p class="text-xs text-muted-foreground">Double-click to book this field</p>
        </div>
      </div>
    `;
  };

  // Helper to create facility tooltip HTML
  const createFacilityTooltipHTML = (props: Record<string, any> | null): string => {
    if (!props) return '';
    const facilityType = typeof props.facility_type === 'string' ? props.facility_type.replace('_', ' ') : '';
    return `
      <div class="facility-hover-tooltip" style="padding: 8px; min-width: 180px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; backdrop-filter: blur(8px); color: var(--card-foreground);">
        <div style="display: flex; align-items: center; margin-bottom: 6px;">
          <div style="width: 8px; height: 8px; background: ${props.status === 'active' ? '#10b981' : '#6b7280'}; border-radius: 50%; margin-right: 8px;"></div>
          <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--foreground);">${props.name || ''}</h4>
        </div>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: var(--muted-foreground); text-transform: capitalize;">${facilityType}</p>
        <p style="margin: 0 0 6px 0; font-size: 11px; color: var(--muted-foreground);">${props.address || ''}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; color: var(--muted-foreground);">
          <div>📐 ${props.square_footage?.toLocaleString() || 'N/A'} sq ft</div>
          <div>📅 ${props.year_built || 'N/A'}</div>
        </div>
        <div style="text-align: center; font-size: 9px; color: var(--muted-foreground); margin-top: 6px; padding-top: 4px; border-top: 1px solid var(--border);">
          Click to view details
        </div>
      </div>
    `;
  };

  // Helper to create field tooltip HTML
  const createFieldTooltipHTML = (props: Record<string, any> | null): string => {
    if (!props) return '';
    const fieldAddress = props.full_address || `${props.latitude || ''}, ${props.longitude || ''}`;
    const surfaceType = typeof props.surface_type === 'string' ? props.surface_type.replace('_', ' ') : 'Standard';
    return `
      <div class="field-hover-tooltip" style="padding: 8px; min-width: 160px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; backdrop-filter: blur(8px); color: var(--card-foreground);">
        <div style="display: flex; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 16px; margin-right: 6px;">${props.icon || ''}</span>
          <div>
            <h4 style="margin: 0; font-size: 13px; font-weight: 600; color: var(--foreground);">${props.name || ''}</h4>
            <p style="margin: 0; font-size: 10px; color: var(--muted-foreground); text-transform: capitalize;">${props.field_type || ''} • ${surfaceType}</p>
          </div>
        </div>
        <div style="margin-bottom: 6px; padding: 4px; background: var(--muted); border-radius: 4px;">
          <div style="display: flex; align-items: start; gap: 4px;">
            <div style="margin-top: 1px;">📍</div>
            <p style="margin: 0; font-size: 9px; color: var(--foreground); line-height: 1.2;">${fieldAddress}</p>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; font-size: 10px; color: var(--muted-foreground);">
          <div>💰 $${props.hourly_rate || '0'}/hr</div>
          <div>📅 $${props.daily_rate || '0'}/day</div>
          ${props.capacity ? `<div>👥 ${props.capacity}</div>` : ''}
          ${props.dimensions ? `<div>📏 ${props.dimensions}</div>` : ''}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 6px;">
          ${props.has_lighting ? '<span style="background: #fbbf24; color: #92400e; padding: 1px 4px; border-radius: 6px; font-size: 8px;">💡</span>' : ''}
          ${props.has_parking ? '<span style="background: #10b981; color: #065f46; padding: 1px 4px; border-radius: 6px; font-size: 8px;">🚗</span>' : ''}
          ${props.ada_compliant ? '<span style="background: #3b82f6; color: #1e40af; padding: 1px 4px; border-radius: 6px; font-size: 8px;">♿</span>' : ''}
        </div>
        <div style="text-align: center; font-size: 9px; color: var(--muted-foreground); border-top: 1px solid var(--border); padding-top: 4px;">
          Click for details • Double-click to book
        </div>
      </div>
    `;
  };

  // Helper to create cluster tooltip HTML
  const createClusterTooltipHTML = (props: Record<string, any> | null, itemType: 'Facility' | 'Field'): string => {
    if (!props) return '';
    const icon = itemType === 'Facility' ? '🏢' : '🏟️';
    return `
      <div style="padding: 8px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; backdrop-filter: blur(8px); color: var(--card-foreground);">
        <div style="text-align: center;">
          <div style="font-size: 16px; margin-bottom: 4px;">${icon}</div>
          <div style="font-size: 14px; font-weight: 600; color: var(--foreground);">${props.point_count || 0} ${itemType}s</div>
          <div style="font-size: 10px; color: var(--muted-foreground); margin-top: 4px;">Click to zoom in</div>
        </div>
      </div>
    `;
  };

  // Map style configurations
  const getMapStyle = (style: MapStyle, themeMode: string) => {
    const styles = {
      streets: themeMode === 'light' ? 'mapbox://styles/mapbox/streets-v11' : 'mapbox://styles/mapbox/dark-v11',
      satellite: 'mapbox://styles/mapbox/satellite-v9',
      terrain: 'mapbox://styles/mapbox/outdoors-v11',
      dark: 'mapbox://styles/mapbox/dark-v11',
      light: 'mapbox://styles/mapbox/light-v11'
    };
    return styles[style];
  };

  const mapStyleOptions = [
    { 
      id: 'streets' as MapStyle, 
      label: 'Streets', 
      iconName: 'Map',
      description: 'Standard street map'
    },
    { 
      id: 'satellite' as MapStyle, 
      label: 'Aerial', 
      iconName: 'Satellite',
      description: 'Satellite imagery'
    },
    { 
      id: 'terrain' as MapStyle, 
      label: 'Terrain', 
      iconName: 'Layers',
      description: 'Topographic map'
    },
    { 
      id: 'dark' as MapStyle, 
      label: 'Dark', 
      iconName: 'Moon',
      description: 'Dark theme'
    },
    { 
      id: 'light' as MapStyle, 
      label: 'Light', 
      iconName: 'Sun',
      description: 'Light theme'
    }
  ];

  const handleStyleChange = (newStyle: MapStyle) => {
    if (!map.current) return;
    
    setCurrentMapStyle(newStyle);
    const mapStyle = getMapStyle(newStyle, theme || 'light');
    map.current.setStyle(mapStyle);
    
    // Re-add data sources and layers after style loads
    map.current.once('styledata', () => {
      addDataSources();
    });
  };

  // Get field icon emoji based on type
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

  // Create GeoJSON data for facilities
  const createFacilitiesGeoJSON = (): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = [];
    
    facilities.forEach((facility) => {
      const geocoded = geocodedFacilities.get(facility.id);
      if (!geocoded) return;

      const { latitude, longitude } = geocoded;
      
      features.push({
        type: 'Feature',
        properties: {
          id: facility.id,
          name: facility.name,
          type: 'facility',
          facility_type: facility.facility_type,
          status: facility.status,
          address: facility.address,
          square_footage: facility.square_footage,
          year_built: facility.year_built,
          icon: '🏢'
        },
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      });
    });

    return {
      type: 'FeatureCollection',
      features
    };
  };

  // Create GeoJSON data for fields
  const createFieldsGeoJSON = (): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = [];
    
    fields.forEach((field) => {
      if (!field.latitude || !field.longitude) return;

      features.push({
        type: 'Feature',
        properties: {
          id: field.id,
          name: field.name,
          type: 'field',
          field_type: field.type,
          status: field.status,
          hourly_rate: field.hourly_rate,
          daily_rate: field.daily_rate,
          capacity: field.capacity,
          dimensions: field.dimensions,
          surface_type: field.surface_type,
          has_lighting: field.has_lighting,
          has_parking: field.has_parking,
          ada_compliant: field.ada_compliant,
          full_address: field.full_address || field.street_address,
          icon: getFieldIcon(field.type)
        },
        geometry: {
          type: 'Point',
          coordinates: [field.longitude, field.latitude]
        }
      });
    });

    return {
      type: 'FeatureCollection',
      features
    };
  };

  // Add data sources and layers to the map
  const addDataSources = () => {
    if (!map.current) return;

    const facilitiesData = createFacilitiesGeoJSON();
    const fieldsData = createFieldsGeoJSON();

    // Remove existing sources if they exist
    if (map.current.getSource('facilities')) {
      // Remove all layers that use the facilities source
      if (map.current.getLayer('facilities-clusters')) {
        map.current.removeLayer('facilities-clusters');
      }
      if (map.current.getLayer('facilities-cluster-count')) {
        map.current.removeLayer('facilities-cluster-count');
      }
      if (map.current.getLayer('facilities-unclustered-point')) {
        map.current.removeLayer('facilities-unclustered-point');
      }
      if (map.current.getLayer('facilities-labels')) {
        map.current.removeLayer('facilities-labels');
      }
      map.current.removeSource('facilities');
    }

    if (map.current.getSource('fields')) {
      // Remove all layers that use the fields source
      if (map.current.getLayer('fields-clusters')) {
        map.current.removeLayer('fields-clusters');
      }
      if (map.current.getLayer('fields-cluster-count')) {
        map.current.removeLayer('fields-cluster-count');
      }
      if (map.current.getLayer('fields-unclustered-point')) {
        map.current.removeLayer('fields-unclustered-point');
      }
      if (map.current.getLayer('fields-labels')) {
        map.current.removeLayer('fields-labels');
      }
      map.current.removeSource('fields');
    }

    // Add facilities source with clustering
    map.current.addSource('facilities', {
      type: 'geojson',
      data: facilitiesData,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    // Add fields source with clustering
    map.current.addSource('fields', {
      type: 'geojson',
      data: fieldsData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add facility cluster circles
    map.current.addLayer({
      id: 'facilities-clusters',
      type: 'circle',
      source: 'facilities',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#8b5cf6', // Purple for small clusters
          5,
          '#7c3aed', // Darker purple for medium clusters
          10,
          '#6d28d9'  // Even darker purple for large clusters
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, // Small cluster radius
          5,
          25, // Medium cluster radius
          10,
          30  // Large cluster radius
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add facility cluster count labels
    map.current.addLayer({
      id: 'facilities-cluster-count',
      type: 'symbol',
      source: 'facilities',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 14
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Add individual facility points (not clustered)
    map.current.addLayer({
      id: 'facilities-unclustered-point',
      type: 'circle',
      source: 'facilities',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#8b5cf6',
        'circle-radius': 15,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add facility labels for individual points
    map.current.addLayer({
      id: 'facilities-labels',
      type: 'symbol',
      source: 'facilities',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': '🏢',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 16
      }
    });

    // Add field cluster circles
    map.current.addLayer({
      id: 'fields-clusters',
      type: 'circle',
      source: 'fields',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#10b981', // Green for small clusters
          5,
          '#059669', // Darker green for medium clusters
          10,
          '#047857'  // Even darker green for large clusters
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, // Small cluster radius
          5,
          25, // Medium cluster radius
          10,
          30  // Large cluster radius
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add field cluster count labels
    map.current.addLayer({
      id: 'fields-cluster-count',
      type: 'symbol',
      source: 'fields',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 14
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Add individual field points (not clustered)
    map.current.addLayer({
      id: 'fields-unclustered-point',
      type: 'circle',
      source: 'fields',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#10b981',
        'circle-radius': 12,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add field emoji labels for individual points
    map.current.addLayer({
      id: 'fields-labels',
      type: 'symbol',
      source: 'fields',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'icon'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 14
      }
    });

    // Add click handlers for clusters and individual points
    addClickHandlers();
    addHoverHandlers();
  };

  // Add click handlers for map interactions
  const addClickHandlers = () => {
    if (!map.current) return;

    // Handle facility cluster clicks (zoom in)
    map.current.on('click', 'facilities-clusters', (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['facilities-clusters']
      });
      if (!features.length || !features[0].properties) return;
      
      const clusterId = features[0].properties.cluster_id;
      const source = map.current!.getSource('facilities') as mapboxgl.GeoJSONSource;
      
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        
        const geometry = features[0].geometry;
        if (geometry.type === 'Point') {
          map.current!.easeTo({
            center: geometry.coordinates as [number, number],
            zoom: zoom || 10
          });
        }
      });
    });

    // Handle field cluster clicks (zoom in)
    map.current.on('click', 'fields-clusters', (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['fields-clusters']
      });
      if (!features.length || !features[0].properties) return;
      
      const clusterId = features[0].properties.cluster_id;
      const source = map.current!.getSource('fields') as mapboxgl.GeoJSONSource;
      
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        
        const geometry = features[0].geometry;
        if (geometry.type === 'Point') {
          map.current!.easeTo({
            center: geometry.coordinates as [number, number],
            zoom: zoom || 10
          });
        }
      });
    });

    // Handle individual facility clicks
    map.current.on('click', 'facilities-unclustered-point', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      if (!feature.properties) return;
      
      const facilityId = feature.properties.id;
      const facility = facilities.find(f => f.id === facilityId);
      
      if (facility && onFacilityClick) {
        onFacilityClick(facility);
      }

      // Show popup
      const { geometry } = feature;
      if (geometry.type === 'Point') {
        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(geometry.coordinates as [number, number])
          .setHTML(createFacilityPopupHTML(feature.properties))
          .addTo(map.current!);
      }
    });

    // Handle individual field clicks and double-clicks
    let fieldClickTimeout: NodeJS.Timeout | null = null;
    
    map.current.on('click', 'fields-unclustered-point', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      if (!feature.properties) return;

      const fieldId = feature.properties.id;
      const field = fields.find(f => f.id === fieldId);
      
      if (!field) return;

      // Clear any existing timeout
      if (fieldClickTimeout) {
        clearTimeout(fieldClickTimeout);
        fieldClickTimeout = null;
        return;
      }

      // Set timeout for single click
      fieldClickTimeout = setTimeout(() => {
        if (onFieldClick) {
          onFieldClick(field);
        }

        // Show popup
        const { geometry } = feature;
        if (geometry.type !== 'Point') return;

        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(geometry.coordinates as [number, number])
          .setHTML(createFieldPopupHTML(feature.properties))
          .addTo(map.current!);

        fieldClickTimeout = null;
      }, 250); // 250ms delay to detect double-click
    });

    // Handle field double-clicks
    map.current.on('dblclick', 'fields-unclustered-point', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      if (!feature.properties) return;

      const fieldId = feature.properties.id;
      const field = fields.find(f => f.id === fieldId);
      
      // Clear single click timeout
      if (fieldClickTimeout) {
        clearTimeout(fieldClickTimeout);
        fieldClickTimeout = null;
      }
      
      if (field && onFieldDoubleClick) {
        onFieldDoubleClick(field);
      }
    });

    // Change cursor to pointer when hovering over clickable features
    map.current.on('mouseenter', 'facilities-clusters', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'facilities-clusters', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
    });

    map.current.on('mouseenter', 'fields-clusters', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'fields-clusters', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
    });

    map.current.on('mouseenter', 'facilities-unclustered-point', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'facilities-unclustered-point', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
    });

    map.current.on('mouseenter', 'fields-unclustered-point', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'fields-unclustered-point', () => {
      if (!map.current) return;
      map.current.getCanvas().style.cursor = '';
    });
  };

  // Add hover handlers for tooltips
  const addHoverHandlers = () => {
    if (!map.current) return;

    // Hover handlers for individual facilities
    map.current.on('mouseenter', 'facilities-unclustered-point', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      if (!feature.properties) return;
      
      setHoverTooltip({
        visible: true,
        x: e.point.x + 15,
        y: e.point.y - 10,
        content: createFacilityTooltipHTML(feature.properties)
      });
    });

    map.current.on('mouseleave', 'facilities-unclustered-point', () => {
      setHoverTooltip(prev => ({ ...prev, visible: false }));
    });

    // Hover handlers for individual fields
    map.current.on('mouseenter', 'fields-unclustered-point', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      if (!feature.properties) return;

      setHoverTooltip({
        visible: true,
        x: e.point.x + 15,
        y: e.point.y - 10,
        content: createFieldTooltipHTML(feature.properties)
      });
    });

    map.current.on('mouseleave', 'fields-unclustered-point', () => {
      setHoverTooltip(prev => ({ ...prev, visible: false }));
    });

    // Hover handlers for clusters
    map.current.on('mouseenter', 'facilities-clusters', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      if (!feature.properties) return;
      
      setHoverTooltip({
        visible: true,
        x: e.point.x + 15,
        y: e.point.y - 10,
        content: createClusterTooltipHTML(feature.properties, 'Facility')
      });
    });

    map.current.on('mouseleave', 'facilities-clusters', () => {
      setHoverTooltip(prev => ({ ...prev, visible: false }));
    });

    map.current.on('mouseenter', 'fields-clusters', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      if (!feature.properties) return;
      
      setHoverTooltip({
        visible: true,
        x: e.point.x + 15,
        y: e.point.y - 10,
        content: createClusterTooltipHTML(feature.properties, 'Field')
      });
    });

    map.current.on('mouseleave', 'fields-clusters', () => {
      setHoverTooltip(prev => ({ ...prev, visible: false }));
    });
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if token is available
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      console.error('Mapbox token not found. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file');
      return;
    }

    // Initialize map with theme-aware style
    const mapStyle = getMapStyle(currentMapStyle, theme || 'light');
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: center,
      zoom: zoom,
      pitch: 0,
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Update coordinates on move
    map.current.on('move', () => {
      if (!map.current) return;
      setLng(Number(map.current.getCenter().lng.toFixed(4)));
      setLat(Number(map.current.getCenter().lat.toFixed(4)));
      setMapZoom(Number(map.current.getZoom().toFixed(2)));
    });

    // Wait for map to load before adding sources
    map.current.on('load', () => {
      addDataSources();
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []); // Only run once on mount

  // Update map style when theme or style changes
  useEffect(() => {
    if (!map.current) return;
    
    const mapStyle = getMapStyle(currentMapStyle, theme || 'light');
    map.current.setStyle(mapStyle);
    
    // Re-add data sources after style loads
    map.current.once('styledata', () => {
      addDataSources();
    });
  }, [theme, currentMapStyle]);

  // Geocode facilities when they change
  useEffect(() => {
    if (!facilities.length) return;

    const geocodeFacilities = async () => {
      setIsGeocoding(true);
      
      const addressesToGeocode = facilities.map(facility => ({
        id: facility.id,
        address: facility.address
      }));

      const results = await geocodeAddresses(addressesToGeocode);
      setGeocodedFacilities(results);
      setIsGeocoding(false);
    };

    geocodeFacilities();
  }, [facilities]);

  // Update data sources when facilities or fields change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    addDataSources();
  }, [facilities, fields, geocodedFacilities]);

  // Show placeholder if no token
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="w-full h-full bg-card rounded-lg flex items-center justify-center border border-border">
        <div className="text-center text-muted-foreground p-8">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-foreground mb-2">Mapbox Token Required</h4>
          <p className="text-sm max-w-md mb-4">
            To display the map, add your Mapbox access token to the <code className="bg-muted px-2 py-1 rounded">.env.local</code> file:
          </p>
          <div className="bg-muted rounded-lg p-4 text-left">
            <code className="text-xs text-primary">
              NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-token-here
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Get a free token at <a href="https://account.mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">mapbox.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Map Style Controls */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 z-40">
        <div className="grid grid-cols-5 gap-1">
          {mapStyleOptions.map((option) => (
            <Button
              key={option.id}
              variant={currentMapStyle === option.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handleStyleChange(option.id)}
              className={`p-2 h-8 w-8 ${
                currentMapStyle === option.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              title={`${option.label} - ${option.description}`}
            >
              {option.iconName === 'Map' && <MapIcon className="h-3 w-3" />}
              {option.iconName === 'Satellite' && <Satellite className="h-3 w-3" />}
              {option.iconName === 'Layers' && <Layers className="h-3 w-3" />}
              {option.iconName === 'Moon' && <Moon className="h-3 w-3" />}
              {option.iconName === 'Sun' && <Sun className="h-3 w-3" />}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Hover Tooltip */}
      {hoverTooltip.visible && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: `${hoverTooltip.x}px`,
            top: `${hoverTooltip.y}px`,
            transform: 'translate(0, -100%)'
          }}
          dangerouslySetInnerHTML={{ __html: hoverTooltip.content }}
        />
      )}
      
      {/* Geocoding Status */}
      {isGeocoding && (
        <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-primary-foreground flex items-center border border-border">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
          Loading facilities...
        </div>
      )}

      {/* Facilities and Fields Counter */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-card-foreground border border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>{geocodedFacilities.size} facilities</span>
          </div>
          {fields.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{fields.length} fields</span>
            </div>
          )}
        </div>
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-card-foreground border border-border">
        <div className="text-center">
          <div className="text-muted-foreground">Zoom level: {mapZoom}</div>
          <div className="text-muted-foreground text-xs mt-1">
            {mapZoom < 12 ? 'Zoom in to see individual markers' : 'Individual markers visible'}
          </div>
        </div>
      </div>
    </div>
  );
} 