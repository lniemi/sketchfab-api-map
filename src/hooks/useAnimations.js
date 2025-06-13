import { useState, useRef, useCallback } from 'react';
import { getAnimation } from '../animations';

export const useAnimations = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState(null);
  
  const animationRef = useRef(null); // ID for requestAnimationFrame
  const animationStateRef = useRef(null); // Holds the current state of the animation (e.g., time, position)
  const mapRef = useRef(null); // Reference to the map instance for triggerRepaint
  const isAnimatingRef = useRef(false); // Ref to track animation status for the RAF loop

  // getAnimation is stable as it's an import.
  // State setters (setIsAnimating, setAnimationType) are stable.
  // Refs (animationStateRef, mapRef, isAnimatingRef, animationRef) are stable.
  // Parameters (type, map, onSuccess, onError) are fresh on each call.
  const startAnimation = useCallback((type, map, onSuccess, onError) => {
    const animation = getAnimation(type);
    if (!animation) {
      onError(`Animation type "${type}" not found`);
      return;
    }
    
    // Stop any existing animation frame loop before starting a new one
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsAnimating(true);
    setAnimationType(type);
    isAnimatingRef.current = true;
    animationStateRef.current = animation.init(); // Initialize animation state
    mapRef.current = map; // Store the map instance
    
    const animate = () => {
      // Check all conditions for the loop to continue
      if (mapRef.current && isAnimatingRef.current && animationStateRef.current) {
        mapRef.current.triggerRepaint(); // Crucial for updating the custom layer
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // If conditions are not met, ensure the loop doesn't restart by itself
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
    };
    
    if (mapRef.current) { // Ensure map is present before starting the loop
        mapRef.current.triggerRepaint(); // Initial repaint
        animationRef.current = requestAnimationFrame(animate); // Start the loop
        onSuccess(`${animation.displayName} animation started!`);
    } else {
        onError("Map instance not available to start animation.");
        setIsAnimating(false);
        setAnimationType(null);
        isAnimatingRef.current = false;
        animationStateRef.current = null;
    }
  }, [/* No explicit state/prop dependencies needed due to ref/parameter usage, but be mindful */]);

  // layerRef is a parameter. onSuccess is a parameter. Refs are stable. State setters stable.
  const stopAnimation = useCallback((onSuccess, layerRef) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsAnimating(false);
    // setAnimationType(null); // Keep animationType if you want to know what was last running
    isAnimatingRef.current = false;
    // animationStateRef.current = null; // Keep state if you might want to resume, or clear if always fresh start

    if (layerRef && layerRef.current && layerRef.current.resetTransform) {
      layerRef.current.resetTransform();
    }
    
    if (mapRef.current) {
      mapRef.current.triggerRepaint(); // One final repaint to show reset position
    }
    
    // mapRef.current = null; // Don't nullify mapRef here if startAnimation might reuse it.
                         // Or, ensure startAnimation always gets a fresh map.
                         // It's better if startAnimation always receives the map it should operate on.
    
    onSuccess('Animation stopped');
  }, [/* No explicit state/prop dependencies needed */]);

  const updateAnimation = useCallback((modelOrigin, modelTransform) => {
    // Check isAnimatingRef.current as the primary source of truth for whether updates should apply
    if (!isAnimatingRef.current || !animationStateRef.current || !animationType) {
      return modelTransform;
    }
    
    const animation = getAnimation(animationType);
    if (!animation) {
      return modelTransform;
    }
    
    // This is where the actual modelTransform and animationStateRef.current are modified
    return animation.update(animationStateRef.current, modelOrigin, modelTransform);
  }, [animationType]); // Depends on animationType to get the correct animation logic

  return {
    isAnimating,
    animationType,
    // animationRef, // Not typically exposed
    startAnimation,
    stopAnimation,
    updateAnimation,
    // Expose for debugging if needed:
    // _isAnimatingRef: isAnimatingRef,
    // _animationStateRef: animationStateRef,
    // _mapRef: mapRef 
  };
};