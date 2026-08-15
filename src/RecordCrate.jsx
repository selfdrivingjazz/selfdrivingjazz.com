import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
const CRATE_WIDTH = 3.55;
const CRATE_DEPTH = 3.18;
const POST_SIZE = 0.14;
const POST_X = 1.68;
const POST_Z = (CRATE_DEPTH - POST_SIZE) / 2;
const POST_HEIGHT = 1.32;
const SLEEVE_SIZE = 2.78;
const SLEEVE_DEPTH = 0.075;
const RECORD_SPACING = 0.135;
const FLIP_ANGLE = 0.8;
const INNER_FRONT_Z = POST_Z - POST_SIZE / 2 - 0.04;
const FLIPPED_FRONT_OFFSET = SLEEVE_SIZE * Math.sin(FLIP_ANGLE)
  + (SLEEVE_DEPTH / 2) * Math.cos(FLIP_ANGLE);
const FRONT_RECORD_Z = INNER_FRONT_Z - FLIPPED_FRONT_OFFSET;
const VIEW_DIRECTION = new THREE.Vector3(1, 0.62, 1.18).normalize();

function RecordFallback({ projects, activeIndex }) {
  return (
    <div className="record-fallback" role="img" aria-label={`Record crate showing ${projects[activeIndex].title}`}>
      <div className="record-fallback-stack" aria-hidden="true">
        {[...projects].reverse().map((project, reverseIndex) => {
          const index = projects.length - reverseIndex - 1;
          const flippedDistance = Math.max(0, activeIndex - index);
          const transform = index < activeIndex
            ? `translate3d(${(index - flippedDistance) * 3}px, calc(26% + ${flippedDistance * 3}px), ${flippedDistance * 4}px) rotateX(46deg)`
            : `translate3d(${index * 2}px, ${index * -2}px, ${index * -3}px)`;
          return (
            <img
              key={project.slug}
              className="record-fallback-sleeve"
              src={project.recordCover}
              alt=""
              style={{ transform }}
            />
          );
        })}
      </div>
      <div className="record-fallback-crate" aria-hidden="true" />
    </div>
  );
}

