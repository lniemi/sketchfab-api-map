import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export const useMapProvider = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapboxApiToken, setMapboxApiToken] = useState(
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
  );
  const [mapError, setMapError] = useState('');

  const initializeMap = (onSuccess, onError) => {
    if (!mapboxApiToken) {
      const errorMsg = 'Mapbox API token is required';
      setMapError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    if (map.current) return; // Initialize map only once

    try {
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
        setMapError('');
        if (onSuccess) onSuccess('Map initialized successfully!');
      });

      map.current.on('error', (error) => {
        console.error('Map error:', error);
        const errorMsg = 'Failed to initialize map. Please check your API token.';
        setMapError(errorMsg);
        if (onError) onError(errorMsg);
      });
    } catch (error) {
      console.error('Map initialization error:', error);
      const errorMsg = 'Failed to initialize map. Please check your API token.';
      setMapError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  // Auto-initialize map when component mounts and API token is available
  useEffect(() => {
    if (mapboxApiToken && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [mapboxApiToken]);

  const resetMap = () => {
    if (map.current) {
      map.current.remove();
      map.current = null;
      setMapInitialized(false);
      setMapError('');
    }
  };
  return {
    mapContainer,
    map,
    mapInitialized,
    mapboxApiToken,
    setMapboxApiToken,
    mapError,
    initializeMap,
    resetMap
  };
};