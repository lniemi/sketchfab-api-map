import { broomBroomAnimation } from './broomBroomAnimation.js';

export const animations = {
  broomBroom: broomBroomAnimation
};

export const getAnimation = (animationType) => {
  return animations[animationType];
};
