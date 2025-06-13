import mapboxgl from 'mapbox-gl';

export const broomBroomAnimation = {
  name: 'broomBroom',
  displayName: 'Broom Broom',
  emoji: '🏎️',
  
  init() {
    // This function is called every time the 'broomBroom' animation starts.
    // Resetting these parameters ensures the animation sequence begins fresh.
    return {
      animationTime: 0, // Ensures the animation path restarts from its beginning
      animationSpeed: 0.015,
      driftRadius: 0.0002,
      previousLng: null, // Resets history for velocity calculation
      previousLat: null,
      velocity: { lng: 0, lat: 0 },
      carHeading: 0,
      targetHeading: 0,
      driftAngle: 0,
      speed: 0.0001
    };
  },

  update(animationState, modelOrigin, modelTransform) {
    const { animationSpeed, driftRadius } = animationState;
    
    // Update animation time
    animationState.animationTime += animationSpeed;
    
    // Calculate the center of the drift circle using the model's initial placement
    const centerLng = modelOrigin[0];
    const centerLat = modelOrigin[1];
    
    // Calculate circular path for drifting
    const angle = animationState.animationTime;
    const newLng = centerLng + Math.cos(angle) * driftRadius;
    const newLat = centerLat + Math.sin(angle) * driftRadius;
    
    // Calculate velocity (direction of movement)
    if (animationState.previousLng !== null) {
      animationState.velocity.lng = newLng - animationState.previousLng;
      animationState.velocity.lat = newLat - animationState.previousLat;
    }
    
    // Calculate movement direction
    const movementAngle = Math.atan2(animationState.velocity.lat, animationState.velocity.lng);
    
    // Realistic drifting: car faces a different direction than its actual movement
    const driftOffset = Math.sin(angle * 2) * 0.4; 
    animationState.carHeading = movementAngle + driftOffset;
    
    // Update position using Mapbox coordinate system
    const newCoordinate = mapboxgl.MercatorCoordinate.fromLngLat([newLng, newLat], 0);
    
    modelTransform.translateX = newCoordinate.x;
    modelTransform.translateY = newCoordinate.y;
    modelTransform.translateZ = newCoordinate.z;

    // Rotate only around Y-axis (vertical) to keep car upright
    const modelFacingOffset = Math.PI; // 180 degrees to make front face forward
    modelTransform.rotateY = animationState.carHeading + modelFacingOffset;
    
    // Store current position for next frame's velocity calculation
    animationState.previousLng = newLng;
    animationState.previousLat = newLat;
    
    return modelTransform;
  }
};