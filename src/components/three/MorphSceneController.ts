import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createMorphCoreGeometry,
  createMachinedRingGeometry,
  createSatelliteNodeParts,
  MORPH_STATES,
  MorphStateId,
} from './morphGeometries';
import { createMorphMaterials, MorphMaterialsBundle } from './morphMaterials';

export type CameraPreset = 'iso' | 'front' | 'top';

export interface MorphSceneCallbacks {
  onStateChange?: (state: MorphStateId) => void;
  onWebglError?: (reason: string) => void;
}

// Module-scoped zero-GC scratch math objects
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetCtrlTarget = new THREE.Vector3(0, 0.12, 0);
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _pointerNdc = new THREE.Vector2();

const SHARD_COUNT = 220;

const CAMERA_PRESETS: Record<CameraPreset, [number, number, number]> = {
  iso: [3.4, 1.9, 4.55],
  front: [0.0, 0.65, 5.45],
  top: [0.0, 5.2, 2.2],
};

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
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

export class MorphSceneController {
  private container: HTMLElement;
  private callbacks: MorphSceneCallbacks;
  private isSoftwareGl: boolean;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private envRT: THREE.WebGLRenderTarget;
  private materials: MorphMaterialsBundle;

  private heroGroup: THREE.Group;
  private coreMesh: THREE.Mesh;
  private wireMesh: THREE.Mesh;
  private gimbalInner: THREE.Mesh;
  private gimbalOuter: THREE.Mesh;
  private glassCollar: THREE.Mesh;
  private podGroups: THREE.Group[] = [];
  private podOrbits: Array<{ angleOffset: number; planeSign: number }> = [];
  private shardsMesh: THREE.InstancedMesh;
  private shardSeeds: Float32Array;
  private rayProxyMesh: THREE.Mesh;

  private disposables: Array<{ dispose: () => void }> = [];

  private activeState: MorphStateId = 'proxmox';
  private wireframeVisible = true;
  private autoCycle = true;
  private reducedMotion = false;
  private isVisible = true;
  private disposed = false;

  // Morph blending state (weights for morphTargetInfluences[0..2])
  private currentWeights = [0, 0, 0];
  private targetWeights = [0, 0, 0];
  private morphPulse = 0;
  private scanProgress = -1.6;
  private autoTimer = 0;

  // Smooth camera transition flag (yields cleanly when user drags)
  private camPresetActive = false;

  // Hover & click raycast state
  private pointerX = 0;
  private pointerY = 0;
  private hoveredCore = false;
  private raycaster = new THREE.Raycaster();
  private downPos = { x: 0, y: 0 };

  // Timing & pacing
  private elapsed = 0;
  private lastTickTime = 0;
  private frameId = 0;
  private isLoopRunning = false;
  private intersectionObs: IntersectionObserver | null = null;

  constructor(
    container: HTMLElement,
    callbacks: MorphSceneCallbacks = {},
    initialReducedMotion = false
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.reducedMotion = initialReducedMotion;
    this.isSoftwareGl = detectSoftwareGl();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D Morphing Systems Architecture Viewport'
    );

    container.appendChild(this.renderer.domElement);

    // Scene + Depth Fog matching #040711 portfolio background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#040711');
    this.scene.fog = new THREE.FogExp2(0x040711, 0.052);

    // Studio IBL Environment Map (RoomEnvironment via PMREM)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRT = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    this.camera.position.set(...CAMERA_PRESETS.iso);
    _targetCamPos.copy(this.camera.position);

    // OrbitControls (wheel zoom disabled to avoid trapping vertical page scroll)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(_targetCtrlTarget);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minPolarAngle = Math.PI * 0.18;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.autoRotate = false;
    this.controls.update();

    this.controls.addEventListener('start', this.onControlStart);
    this.controls.addEventListener('change', this.onControlChange);

