'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { MachineInteraction } from './machine/components';
import { buildMachine, type BuiltMachine } from './machine/buildMachine';
import { generateMachinePlan, type Vector3Tuple } from './machine/grammar';

interface MachineCanvasProps {
  seed: number;
  evolution?: boolean;
}

interface MachineEngine {
  machine: BuiltMachine | null;
  setMachine(nextSeed: number): void;
}

const FRAMING_SCALE = 0.84;

function color(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}

function projectPosition([x, y, z]: Vector3Tuple) {
  return {
    x: (x - z * 0.72) * 72,
    y: (x * 0.22 + z * 0.38) * 45 - y * 70,
  };
}

function MachineFallback({ seed }: { seed: number }) {
  const plan = useMemo(() => generateMachinePlan(seed), [seed]);
  const modules = useMemo(
    () => plan.modules
      .map((module, index) => {
        const projected = projectPosition(module.position);
        return {
          ...module,
          index,
          x: projected.x,
          y: projected.y,
          width: module.size[0] * 50,
          height: module.size[1] * 54 + 16,
          depth: module.size[2] * 12,
        };
      })
      .sort((left, right) => left.y - right.y),
    [plan],
  );
  const moduleByIndex = new Map(modules.map((module) => [module.index, module]));
  const horizontal = modules.flatMap((module) => [
    module.x - module.width / 2,
    module.x + module.width / 2 + module.depth,
  ]);
  const vertical = modules.flatMap((module) => [
    module.y - module.height - module.depth,
    module.y + module.depth,
  ]);
  const minimumX = Math.min(...horizontal) - 36;
  const maximumX = Math.max(...horizontal) + 36;
  const minimumY = Math.min(...vertical) - 36;
  const maximumY = Math.max(...vertical) + 36;
  const viewBox = `${minimumX} ${minimumY} ${maximumX - minimumX} ${maximumY - minimumY}`;

  return (
    <svg
      className="machine-fallback"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${plan.specimen}, a procedurally generated two-dimensional ${plan.topology.name.toLowerCase()}.`}
    >
      <g className="fallback-grid" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => {
          const offset = (index - 3) * 34;
          return <line key={offset} x1={minimumX} y1={maximumY - offset} x2={maximumX} y2={maximumY - offset} />;
        })}
      </g>
      <g className="fallback-joints" aria-hidden="true">
        {plan.edges.map(([fromIndex, toIndex]) => {
          const from = moduleByIndex.get(fromIndex);
          const to = moduleByIndex.get(toIndex);
          if (!from || !to) return null;
          return (
            <g key={`${fromIndex}-${toIndex}`}>
              <line x1={from.x} y1={from.y - from.height / 2} x2={to.x} y2={to.y - to.height / 2} />
              <circle cx={(from.x + to.x) / 2} cy={(from.y + to.y - from.height / 2 - to.height / 2) / 2} r="4" />
            </g>
          );
        })}
      </g>
      <g className="fallback-modules" aria-hidden="true">
        {modules.map((module) => {
          const left = module.x - module.width / 2;
          const top = module.y - module.height;
          const accent = color(plan.palette[module.accent]);
          const controls = module.role === 'keys' ? 6 : module.role === 'speaker' ? 2 : 4;
          return (
            <g key={module.id}>
              {module.legs && (
                <>
                  <line className="fallback-leg" x1={left + 9} y1={module.y} x2={left + 2} y2={module.y + 20} />
                  <line className="fallback-leg" x1={left + module.width - 9} y1={module.y} x2={left + module.width + 2} y2={module.y + 20} />
                </>
              )}
              {module.form === 'drum' ? (
                <>
                  <rect x={left} y={top + module.depth / 2} width={module.width} height={module.height - module.depth / 2} rx={module.width / 8} fill={color(plan.palette.dark)} />
                  <ellipse cx={module.x} cy={top + module.depth / 2} rx={module.width / 2} ry={Math.max(7, module.depth)} fill={color(plan.palette.surface)} stroke={accent} />
                  <ellipse cx={module.x} cy={module.y} rx={module.width / 2} ry={Math.max(5, module.depth * 0.72)} fill={color(plan.palette.black)} />
                </>
              ) : (
                <>
                  <rect x={left} y={top} width={module.width} height={module.height} rx="3" fill={color(plan.palette.dark)} stroke={color(plan.palette.hardware)} />
                  <polygon
                    points={`${left},${top} ${left + module.depth},${top - module.depth} ${left + module.width + module.depth},${top - module.depth} ${left + module.width},${top}`}
                    fill={color(plan.palette.surface)}
                    stroke={color(plan.palette.hardware)}
                  />
                  <polygon
                    points={`${left + module.width},${top} ${left + module.width + module.depth},${top - module.depth} ${left + module.width + module.depth},${module.y - module.depth} ${left + module.width},${module.y}`}
                    fill={color(plan.palette.mid)}
                    stroke={color(plan.palette.hardware)}
                  />
                </>
              )}
              {Array.from({ length: controls }, (_, index) => {
                const spacing = module.width / (controls + 1);
                const controlX = left + spacing * (index + 1);
                const controlY = top + module.height * 0.52;
                if (module.role === 'keys') {
                  return (
                    <rect
                      key={index}
                      x={controlX - Math.max(2, spacing * 0.28)}
                      y={controlY - 6}
                      width={Math.max(4, spacing * 0.56)}
                      height="13"
                      rx="1"
                      fill={index % 3 === 1 ? accent : color(plan.palette.white)}
                    />
                  );
                }
                return (
                  <circle
                    key={index}
                    cx={controlX}
                    cy={controlY}
                    r={module.role === 'speaker' ? Math.max(6, spacing * 0.38) : Math.max(3, spacing * 0.22)}
                    fill={index % 3 === 1 ? color(plan.palette.secondary) : accent}
                    stroke={color(plan.palette.white)}
                  />
                );
              })}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function MachineCanvas({ seed, evolution = false }: MachineCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MachineEngine | null>(null);
  const evolutionRef = useRef(evolution);
  evolutionRef.current = evolution;
  const [failed, setFailed] = useState(false);

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

    activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    activeRenderer.setClearColor(0x000000, 0);
    activeRenderer.outputColorSpace = THREE.SRGBColorSpace;
    activeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    activeRenderer.toneMappingExposure = 1.08;
    activeRenderer.shadowMap.enabled = true;
    activeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    activeRenderer.domElement.className = 'machine-canvas';
    activeRenderer.domElement.setAttribute('role', 'application');
    activeRenderer.domElement.tabIndex = 0;
    activeRenderer.domElement.setAttribute(
      'aria-label',
      'A procedurally generated three-dimensional instrument. Drag to inspect it; click its controls to operate them.',
    );
    activeMount.append(activeRenderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 3.35, -3.35, 0.1, 80);
    camera.position.set(7.6, 6.2, 8.4);
    camera.lookAt(0, 0, 0);

    const machineRoot = new THREE.Group();
    machineRoot.position.y = -0.8;
    scene.add(machineRoot);

    const hemisphere = new THREE.HemisphereLight(0xcad7d2, 0x050706, 2.4);
    scene.add(hemisphere);

    const keyLight = new THREE.DirectionalLight(0xe8eee9, 4.1);
    keyLight.position.set(-3.5, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    scene.add(keyLight);

    const cyanLight = new THREE.PointLight(0x73ddd0, 8, 9, 2);
    cyanLight.position.set(3.4, 2.5, 2.8);
    scene.add(cyanLight);

    const limeLight = new THREE.PointLight(0xb9dc63, 4, 7, 2);
    limeLight.position.set(-3, 3.2, -2.5);
    scene.add(limeLight);

    const grid = new THREE.GridHelper(11, 18, 0x26312e, 0x171d1b);
    grid.position.y = -0.22;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    for (const material of gridMaterials) {
      material.transparent = true;
      material.opacity = 0.34;
      material.depthWrite = false;
    }
    scene.add(grid);

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const raycaster = new THREE.Raycaster();
    const pointerVector = new THREE.Vector2();
    const interaction = {
      pressed: false,
      dragging: false,
      downX: 0,
      downY: 0,
      lastX: 0,
      lastY: 0,
      targetX: 0.02,
      targetY: -0.48,
      currentX: 0.02,
      currentY: -0.48,
      hoverX: 0,
      hoverY: 0,
      keyboardIndex: 0,
      viewRadius: 3,
      viewCenterY: 0.8,
    };

    function resize() {
      const width = Math.max(1, activeMount.clientWidth);
      const height = Math.max(1, activeMount.clientHeight);
      const aspect = width / height;
      const diameter = interaction.viewRadius * 2 * FRAMING_SCALE;
      const viewHeight = aspect < 1 ? diameter / aspect : diameter;
      camera.left = (-viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      activeRenderer.setSize(width, height, false);
    }

    function normalizedPointer(event: PointerEvent) {
      const bounds = activeRenderer.domElement.getBoundingClientRect();
      return {
        x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        y: ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      };
    }

    function controlAt(event: PointerEvent) {
      if (!engine.machine?.interactions.length) return null;
      const pointer = normalizedPointer(event);
      pointerVector.set(pointer.x, pointer.y);
      raycaster.setFromCamera(pointerVector, camera);
      const controls = engine.machine.interactions;
      const hits = raycaster.intersectObjects(controls.map(({ target }) => target), true);
      for (const hit of hits) {
        let object: THREE.Object3D | null = hit.object;
        while (object) {
          const control = controls.find(({ target }) => target === object);
          if (control) return control;
          object = object.parent;
        }
      }
      return null;
    }
    function activateControl(control: MachineInteraction | null) {
      if (!control) return;
      control.activate();
      const operationCount = Number(activeRenderer.domElement.dataset.operations ?? 0) + 1;
      activeRenderer.domElement.dataset.operations = String(operationCount);
    }


    function handlePointerDown(event: PointerEvent) {
      interaction.pressed = true;
      interaction.dragging = false;
      interaction.downX = event.clientX;
      interaction.downY = event.clientY;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      activeRenderer.domElement.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
      if (interaction.pressed) {
        if (!interaction.dragging && Math.hypot(event.clientX - interaction.downX, event.clientY - interaction.downY) > 5) {
          interaction.dragging = true;
          activeRenderer.domElement.classList.add('is-dragging');
        }
        if (interaction.dragging) {
          const deltaX = event.clientX - interaction.lastX;
          const deltaY = event.clientY - interaction.lastY;
          interaction.targetY += deltaX * 0.008;
          interaction.targetX = THREE.MathUtils.clamp(interaction.targetX + deltaY * 0.006, -0.32, 0.32);
        }
        interaction.lastX = event.clientX;
        interaction.lastY = event.clientY;
        return;
      }
      const pointer = normalizedPointer(event);
      interaction.hoverX = pointer.y * 0.045;
      interaction.hoverY = pointer.x * 0.075;
      activeRenderer.domElement.classList.toggle('is-control', Boolean(controlAt(event)));
    }

    function handlePointerEnd(event: PointerEvent) {
      const wasDragging = interaction.dragging;
      interaction.pressed = false;
      interaction.dragging = false;
      activeRenderer.domElement.classList.remove('is-dragging');
      if (!wasDragging) activateControl(controlAt(event));
      activeRenderer.domElement.classList.toggle('is-control', Boolean(controlAt(event)));
      if (activeRenderer.domElement.hasPointerCapture(event.pointerId)) {
        activeRenderer.domElement.releasePointerCapture(event.pointerId);
      }
    }

    function handlePointerLeave() {
      if (!interaction.dragging) {
        interaction.hoverX = 0;
        interaction.hoverY = 0;
        activeRenderer.domElement.classList.remove('is-control');
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.key !== 'Enter' && event.key !== ' ') || !engine.machine?.interactions.length) return;
      event.preventDefault();
      const controls = engine.machine.interactions;
      activateControl(controls[interaction.keyboardIndex % controls.length]);
      interaction.keyboardIndex = (interaction.keyboardIndex + 1) % controls.length;
    }

    activeRenderer.domElement.addEventListener('pointerdown', handlePointerDown);
    activeRenderer.domElement.addEventListener('pointermove', handlePointerMove);
    activeRenderer.domElement.addEventListener('pointerup', handlePointerEnd);
    activeRenderer.domElement.addEventListener('pointercancel', handlePointerEnd);
    activeRenderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    activeRenderer.domElement.addEventListener('keydown', handleKeyDown);
    function handleContextLost(event: Event) {
      event.preventDefault();
      setFailed(true);
    }
    activeRenderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let animationFrame = 0;
    const engine: MachineEngine = {
      machine: null,
      setMachine(nextSeed: number) {
        this.machine?.dispose();
        this.machine = buildMachine(nextSeed);
        machineRoot.add(this.machine.group);
        cyanLight.color.setHex(this.machine.plan.palette.primary);
        limeLight.color.setHex(this.machine.plan.palette.secondary);
        interaction.viewRadius = this.machine.viewRadius;
        interaction.viewCenterY = this.machine.viewCenterY;
        grid.position.y = -interaction.viewCenterY - 0.22;
        resize();
        interaction.keyboardIndex = 0;
        activeRenderer.domElement.setAttribute(
          'aria-label',
          `${this.machine.family.name}, a procedurally generated three-dimensional ${this.machine.plan.topology.name.toLowerCase()}. Drag to inspect it; click controls to operate them.`,
        );
      },
    };
    engineRef.current = engine;

    function render() {
      const elapsed = clock.getElapsedTime();
      const reducedMotion = reducedMotionQuery.matches;
      engine.machine?.update(elapsed, reducedMotion, evolutionRef.current);

      const targetX = interaction.targetX + (reducedMotion ? 0 : interaction.hoverX);
      const targetY = interaction.targetY + (reducedMotion ? 0 : interaction.hoverY);
      interaction.currentX = THREE.MathUtils.damp(interaction.currentX, targetX, 6, 1 / 60);
      interaction.currentY = THREE.MathUtils.damp(interaction.currentY, targetY, 6, 1 / 60);
      const orbit = reducedMotion ? 0 : elapsed * 0.035;
      machineRoot.rotation.x = interaction.currentX + (reducedMotion ? 0 : Math.sin(elapsed * 0.22) * 0.025);
      machineRoot.rotation.y = interaction.currentY + orbit;
      machineRoot.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 0.17) * 0.012;
      machineRoot.position.y = -interaction.viewCenterY + (reducedMotion ? 0 : Math.sin(elapsed * 0.4) * 0.035);
      if (!reducedMotion) {
        cyanLight.position.x = 3.4 + Math.sin(elapsed * 0.31) * 1.4;
        limeLight.position.z = -2.5 + Math.cos(elapsed * 0.27) * 1.2;
      }

      activeRenderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      activeRenderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      activeRenderer.domElement.removeEventListener('pointermove', handlePointerMove);
      activeRenderer.domElement.removeEventListener('pointerup', handlePointerEnd);
      activeRenderer.domElement.removeEventListener('pointercancel', handlePointerEnd);
      activeRenderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      activeRenderer.domElement.removeEventListener('keydown', handleKeyDown);
      activeRenderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      engine.machine?.dispose();
      grid.geometry.dispose();
      for (const material of gridMaterials) material.dispose();
      activeRenderer.dispose();
      activeRenderer.domElement.remove();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setMachine(seed);
  }, [seed]);

  return (
    <div className="machine-stage" ref={mountRef}>
      {failed && <MachineFallback seed={seed} />}
    </div>
  );
}

export default MachineCanvas;
