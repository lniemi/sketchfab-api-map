import * as THREE from 'three';
// GLTFLoader is now used in useModelLoader.js
import mapboxgl from 'mapbox-gl';

export const createModelLayer = (
  layerId, 
  modelOrigin, 
  updateAnimation, 
  onSceneReady // Callback: (threeJsScene: THREE.Scene) => void
) => {
  const modelAltitude = 0;
  const modelRotate = [Math.PI / 2, 0, 0];

  const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
  );

  let modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
  };

  // Store the initial transform for resetting
  const initialTransform = { ...modelTransform };

  // Custom layer for 3D model
  const customLayer = {
    id: layerId,
    type: 'custom',
    renderingMode: '3d',
    onAdd(map, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // Add lights
      const directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(0, -70, 100).normalize();
      this.scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff);
      directionalLight2.position.set(0, 70, 100).normalize();
      this.scene.add(directionalLight2);      // Add ambient light for better visibility
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);

      // The caller (useModelLoader.js) is now responsible for loading the model
      // and adding it to this.scene. The onSceneReady callback provides this.scene
      // to the caller for this purpose.
      if (onSceneReady) {
        onSceneReady(this.scene);
      }

      this.map = map;
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      this.renderer.autoClear = false;
    },
    render(gl, matrix) {
      // Update animation if needed
      modelTransform = updateAnimation(modelOrigin, modelTransform);

      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    },
    // Add method to reset transform when animation stops
    resetTransform() {
      modelTransform = { ...initialTransform };
    }
  };

  return customLayer;
};