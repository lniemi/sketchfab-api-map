import { useState, useRef } from 'react';
import { createModelLayer } from '../utils/modelLayer';

export const useModelLoader = () => {
  const [currentLayer, setCurrentLayer] = useState(null);
  const modelRef = useRef(null);
  const layerRef = useRef(null);

  const loadModelOnMap = (map, modelUrl, updateAnimation, onProgress, onSuccess, onError) => {
    // Remove existing layer if any
    if (currentLayer && map.getLayer(currentLayer)) {
      map.removeLayer(currentLayer);
    }

    const layerId = `3d-model-${Date.now()}`;
    setCurrentLayer(layerId);

    // Model positioning parameters
    const modelOrigin = [24.9441, 60.1710]; // Helsinki Railway Square

    const customLayer = createModelLayer(
      layerId,
      modelUrl,
      modelOrigin,
      updateAnimation,
      (percentComplete) => {
        onProgress(`Loading model: ${percentComplete}%`);
      },
      (gltfScene) => {
        modelRef.current = gltfScene;
        onSuccess('Model loaded successfully!');
      },
      (errorMessage) => {
        onError(`Failed to load model: ${errorMessage}`);
      }
    );

    layerRef.current = customLayer;
    map.addLayer(customLayer);
  };

  const removeModel = (map, onSuccess, onError) => {
    if (currentLayer && map.getLayer(currentLayer)) {
      map.removeLayer(currentLayer);
      setCurrentLayer(null);
      modelRef.current = null;
      layerRef.current = null;
      onSuccess('Model removed');
    } else {
      onError('No model to remove');
    }
  };

  const loadDefaultModel = (map, updateAnimation, onProgress, onSuccess, onError) => {
    loadModelOnMap(
      map, 
      'https://maplibre.org/maplibre-gl-js/docs/assets/34M_17/34M_17.gltf',
      updateAnimation,
      onProgress,
      onSuccess,
      onError
    );
  };

  return {
    currentLayer,
    modelRef,
    layerRef,
    loadModelOnMap,
    removeModel,
    loadDefaultModel
  };
};