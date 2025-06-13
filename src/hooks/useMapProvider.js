import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export const useMapProvider = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapboxApiToken, setMapboxApiToken] = useState('');

  const initializeMap = (onSuccess, onError) => {
    if (!mapboxApiToken) {
      onError('Please enter your Mapbox API token');
      return;
    }

    if (map.current) return; // Initialize map only once

    // Mapbox GL JS - requires API key
    mapboxgl.accessToken = mapboxApiToken;
    
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard', // Mapbox Standard style with 3D buildings
      zoom: 16,
      center: [24.9441, 60.1710], // Senate Square, Helsinki
      pitch: 60,
      bearing: -20,
      antialias: true
    });

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current = mapInstance;
    
    // Wait for map to load before adding 3D buildings layer
    map.current.on('style.load', () => {
      // For Mapbox, 3D buildings are included in the Standard style
      const layers = map.current.getStyle().layers;
      
      // Find the building layer and ensure it's visible
      for (const layer of layers) {
        if (layer.type === 'fill-extrusion' && layer.id.includes('building')) {
          map.current.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.8);
        }
      }

      // Add sky layer for better 3D effect
      map.current.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });

      setMapInitialized(true);
      onSuccess('Map initialized successfully with Mapbox GL JS!');
    });

    map.current.on('error', (error) => {
      console.error('Map error:', error);
      onError('Failed to initialize map with Mapbox. Please check your API token.');
    });
  };

  const resetMap = () => {
    if (map.current) {
      map.current.remove();
      map.current = null;
      setMapInitialized(false);
    }
  };

  return {
    mapContainer,
    map,
    mapInitialized,
    mapboxApiToken,
    setMapboxApiToken,
    initializeMap,
    resetMap
  };
};