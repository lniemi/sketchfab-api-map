import { useState, useRef } from 'react';
import { createModelLayer } from '../utils/modelLayer';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // For loading GLTF models
import * as THREE from 'three'; // For THREE.Box3, THREE.Vector3

export const useModelLoader = () => {
  const [currentLayer, setCurrentLayer] = useState(null);
  const modelRef = useRef(null);
  const layerRef = useRef(null);

  const loadModelOnMap = (map, modelUrl, updateAnimation, onProgress, onSuccess, onError) => {
    // Remove existing layer if any
    if (currentLayer && map.getLayer(currentLayer)) {
      map.removeLayer(currentLayer);
    }    const layerId = `3d-model-${Date.now()}`;
    setCurrentLayer(layerId); // Set current layer to the new one being created

    const modelOrigin = [24.9441, 60.1710]; // Helsinki Railway Square

    const customLayer = createModelLayer(
      layerId,
      modelOrigin,
      updateAnimation,
      (threeJsScene) => { // This is the onSceneReady callback from createModelLayer
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => { // GLTFLoader success
            // Scale the model if it's too large or too small
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);
            
            // Adjust scale if model is too large (assuming we want models around 50-100 units)
            if (maxDimension > 100) {
              const scaleFactor = 50 / maxDimension;
              gltf.scene.scale.multiplyScalar(scaleFactor);
            }
            
            threeJsScene.add(gltf.scene); // Add to layer's Three.js scene
            modelRef.current = gltf.scene; // Store the loaded model part (THREE.Group)
            // Call the onSuccess provided to loadModelOnMap, passing the gltf.scene
            onSuccess('Model loaded successfully!', gltf.scene); 
          },
          (progress) => { // GLTFLoader progress
            if (progress.total > 0) {
              const percentComplete = (progress.loaded / progress.total * 100).toFixed(0);
              onProgress(`Loading model: ${percentComplete}%`);
            } else {
              // Fallback if progress.total is not available (e.g. for some server configurations)
              onProgress('Loading model...');
            }
          },
          (error) => { // GLTFLoader error
            console.error('Error loading model:', error);
            onError(`Failed to load model: ${error.message || 'Unknown error'}`);
          }
        );
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

  // New function to add a pre-loaded (cached) GLTF scene to the map
  const addCachedModelToMap = (map, gltfSceneToLoad, updateAnimation, onSuccess, onError) => {
    // Caller should ensure any previous layer is handled (e.g., removed if necessary)
    const layerId = `3d-model-cached-${Date.now()}`;
    setCurrentLayer(layerId); // Update currentLayer to the new layer ID
    const modelOrigin = [24.9441, 60.1710]; // Or make this dynamic if needed

    const customLayer = createModelLayer(
      layerId,
      modelOrigin,
      updateAnimation,
      (threeJsScene) => { // onSceneReady callback
        if (!gltfSceneToLoad) {
          onError("Cached model (gltfScene) is missing.");
          return;
        }
        // Clone the GLTF scene. This is crucial to avoid issues if the original cached
        // scene is manipulated or if multiple layers attempt to use the same instance.
        const modelClone = gltfSceneToLoad.clone();
        
        // The model is assumed to be already scaled from its initial load,
        // as scaling was applied directly to the gltf.scene object that was cached.
        threeJsScene.add(modelClone);
        modelRef.current = modelClone; // Store a reference to the cloned model in this layer
        onSuccess('Cached model added to map!', modelClone); // Pass the cloned scene
      }
    );

    layerRef.current = customLayer; // Store reference to the new custom layer
    map.addLayer(customLayer);
  };

  return {
    currentLayer,
    modelRef,
    layerRef,
    loadModelOnMap,
    removeModel,
    loadDefaultModel,
    addCachedModelToMap // Expose the new function
  };
};