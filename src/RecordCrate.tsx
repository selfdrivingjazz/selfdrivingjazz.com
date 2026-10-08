'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import RecordCrateFallback from './RecordCrateFallback';

type Vector3Tuple = [number, number, number];

/** A sleeve in the crate: either a cover image, or a generated collage sleeve (e.g. "older works"). */
export type CrateRecord =
  | { cover: string }
  | { collage: string[]; title: string; label: string };

interface RecordCrateProps {
  records: CrateRecord[];
  activeIndex: number;
  /** Called when the front record is tapped/activated. */
  onOpen: (index: number) => void;
  /** Lift the record out of the crate toward the camera before calling `onOpen`. */
  pullTransition?: boolean;
}

interface PullAnimation {
  index: number;
  mesh: THREE.Mesh;
  start: number;
  from: THREE.Vector3;
  lift: THREE.Vector3;
  to: THREE.Vector3;
  fromRotation: THREE.Quaternion;
  toRotation: THREE.Quaternion;
  opened: boolean;
}

interface PointerGesture {
  pointerId: number;
  startX: number;
  startRotation: number;
  dragged: boolean;
}
const CRATE_WIDTH = 3.55;
const CRATE_DEPTH = 3.18;
const POST_SIZE = 0.14;
// Rails sit inside the posts and are slightly slimmer, so no faces are coplanar (no z-fighting at the joints).
const RAIL_SIZE = 0.12;
const POST_X = 1.68;
const POST_Z = (CRATE_DEPTH - POST_SIZE) / 2;
const POST_HEIGHT = 1.32;
const SLEEVE_SIZE = 2.78;
const SLEEVE_DEPTH = 0.036;
const RECORD_SPACING = 0.11;
const BASE_TOP = 0.08;
const RECORD_ANCHOR_Y = BASE_TOP + SLEEVE_DEPTH / 2 + 0.004;
// Stack sits near the crate's middle so forward- and back-leaning records tilt by similar, moderate angles.
const FRONT_RECORD_Z = 0.15;
const RIM_TARGET_Y = 1.25;
// Leaning records stop just short of the rail's inner face instead of pressing into it (which made them jitter).
const RIM_TARGET_Z = POST_Z - RAIL_SIZE / 2 - SLEEVE_DEPTH / 2 - 0.012;
const MOTOR_DEADBAND = 0.003;
const SETTLE_FRAMES = 30;
const HINGE_AXIS = new CANNON.Vec3(1, 0, 0);
const VIEW_DIRECTION = new THREE.Vector3(0, 0.62, 1.18).normalize();
const FRONT_CRATE_ROTATION = -0.20;
const ROTATION_PER_PIXEL = 0.008;
const DRAG_THRESHOLD = 5;
const PULL_DURATION_MS = 920;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}


function drawCollageSleeve(canvas: HTMLCanvasElement, record: { collage: string[]; title: string; label: string }, onChange: () => void) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const size = canvas.width;
  const tile = size / 3;
  context.fillStyle = '#0b0c0c';
  context.fillRect(0, 0, size, size);
  const slots = [0, 1, 2, 3, 5, 6, 7, 8];
  record.collage.slice(0, slots.length).forEach((src, index) => {
    const image = new Image();
    image.onload = () => {
      const slot = slots[index];
      context.globalAlpha = 0.78;
      context.drawImage(image, (slot % 3) * tile, Math.floor(slot / 3) * tile, tile, tile);
      context.globalAlpha = 1;
      onChange();
    };
    image.src = src;
  });
  const drawLabel = () => {
    const fontFamily = getComputedStyle(document.body).fontFamily;
    context.fillStyle = '#0b0c0c';
    context.fillRect(tile, tile, tile, tile);
    context.fillStyle = '#f0f0ed';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const [first, ...rest] = record.title.split(' ');
    context.font = `600 ${Math.round(tile * 0.2)}px ${fontFamily}`;
    context.fillText(first, size / 2, tile * 1.38);
    context.fillText(rest.join(' '), size / 2, tile * 1.58);
    context.fillStyle = '#95958f';
    context.font = `500 ${Math.round(tile * 0.07)}px ${fontFamily}`;
    context.fillText(record.label, size / 2, tile * 1.8);
    onChange();
  };
  drawLabel();
  document.fonts?.ready.then(drawLabel);
}

