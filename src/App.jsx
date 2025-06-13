import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './App.css';

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [sketchfabUID, setSketchfabUID] = useState('');
  const [sketchfabApiToken, setSketchfabApiToken] = useState('');
  const [mapboxApiToken, setMapboxApiToken] = useState('');
  const [modelPassword, setModelPassword] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [currentLayer, setCurrentLayer] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const initializeMap = () => {
    if (!mapboxApiToken) {
      setStatus('Please enter your Mapbox API token to initialize the map');
      setStatusType('error');
      return;
    }

    if (map.current) return; // Initialize map only once

    // Set the Mapbox access token
    mapboxgl.accessToken = mapboxApiToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard', // Mapbox Standard style with 3D buildings
      zoom: 16,
      center: [24.9441, 60.1710], // Senate Square, Helsinki (moved 20m south)
      pitch: 60,
      bearing: -20,
      antialias: true
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before adding 3D buildings layer
    map.current.on('style.load', () => {
      // The 3D buildings are included in Mapbox Standard style by default
      // But we can adjust their appearance if needed
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
      setStatus('Map initialized successfully!');
      setStatusType('success');
    });

    map.current.on('error', (error) => {
      console.error('Mapbox error:', error);
      setStatus('Failed to initialize map. Please check your Mapbox API token.');
      setStatusType('error');
    });
  };

  useEffect(() => {
    // Map will be initialized when user provides API token
  }, []);

  const downloadSketchfabModel = async () => {
    if (!mapInitialized) {
      setStatus('Please initialize the map first by entering your Mapbox API token');
      setStatusType('error');
      return;
    }

    if (!sketchfabUID || !sketchfabApiToken) {
      setStatus('Please enter both Sketchfab UID and API Token');
      setStatusType('error');
      return;
    }

    setStatus('Fetching model from Sketchfab...');
    setStatusType('loading');

    try {
      const headers = {
        'Authorization': `Token ${sketchfabApiToken}`,
        'Content-Type': 'application/json'
      };

      // Add password header if provided
      if (modelPassword) {
        headers['x-skfb-model-pwd'] = btoa(modelPassword);
      }

      const response = await fetch(`https://api.sketchfab.com/v3/models/${sketchfabUID}/download`, {
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Use GLB format instead of GLTF (which is a zip file)
      if (data.glb && data.glb.url) {
        setStatus('Model URL retrieved successfully! Loading model...');
        setStatusType('success');
        loadModelOnMap(data.glb.url);
      } else if (data.gltf && data.gltf.url) {
        // Fallback to GLTF but warn it's a ZIP
        setStatus('Warning: GLTF URL is a ZIP file. Using GLB format is recommended.');
        setStatusType('error');
        throw new Error('GLTF format returns a ZIP file. Please ensure the model has GLB format available.');
      } else {
        throw new Error('No GLB download URL found in response');
      }
    } catch (error) {
      setStatus(`Failed to download model: ${error.message}`);
      setStatusType('error');
    }
  };

  const loadModelOnMap = (modelUrl) => {
    // Remove existing layer if any
    if (currentLayer && map.current.getLayer(currentLayer)) {
      map.current.removeLayer(currentLayer);
    }

    const layerId = `3d-model-${Date.now()}`;
    setCurrentLayer(layerId);

    // Model positioning parameters
    const modelOrigin = [24.9441, 60.1710]; // Helsinki Railway Square
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];

    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    );

    const modelTransform = {
      translateX: modelAsMercatorCoordinate.x,
      translateY: modelAsMercatorCoordinate.y,
      translateZ: modelAsMercatorCoordinate.z,
      rotateX: modelRotate[0],
      rotateY: modelRotate[1],
      rotateZ: modelRotate[2],
      scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
    };

    // Custom layer for 3D model
    const customLayer = {
      id: layerId,
      type: 'custom',
      renderingMode: '3d',
      onAdd(map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // Add lights
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);

        // Add ambient light for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Load the model
        const loader = new GLTFLoader();
        
        loader.load(
          modelUrl,
          (gltf) => {
            // Scale the model if it's too large or too small
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);
            
            // Adjust scale if model is too large (assuming we want models around 50-100 units)
            if (maxDimension > 100) {
              const scaleFactor = 50 / maxDimension;
              gltf.scene.scale.multiplyScalar(scaleFactor);
            }
            
            this.scene.add(gltf.scene);
            setStatus('Model loaded successfully!');
            setStatusType('success');
          },
          (progress) => {
            if (progress.total > 0) {
              const percentComplete = (progress.loaded / progress.total * 100).toFixed(0);
              setStatus(`Loading model: ${percentComplete}%`);
              setStatusType('loading');
            }
          },
          (error) => {
            console.error('Error loading model:', error);
            setStatus(`Failed to load model: ${error.message || 'Unknown error'}`);
            setStatusType('error');
          }
        );

        this.map = map;
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true
        });
        this.renderer.autoClear = false;
      },
      render(gl, matrix) {
        const rotationX = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          modelTransform.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          modelTransform.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          modelTransform.rotateZ
        );

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              modelTransform.scale,
              -modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
      }
    };

    map.current.addLayer(customLayer);
  };

  const loadDefaultModel = () => {
    if (!mapInitialized) {
      setStatus('Please initialize the map first by entering your Mapbox API token');
      setStatusType('error');
      return;
    }
    
    setStatus('Loading default model...');
    setStatusType('loading');
    loadModelOnMap('https://maplibre.org/maplibre-gl-js/docs/assets/34M_17/34M_17.gltf');
  };

  const removeModel = () => {
    if (currentLayer && map.current.getLayer(currentLayer)) {
      map.current.removeLayer(currentLayer);
      setCurrentLayer(null);
      setStatus('Model removed');
      setStatusType('success');
    } else {
      setStatus('No model to remove');
      setStatusType('error');
    }
  };

  return (
    <div className="app-container">
      <div ref={mapContainer} className="map-container" />
      
      <div className="sidepanel-container">
        <div className={`controls ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <h2>3D Model Map Viewer</h2>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            Enter your API keys to get started. This app loads GLB format models from Sketchfab onto a Mapbox map.
          </p>
          
          <div className="api-keys-section">
            <h3>API Configuration</h3>
            
            <div className="input-group">
              <label htmlFor="mapbox-token">Mapbox API Token:</label>
              <input
                id="mapbox-token"
                type="password"
                value={mapboxApiToken}
                onChange={(e) => setMapboxApiToken(e.target.value)}
                placeholder="Your Mapbox API Token (pk.ey...)"
              />
            </div>

            <div className="button-group">
              <button 
                onClick={initializeMap} 
                disabled={!mapboxApiToken || mapInitialized}
                className={mapInitialized ? 'success' : ''}
              >
                {mapInitialized ? 'Map Initialized ✓' : 'Initialize Map'}
              </button>
            </div>
          </div>

          {mapInitialized && (
            <div className="model-section">
              <h3>Load 3D Model from Sketchfab</h3>
              
              <div className="input-group">
                <label htmlFor="sketchfab-token">Sketchfab API Token:</label>
                <input
                  id="sketchfab-token"
                  type="password"
                  value={sketchfabApiToken}
                  onChange={(e) => setSketchfabApiToken(e.target.value)}
                  placeholder="Your Sketchfab API Token"
                />
              </div>

              <div className="input-group">
                <label htmlFor="uid">Sketchfab Model UID:</label>
                <input
                  id="uid"
                  type="text"
                  value={sketchfabUID}
                  onChange={(e) => setSketchfabUID(e.target.value)}
                  placeholder="e.g., ac2b507090fd4966a5109512a78cf73e"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Model Password (if required):</label>
                <input
                  id="password"
                  type="password"
                  value={modelPassword}
                  onChange={(e) => setModelPassword(e.target.value)}
                  placeholder="Leave empty if not password-protected"
                />
              </div>

              <div className="button-group">
                <button onClick={downloadSketchfabModel}>
                  Load Sketchfab Model
                </button>
                <button onClick={loadDefaultModel}>
                  Load Default Model
                </button>
              </div>

              {currentLayer && (
                <div className="button-group" style={{ marginTop: '10px' }}>
                  <button onClick={removeModel} className="remove">
                    Remove Model
                  </button>
                </div>
              )}
            </div>
          )}

          {status && (
            <div className={`status ${statusType}`}>
              {status}
            </div>
          )}
        </div>
        
        <button 
          className={`toggle-button ${sidebarCollapsed ? 'collapsed' : ''}`}
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default App;