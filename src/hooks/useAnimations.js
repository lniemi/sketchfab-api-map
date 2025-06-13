import { useState, useRef } from 'react';
import { getAnimation } from '../animations';

export const useAnimations = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState(null);
  const animationRef = useRef(null);
  const animationStateRef = useRef(null);

  const startAnimation = (type, onSuccess, onError) => {
    const animation = getAnimation(type);
    
    if (!animation) {
      onError(`Animation type "${type}" not found`);
      return;
    }
    
    setIsAnimating(true);
    setAnimationType(type);
    animationStateRef.current = animation.init();
    onSuccess(`Starting ${animation.displayName} animation...`);
  };

  const stopAnimation = (onSuccess) => {
    setIsAnimating(false);
    setAnimationType(null);
    animationStateRef.current = null;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    onSuccess('Animation stopped');
  };

  const updateAnimation = (modelOrigin, modelTransform, mapProvider) => {
    if (!isAnimating || !animationType || !animationStateRef.current) {
      return modelTransform;
    }

    const animation = getAnimation(animationType);
    return animation.update(animationStateRef.current, modelOrigin, modelTransform, mapProvider);
  };

  return {
    isAnimating,
    animationType,
    animationRef,
    startAnimation,
    stopAnimation,
    updateAnimation
  };
};
