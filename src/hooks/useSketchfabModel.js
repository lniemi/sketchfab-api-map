import { useState } from 'react';

export const useSketchfabModel = () => {
  const [sketchfabUID, setSketchfabUID] = useState('');
  const [sketchfabApiToken, setSketchfabApiToken] = useState('');
  const [modelPassword, setModelPassword] = useState('');

  const downloadSketchfabModel = async (mapInitialized, onSuccess, onError, onLoading) => {
    if (!mapInitialized) {
      onError('Please initialize the map first');
      return;
    }

    if (!sketchfabUID || !sketchfabApiToken) {
      onError('Please enter both Sketchfab UID and API Token');
      return;
    }

    onLoading('Fetching model from Sketchfab...');

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
        onSuccess('Model URL retrieved successfully! Loading model...', data.glb.url);
      } else if (data.gltf && data.gltf.url) {
        // Fallback to GLTF but warn it's a ZIP
        onError('Warning: GLTF URL is a ZIP file. Using GLB format is recommended.');
        throw new Error('GLTF format returns a ZIP file. Please ensure the model has GLB format available.');
      } else {
        throw new Error('No GLB download URL found in response');
      }
    } catch (error) {
      onError(`Failed to download model: ${error.message}`);
    }
  };

  return {
    sketchfabUID,
    setSketchfabUID,
    sketchfabApiToken,
    setSketchfabApiToken,
    modelPassword,
    setModelPassword,
    downloadSketchfabModel
  };
};