function RecordCrate({ projects, activeIndex }) {
  const mountRef = useRef(null);
  const activeIndexRef = useRef(activeIndex);
  const [failed, setFailed] = useState(false);
  activeIndexRef.current = activeIndex;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    for (const options of [
      { antialias: true, alpha: true, powerPreference: 'high-performance' },
      { antialias: false, alpha: true, powerPreference: 'default' },
    ]) {
      try {
        renderer = new THREE.WebGLRenderer(options);
        break;
      } catch {
        renderer = undefined;
      }
    }
    if (!renderer) {
      setFailed(true);
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x080808, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'record-crate-canvas';
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', 'A three-dimensional crate of project records.');
    mount.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40);

    const ambient = new THREE.HemisphereLight(0xdce5e1, 0x050606, 2.1);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(-3.5, 7, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    scene.add(key);
    const fill = new THREE.PointLight(0x91d8ce, 3.2, 12, 2);
    fill.position.set(3.5, 2.4, 2.8);
    scene.add(fill);

    const geometries = [];
    const materials = new Set();
    const textures = [];
    const crateMaterial = new THREE.MeshStandardMaterial({ color: 0x202321, roughness: 0.86, metalness: 0.08 });
    const crateEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x353a37, roughness: 0.78, metalness: 0.12 });
    const sleeveEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x101211, roughness: 0.72, metalness: 0.06 });
    const sleeveBackMaterial = new THREE.MeshStandardMaterial({ color: 0x171918, roughness: 0.8, metalness: 0.04 });
    materials.add(crateMaterial);
    materials.add(crateEdgeMaterial);
    materials.add(sleeveEdgeMaterial);
    materials.add(sleeveBackMaterial);

    const crate = new THREE.Group();
    crate.rotation.y = -0.08;
    scene.add(crate);

    function box(size, position, material = crateMaterial) {
      const geometry = new THREE.BoxGeometry(...size);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      crate.add(mesh);
      geometries.push(geometry);
      return mesh;
    }

    box([CRATE_WIDTH, 0.16, CRATE_DEPTH], [0, 0, 0]);
    for (const x of [-POST_X, POST_X]) {
      for (const z of [-POST_Z, POST_Z]) {
        box([POST_SIZE, POST_HEIGHT, POST_SIZE], [x, POST_HEIGHT / 2, z], crateEdgeMaterial);
      }
    }
    for (const y of [0.48, 1.25]) {
      box([CRATE_WIDTH - 0.07, POST_SIZE, POST_SIZE], [0, y, -POST_Z], crateMaterial);
      box([CRATE_WIDTH - 0.07, POST_SIZE, POST_SIZE], [0, y, POST_Z], crateMaterial);
      box([POST_SIZE, POST_SIZE, CRATE_DEPTH - 0.1], [-POST_X, y, 0], crateMaterial);
      box([POST_SIZE, POST_SIZE, CRATE_DEPTH - 0.1], [POST_X, y, 0], crateMaterial);
    }

    const textureLoader = new THREE.TextureLoader();
    const pivots = projects.map((project, index) => {
      const texture = textureLoader.load(project.recordCover);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textures.push(texture);
      const coverMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.74, metalness: 0.02 });
      materials.add(coverMaterial);

      const geometry = new THREE.BoxGeometry(SLEEVE_SIZE, SLEEVE_SIZE, SLEEVE_DEPTH);
      geometries.push(geometry);
      const sleeve = new THREE.Mesh(geometry, [
        sleeveEdgeMaterial,
        sleeveEdgeMaterial,
        sleeveEdgeMaterial,
        sleeveEdgeMaterial,
        coverMaterial,
        sleeveBackMaterial,
      ]);
      sleeve.position.y = SLEEVE_SIZE / 2;
      sleeve.castShadow = true;
      sleeve.receiveShadow = true;

      const pivot = new THREE.Group();
      pivot.position.set(0, 0.14, FRONT_RECORD_Z - index * RECORD_SPACING);
      pivot.add(sleeve);
      crate.add(pivot);
      return { pivot, baseZ: pivot.position.z };
    });
    const framingPoints = [];
    for (const rotation of [0, FLIP_ANGLE]) {
      for (const { pivot } of pivots) pivot.rotation.x = rotation;
      crate.updateWorldMatrix(true, true);
      crate.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        for (const x of [bounds.min.x, bounds.max.x]) {
          for (const y of [bounds.min.y, bounds.max.y]) {
            for (const z of [bounds.min.z, bounds.max.z]) {
              framingPoints.push(new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld));
            }
          }
        }
      });
    }
    for (const { pivot } of pivots) pivot.rotation.x = 0;
    crate.updateWorldMatrix(true, true);

    const framingCenter = new THREE.Box3().setFromPoints(framingPoints).getCenter(new THREE.Vector3());
    const cameraForward = VIEW_DIRECTION.clone().negate();
    const cameraRight = new THREE.Vector3().crossVectors(cameraForward, camera.up).normalize();
    const cameraVertical = new THREE.Vector3().crossVectors(cameraRight, cameraForward).normalize();

    function resize() {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      const tangentVertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const tangentHorizontal = tangentVertical * camera.aspect;
      let cameraDistance = 0;
      for (const point of framingPoints) {
        const relative = point.clone().sub(framingCenter);
        const towardCamera = relative.dot(VIEW_DIRECTION);
        cameraDistance = Math.max(
          cameraDistance,
          towardCamera + Math.abs(relative.dot(cameraVertical)) * 1.04 / tangentVertical,
          towardCamera + Math.abs(relative.dot(cameraRight)) * 1.04 / tangentHorizontal,
        );
      }
      camera.position.copy(framingCenter).addScaledVector(VIEW_DIRECTION, cameraDistance + 0.05);
      camera.lookAt(framingCenter);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function handleContextLost(event) {
      event.preventDefault();
      setFailed(true);
    }
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let animationFrame;
    function render() {
      const delta = Math.min(0.05, clock.getDelta());
      const damping = 1 - Math.exp(-delta * 8);
      for (const [index, record] of pivots.entries()) {
        const flipped = index < activeIndexRef.current;
        const targetRotation = flipped ? FLIP_ANGLE : 0;
        const targetY = 0.14;
        const targetZ = record.baseZ;
        record.pivot.rotation.x += (targetRotation - record.pivot.rotation.x) * damping;
        record.pivot.position.y += (targetY - record.pivot.position.y) * damping;
        record.pivot.position.z += (targetZ - record.pivot.position.z) * damping;
      }
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      for (const texture of textures) texture.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [projects]);

  return (
    <div className="record-crate-stage" ref={mountRef}>
      {failed && <RecordFallback projects={projects} activeIndex={activeIndex} />}
      <p className="record-crate-label" aria-live="polite">
        <span>{projects[activeIndex].label}</span>
        <span>{projects[activeIndex].title}</span>
      </p>
    </div>
  );
}

export default RecordCrate;
