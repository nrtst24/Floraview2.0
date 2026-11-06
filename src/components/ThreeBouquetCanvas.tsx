import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBouquet3D, BouquetBuildResult } from '../three/bouquetGeometry';
import {
  createContactShadowTexture,
  createPedestalStoneTexture,
} from '../three/proceduralTextures';
import { BouquetConfig, FlowerSpeciesId } from '../types/floraview';

export type CameraPreset = 'threequarter' | 'front' | 'top' | 'stem';

export interface ThreeBouquetCanvasHandle {
  captureSnapshot: () => string | null;
  resetCamera: () => void;
}

interface ThreeBouquetCanvasProps {
  config: BouquetConfig;
  mode?: 'studio' | 'ar' | 'preview';
  explodedProgress?: number;
  cameraPreset?: CameraPreset;
  autoRotate?: boolean;
  arScale?: number;
  arRotationDeg?: number;
  arOffset?: { x: number; z: number };
  arVaseMode?: boolean;
  onSelectSpecies?: (species: FlowerSpeciesId | null) => void;
  className?: string;
}

const CAMERA_TARGETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  threequarter: { pos: [1.55, 1.85, 2.35], target: [0, 1.05, 0] },
  front: { pos: [0, 1.32, 2.75], target: [0, 1.05, 0] },
  top: { pos: [0, 3.15, 0.55], target: [0, 1.28, 0] },
  stem: { pos: [1.1, 0.68, 1.85], target: [0, 0.55, 0] },
};

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const ThreeBouquetCanvas = forwardRef<
  ThreeBouquetCanvasHandle,
  ThreeBouquetCanvasProps
