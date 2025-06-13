import { useState } from 'react';

export const useSketchfabModel = () => {
  const [sketchfabUID, setSketchfabUID] = useState('');
  const [sketchfabApiToken, setSketchfabApiToken] = useState('');
  const [modelPassword, setModelPassword] = useState('');

  // Modified to accept optional uid, token, password in a params object
  const downloadSketchfabModel = async (
    mapInitialized,
    onSuccess, // Callback: (statusMessage, modelUrl)
    onError,   // Callback: (errorMessage)
    onLoading, // Callback: (loadingMessage)
    params = {} // Optional params: { uid, apiToken, password }
  ) => {
    if (!mapInitialized) {
      onError('Please initialize the map first');
      return;
    }

    // Use provided params or fallback to state (input field values)
    const uidToUse = params.uid || sketchfabUID;
    const apiTokenToUse = params.apiToken || sketchfabApiToken;
    const passwordToUse = params.password || modelPassword;

    if (!uidToUse || !apiTokenToUse) {
      onError('Please enter Sketchfab UID and API Token');
      return;
    }

    onLoading('Fetching model from Sketchfab...');

    try {
      const headers = {
        'Authorization': `Token ${apiTokenToUse}`,
        'Content-Type': 'application/json'
      };

      // Add password header if provided for the specific model to download
      if (passwordToUse) {
        headers['x-skfb-model-pwd'] = btoa(passwordToUse);
      }

      const response = await fetch(`https://api.sketchfab.com/v3/models/${uidToUse}/download`, {
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.glb && data.glb.url) {
        onSuccess('Model URL retrieved successfully! Loading model...', data.glb.url);
      } else if (data.gltf && data.gltf.url) {
        // GLTF is a zip, prefer GLB. Error for now as per original logic.
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
    downloadSketchfabModel // Expose the modified function
  };
};