    // 3-Point Warm/Cool Studio Lighting Rig (same intensities on GPU & software GL)
    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0x070d1c, 0.78);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.35);
    keyLight.position.set(4.8, 6.4, 4.2);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    const d = 4.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x22d3ee, 1.65);
    rimLight.position.set(-4.8, 3.2, -4.4);
    this.scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.85);
    fillLight.position.set(3.2, -1.5, -3.5);
    this.scene.add(fillLight);

    // Materials
    const maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy() || 1);
    this.materials = createMorphMaterials(this.isSoftwareGl, maxAnisotropy);

    // Grounded Anodized Calibration Pedestal (strictly bottom-grounded with zero Z-fighting)
    const pedestalCylGeo = new THREE.CylinderGeometry(2.65, 2.95, 0.22, 64);
    const pedestalBody = new THREE.Mesh(pedestalCylGeo, this.materials.pedestalSideMaterial);
    pedestalBody.position.set(0, -1.96, 0);
    pedestalBody.receiveShadow = true;
    this.scene.add(pedestalBody);

    const pedestalTopGeo = new THREE.CircleGeometry(2.64, 64);
    const pedestalTop = new THREE.Mesh(pedestalTopGeo, this.materials.pedestalTopMaterial);
    pedestalTop.rotation.x = -Math.PI / 2;
    pedestalTop.position.set(0, -1.83, 0);
    pedestalTop.receiveShadow = true;
    this.scene.add(pedestalTop);

    const contactGeo = new THREE.PlaneGeometry(4.4, 4.4);
    const contactPlane = new THREE.Mesh(contactGeo, this.materials.contactShadowMaterial);
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.set(0, -1.805, 0);
    this.scene.add(contactPlane);

    // Hero Multi-Part Assembly Group
    this.heroGroup = new THREE.Group();
    this.heroGroup.position.set(0, 0.22, 0);
    this.scene.add(this.heroGroup);

    // 1. Morphing Core Manifold Mesh + Locked Hardware Wireframe Overlay
    const coreGeo = createMorphCoreGeometry(76, 54);
    this.coreMesh = new THREE.Mesh(coreGeo, this.materials.coreMaterial);
    this.coreMesh.castShadow = !this.isSoftwareGl;
    this.coreMesh.receiveShadow = true;
    this.heroGroup.add(this.coreMesh);

    this.wireMesh = new THREE.Mesh(coreGeo, this.materials.wireMaterial);
    this.wireMesh.scale.setScalar(1.004);
    this.wireMesh.morphTargetInfluences = this.coreMesh.morphTargetInfluences;
    this.wireMesh.visible = this.wireframeVisible;
    this.heroGroup.add(this.wireMesh);

    // Invisible simplified raycast proxy sphere on Layer 1 for cheap hover/click detection
    const rayProxyGeo = new THREE.SphereGeometry(1.55, 16, 12);
    const rayProxyMat = new THREE.MeshBasicMaterial({ visible: false });
    this.rayProxyMesh = new THREE.Mesh(rayProxyGeo, rayProxyMat);
    this.rayProxyMesh.layers.set(1);
    this.heroGroup.add(this.rayProxyMesh);
    this.raycaster.layers.set(1);

    // 2. Two Machined Titanium Gimbal Rings (LatheGeometry)
    const gimbalInnerGeo = createMachinedRingGeometry(1.62, 1.72, 0.04, 72);
    this.gimbalInner = new THREE.Mesh(gimbalInnerGeo, this.materials.titaniumMaterial);
    this.gimbalInner.rotation.set(Math.PI * 0.22, 0, Math.PI * 0.14);
    this.gimbalInner.castShadow = !this.isSoftwareGl;
    this.heroGroup.add(this.gimbalInner);

    const gimbalOuterGeo = createMachinedRingGeometry(1.94, 2.02, 0.032, 72);
    this.gimbalOuter = new THREE.Mesh(gimbalOuterGeo, this.materials.titaniumMaterial);
    this.gimbalOuter.rotation.set(-Math.PI * 0.18, 0, -Math.PI * 0.25);
    this.gimbalOuter.castShadow = !this.isSoftwareGl;
    this.heroGroup.add(this.gimbalOuter);

    // 3. Sapphire Optical Collar Ring (Depth-Sorted Outer Containment Rim)
    const glassCollarGeo = new THREE.TorusGeometry(1.82, 0.055, 24, 96);
    this.glassCollar = new THREE.Mesh(glassCollarGeo, this.materials.opticalGlassMaterial);
    this.glassCollar.rotation.x = Math.PI * 0.5;
    this.glassCollar.renderOrder = 3;
    this.heroGroup.add(this.glassCollar);

    // 4. 6 Composite 3-Part Satellite Cluster Pods (3 Masters + 3 Workers)
    const podParts = createSatelliteNodeParts();
    for (let i = 0; i < 6; i++) {
      const pod = new THREE.Group();
      const chassis = new THREE.Mesh(podParts.chassisGeo, this.materials.chassisMaterial);
      chassis.castShadow = !this.isSoftwareGl;
      pod.add(chassis);

      const collar = new THREE.Mesh(podParts.collarGeo, this.materials.titaniumMaterial);
      collar.rotation.x = Math.PI * 0.5;
      collar.position.z = 0.09;
      pod.add(collar);

      const optic = new THREE.Mesh(podParts.opticGeo, this.materials.opticBarMaterial);
      optic.position.y = 0.125;
      pod.add(optic);

      const angleOffset = (i / 6) * Math.PI * 2;
      const planeSign = i % 2 === 0 ? 1 : -1;
      this.podGroups.push(pod);
      this.podOrbits.push({ angleOffset, planeSign });
      this.heroGroup.add(pod);
    }

    // 5. 220 InstancedMesh Orbital Micro-Shards (zero GC updates)
    const shardGeo = new THREE.OctahedronGeometry(0.034, 0);
    this.shardsMesh = new THREE.InstancedMesh(shardGeo, this.materials.shardMaterial, SHARD_COUNT);
    this.shardsMesh.frustumCulled = false;
    this.shardSeeds = new Float32Array(SHARD_COUNT * 3);
    for (let i = 0; i < SHARD_COUNT; i++) {
      // Deterministic golden-ratio sphere-spiral seeds (no Math.random flicker across mounts)
      const phi = (i * 2.399963229728653) % (Math.PI * 2);
      const u = (i + 0.5) / SHARD_COUNT;
      this.shardSeeds[i * 3] = phi;
      this.shardSeeds[i * 3 + 1] = Math.acos(1 - 2 * u);
      this.shardSeeds[i * 3 + 2] = 0.5 + ((i * 37) % 100) / 100;
    }
    this.heroGroup.add(this.shardsMesh);

    this.disposables.push(
      pedestalCylGeo,
      pedestalTopGeo,
      contactGeo,
      coreGeo,
      rayProxyGeo,
      rayProxyMat,
      gimbalInnerGeo,
      gimbalOuterGeo,
      glassCollarGeo,
      podParts.chassisGeo,
      podParts.collarGeo,
      podParts.opticGeo,
      shardGeo
    );

    // Pre-warm GPU shader programs cleanly (skipped on software WebGL per skill guideline)
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Bind interaction & lifecycle listeners
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', this.onPointerMove, { passive: true });
    dom.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    dom.addEventListener('pointerup', this.onPointerUp, { passive: true });
    dom.addEventListener('pointerleave', this.onPointerLeave);
    dom.addEventListener('webglcontextlost', this.onContextLost);
    dom.addEventListener('webglcontextrestored', this.onContextRestored);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // Viewport Visibility Gate via IntersectionObserver
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObs = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          this.isVisible = Boolean(entry?.isIntersecting);
          if (this.isVisible) {
            this.startOrRenderOnce();
          } else {
            this.stopLoop();
          }
        },
        { threshold: 0.05 }
      );
      this.intersectionObs.observe(this.container);
    }

    // Apply initial pose synchronously before first draw
    this.updateSceneKinematics(0);
    this.renderer.render(this.scene, this.camera);

    if (!this.reducedMotion) {
      this.startLoop();
    }
  }

  public setState(state: MorphStateId, notify = false): void {
    if (this.activeState === state) return;
    this.activeState = state;
    this.autoTimer = 0;

    // Target morph target weights across states [0]=base, [1..3]=targets 0..2
    const idx = MORPH_STATES.indexOf(state);
    this.targetWeights[0] = idx === 1 ? 1 : 0;
    this.targetWeights[1] = idx === 2 ? 1 : 0;
    this.targetWeights[2] = idx === 3 ? 1 : 0;

    // Spark luminous cyan morph scan wavefront
    this.morphPulse = 1.0;
    this.scanProgress = -1.55;

    if (notify) {
      this.callbacks.onStateChange?.(state);
    }

    if (this.reducedMotion) {
      // Snap cleanly on reduced-motion user action & request single on-demand draw
      this.currentWeights[0] = this.targetWeights[0];
      this.currentWeights[1] = this.targetWeights[1];
      this.currentWeights[2] = this.targetWeights[2];
      this.morphPulse = 0;
      this.requestSingleRender();
    }
  }

  public setWireframe(visible: boolean): void {
    this.wireframeVisible = visible;
    this.wireMesh.visible = visible;
    if (this.reducedMotion) this.requestSingleRender();
  }

  public setAutoCycle(enabled: boolean): void {
    this.autoCycle = enabled;
    this.autoTimer = 0;
  }

  public setCameraPreset(preset: CameraPreset): void {
    const [x, y, z] = CAMERA_PRESETS[preset];
    _targetCamPos.set(x, y, z);
    if (this.reducedMotion || this.isSoftwareGl) {
      this.camera.position.copy(_targetCamPos);
      this.controls.target.copy(_targetCtrlTarget);
      this.controls.update();
      this.requestSingleRender();
    } else {
      this.camPresetActive = true;
    }
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced) {
      this.stopLoop();
      this.currentWeights[0] = this.targetWeights[0];
      this.currentWeights[1] = this.targetWeights[1];
      this.currentWeights[2] = this.targetWeights[2];
      this.morphPulse = 0;
      this.requestSingleRender();
    } else if (this.isVisible) {
      this.startLoop();
    }
  }

  public resize(): void {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.requestSingleRender();
  }

  private onControlStart = () => {
    this.camPresetActive = false;
  };

  private onControlChange = () => {
    if (this.reducedMotion) {
      this.requestSingleRender();
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerX = _pointerNdc.x;
    this.pointerY = _pointerNdc.y;

    this.raycaster.setFromCamera(_pointerNdc, this.camera);
    const hit = this.raycaster.intersectObject(this.rayProxyMesh, false).length > 0;
    if (hit !== this.hoveredCore) {
      this.hoveredCore = hit;
      this.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    this.downPos.x = e.clientX;
    this.downPos.y = e.clientY;
    if (!this.hoveredCore) {
      this.renderer.domElement.style.cursor = 'grabbing';
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    this.renderer.domElement.style.cursor = this.hoveredCore ? 'pointer' : 'grab';
    const dist = Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y);
    if (dist <= 6 && this.hoveredCore) {
      const nextIdx = (MORPH_STATES.indexOf(this.activeState) + 1) % MORPH_STATES.length;
      this.setState(MORPH_STATES[nextIdx], true);
    }
  };

  private onPointerLeave = () => {
    this.pointerX = 0;
    this.pointerY = 0;
    this.hoveredCore = false;
    this.renderer.domElement.style.cursor = 'grab';
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.stopLoop();
    this.callbacks.onWebglError?.('WebGL context paused');
  };

  private onContextRestored = () => {
    this.startOrRenderOnce();
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      this.stopLoop();
    } else if (this.isVisible && !this.reducedMotion) {
      this.startLoop();
    }
  };

  private startOrRenderOnce(): void {
    if (this.disposed) return;
    if (this.reducedMotion) {
      this.requestSingleRender();
    } else {
      this.startLoop();
    }
  }

  private startLoop(): void {
    if (this.disposed || this.isLoopRunning || this.reducedMotion) return;
    this.isLoopRunning = true;
    this.lastTickTime = performance.now();
    this.tick(this.lastTickTime);
  }

  private stopLoop(): void {
    this.isLoopRunning = false;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    this.frameId = 0;
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext | null;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private requestSingleRender(): void {
    if (this.disposed) return;
    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(() => {
      if (this.disposed) return;
      this.updateSceneKinematics(0);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  private tick = (now: number) => {
    if (this.disposed || !this.isLoopRunning) return;

    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTickTime) / 1000));
    this.lastTickTime = now;

    if (!document.hidden && this.isVisible) {
      this.elapsed += dt;
      this.updateSceneKinematics(dt);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      this.afterDraw(() => {
        if (this.isLoopRunning && !this.disposed) {
          this.tick(performance.now());
        }
      });
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private updateSceneKinematics(dt: number): void {
    // Optional auto-morph showcase cycling every 5.8s
    if (this.autoCycle && !this.reducedMotion && dt > 0) {
      this.autoTimer += dt;
      if (this.autoTimer >= 5.8) {
        this.autoTimer = 0;
        const nextIdx = (MORPH_STATES.indexOf(this.activeState) + 1) % MORPH_STATES.length;
        this.setState(MORPH_STATES[nextIdx], true);
      }
    }

    // 1. Exponential damping on morph target weights
    const morphLambda = 4.2;
    const influences = this.coreMesh.morphTargetInfluences;
    for (let i = 0; i < 3; i++) {
      this.currentWeights[i] =
        dt > 0
          ? THREE.MathUtils.damp(this.currentWeights[i], this.targetWeights[i], morphLambda, dt)
          : this.targetWeights[i];
      if (influences) influences[i] = this.currentWeights[i];
    }

    // Decay cyan morph wavefront glow & advance upward scan sweep
    if (dt > 0) {
      this.morphPulse = THREE.MathUtils.damp(this.morphPulse, 0, 2.2, dt);
      if (this.morphPulse > 0.02) {
        this.scanProgress += dt * 3.1;
      }
    }
    this.materials.coreUniforms.uTime.value = this.elapsed;
    this.materials.coreUniforms.uMorphPulse.value = this.morphPulse;
    this.materials.coreUniforms.uScanProgress.value = this.scanProgress;
    this.materials.wireMaterial.opacity = 0.14 + this.morphPulse * 0.24;

    // 2. Smooth hero float + pointer parallax lean
    const t = this.elapsed;
    const hoverScale = this.hoveredCore ? 1.03 : 1.0;
    if (dt > 0) {
      const s = THREE.MathUtils.damp(this.coreMesh.scale.x, hoverScale, 6, dt);
      this.coreMesh.scale.setScalar(s);
      this.wireMesh.scale.setScalar(s * 1.004);
    }
    this.heroGroup.position.y = 0.22 + (this.reducedMotion ? 0 : Math.sin(t * 1.15) * 0.055);
    this.coreMesh.rotation.y = this.reducedMotion ? 0.35 : t * 0.26 + this.pointerX * 0.18;
    this.coreMesh.rotation.x = this.reducedMotion ? 0.12 : this.pointerY * 0.14;
    this.wireMesh.rotation.copy(this.coreMesh.rotation);

    // 3. Machined Gimbal Ring Choreography by active architecture mode
    const isTorus = this.currentWeights[0]; // databricks weight
    const isK3s = this.currentWeights[1]; // k3s weight
    const isFituc = this.currentWeights[2]; // fituc weight

    const gimbalSpeed = this.reducedMotion ? 0 : dt;
    this.gimbalInner.rotation.y += gimbalSpeed * (0.35 + isTorus * 0.55);
    const targetInnerTiltX =
      Math.PI * 0.22 * (1 - isTorus) + Math.PI * 0.48 * isTorus - Math.PI * 0.12 * isK3s;
    this.gimbalInner.rotation.x =
      dt > 0
        ? THREE.MathUtils.damp(this.gimbalInner.rotation.x, targetInnerTiltX, 3.8, dt)
        : targetInnerTiltX;

    this.gimbalOuter.rotation.y -= gimbalSpeed * (0.24 + isK3s * 0.4);
    const targetOuterTiltZ = -Math.PI * 0.25 * (1 - isFituc) + Math.PI * 0.15 * isFituc;
    this.gimbalOuter.rotation.z =
      dt > 0
        ? THREE.MathUtils.damp(this.gimbalOuter.rotation.z, targetOuterTiltZ, 3.8, dt)
        : targetOuterTiltZ;

    this.glassCollar.rotation.z = this.reducedMotion ? 0 : t * 0.18;
    this.glassCollar.rotation.x = Math.PI * 0.5 + (this.reducedMotion ? 0 : Math.sin(t * 0.6) * 0.14);

    // 4. Composite 6-Pod Cluster Nodes Orbital Expansion (Proxmox Rack -> Fleet Ring -> K3s 3M+3W -> FiT-UC Wave)
    for (let i = 0; i < 6; i++) {
      const pod = this.podGroups[i];
      const { angleOffset, planeSign } = this.podOrbits[i];
      const baseAngle = angleOffset + (this.reducedMotion ? 0.2 : t * (0.28 + isTorus * 0.45));

      const radius = 1.66 + isTorus * 0.28 + isK3s * 0.56 + isFituc * 0.22;
      const elevation =
        planeSign * (0.14 * (1 - isTorus) + 0.32 * isK3s) +
        (isFituc * Math.sin(baseAngle * 2 + t * 1.6) * 0.42);

      pod.position.set(
        Math.cos(baseAngle) * radius,
        elevation,
        Math.sin(baseAngle) * radius
      );
      pod.lookAt(this.heroGroup.position);
    }

    // 5. Instanced Orbital Data Shards (Zero-GC Matrix4 transform composition)
    for (let i = 0; i < SHARD_COUNT; i++) {
      const phi0 = this.shardSeeds[i * 3];
      const theta0 = this.shardSeeds[i * 3 + 1];
      const rand = this.shardSeeds[i * 3 + 2];

      const phi = phi0 + (this.reducedMotion ? 0 : t * (0.14 + rand * 0.26) * (1 + isTorus * 1.1));
      const baseR = 2.08 + rand * 0.62;
      const waveOffset = isFituc * Math.sin(phi * 3 + t * 1.8) * 0.24;
      const diskFlatten = 1 - isTorus * 0.52;
      const hexPinch = 1 + isK3s * 0.14 * Math.cos(6 * phi);

      const sinT = Math.sin(theta0);
      const x = Math.cos(phi) * sinT * baseR * hexPinch;
      const y = (Math.cos(theta0) * baseR * diskFlatten) + waveOffset;
      const z = Math.sin(phi) * sinT * baseR * hexPinch;

      _v1.set(x, y, z);
      _euler.set(phi * 0.7, theta0, t * 0.5 * rand);
      _quat.setFromEuler(_euler);
      const pulseScale = 0.7 + rand * 0.65 + this.morphPulse * 0.35;
      _scale.setScalar(pulseScale);
      _mat4.compose(_v1, _quat, _scale);
      this.shardsMesh.setMatrixAt(i, _mat4);
    }
    this.shardsMesh.instanceMatrix.needsUpdate = true;

    // 6. Camera Preset Exponential Damping (cancels once settled or when dragging starts)
    if (this.camPresetActive && dt > 0) {
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        _targetCamPos.x,
        4.5,
        dt
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        _targetCamPos.y,
        4.5,
        dt
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        _targetCamPos.z,
        4.5,
        dt
      );
      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        _targetCtrlTarget.x,
        4.5,
        dt
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        _targetCtrlTarget.y,
        4.5,
        dt
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        _targetCtrlTarget.z,
        4.5,
        dt
      );
      if (this.camera.position.distanceToSquared(_targetCamPos) < 0.0008) {
        this.camera.position.copy(_targetCamPos);
        this.camPresetActive = false;
      }
    }
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopLoop();
    this.intersectionObs?.disconnect();

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('pointerleave', this.onPointerLeave);
    dom.removeEventListener('webglcontextlost', this.onContextLost);
    dom.removeEventListener('webglcontextrestored', this.onContextRestored);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.controls.removeEventListener('start', this.onControlStart);
    this.controls.removeEventListener('change', this.onControlChange);
    this.controls.dispose();

    this.materials.dispose();
    this.envRT.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }

    this.renderer.dispose();
    if (dom.parentNode === this.container) {
      this.container.removeChild(dom);
    }
  }
}
