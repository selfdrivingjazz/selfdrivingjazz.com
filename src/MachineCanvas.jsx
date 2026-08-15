import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildMachine } from './machine/buildMachine.js';

const CAMERA_VIEW_HEIGHT = 8.4;

function MachineCanvas({ seed, evolution = false }) {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const evolutionRef = useRef(evolution);
  evolutionRef.current = evolution;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setFailed(true);
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'machine-canvas';
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute(
      'aria-label',
      'A procedurally generated three-dimensional machine. Drag to inspect it.',
    );
    mount.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 3.35, -3.35, 0.1, 80);
    camera.position.set(7.6, 6.2, 8.4);
    camera.lookAt(0, 0.85, 0);

    const machineRoot = new THREE.Group();
    machineRoot.position.y = -0.42;
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
    const interaction = {
      dragging: false,
      lastX: 0,
      lastY: 0,
      targetX: 0.02,
      targetY: -0.48,
      currentX: 0.02,
      currentY: -0.48,
      hoverX: 0,
      hoverY: 0,
    };

    function resize() {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const aspect = width / height;
      camera.left = (-CAMERA_VIEW_HEIGHT * aspect) / 2;
      camera.right = (CAMERA_VIEW_HEIGHT * aspect) / 2;
      camera.top = CAMERA_VIEW_HEIGHT / 2;
      camera.bottom = -CAMERA_VIEW_HEIGHT / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function normalizedPointer(event) {
      const bounds = renderer.domElement.getBoundingClientRect();
      return {
        x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        y: ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      };
    }

    function handlePointerDown(event) {
      interaction.dragging = true;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      renderer.domElement.classList.add('is-dragging');
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
      if (interaction.dragging) {
        const deltaX = event.clientX - interaction.lastX;
        const deltaY = event.clientY - interaction.lastY;
        interaction.lastX = event.clientX;
        interaction.lastY = event.clientY;
        interaction.targetY += deltaX * 0.008;
        interaction.targetX = THREE.MathUtils.clamp(interaction.targetX + deltaY * 0.006, -0.32, 0.32);
        return;
      }
      const pointer = normalizedPointer(event);
      interaction.hoverX = pointer.y * 0.045;
      interaction.hoverY = pointer.x * 0.075;
    }

    function handlePointerEnd(event) {
      interaction.dragging = false;
      renderer.domElement.classList.remove('is-dragging');
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    }

    function handlePointerLeave() {
      if (!interaction.dragging) {
        interaction.hoverX = 0;
        interaction.hoverY = 0;
      }
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerEnd);
    renderer.domElement.addEventListener('pointercancel', handlePointerEnd);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let animationFrame;
    const engine = {
      machine: null,
      setMachine(nextSeed) {
        this.machine?.dispose();
        this.machine = buildMachine(nextSeed);
        machineRoot.add(this.machine.group);
        renderer.domElement.setAttribute(
          'aria-label',
          `${this.machine.family.name}, a procedurally generated three-dimensional instrument. Drag to inspect it.`,
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
      const orbit = reducedMotion ? 0 : elapsed * 0.075;
      machineRoot.rotation.x = interaction.currentX + (reducedMotion ? 0 : Math.sin(elapsed * 0.22) * 0.025);
      machineRoot.rotation.y = interaction.currentY + orbit;
      machineRoot.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 0.17) * 0.012;
      machineRoot.position.y = -0.18 + (reducedMotion ? 0 : Math.sin(elapsed * 0.4) * 0.035);
      if (!reducedMotion) {
        cyanLight.position.x = 3.4 + Math.sin(elapsed * 0.31) * 1.4;
        limeLight.position.z = -2.5 + Math.cos(elapsed * 0.27) * 1.2;
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerEnd);
      renderer.domElement.removeEventListener('pointercancel', handlePointerEnd);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      engine.machine?.dispose();
      grid.geometry.dispose();
      for (const material of gridMaterials) material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setMachine(seed);
  }, [seed]);

  if (failed) {
    return <p className="machine-fallback">The machine renderer is unavailable on this device.</p>;
  }

  return <div className="machine-stage" ref={mountRef} />;
}

export default MachineCanvas;
