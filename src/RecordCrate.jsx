'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import RecordCrateFallback from './RecordCrateFallback.jsx';
const CRATE_WIDTH = 3.55;
const CRATE_DEPTH = 3.18;
const POST_SIZE = 0.14;
const POST_X = 1.68;
const POST_Z = (CRATE_DEPTH - POST_SIZE) / 2;
const POST_HEIGHT = 1.32;
const SLEEVE_SIZE = 2.78;
const SLEEVE_DEPTH = 0.075;
const RECORD_SPACING = 0.135;
const BASE_TOP = 0.08;
const RECORD_ANCHOR_Y = BASE_TOP + SLEEVE_DEPTH / 2 + 0.004;
const FRONT_RECORD_Z = -0.6;
const RIM_TARGET_Y = 1.25;
const RIM_TARGET_Z = POST_Z;
const HINGE_AXIS = new CANNON.Vec3(1, 0, 0);
const VIEW_DIRECTION = new THREE.Vector3(0, 0.62, 1.18).normalize();
const FRONT_CRATE_ROTATION = -0.20;
const ROTATION_PER_PIXEL = 0.008;
const DRAG_THRESHOLD = 5;


function RecordCrate({ projects, activeIndex, onAdvance }) {
  const mountRef = useRef(null);
  const activeIndexRef = useRef(activeIndex);
  const onAdvanceRef = useRef(onAdvance);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  activeIndexRef.current = activeIndex;
  onAdvanceRef.current = onAdvance;

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
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('role', 'button');
    renderer.domElement.setAttribute(
      'aria-label',
      'Interactive three-dimensional crate of project records. Click to advance; drag to rotate.',
    );
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

    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
      allowSleep: false,
    });
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.solver.iterations = 20;
    world.solver.tolerance = 0.001;

    const cratePhysicsMaterial = new CANNON.Material({ friction: 0.68, restitution: 0 });
    const recordPhysicsMaterial = new CANNON.Material({ friction: 0.5, restitution: 0.01 });
    world.addContactMaterial(new CANNON.ContactMaterial(
      cratePhysicsMaterial,
      recordPhysicsMaterial,
      {
        friction: 0.68,
        restitution: 0,
        contactEquationStiffness: 1e7,
        contactEquationRelaxation: 4,
      },
    ));
    world.addContactMaterial(new CANNON.ContactMaterial(
      recordPhysicsMaterial,
      recordPhysicsMaterial,
      {
        friction: 0.46,
        restitution: 0,
        contactEquationStiffness: 1e7,
        contactEquationRelaxation: 4,
      },
    ));

    const geometries = [];
    const materials = new Set();
    const textures = [];
    const crateMaterial = new THREE.MeshStandardMaterial({ color: 0x202321, roughness: 0.86, metalness: 0.08 });
    const crateEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x353a37, roughness: 0.78, metalness: 0.12 });
    const sleeveEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x101211, roughness: 0.72, metalness: 0.06 });
    materials.add(crateMaterial);
    materials.add(crateEdgeMaterial);
    materials.add(sleeveEdgeMaterial);

    const crate = new THREE.Group();
    crate.rotation.y = FRONT_CRATE_ROTATION;
    scene.add(crate);

    const crateBody = new CANNON.Body({
      mass: 0,
      material: cratePhysicsMaterial,
    });

    function box(size, position, material = crateMaterial) {
      const geometry = new THREE.BoxGeometry(...size);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      crate.add(mesh);
      geometries.push(geometry);
      crateBody.addShape(
        new CANNON.Box(new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2)),
        new CANNON.Vec3(...position),
      );
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
    world.addBody(crateBody);

    function anchorZFor(index) {
      return FRONT_RECORD_Z - index * RECORD_SPACING;
    }

    const frontRestAngle = Math.atan2(
      RIM_TARGET_Z - anchorZFor(0),
      RIM_TARGET_Y - RECORD_ANCHOR_Y,
    );
    const backRestAngle = Math.atan2(
      -RIM_TARGET_Z - anchorZFor(projects.length - 1),
      RIM_TARGET_Y - RECORD_ANCHOR_Y,
    );

    function angleForSelection(index, selectedIndex) {
      return index < selectedIndex ? frontRestAngle : backRestAngle;
    }

    function centerFor(index, angle) {
      return {
        y: RECORD_ANCHOR_Y + Math.cos(angle) * SLEEVE_SIZE / 2,
        z: anchorZFor(index) + Math.sin(angle) * SLEEVE_SIZE / 2,
      };
    }

    let disposed = false;
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onLoad = () => {
      requestAnimationFrame(() => {
        if (!disposed) setReady(true);
      });
    };
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const records = projects.map((project, index) => {
      const texture = textureLoader.load(project.recordCover);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textures.push(texture);
      const coverMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.74, metalness: 0.02 });
      materials.add(coverMaterial);

      const geometry = new THREE.BoxGeometry(SLEEVE_SIZE, SLEEVE_SIZE, SLEEVE_DEPTH);
      geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, [
        sleeveEdgeMaterial,
        sleeveEdgeMaterial,
        sleeveEdgeMaterial,
        sleeveEdgeMaterial,
        coverMaterial,
        coverMaterial,
      ]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      crate.add(mesh);

      const initialAngle = angleForSelection(index, activeIndexRef.current);
      const center = centerFor(index, initialAngle);
      const body = new CANNON.Body({
        mass: 0.42,
        material: recordPhysicsMaterial,
        position: new CANNON.Vec3(0, center.y, center.z),
        quaternion: new CANNON.Quaternion().setFromAxisAngle(HINGE_AXIS, initialAngle),
        linearDamping: 0.9,
        angularDamping: 0.72,
        allowSleep: false,
      });
      body.addShape(new CANNON.Box(new CANNON.Vec3(
        SLEEVE_SIZE / 2,
        SLEEVE_SIZE / 2,
        SLEEVE_DEPTH / 2,
      )));
      world.addBody(body);

      const hinge = new CANNON.HingeConstraint(body, crateBody, {
        pivotA: new CANNON.Vec3(0, -SLEEVE_SIZE / 2, 0),
        pivotB: new CANNON.Vec3(0, RECORD_ANCHOR_Y, anchorZFor(index)),
        axisA: HINGE_AXIS,
        axisB: HINGE_AXIS,
        collideConnected: true,
        maxForce: 40,
      });
      hinge.enableMotor();
      hinge.setMotorMaxForce(3);
      world.addConstraint(hinge);

      return { mesh, body, hinge };
    });

    function currentAngle(body) {
      return 2 * Math.atan2(body.quaternion.x, body.quaternion.w);
    }

    function driveRecords() {
      for (const [index, { body, hinge }] of records.entries()) {
        const target = angleForSelection(index, activeIndexRef.current);
        const error = Math.atan2(
          Math.sin(target - currentAngle(body)),
          Math.cos(target - currentAngle(body)),
        );
        hinge.setMotorSpeed(THREE.MathUtils.clamp(error * 7, -3.2, 3.2));
        body.wakeUp();
      }
    }

    function syncRecordMeshes() {
      for (const { mesh, body } of records) {
        mesh.position.set(body.position.x, body.position.y, body.position.z);
        mesh.quaternion.set(
          body.quaternion.x,
          body.quaternion.y,
          body.quaternion.z,
          body.quaternion.w,
        );
      }
    }

    for (let step = 0; step < 90; step += 1) {
      driveRecords();
      world.step(1 / 120);
    }
    syncRecordMeshes();

    const framingPoints = [];
    for (const angle of [backRestAngle, frontRestAngle]) {
      for (const [index, { mesh }] of records.entries()) {
        const center = centerFor(index, angle);
        mesh.position.set(0, center.y, center.z);
        mesh.rotation.set(angle, 0, 0);
      }
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
    syncRecordMeshes();
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
          towardCamera + Math.abs(relative.dot(cameraVertical)) * 1.06 / tangentVertical,
          towardCamera + Math.abs(relative.dot(cameraRight)) * 1.06 / tangentHorizontal,
        );
      }
      camera.position.copy(framingCenter).addScaledVector(VIEW_DIRECTION, cameraDistance + 0.05);
      camera.lookAt(framingCenter);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    let targetCrateRotation = FRONT_CRATE_ROTATION;
    let pointerGesture;

    function advanceCrate() {
      onAdvanceRef.current?.();
    }

    function handlePointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (pointerGesture) return;
      event.preventDefault();
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.classList.add('is-dragging');
      pointerGesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startRotation: crate.rotation.y,
        dragged: false,
      };
    }

    function handlePointerMove(event) {
      if (!pointerGesture || event.pointerId !== pointerGesture.pointerId) return;
      const distance = event.clientX - pointerGesture.startX;
      if (Math.abs(distance) >= DRAG_THRESHOLD) pointerGesture.dragged = true;
      if (!pointerGesture.dragged) return;
      targetCrateRotation = pointerGesture.startRotation + distance * ROTATION_PER_PIXEL;
      crate.rotation.y = targetCrateRotation;
    }

    function finishPointerGesture(event, cancelled = false) {
      if (!pointerGesture || event.pointerId !== pointerGesture.pointerId) return;
      const shouldAdvance = !cancelled && !pointerGesture.dragged;
      pointerGesture = undefined;
      renderer.domElement.classList.remove('is-dragging');
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      if (shouldAdvance) advanceCrate();
    }

    function handlePointerUp(event) {
      finishPointerGesture(event);
    }

    function handlePointerCancel(event) {
      finishPointerGesture(event, true);
    }

    function handleKeyDown(event) {
      if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      advanceCrate();
    }

    function handleContextLost(event) {
      event.preventDefault();
      setFailed(true);
    }
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointercancel', handlePointerCancel);
    renderer.domElement.addEventListener('keydown', handleKeyDown);

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let animationFrame;
    function render() {
      const delta = Math.min(0.05, clock.getDelta());
      const rotationDelta = Math.atan2(
        Math.sin(targetCrateRotation - crate.rotation.y),
        Math.cos(targetCrateRotation - crate.rotation.y),
      );
      crate.rotation.y += rotationDelta * (1 - Math.exp(-delta * 12));
      driveRecords();
      world.step(1 / 60, delta, 3);
      syncRecordMeshes();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    }
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointercancel', handlePointerCancel);
      renderer.domElement.removeEventListener('keydown', handleKeyDown);
      for (const texture of textures) texture.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [projects]);

  return (
    <div className="record-crate-stage" ref={mountRef}>
      <RecordCrateFallback hidden={ready && !failed} failed={failed} />
    </div>
  );
}

export default RecordCrate;