function RecordCrate({ records: crateRecords, activeIndex, onOpen, pullTransition = false }: RecordCrateProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef(activeIndex);
  const onOpenRef = useRef(onOpen);
  const pullTransitionRef = useRef(pullTransition);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  activeIndexRef.current = activeIndex;
  onOpenRef.current = onOpen;
  pullTransitionRef.current = pullTransition;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer: THREE.WebGLRenderer | undefined;
    const rendererOptions: THREE.WebGLRendererParameters[] = [
      { antialias: true, alpha: true, powerPreference: 'high-performance' },
      { antialias: false, alpha: true, powerPreference: 'default' },
    ];
    for (const options of rendererOptions) {
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
    const activeMount: HTMLDivElement = mount;
    const activeRenderer: THREE.WebGLRenderer = renderer;

    activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    activeRenderer.setClearColor(0x080808, 0);
    activeRenderer.outputColorSpace = THREE.SRGBColorSpace;
    activeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    activeRenderer.toneMappingExposure = 0.92;
    activeRenderer.shadowMap.enabled = true;
    activeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    activeRenderer.domElement.className = 'record-crate-canvas';
    activeRenderer.domElement.tabIndex = 0;
    activeRenderer.domElement.setAttribute('role', 'button');
    activeRenderer.domElement.setAttribute(
      'aria-label',
      'Interactive three-dimensional crate of project records. Activate to open the front record; drag sideways to rotate.',
    );
    activeMount.append(activeRenderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40);

    const ambient = new THREE.HemisphereLight(0xdce5e1, 0x050606, 1.7);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-3.5, 7, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    scene.add(key);
    const fill = new THREE.PointLight(0x91d8ce, 1.8, 12, 2);
    fill.position.set(3.5, 2.4, 2.8);
    scene.add(fill);
    const animateLights = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
      allowSleep: false,
    });
    world.broadphase = new CANNON.SAPBroadphase(world);
    const solver = world.solver as CANNON.GSSolver;
    solver.iterations = 20;
    solver.tolerance = 0.001;

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

    const geometries: THREE.BufferGeometry[] = [];
    const materials = new Set<THREE.Material>();
    const textures: THREE.Texture[] = [];
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

    function box(size: Vector3Tuple, position: Vector3Tuple, material: THREE.MeshStandardMaterial = crateMaterial) {
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
      box([POST_X * 2, RAIL_SIZE, RAIL_SIZE], [0, y, -POST_Z], crateMaterial);
      box([POST_X * 2, RAIL_SIZE, RAIL_SIZE], [0, y, POST_Z], crateMaterial);
      box([RAIL_SIZE, RAIL_SIZE, POST_Z * 2], [-POST_X, y, 0], crateMaterial);
      box([RAIL_SIZE, RAIL_SIZE, POST_Z * 2], [POST_X, y, 0], crateMaterial);
    }
    world.addBody(crateBody);

    const recordCount = crateRecords.length;
    function anchorZFor(index: number): number {
      return FRONT_RECORD_Z - index * RECORD_SPACING;
    }

    const frontRestAngle = Math.atan2(
      RIM_TARGET_Z - anchorZFor(0),
      RIM_TARGET_Y - RECORD_ANCHOR_Y,
    );
    const backRestAngle = Math.atan2(
      -RIM_TARGET_Z - anchorZFor(recordCount - 1),
      RIM_TARGET_Y - RECORD_ANCHOR_Y,
    );

    function angleForSelection(index: number, selectedIndex: number): number {
      return index < selectedIndex ? frontRestAngle : backRestAngle;
    }

    function centerFor(index: number, angle: number) {
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
    const records = crateRecords.map((record, index) => {
      let texture: THREE.Texture;
      if ('cover' in record) {
        texture = textureLoader.load(record.cover);
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const canvasTexture = new THREE.CanvasTexture(canvas);
        drawCollageSleeve(canvas, record, () => { canvasTexture.needsUpdate = true; });
        texture = canvasTexture;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, activeRenderer.capabilities.getMaxAnisotropy());
      textures.push(texture);
      const coverMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xd8d8d8,
        roughness: 0.9,
        metalness: 0,
      });
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

      return { mesh, body, hinge, target: Number.NaN, stillFrames: 0 };
    });

    function currentAngle(body: CANNON.Body): number {
      return 2 * Math.atan2(body.quaternion.x, body.quaternion.w);
    }

    // Settled records are put to sleep; otherwise sleeves resting on each other jitter in the contact solver.
    function driveRecords() {
      for (const [index, record] of records.entries()) {
        const { body, hinge } = record;
        const target = angleForSelection(index, activeIndexRef.current);
        if (target !== record.target) {
          record.target = target;
          record.stillFrames = 0;
          body.wakeUp();
        }
        if (body.sleepState === CANNON.Body.SLEEPING) continue;
        const error = Math.atan2(
          Math.sin(target - currentAngle(body)),
          Math.cos(target - currentAngle(body)),
        );
        hinge.setMotorSpeed(Math.abs(error) < MOTOR_DEADBAND ? 0 : THREE.MathUtils.clamp(error * 7, -3.2, 3.2));
        record.stillFrames = body.angularVelocity.length() < 0.04 ? record.stillFrames + 1 : 0;
        if (record.stillFrames > SETTLE_FRAMES) body.sleep();
      }
    }

    let pull: PullAnimation | undefined;

    function syncRecordMeshes() {
      for (const { mesh, body } of records) {
        if (pull?.mesh === mesh) continue;
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

    const framingPoints: THREE.Vector3[] = [];
    for (const angle of [backRestAngle, frontRestAngle]) {
      for (const [index, { mesh }] of records.entries()) {
        const center = centerFor(index, angle);
        mesh.position.set(0, center.y, center.z);
        mesh.rotation.set(angle, 0, 0);
      }
      crate.updateWorldMatrix(true, true);
      crate.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        if (!bounds) return;
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
      const width = Math.max(1, activeMount.clientWidth);
      const height = Math.max(1, activeMount.clientHeight);
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
      activeRenderer.setSize(width, height, false);
    }

    let targetCrateRotation = FRONT_CRATE_ROTATION;
    let pointerGesture: PointerGesture | undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function openActiveRecord() {
      if (pull) return;
      const index = activeIndexRef.current;
      if (!pullTransitionRef.current || reducedMotion) {
        onOpenRef.current(index);
        return;
      }
      const { mesh } = records[index];
      scene.attach(mesh);
      const from = mesh.position.clone();
      const forward = camera.getWorldDirection(new THREE.Vector3());
      const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const limitingTangent = Math.min(tangent, tangent * camera.aspect);
      const distance = (SLEEVE_SIZE / 2) / (limitingTangent * 0.86);
      pull = {
        index,
        mesh,
        start: performance.now(),
        from,
        lift: from.clone().add(new THREE.Vector3(0, SLEEVE_SIZE * 1.05, 0)),
        to: camera.position.clone().addScaledVector(forward, distance),
        fromRotation: mesh.quaternion.clone(),
        toRotation: camera.quaternion.clone(),
        opened: false,
      };
      activeRenderer.domElement.classList.add('is-pulling');
    }

    function stepPull(now: number) {
      if (!pull) return;
      const t = Math.min(1, (now - pull.start) / PULL_DURATION_MS);
      const eased = easeInOutCubic(t);
      const inverse = 1 - eased;
      // Quadratic Bézier: rise straight out of the crate, then sweep toward the lens.
      pull.mesh.position
        .copy(pull.from).multiplyScalar(inverse * inverse)
        .addScaledVector(pull.lift, 2 * inverse * eased)
        .addScaledVector(pull.to, eased * eased);
      const turn = easeInOutCubic(THREE.MathUtils.clamp((t - 0.18) / 0.82, 0, 1));
      pull.mesh.quaternion.slerpQuaternions(pull.fromRotation, pull.toRotation, turn);
      if (t === 1 && !pull.opened) {
        pull.opened = true;
        onOpenRef.current(pull.index);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (pointerGesture) return;
      event.preventDefault();
      activeRenderer.domElement.setPointerCapture(event.pointerId);
      activeRenderer.domElement.classList.add('is-dragging');
      pointerGesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startRotation: crate.rotation.y,
        dragged: false,
      };
    }

    function handlePointerMove(event: PointerEvent) {
      if (!pointerGesture || event.pointerId !== pointerGesture.pointerId) return;
      const distance = event.clientX - pointerGesture.startX;
      if (Math.abs(distance) >= DRAG_THRESHOLD) pointerGesture.dragged = true;
      if (!pointerGesture.dragged) return;
      targetCrateRotation = pointerGesture.startRotation + distance * ROTATION_PER_PIXEL;
      crate.rotation.y = targetCrateRotation;
    }

    function finishPointerGesture(event: PointerEvent, cancelled = false) {
      if (!pointerGesture || event.pointerId !== pointerGesture.pointerId) return;
      const shouldOpen = !cancelled && !pointerGesture.dragged;
      pointerGesture = undefined;
      activeRenderer.domElement.classList.remove('is-dragging');
      if (activeRenderer.domElement.hasPointerCapture(event.pointerId)) {
        activeRenderer.domElement.releasePointerCapture(event.pointerId);
      }
      if (shouldOpen) openActiveRecord();
    }

    function handlePointerUp(event: PointerEvent) {
      finishPointerGesture(event);
    }

    function handlePointerCancel(event: PointerEvent) {
      finishPointerGesture(event, true);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      openActiveRecord();
    }

    function handleContextLost(event: Event) {
      event.preventDefault();
      setFailed(true);
    }
    activeRenderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    activeRenderer.domElement.addEventListener('pointerdown', handlePointerDown);
    activeRenderer.domElement.addEventListener('pointermove', handlePointerMove);
    activeRenderer.domElement.addEventListener('pointerup', handlePointerUp);
    activeRenderer.domElement.addEventListener('pointercancel', handlePointerCancel);
    activeRenderer.domElement.addEventListener('keydown', handleKeyDown);

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let animationFrame = 0;
    function render() {
      const delta = Math.min(0.05, clock.getDelta());
      const elapsed = clock.elapsedTime;
      if (animateLights) {
        key.position.x = -3.5 + Math.sin(elapsed * 0.19) * 0.5;
        key.position.z = 5.5 + Math.cos(elapsed * 0.14) * 0.35;
        fill.position.x = 3.5 + Math.cos(elapsed * 0.22) * 0.65;
        fill.position.y = 2.4 + Math.sin(elapsed * 0.17) * 0.28;
      }
      const rotationDelta = Math.atan2(
        Math.sin(targetCrateRotation - crate.rotation.y),
        Math.cos(targetCrateRotation - crate.rotation.y),
      );
      crate.rotation.y += rotationDelta * (1 - Math.exp(-delta * 12));
      driveRecords();
      world.step(1 / 60, delta, 3);
      syncRecordMeshes();
      stepPull(performance.now());
      activeRenderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    }
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      activeRenderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      activeRenderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      activeRenderer.domElement.removeEventListener('pointermove', handlePointerMove);
      activeRenderer.domElement.removeEventListener('pointerup', handlePointerUp);
      activeRenderer.domElement.removeEventListener('pointercancel', handlePointerCancel);
      activeRenderer.domElement.removeEventListener('keydown', handleKeyDown);
      for (const texture of textures) texture.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      activeRenderer.dispose();
      activeRenderer.domElement.remove();
    };
  }, [crateRecords]);

  return (
    <div className="record-crate-stage" ref={mountRef}>
      <RecordCrateFallback hidden={ready && !failed} failed={failed} />
    </div>
  );
}

export default RecordCrate;
