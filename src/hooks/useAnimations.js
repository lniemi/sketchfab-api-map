import { useState, useRef, useCallback } from 'react';
import { getAnimation } from '../animations';

export const useAnimations = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState(null);
  const animationRef = useRef(null);
  const animationStateRef = useRef(null);
  const mapRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const startAnimation = useCallback((type, map, onSuccess, onError) => {
    const animation = getAnimation(type);
    if (!animation) {
      onError(`Animation type "${type}" not found`);
      return;
    }
    
    // Stop any existing animation first
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsAnimating(true);
    setAnimationType(type);
    isAnimatingRef.current = true;
    animationStateRef.current = animation.init();
    mapRef.current = map;
    
    // Start the animation loop
    const animate = () => {
      if (mapRef.current && isAnimatingRef.current && animationStateRef.current) {
        // Force map to re-render
        mapRef.current.triggerRepaint();
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Trigger initial repaint to start the render cycle
    mapRef.current.triggerRepaint();
    animationRef.current = requestAnimationFrame(animate);
    onSuccess(`${animation.displayName} animation started!`);
  }, []);

  const stopAnimation = useCallback((onSuccess, layerRef) => {
    setIsAnimating(false);
    setAnimationType(null);
    isAnimatingRef.current = false;
    animationStateRef.current = null;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Reset model transform if layer exists
    if (layerRef && layerRef.current && layerRef.current.resetTransform) {
      layerRef.current.resetTransform();
    }
    
    // Trigger one final repaint to show reset position
    if (mapRef.current) {
      mapRef.current.triggerRepaint();
    }
    
    mapRef.current = null;
    
    onSuccess('Animation stopped');
  }, []);

  const updateAnimation = useCallback((modelOrigin, modelTransform) => {
    if (!animationStateRef.current || !animationType) {
      return modelTransform;
    }
    
    const animation = getAnimation(animationType);
    if (!animation) {
      return modelTransform;
    }
    
    return animation.update(animationStateRef.current, modelOrigin, modelTransform);
  }, [animationType]);

  return {
    isAnimating,
    animationType,
    animationRef,
    startAnimation,
    stopAnimation,
    updateAnimation
  };
};