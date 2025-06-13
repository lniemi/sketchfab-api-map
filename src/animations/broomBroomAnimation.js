import mapboxgl from 'mapbox-gl';

export const broomBroomAnimation = {
  name: 'broomBroom',
  displayName: 'Broom Broom',
  emoji: '🏎️',
  
  init() {
    return {
      animationTime: 0,
      animationSpeed: 0.015, // Slightly slower for more controlled movement
      driftRadius: 0.0002, // Smaller radius for tighter control
      previousLng: null,
      previousLat: null,
      velocity: { lng: 0, lat: 0 }, // Current velocity vector
      carHeading: 0, // Direction the car is pointing (in radians)
      targetHeading: 0, // Direction the car wants to point
      driftAngle: 0, // Angle between car heading and movement direction
      speed: 0.0001 // Forward speed
    };
  },
  update(animationState, modelOrigin, modelTransform) {
    const { animationSpeed, driftRadius } = animationState;
    
    // Update animation time
    animationState.animationTime += animationSpeed;
    
    // Calculate the center of the drift circle
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
    
    // Calculate movement direction (this is the actual direction the car is moving)
    const movementAngle = Math.atan2(animationState.velocity.lat, animationState.velocity.lng);
    
    // For realistic drifting: car faces a different direction than its actual movement
    // The car should appear to be "sliding" - the wheels/front face one direction while sliding in another
    const driftOffset = Math.sin(angle * 2) * 0.4; // Oscillating drift angle for realistic effect
    animationState.carHeading = movementAngle + driftOffset; // Car faces offset from movement direction
    
    // Update position using Mapbox coordinate system
    const newCoordinate = mapboxgl.MercatorCoordinate.fromLngLat([newLng, newLat], 0);
    
    // Update position
    modelTransform.translateX = newCoordinate.x;
    modelTransform.translateY = newCoordinate.y;
    modelTransform.translateZ = newCoordinate.z;
    
    // IMPORTANT: Only rotate around Y-axis (vertical) to keep car upright
    // The original rotateX and rotateZ should remain unchanged from the initial model rotation
    // Only modify rotateY for the car's heading direction
    
    // Convert heading to Y-axis rotation (car should face the direction it's pointing)
    // Keep the same rotational direction as the circular motion for natural drift
    const modelFacingOffset = Math.PI; // 180 degrees to make front face forward instead of backward
    modelTransform.rotateY = animationState.carHeading + modelFacingOffset;
    
    // Store current position for next frame
    animationState.previousLng = newLng;
    animationState.previousLat = newLat;
    
    return modelTransform;
  }
};