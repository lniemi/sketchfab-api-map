import React, { useState } from 'react';
import { useMapProvider } from './hooks/useMapProvider';
import { useSketchfabModel } from './hooks/useSketchfabModel';
import { useModelLoader } from './hooks/useModelLoader';
import { useAnimations } from './hooks/useAnimations';
import MapProviderSection from './components/MapProviderSection';
import ModelSection from './components/ModelSection';
import StatusMessage from './components/StatusMessage';
import ToggleButton from './components/ToggleButton';
import './App.css';

function App() {
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Custom hooks
  const mapProvider = useMapProvider();
  const sketchfabModel = useSketchfabModel();
  const modelLoader = useModelLoader();
  const animations = useAnimations();
  
  // Utility functions
  const updateStatus = (message, type) => {
    setStatus(message);
    setStatusType(type);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleResetAndInitialize = () => {
    mapProvider.resetMap();
    mapProvider.initializeMap(
      (message) => updateStatus(message, 'success'),
      (message) => updateStatus(message, 'error')
    );
  };

  const handleDownloadSketchfabModel = () => {
    sketchfabModel.downloadSketchfabModel(
      mapProvider.mapInitialized,
      (message, modelUrl) => {
        updateStatus(message, 'success');
        modelLoader.loadModelOnMap(
          mapProvider.map.current,
          modelUrl,
          animations.updateAnimation,
          (message) => updateStatus(message, 'loading'),
          (message) => updateStatus(message, 'success'),
          (message) => updateStatus(message, 'error')
        );
      },
      (message) => updateStatus(message, 'error'),
      (message) => updateStatus(message, 'loading')
    );
  };

  const handleLoadDefaultModel = () => {
    if (!mapProvider.mapInitialized) {
      updateStatus('Please initialize the map first', 'error');
      return;
    }
    
    updateStatus('Loading default model...', 'loading');
    modelLoader.loadDefaultModel(
      mapProvider.map.current,
      animations.updateAnimation,
      (message) => updateStatus(message, 'loading'),
      (message) => updateStatus(message, 'success'),
      (message) => updateStatus(message, 'error')
    );
  };

  const handleRemoveModel = () => {
    animations.stopAnimation(
      (message) => updateStatus(message, 'success'),
      modelLoader.layerRef
    );
    modelLoader.removeModel(
      mapProvider.map.current,
      (message) => updateStatus(message, 'success'),
      (message) => updateStatus(message, 'error')
    );
  };

  const handleStartAnimation = (animationType) => {
    if (!modelLoader.currentLayer || !mapProvider.map.current) {
      updateStatus('Please load a model first', 'error');
      return;
    }

    animations.startAnimation(
      animationType,
      mapProvider.map.current,
      (message) => updateStatus(message, 'success'),
      (message) => updateStatus(message, 'error')
    );
  };

  const handleStopAnimation = () => {
    animations.stopAnimation(
      (message) => updateStatus(message, 'success'),
      modelLoader.layerRef
    );
  };
  
  return (
    <div className="app-container">
      <div ref={mapProvider.mapContainer} className="map-container" />
      
      <div className="sidepanel-container">
        <div className={`controls ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <h2>3D Model Map Viewer</h2>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            Load GLB format models from Sketchfab onto a Mapbox 3D map with premium features.
          </p>
          
          <MapProviderSection
            mapboxApiToken={mapProvider.mapboxApiToken}
            setMapboxApiToken={mapProvider.setMapboxApiToken}
            mapInitialized={mapProvider.mapInitialized}
            onResetAndInitialize={handleResetAndInitialize}
          />
          
          {mapProvider.mapInitialized && (
            <ModelSection
              sketchfabUID={sketchfabModel.sketchfabUID}
              setSketchfabUID={sketchfabModel.setSketchfabUID}
              sketchfabApiToken={sketchfabModel.sketchfabApiToken}
              setSketchfabApiToken={sketchfabModel.setSketchfabApiToken}
              modelPassword={sketchfabModel.modelPassword}
              setModelPassword={sketchfabModel.setModelPassword}
              onDownloadSketchfabModel={handleDownloadSketchfabModel}
              onLoadDefaultModel={handleLoadDefaultModel}
              currentLayer={modelLoader.currentLayer}
              onRemoveModel={handleRemoveModel}
              isAnimating={animations.isAnimating}
              animationType={animations.animationType}
              onStartAnimation={handleStartAnimation}
              onStopAnimation={handleStopAnimation}
            />
          )}

          <StatusMessage status={status} statusType={statusType} />
        </div>
        
        <ToggleButton 
          sidebarCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>
    </div>
  );
}

export default App;