>(
  (
    {
      config,
      mode = 'studio',
      explodedProgress = 0,
      cameraPreset = 'threequarter',
      autoRotate = true,
      arScale = 1,
      arRotationDeg = 0,
      arOffset = { x: 0, z: 0 },
      arVaseMode = false,
      onSelectSpecies,
      className = 'w-full h-full',
    },
    ref,
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);

    // Live mutable state refs read inside WebGL render loop without tearing down canvas
    const explodedTargetRef = useRef(explodedProgress);
    const explodedCurrentRef = useRef(explodedProgress);
    const autoRotateRef = useRef(autoRotate);
    const arScaleRef = useRef(arScale);
    const arRotationRef = useRef((arRotationDeg * Math.PI) / 180);
    const arOffsetRef = useRef(arOffset);
    const arVaseModeRef = useRef(arVaseMode);
    const onSelectSpeciesRef = useRef(onSelectSpecies);

    const cameraTransitionRef = useRef<{
      active: boolean;
      pos: THREE.Vector3;
      target: THREE.Vector3;
    }>({
      active: false,
      pos: new THREE.Vector3(...CAMERA_TARGETS.threequarter.pos),
      target: new THREE.Vector3(...CAMERA_TARGETS.threequarter.target),
    });

    const sceneRefs = useRef<{
      renderer: THREE.WebGLRenderer | null;
      scene: THREE.Scene | null;
      camera: THREE.PerspectiveCamera | null;
      controls: OrbitControls | null;
      bouquetAnchor: THREE.Group | null;
      vaseGroup: THREE.Group | null;
      reticleGroup: THREE.Group | null;
      currentBuild: BouquetBuildResult | null;
      requestRender: (() => void) | null;
      isSoftwareGl: boolean;
    }>({
      renderer: null,
      scene: null,
      camera: null,
      controls: null,
      bouquetAnchor: null,
      vaseGroup: null,
      reticleGroup: null,
      currentBuild: null,
      requestRender: null,
      isSoftwareGl: false,
    });

    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        const { renderer, scene, camera } = sceneRefs.current;
        if (!renderer || !scene || !camera) return null;
        renderer.render(scene, camera);
        try {
          return renderer.domElement.toDataURL('image/png');
        } catch {
          return null;
        }
      },
      resetCamera: () => {
        const preset = CAMERA_TARGETS.threequarter;
        cameraTransitionRef.current.pos.set(...preset.pos);
        cameraTransitionRef.current.target.set(...preset.target);
        cameraTransitionRef.current.active = true;
        sceneRefs.current.requestRender?.();
      },
    }));

    // Initialize WebGL scene once per mount/mode
    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareWebGL();
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          alpha: mode === 'ar',
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        });
      } catch {
        setContextLost(true);
        return;
      }

      const width = Math.max(container.clientWidth, 280);
      const height = Math.max(container.clientHeight, 260);
      renderer.setSize(width, height);
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
      );
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (mode === 'ar') {
        renderer.setClearColor(0x000000, 0);
      } else {
        renderer.setClearColor(0xf6f4ef, 1);
      }

      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.touchAction = 'none';

      const scene = new THREE.Scene();
      if (mode !== 'ar') {
        scene.background = new THREE.Color('#F6F4EF');
        scene.fog = new THREE.Fog('#F6F4EF', 6.5, 14);
      }

      // Mandatory Studio Environment Map via RoomEnvironment + PMREMGenerator
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envMap;
      pmremGenerator.dispose();

      // 3-Point Warm/Cool Botanical Studio Lighting Rig
      const hemiLight = new THREE.HemisphereLight('#F4F8FF', '#C9B99B', 0.72);
      hemiLight.position.set(0, 6, 0);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight('#FFF6EA', 1.85);
      keyLight.position.set(2.8, 4.6, 3.2);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      const d = 1.8;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight('#DCEEE5', 0.85);
      rimLight.position.set(-3.0, 2.5, -2.5);
      scene.add(rimLight);

      // Camera & OrbitControls
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 30);
      const initPreset =
        mode === 'ar'
          ? { pos: [0, 1.55, 3.15] as [number, number, number], target: [0, 0.88, 0] as [number, number, number] }
          : CAMERA_TARGETS.threequarter;
      camera.position.set(...initPreset.pos);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(...initPreset.target);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.07;
      controls.enablePan = mode === 'ar';
      controls.minDistance = 1.15;
      controls.maxDistance = 4.6;
      controls.minPolarAngle = 0.15;
      controls.maxPolarAngle = Math.PI / 2 - 0.02;
      controls.autoRotate = !isSoftwareGl && autoRotateRef.current && mode !== 'ar';
      controls.autoRotateSpeed = 1.1;

      // Grounding Stage: Travertine Studio Plinth (studio/preview) OR AR Surface Reticle (ar)
      const stageGroup = new THREE.Group();
      const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      const shadowTex = createContactShadowTexture();
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: mode === 'ar' ? 0.52 : 0.42,
      });
      const shadowGeo = new THREE.PlaneGeometry(1.7, 1.7);
      shadowGeo.rotateX(-Math.PI / 2);

      let stoneTex: THREE.CanvasTexture | null = null;
      const stageDisposables: Array<{ dispose: () => void }> = [shadowTex, shadowMat, shadowGeo];

      if (mode !== 'ar') {
        stoneTex = createPedestalStoneTexture(maxAniso);
        stageDisposables.push(stoneTex);

        // Travertine circular display plinth sitting flush at y = 0
        const plinthMat = new THREE.MeshStandardMaterial({
          map: stoneTex,
          roughness: 0.72,
          metalness: 0.04,
        });
        const plinthGeo = new THREE.CylinderGeometry(0.92, 0.98, 0.14, 48);
        plinthGeo.translate(0, -0.07, 0);
        const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
        plinthMesh.receiveShadow = true;
        stageDisposables.push(plinthMat, plinthGeo);
        stageGroup.add(plinthMesh);

        // Brass inlay ring around plinth top edge
        const brassMat = new THREE.MeshStandardMaterial({
          color: '#C7A45C',
          roughness: 0.28,
          metalness: 0.82,
        });
        const ringGeo = new THREE.TorusGeometry(0.92, 0.008, 10, 64);
        ringGeo.rotateX(Math.PI / 2);
        const ringMesh = new THREE.Mesh(ringGeo, brassMat);
        ringMesh.position.y = 0.002;
        stageDisposables.push(brassMat, ringGeo);
        stageGroup.add(ringMesh);
      }

      const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
      contactShadow.position.y = 0.004;
      stageGroup.add(contactShadow);
      scene.add(stageGroup);

      // AR Spatial Surface Reticle Ring
      const reticleGroup = new THREE.Group();
      reticleGroup.visible = mode === 'ar';
      const reticleOuterGeo = new THREE.RingGeometry(0.46, 0.5, 48);
      reticleOuterGeo.rotateX(-Math.PI / 2);
      const reticleInnerGeo = new THREE.RingGeometry(0.18, 0.2, 32);
      reticleInnerGeo.rotateX(-Math.PI / 2);
      const reticleMat = new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const rOuter = new THREE.Mesh(reticleOuterGeo, reticleMat);
      rOuter.position.y = 0.008;
      const rInner = new THREE.Mesh(reticleInnerGeo, reticleMat);
      rInner.position.y = 0.008;
      reticleGroup.add(rOuter, rInner);
      stageDisposables.push(reticleOuterGeo, reticleInnerGeo, reticleMat);
      scene.add(reticleGroup);

      // Bouquet Anchor Group + Optional Ceramic Vase for AR mode
      const bouquetAnchor = new THREE.Group();
      scene.add(bouquetAnchor);

      const vaseGroup = new THREE.Group();
      vaseGroup.visible = false;
      const vasePoints = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.22, 0.0),
        new THREE.Vector2(0.28, 0.22),
        new THREE.Vector2(0.24, 0.48),
        new THREE.Vector2(0.16, 0.62),
        new THREE.Vector2(0.19, 0.68),
      ];
      const vaseGeo = new THREE.LatheGeometry(vasePoints, 32);
      const vaseMat = new THREE.MeshPhysicalMaterial({
        color: '#EAE5DA',
        roughness: 0.28,
        metalness: 0.05,
        clearcoat: 0.65,
        clearcoatRoughness: 0.2,
      });
      const vaseMesh = new THREE.Mesh(vaseGeo, vaseMat);
      vaseMesh.castShadow = true;
      vaseMesh.receiveShadow = true;
      vaseGroup.add(vaseMesh);
      stageDisposables.push(vaseGeo, vaseMat);
      bouquetAnchor.add(vaseGroup);

      // Build initial 3D bouquet
      const initialBuild = buildBouquet3D(config, maxAniso);
      bouquetAnchor.add(initialBuild.group);

      // Coalesced On-Demand & Software-WebGL-Safe Render Scheduler
      let frameId = 0;
      let renderBusy = false;
      let renderDirty = false;
      let disposed = false;
      const clock = new THREE.Clock();

      function afterDraw(cb: () => void) {
        if (disposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) {
              if (sync) gl.deleteSync(sync);
              return;
            }
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (state === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
        } else {
          frameId = window.setTimeout(cb, 80);
        }
      }

      function requestRender() {
        if (disposed) return;
        if (renderBusy) {
          renderDirty = true;
          return;
        }
        renderBusy = true;
        frameId = requestAnimationFrame(() => {
          if (disposed) return;
          renderDirty = false;
          const delta = Math.min(clock.getDelta(), 0.1);

          // 1. Smoothly damp exploded stem separation
          const targetExp = explodedTargetRef.current;
          const currExp = explodedCurrentRef.current;
          let needsMoreFrames = false;

          if (Math.abs(targetExp - currExp) > 0.002) {
            const nextExp = THREE.MathUtils.damp(currExp, targetExp, 9, delta);
            explodedCurrentRef.current = nextExp;
            needsMoreFrames = true;
          } else {
            explodedCurrentRef.current = targetExp;
          }

          const build = sceneRefs.current.currentBuild;
          if (build) {
            const exp = explodedCurrentRef.current;
            for (let i = 0; i < build.stemGroups.length; i++) {
              const sg = build.stemGroups[i];
              const basePos = sg.userData.basePos as THREE.Vector3 | undefined;
              const expOffset = sg.userData.explodeOffset as THREE.Vector3 | undefined;
              if (basePos && expOffset) {
                sg.position.set(
                  basePos.x + expOffset.x * exp,
                  basePos.y + expOffset.y * exp,
                  basePos.z + expOffset.z * exp,
                );
              }
            }
          }

          // 2. Smoothly damp scripted camera preset transition
          if (cameraTransitionRef.current.active) {
            camera.position.lerp(cameraTransitionRef.current.pos, 1 - Math.exp(-7 * delta));
            controls.target.lerp(cameraTransitionRef.current.target, 1 - Math.exp(-7 * delta));
            if (
              camera.position.distanceTo(cameraTransitionRef.current.pos) < 0.015 &&
              controls.target.distanceTo(cameraTransitionRef.current.target) < 0.015
            ) {
              camera.position.copy(cameraTransitionRef.current.pos);
              controls.target.copy(cameraTransitionRef.current.target);
              cameraTransitionRef.current.active = false;
            } else {
              needsMoreFrames = true;
            }
          }

          // 3. Apply AR spatial transforms
          if (mode === 'ar') {
            const s = arScaleRef.current;
            bouquetAnchor.scale.setScalar(s);
            bouquetAnchor.rotation.y = arRotationRef.current;
            bouquetAnchor.position.set(arOffsetRef.current.x, 0, arOffsetRef.current.z);
            reticleGroup.position.set(arOffsetRef.current.x, 0, arOffsetRef.current.z);
            contactShadow.position.set(arOffsetRef.current.x, 0.004, arOffsetRef.current.z);
            vaseGroup.visible = arVaseModeRef.current;
          }

          controls.autoRotate = !isSoftwareGl && autoRotateRef.current && mode !== 'ar';
          const ctrlChanged = controls.update();
          if (ctrlChanged || controls.autoRotate) {
            needsMoreFrames = true;
          }

          renderer.render(scene, camera);

          const done = () => {
            renderBusy = false;
            if (renderDirty || needsMoreFrames) {
              requestRender();
            }
          };

          if (isSoftwareGl) {
            afterDraw(done);
          } else {
            done();
          }
        });
      }

      // Cancel camera preset animation if user manually interacts
      const handleControlStart = () => {
        cameraTransitionRef.current.active = false;
      };
      const handleControlChange = () => {
        requestRender();
      };
      controls.addEventListener('start', handleControlStart);
      controls.addEventListener('change', handleControlChange);

      // Raycast tap/click to inspect stem species in 3D Studio
      let pointerDownPos = { x: 0, y: 0 };
      const handlePointerDown = (e: PointerEvent) => {
        pointerDownPos = { x: e.clientX, y: e.clientY };
      };
      const handlePointerUp = (e: PointerEvent) => {
        if (!onSelectSpeciesRef.current || !sceneRefs.current.currentBuild) return;
        const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (moveDist > 8) return; // Ignore orbit drags
        const rect = renderer.domElement.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(
          sceneRefs.current.currentBuild.stemGroups,
          true,
        );
        if (hits.length > 0) {
          let obj: THREE.Object3D | null = hits[0].object;
          while (obj && !obj.userData.speciesId) {
            obj = obj.parent;
          }
          if (obj?.userData.speciesId) {
            onSelectSpeciesRef.current(obj.userData.speciesId as FlowerSpeciesId);
          }
        }
      };
      renderer.domElement.addEventListener('pointerdown', handlePointerDown);
      renderer.domElement.addEventListener('pointerup', handlePointerUp);

      // WebGL context loss safety
      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const handleContextRestored = () => {
        setContextLost(false);
        requestRender();
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

      // Resize observer (skip redundant setSize calls that clear the WebGL drawing buffer)
      let lastW = width;
      let lastH = height;
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.round(Math.max(entry.contentRect.width, 200));
          const h = Math.round(Math.max(entry.contentRect.height, 200));
          if (w === lastW && h === lastH) continue;
          lastW = w;
          lastH = h;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          renderer.render(scene, camera);
          requestRender();
        }
      });
      resizeObserver.observe(container);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      sceneRefs.current = {
        renderer,
        scene,
        camera,
        controls,
        bouquetAnchor,
        vaseGroup,
        reticleGroup,
        currentBuild: initialBuild,
        requestRender,
        isSoftwareGl,
      };

      renderer.render(scene, camera);
      requestRender();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        resizeObserver.disconnect();
        controls.removeEventListener('start', handleControlStart);
        controls.removeEventListener('change', handleControlChange);
        controls.dispose();
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        renderer.domElement.removeEventListener('pointerup', handlePointerUp);
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

        sceneRefs.current.currentBuild?.dispose();
        stageDisposables.forEach((d) => d.dispose());
        envMap.dispose();
        renderer.dispose();
      };
    }, [mode]);

    // Rebuild 3D bouquet geometry dynamically whenever stems/palette/wrap/ribbon change
    useEffect(() => {
      const { bouquetAnchor, currentBuild, renderer, requestRender } = sceneRefs.current;
      if (!bouquetAnchor || !renderer) return;

      const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      const nextBuild = buildBouquet3D(config, maxAniso);

      if (currentBuild) {
        bouquetAnchor.remove(currentBuild.group);
        currentBuild.dispose();
      }

      bouquetAnchor.add(nextBuild.group);
      sceneRefs.current.currentBuild = nextBuild;
      requestRender?.();
    }, [
      config.petalPalette,
      config.wrapStyle,
      config.ribbonStyle,
      config.stems.rose,
      config.stems.sunflower,
      config.stems.stargazer,
      config.stems.orchid,
      config.stems.sampaguita,
      config.stems.eucalyptus,
    ]);

    // Sync exploded slider, auto-rotate, and AR spatial parameters without remounting WebGL
    useEffect(() => {
      explodedTargetRef.current = explodedProgress;
      sceneRefs.current.requestRender?.();
    }, [explodedProgress]);

    useEffect(() => {
      autoRotateRef.current = autoRotate;
      sceneRefs.current.requestRender?.();
    }, [autoRotate]);

    useEffect(() => {
      arScaleRef.current = arScale;
      arRotationRef.current = (arRotationDeg * Math.PI) / 180;
      arOffsetRef.current = arOffset;
      arVaseModeRef.current = arVaseMode;
      sceneRefs.current.requestRender?.();
    }, [arScale, arRotationDeg, arOffset.x, arOffset.z, arVaseMode]);

    useEffect(() => {
      onSelectSpeciesRef.current = onSelectSpecies;
    }, [onSelectSpecies]);

    // Smoothly transition camera when preset changes
    useEffect(() => {
      if (mode === 'ar') return;
      const preset = CAMERA_TARGETS[cameraPreset];
      _vec3A.set(...preset.pos);
      _vec3B.set(...preset.target);
      cameraTransitionRef.current.pos.copy(_vec3A);
      cameraTransitionRef.current.target.copy(_vec3B);
      cameraTransitionRef.current.active = true;
      sceneRefs.current.requestRender?.();
    }, [cameraPreset, mode]);

    if (contextLost) {
      return (
        <div
          className={`flex flex-col items-center justify-center bg-[#F1F0EC] text-[#16211B] p-6 text-center ${className}`}
        >
          <p className="font-serif text-xl font-semibold mb-1">{config.title}</p>
          <p className="text-xs text-[#536159]">
            3D WebGL viewport paused. Tap Reset or switch palette to reload.
          </p>
        </div>
      );
    }

    return (
      <div
        ref={mountRef}
        className={`relative select-none overflow-hidden ${className}`}
        aria-label={`Interactive 3D bouquet model: ${config.title}`}
      />
    );
  },
);

ThreeBouquetCanvas.displayName = 'ThreeBouquetCanvas';
