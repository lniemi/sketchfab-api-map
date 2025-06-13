import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import maplibregl from 'maplibre-gl';

export const useMapProvider = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapProvider, setMapProvider] = useState('maplibre');
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapboxApiToken, setMapboxApiToken] = useState('');

  const initializeMap = (onSuccess, onError) => {
    if (mapProvider === 'mapbox' && !mapboxApiToken) {
      onError('Please enter your Mapbox API token to use Mapbox');
      return;
    }

    if (map.current) return; // Initialize map only once

    let mapInstance;
    
    if (mapProvider === 'maplibre') {
      // MapLibre GL JS - no API key required
      mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.stadiamaps.com/styles/alidade_bright.json', // Stadia Maps style
        zoom: 16,
        center: [24.9441, 60.1710], // Senate Square, Helsinki
        pitch: 60,
        bearing: -20,
        antialias: true
      });

      // Add RTL text plugin for better text rendering
      maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js');

      // Add navigation controls
      mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
    } else {
      // Mapbox GL JS - requires API key
      mapboxgl.accessToken = mapboxApiToken;
      
      mapInstance = new mapboxgl.Map({
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
    }

    map.current = mapInstance;
    
    // Wait for map to load before adding 3D buildings layer
    map.current.on('style.load', () => {
      if (mapProvider === 'maplibre') {
        // Add 3D buildings layer for MapLibre using the same approach as the example
        const layers = map.current.getStyle().layers;

        // Find the first symbol layer to add buildings underneath
        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
          }
        }

        map.current.addLayer({
          'id': '3d-buildings',
          'source': 'openmaptiles',
          'source-layer': 'building',
          'filter': [
            "!",
            ["to-boolean",
              ["get", "hide_3d"]
            ]
          ],
          'type': 'fill-extrusion',
          'minzoom': 13,
          'paint': {
            'fill-extrusion-color': 'lightgray',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13,
              0,
              16,
              ['get', 'render_height']
            ],
            'fill-extrusion-base': ['case',
              ['>=', ['get', 'zoom'], 16],
              ['get', 'render_min_height'], 0
            ]
          }
        }, labelLayerId);
      } else {
        // For Mapbox, 3D buildings are included in the Standard style
        const layers = map.current.getStyle().layers;
        
        // Find the building layer and ensure it's visible
        for (const layer of layers) {
          if (layer.type === 'fill-extrusion' && layer.id.includes('building')) {
            map.current.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.8);
          }
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
      onSuccess(`Map initialized successfully with ${mapProvider === 'maplibre' ? 'MapLibre GL JS' : 'Mapbox GL JS'}!`);
    });

    map.current.on('error', (error) => {
      console.error('Map error:', error);
      onError(`Failed to initialize map with ${mapProvider}. ${mapProvider === 'mapbox' ? 'Please check your Mapbox API token.' : 'Please try again.'}`);
    });
  };

  const resetMap = () => {
    if (map.current) {
      map.current.remove();
      map.current = null;
      setMapInitialized(false);
    }
  };

  // Auto-initialize MapLibre on first load (no API key needed)
  useEffect(() => {
    if (mapProvider === 'maplibre' && !mapInitialized) {
      initializeMap(() => {}, () => {});
    }
  }, []);

  // Auto-reinitialize when switching to MapLibre
  useEffect(() => {
    if (mapProvider === 'maplibre' && !mapInitialized) {
      initializeMap(() => {}, () => {});
    }
  }, [mapProvider]);

  return {
    mapContainer,
    map,
    mapProvider,
    setMapProvider,
    mapInitialized,
    mapboxApiToken,
    setMapboxApiToken,
    initializeMap,
    resetMap
  };
};
