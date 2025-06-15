import React, { useState, useEffect, useCallback } from 'react';
import { useMapProvider } from './hooks/useMapProvider';
import { useSketchfabModel } from './hooks/useSketchfabModel';
import { useModelLoader } from './hooks/useModelLoader';
import { useAnimations } from './hooks/useAnimations';
import MapProviderSection from './components/MapProviderSection';
import ModelSection from './components/ModelSection';
import StatusMessage from './components/StatusMessage';
import ToggleButton from './components/ToggleButton';
import './App.css';

function App() {  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentModelSource, setCurrentModelSource] = useState(null);
  const [cachedGltfScene, setCachedGltfScene] = useState(null);

  const mapProvider = useMapProvider();
  const sketchfabModel = useSketchfabModel();
  const modelLoader = useModelLoader();
  const animations = useAnimations();
  
  const updateStatus = (message, type) => {
    setStatus(message);
    setStatusType(type);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  const handleResetAndInitialize = () => {
    // Ensure any ongoing operations are cleaned up
    if (animations.isAnimating) {
      animations.stopAnimation(() => updateStatus("Animation stopped due to map reset.", "info"), modelLoader.layerRef);
    }
    if (modelLoader.currentLayer && mapProvider.map.current) {
      modelLoader.removeModel(mapProvider.map.current, () => {}, () => {}); // Silently remove
    }
    mapProvider.resetMap();
    setCurrentModelSource(null);
    setCachedGltfScene(null); // Clear cache on full reset
    mapProvider.initializeMap(
      (message) => updateStatus(message, 'success'),
      (message) => updateStatus(message, 'error')
    );
  };

  const handleDownloadSketchfabModel = async () => {
    if (!mapProvider.mapInitialized) {
      updateStatus('Please initialize the map first', 'error');
      return;
    }    if (modelLoader.currentLayer) {
      await handleRemoveModel(false); 
    }
    setCachedGltfScene(null); // Clear previous cache when initiating a new model load

    const currentUID = sketchfabModel.sketchfabUID;
    const currentToken = sketchfabModel.sketchfabApiToken;
    const currentPassword = sketchfabModel.modelPassword;

    sketchfabModel.downloadSketchfabModel(
      mapProvider.mapInitialized,
      (message, modelUrl) => {
        updateStatus(message, 'loading');
        modelLoader.loadModelOnMap(
          mapProvider.map.current, modelUrl, animations.updateAnimation,          (progressMsg) => updateStatus(`Loading: ${progressMsg}%`, 'loading'),
          (successMsg, loadedGltfScene) => { // onSuccess now provides gltfScene
            updateStatus(successMsg, 'success');
            setCurrentModelSource({ type: 'sketchfab', uid: currentUID, apiToken: currentToken, password: currentPassword });
            setCachedGltfScene(loadedGltfScene); // Cache the loaded scene
          },
          (errorMsg) => {
            updateStatus(errorMsg, 'error');
            setCurrentModelSource(null);
          }
        );
      },
      (errorMsg) => {
        updateStatus(errorMsg, 'error');
        setCurrentModelSource(null);
      },
      (loadingMsg) => updateStatus(loadingMsg, 'loading')
    );
  };

  const handleLoadDefaultModel = async () => {
    if (!mapProvider.mapInitialized) {
      updateStatus('Please initialize the map first', 'error');
      return;
    }    if (modelLoader.currentLayer) {
      await handleRemoveModel(false);
    }
    setCachedGltfScene(null); // Clear previous cache when initiating a new model load
    
    updateStatus('Loading default model...', 'loading');
    modelLoader.loadDefaultModel(
      mapProvider.map.current, animations.updateAnimation,
      (progressMsg) => updateStatus(`Loading: ${progressMsg}%`, 'loading'),      (successMsg, loadedGltfScene) => { // onSuccess now provides gltfScene
        updateStatus(successMsg, 'success');
        setCachedGltfScene(loadedGltfScene); // Cache the loaded scene
        setCurrentModelSource({ type: 'default' });
      },
      (errorMsg) => {
        updateStatus(errorMsg, 'error');
        setCurrentModelSource(null);
      }
    );
  };

  const handleRemoveModel = async (clearSourceInfo = true) => {
    if (animations.isAnimating) {
      await new Promise(resolve => {
        animations.stopAnimation((message) => {
          resolve();
        }, modelLoader.layerRef);
      });
    }

    let modelActuallyRemoved = false;
    if (modelLoader.currentLayer && mapProvider.map.current && mapProvider.map.current.getLayer(modelLoader.currentLayer)) {
       await new Promise(resolve => {
        modelLoader.removeModel(
          mapProvider.map.current,
          (message) => { 
            // Only update status if this is a direct removal action
            if(clearSourceInfo) updateStatus(message, 'success'); 
            modelActuallyRemoved = true;
            resolve(); 
          },
          (message) => { 
            if(clearSourceInfo) updateStatus(message, 'error'); 
            resolve(); 
          }
        );
      });
    }
      if (clearSourceInfo) {
      setCurrentModelSource(null); 
      if (modelActuallyRemoved) { // Only clear cache if a model was actually removed AND we are clearing source info
        setCachedGltfScene(null);
      }
    }
  };
  const handleStartBroomBroomAnimation = async () => {
    if (!mapProvider.mapInitialized || !mapProvider.map.current) {
      updateStatus('Map not initialized. Please initialize the map first.', 'error');
      return;
    }

    updateStatus('Preparing Broom Broom animation...', 'loading');

    // Stop existing animation, remove model, keep source info
    await handleRemoveModel(false); 

    let animationPrimedSuccessfully = false;
    // Prime the animation: This sets up the animation state and starts the RAF loop in useAnimations
    animations.startAnimation(
      'broomBroom',
      mapProvider.map.current, // Pass the current map instance
      (startMessage) => {
        updateStatus(`Animation primed: ${startMessage}`, 'info');
        animationPrimedSuccessfully = true;
      },
      (startErrorMessage) => {
        updateStatus(`Failed to prime animation: ${startErrorMessage}`, 'error');
      }
    );

    if (!animationPrimedSuccessfully) {
      // If priming failed (e.g., map was suddenly null), stop here.
      return; 
    }
    
    updateStatus(`Re-loading model for Broom Broom...`, 'loading');
    let modelSuccessfullyReloaded = false;

    if (cachedGltfScene && mapProvider.map.current) {
      try {
        await new Promise((resolve, reject) => {
          modelLoader.addCachedModelToMap( // Use the new function to load from cache
            mapProvider.map.current,
            cachedGltfScene, // Pass the cached scene
            animations.updateAnimation,
            (sMsg_load, _readdedScene) => { // _readdedScene is the cloned scene added to map
              updateStatus(sMsg_load, 'success'); 
              modelSuccessfullyReloaded = true;
              // currentModelSource remains valid as it's the same model
              resolve();
            },
            (eMsg_load) => reject(new Error(`Failed to add cached model: ${eMsg_load}`))
          );
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        updateStatus(`Error re-loading cached model: ${errorMessage}`, 'error');
        if (animations.isAnimating && animations.animationType === 'broomBroom') {
          animations.stopAnimation((stopMsg) => updateStatus(`Broom Broom stopped due to error: ${stopMsg}`, 'info'), modelLoader.layerRef);
        }
      }
    } else {
      // This case implies the model wasn't cached or map isn't ready.
      let errorMsg = "Cannot reload model for animation: ";
      if (!cachedGltfScene) errorMsg += "No model in cache. Please ensure a model was loaded first. ";
      if (!mapProvider.map.current) errorMsg += "Map not available.";
      updateStatus(errorMsg, 'error');
      if (animations.isAnimating && animations.animationType === 'broomBroom') {
        animations.stopAnimation((stopMsg) => updateStatus(`Broom Broom stopped due to error: ${stopMsg}`, 'info'), modelLoader.layerRef);
      }    }

    if (modelSuccessfullyReloaded) {
      // The animation was already started by the priming step.
      // The success message "Broom Broom animation is running..."
      updateStatus('Broom Broom animation is running with the re-loaded model.', 'success');
    } else {
      // Error status should already be set by the catch block.
      // Ensure animation is stopped if it was primed but model load failed and wasn't caught / handled above.
      if (animations.isAnimating && animations.animationType === 'broomBroom' && !modelSuccessfullyReloaded) {
         animations.stopAnimation((stopMsg) => updateStatus(`Broom Broom stopped (model not reloaded): ${stopMsg}`, 'info'), modelLoader.layerRef);
      }
    }
  };

  const handleStartAnimation = (animationType) => {
    if (animationType === 'broomBroom') {
      handleStartBroomBroomAnimation();
    } else {
      if (!modelLoader.currentLayer || !mapProvider.map.current) {
        updateStatus('Please load a model first for this animation.', 'error');
        return;
      }
      // For other animations, use the simpler start
      animations.startAnimation(
        animationType, mapProvider.map.current,
        (message) => updateStatus(message, 'success'),
        (message) => updateStatus(message, 'error')
      );
    }
  };

  const handleStopAnimation = () => {
    // This is the generic stop button
    if (animations.isAnimating) {
        animations.stopAnimation(
          (message) => updateStatus(message, 'success'),
          modelLoader.layerRef
        );
    } else {
        updateStatus("No animation is currently running.", "info");
    }
  };
  
  return (
    <div className="app-container">
      <div ref={mapProvider.mapContainer} className="map-container" />
      
      <div className="sidepanel-container">
        <div className={`controls ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <h2>3D Model Map Viewer</h2>          <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            Load GLB format models from Sketchfab onto a Mapbox 3D map with premium features.
          </p>          {(!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || mapProvider.mapError) && (
            <MapProviderSection
              mapboxApiToken={mapProvider.mapboxApiToken}
              setMapboxApiToken={mapProvider.setMapboxApiToken}
              mapInitialized={mapProvider.mapInitialized}
              mapError={mapProvider.mapError}
            />
          )}
          
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
              onRemoveModel={() => handleRemoveModel(true)}
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