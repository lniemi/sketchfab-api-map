import mapboxgl from 'mapbox-gl';
import maplibregl from 'maplibre-gl';

export const broomBroomAnimation = {
  name: 'broomBroom',
  displayName: 'Broom Broom',
  emoji: '🏎️',
  
  init() {
    return {
      animationTime: 0,
      animationSpeed: 0.001,
      driftRadius: 0.0002 // Radius in degrees for the drift circle
    };
  },

  update(animationState, modelOrigin, modelTransform, mapProvider) {
    const { animationTime, animationSpeed, driftRadius } = animationState;
    
    // Update animation time
    animationState.animationTime += animationSpeed;
    
    // Calculate circular motion
    const centerLng = modelOrigin[0];
    const centerLat = modelOrigin[1];
    
    const newLng = centerLng + Math.cos(animationState.animationTime * 100) * driftRadius;
    const newLat = centerLat + Math.sin(animationState.animationTime * 100) * driftRadius;
    
    // Update model position
    const MercatorCoordinate = mapProvider === 'maplibre' 
      ? maplibregl.MercatorCoordinate 
      : mapboxgl.MercatorCoordinate;
    
    const newCoordinate = MercatorCoordinate.fromLngLat([newLng, newLat], 0);
    
    modelTransform.translateX = newCoordinate.x;
    modelTransform.translateY = newCoordinate.y;
    modelTransform.translateZ = newCoordinate.z;
    
    // Add rotation to face the direction of movement
    modelTransform.rotateZ = -animationState.animationTime * 100 + Math.PI / 2;
    
    return modelTransform;
  }
};
