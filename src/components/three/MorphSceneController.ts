import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createLotusFlowerAssembly,
  updateLotusBloom,
  LotusPetalAssembly,
  createCherryBlossomGeometry,
  createSingleSakuraPetalGeometry,
  createFlowingBlueRibbonGeometry,
  createSatelliteNodeParts,
  createInternalTelemetryCoreGeometry,
  createOpticalBusRingGeometry,
  createFloatingStreamRibbonGeometries,
  MORPH_STATES,
  MorphStateId,
} from './morphGeometries';
import { createMorphMaterials, MorphMaterialsBundle } from './morphMaterials';

export type CameraPreset = 'iso' | 'front' | 'top';

export interface MorphSceneCallbacks {
  onStateChange?: (state: MorphStateId) => void;
  onBloomChange?: (bloom: number) => void;
  onWebglError?: (reason: string) => void;
}

// Module-scoped zero-GC scratch math objects
const _v1 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetCtrlTarget = new THREE.Vector3(0, 0.28, 0);
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _pointerNdc = new THREE.Vector2();
const _tmpColor = new THREE.Color();

const SAKURA_BLOSSOM_COUNT = 48;
const SAKURA_PETAL_COUNT = 110;

const BABY_PINK_PALETTE = ['#fce7f3', '#fbcfe8', '#f9a8d4', '#fda4af'];

const CAMERA_PRESETS: Record<CameraPreset, [number, number, number]> = {
  top: [0.0, 5.15, 1.35],
  iso: [3.2, 2.25, 4.45],
  front: [0.0, 1.05, 5.1],
};

const MODE_BASE_BLOOM: Record<MorphStateId, number> = {
  core: 0.06,
  stream: 0.38,
  cluster: 0.72,
  mesh: 1.0,
};

const MODE_ACCENTS: Record<MorphStateId, string> = {
  core: '#f472b6', // Rose Pink
  stream: '#ec4899', // Magenta Pink
  cluster: '#39ff14', // Neon Green accent
  mesh: '#f9a8d4', // Baby Pink
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
  private lotusAssembly: LotusPetalAssembly;
  private siliconCrystalMesh: THREE.Mesh;
  private busRingMesh: THREE.Mesh;
  private streamRibbonMeshes: THREE.Mesh[] = [];
  private gimbalInner: THREE.Mesh;
  private gimbalOuter: THREE.Mesh;
  private glassCollar: THREE.Mesh;
  private podGroups: THREE.Group[] = [];
  private podOrbits: Array<{ angleOffset: number; planeSign: number }> = [];

  // Swirling Baby-Pink Cherry Blossoms & Petals (replacing diamond debris)
  private sakuraBlossomsMesh: THREE.InstancedMesh;
  private sakuraBlossomSeeds: Float32Array;
  private sakuraPetalsMesh: THREE.InstancedMesh;
  private sakuraPetalSeeds: Float32Array;

  private rayProxyMesh: THREE.Mesh;
  private disposables: Array<{ dispose: () => void }> = [];

  private activeState: MorphStateId = 'core';
  private wireframeVisible = false;
  private autoCycle = true;
  private reducedMotion = false;
  private isVisible = true;
  private disposed = false;

  // Unified Bloom / Unfold Slider State (0.0 = closed bud, 1.0 = full blossom)
  private currentExploded = MODE_BASE_BLOOM.core;
  private targetExploded = MODE_BASE_BLOOM.core;

  // Architecture weights [stream, cluster, mesh]
  private currentWeights = [0, 0, 0];
  private targetWeights = [0, 0, 0];
  private morphPulse = 0;
  private scanProgress = -1.6;
  private autoTimer = 0;

  private camPresetActive = false;

  private pointerX = 0;
  private pointerY = 0;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private pointerFlowX = 0;
  private pointerFlowY = 0;
  private pointerSpeed = 0;
  private viewportHovered = false;
  private currentHoverMix = 0;
  private ribbonWavePhase = 0;
  private ribbonFlowOffset = 0;
  private hoveredCore = false;
  private raycaster = new THREE.Raycaster();
  private downPos = { x: 0, y: 0 };

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
    this.renderer.toneMappingExposure = 1.02;
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
      'Interactive 3D Blooming Pink Lotus with Swirling Cherry Blossoms'
    );

    container.appendChild(this.renderer.domElement);

    // Pure black cinematic canvas background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#000000');
    this.scene.fog = new THREE.FogExp2(0x000000, 0.042);

    // Studio IBL Environment Map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRT = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Camera — Default overhead Top view showcasing full lotus mandala & swirling cherry blossoms
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    this.camera.position.set(...CAMERA_PRESETS.top);
    _targetCamPos.copy(this.camera.position);

    // OrbitControls (allow full overhead Top polar angle cleanly)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(_targetCtrlTarget);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minPolarAngle = Math.PI * 0.04;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.autoRotate = false;
    this.controls.update();

    this.controls.addEventListener('start', this.onControlStart);
    this.controls.addEventListener('change', this.onControlChange);

    // Balanced Botanical Lighting Rig (Preserves rich rose pink & emerald green, zero white blowout!)
    const hemi = new THREE.HemisphereLight(0xfbcfe8, 0x062c1b, 0.58);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff0f5, 1.38);
    keyLight.position.set(4.2, 5.8, 4.0);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    const d = 3.8;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf472b6, 1.15);
    rimLight.position.set(-4.5, 3.2, -4.2);
    this.scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x22c55e, 0.55);
    fillLight.position.set(3.2, -1.0, -3.4);
    this.scene.add(fillLight);

    // Materials
    const maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy() || 1);
    this.materials = createMorphMaterials(this.isSoftwareGl, maxAnisotropy);

    // Grounded Dark Pond Calibration Pedestal
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
    this.heroGroup.position.set(0, 0.18, 0);
    this.scene.add(this.heroGroup);

    // 1. Procedural 3D Blooming Pink Lotus with Green Calyx Petals & Lily Pad
    this.lotusAssembly = createLotusFlowerAssembly(
      this.materials.petalMaterial,
      this.materials.wireMaterial,
      this.materials.greenPetalMaterial,
      this.materials.stamenMaterial,
      this.materials.receptacleMaterial,
      this.materials.stemMaterial,
      this.materials.lilyPadMaterial
    );
    this.heroGroup.add(this.lotusAssembly.lotusGroup);
    this.disposables.push(...this.lotusAssembly.disposables);

    // 1b. Internal Golden Pollen Heart Crystal
    const siliconGeo = createInternalTelemetryCoreGeometry();
    this.siliconCrystalMesh = new THREE.Mesh(siliconGeo, this.materials.siliconCrystalMaterial);
    this.siliconCrystalMesh.position.set(0, 0.36, 0);
    this.heroGroup.add(this.siliconCrystalMesh);
    this.disposables.push(siliconGeo);

    // 1c. Blue Water-Silk Ribbon Halo below the lily pad
    const busRingGeo = createOpticalBusRingGeometry();
    this.busRingMesh = new THREE.Mesh(busRingGeo, this.materials.busRingMaterial);
    this.busRingMesh.position.y = -0.82;
    this.heroGroup.add(this.busRingMesh);
    this.disposables.push(busRingGeo);

    // 1d. Sweeping Flowing Sky-Blue Silk Ribbons around the lotus
    const ribbonGeos = createFloatingStreamRibbonGeometries();
    ribbonGeos.forEach((rGeo) => {
      const ribbonMesh = new THREE.Mesh(rGeo, this.materials.streamRibbonMaterial);
      this.streamRibbonMeshes.push(ribbonMesh);
      this.heroGroup.add(ribbonMesh);
      this.disposables.push(rGeo);
    });

    // Simplified raycast proxy on Layer 1
    const rayProxyGeo = new THREE.SphereGeometry(1.65, 16, 12);
    const rayProxyMat = new THREE.MeshBasicMaterial({ visible: false });
    this.rayProxyMesh = new THREE.Mesh(rayProxyGeo, rayProxyMat);
    this.rayProxyMesh.position.set(0, 0.5, 0);
    this.rayProxyMesh.layers.set(1);
    this.heroGroup.add(this.rayProxyMesh);
    this.raycaster.layers.set(1);
    this.disposables.push(rayProxyGeo, rayProxyMat);

    // 2. Two Flowing Azure-Blue Silk Orbital Ribbons framing the lotus
    const gimbalInnerGeo = createFlowingBlueRibbonGeometry(2.08, 0.088, 0.30, 3, 2, 160, 4);
    this.gimbalInner = new THREE.Mesh(gimbalInnerGeo, this.materials.titaniumMaterial);
    this.gimbalInner.rotation.set(Math.PI * 0.16, 0, Math.PI * 0.10);
    this.heroGroup.add(this.gimbalInner);
    this.disposables.push(gimbalInnerGeo);

    const gimbalOuterGeo = createFlowingBlueRibbonGeometry(2.38, 0.075, 0.24, 2, -2, 160, 4);
    this.gimbalOuter = new THREE.Mesh(gimbalOuterGeo, this.materials.titaniumMaterial);
    this.gimbalOuter.rotation.set(-Math.PI * 0.14, 0, -Math.PI * 0.18);
    this.heroGroup.add(this.gimbalOuter);
    this.disposables.push(gimbalOuterGeo);

    // 3. Luminous Sky-Blue Translucent Silk-Glass Ribbon
    const glassCollarGeo = createFlowingBlueRibbonGeometry(2.22, 0.056, 0.18, 4, 1, 140, 4);
    this.glassCollar = new THREE.Mesh(glassCollarGeo, this.materials.opticalGlassMaterial);
    this.glassCollar.renderOrder = 3;
    this.heroGroup.add(this.glassCollar);
    this.disposables.push(glassCollarGeo);

    // 4. 6 Compact Architectural Telemetry Nodes orbiting outer perimeter
    const podParts = createSatelliteNodeParts();
    this.disposables.push(
      podParts.chassisGeo,
      podParts.collarGeo,
      podParts.opticGeo,
      podParts.probeGeo
    );
    for (let i = 0; i < 6; i++) {
      const pod = new THREE.Group();
      const chassis = new THREE.Mesh(podParts.chassisGeo, this.materials.chassisMaterial);
      pod.add(chassis);

      const collar = new THREE.Mesh(podParts.collarGeo, this.materials.titaniumMaterial);
      collar.rotation.x = Math.PI * 0.5;
      collar.position.z = 0.075;
      pod.add(collar);

      const optic = new THREE.Mesh(podParts.opticGeo, this.materials.opticBarMaterial);
      optic.position.y = 0.10;
      pod.add(optic);

      const probe = new THREE.Mesh(podParts.probeGeo, this.materials.titaniumMaterial);
      probe.position.set(0, 0.15, 0.06);
      pod.add(probe);

      const angleOffset = (i / 6) * Math.PI * 2;
      const planeSign = i % 2 === 0 ? 1 : -1;
      this.podGroups.push(pod);
      this.podOrbits.push({ angleOffset, planeSign });
      this.heroGroup.add(pod);
    }

    // 5a. 48 5-Petal Sculpted Baby-Pink Cherry Blossoms swirling around the Lotus
    const blossomGeo = createCherryBlossomGeometry(0.145);
    this.disposables.push(blossomGeo);
    this.sakuraBlossomsMesh = new THREE.InstancedMesh(
      blossomGeo,
      this.materials.sakuraBlossomMaterial,
      SAKURA_BLOSSOM_COUNT
    );
    this.sakuraBlossomsMesh.frustumCulled = false;
    this.sakuraBlossomSeeds = new Float32Array(SAKURA_BLOSSOM_COUNT * 4);
    for (let i = 0; i < SAKURA_BLOSSOM_COUNT; i++) {
      const phi = (i / SAKURA_BLOSSOM_COUNT) * Math.PI * 2 + (i % 3) * 0.25;
      const yBase = -0.85 + ((i * 7) % 24) / 24 * 2.25; // Vertical helical height band
      const rad = 1.48 + ((i * 13) % 19) / 19 * 1.15;
      const scaleJitter = 0.85 + ((i * 11) % 10) / 33; // ±15% scale variation

      this.sakuraBlossomSeeds[i * 4] = phi;
      this.sakuraBlossomSeeds[i * 4 + 1] = yBase;
      this.sakuraBlossomSeeds[i * 4 + 2] = rad;
      this.sakuraBlossomSeeds[i * 4 + 3] = scaleJitter;

      _tmpColor.set(BABY_PINK_PALETTE[i % BABY_PINK_PALETTE.length]);
      this.sakuraBlossomsMesh.setColorAt(i, _tmpColor);
    }
    if (this.sakuraBlossomsMesh.instanceColor) {
      this.sakuraBlossomsMesh.instanceColor.needsUpdate = true;
    }
    this.heroGroup.add(this.sakuraBlossomsMesh);

    // 5b. 110 Single Notched Baby-Pink Sakura Petals fluttering in the swirl
    const petalGeo = createSingleSakuraPetalGeometry(0.11, 0.085);
    this.disposables.push(petalGeo);
    this.sakuraPetalsMesh = new THREE.InstancedMesh(
      petalGeo,
      this.materials.sakuraPetalMaterial,
      SAKURA_PETAL_COUNT
    );
    this.sakuraPetalsMesh.frustumCulled = false;
    this.sakuraPetalSeeds = new Float32Array(SAKURA_PETAL_COUNT * 4);
    for (let i = 0; i < SAKURA_PETAL_COUNT; i++) {
      const phi = (i * 2.399963229728653) % (Math.PI * 2);
      const yBase = -0.95 + ((i * 17) % 31) / 31 * 2.55;
      const rad = 1.32 + ((i * 23) % 29) / 29 * 1.45;
      const scaleJitter = 0.82 + ((i * 7) % 12) / 34;

      this.sakuraPetalSeeds[i * 4] = phi;
      this.sakuraPetalSeeds[i * 4 + 1] = yBase;
      this.sakuraPetalSeeds[i * 4 + 2] = rad;
      this.sakuraPetalSeeds[i * 4 + 3] = scaleJitter;

      _tmpColor.set(BABY_PINK_PALETTE[(i + 1) % BABY_PINK_PALETTE.length]);
      this.sakuraPetalsMesh.setColorAt(i, _tmpColor);
    }
    if (this.sakuraPetalsMesh.instanceColor) {
      this.sakuraPetalsMesh.instanceColor.needsUpdate = true;
    }
    this.heroGroup.add(this.sakuraPetalsMesh);

    // Event listeners
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerenter', this.onPointerEnter, { passive: true });
    dom.addEventListener('pointermove', this.onPointerMove, { passive: true });
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('pointerleave', this.onPointerLeave);
    dom.addEventListener('webglcontextlost', this.onContextLost);
    dom.addEventListener('webglcontextrestored', this.onContextRestored);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    if (!this.isSoftwareGl) {
      try {
        this.renderer.compile(this.scene, this.camera);
      } catch {
        // Silent fallback
      }
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObs = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          this.isVisible = entry ? entry.isIntersecting : true;
          if (this.isVisible && !this.reducedMotion && !this.isLoopRunning) {
            this.startLoop();
          } else if (!this.isVisible && this.isLoopRunning) {
            this.stopLoop();
          }
        },
        { threshold: 0.1 }
      );
      this.intersectionObs.observe(this.container);
    }

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

    const idx = MORPH_STATES.indexOf(state);
    this.targetWeights[0] = idx === 1 ? 1 : 0;
    this.targetWeights[1] = idx === 2 ? 1 : 0;
    this.targetWeights[2] = idx === 3 ? 1 : 0;

    // Set bloom target cleanly to match the chosen state and sync UI slider
    const nextBloom = MODE_BASE_BLOOM[state];
    this.targetExploded = nextBloom;
    this.callbacks.onBloomChange?.(nextBloom);

    const hex = MODE_ACCENTS[state];
    this.materials.coreUniforms.uAccent.value.set(hex);

    this.morphPulse = 1.0;
    this.scanProgress = -1.55;

    if (notify) {
      this.callbacks.onStateChange?.(state);
    }

    if (this.reducedMotion) {
      this.currentWeights[0] = this.targetWeights[0];
      this.currentWeights[1] = this.targetWeights[1];
      this.currentWeights[2] = this.targetWeights[2];
      this.currentExploded = nextBloom;
      this.morphPulse = 0;
      this.requestSingleRender();
    }
  }

  public setExploded(factor: number): void {
    const clamped = Math.max(0, Math.min(1, factor));
    this.targetExploded = clamped;
    if (this.reducedMotion) {
      this.currentExploded = clamped;
      this.requestSingleRender();
    }
  }

  public setBloom(factor: number): void {
    this.setExploded(factor);
  }

  public setWireframe(visible: boolean): void {
    this.wireframeVisible = visible;
    this.lotusAssembly.wireframeMeshes.forEach((w) => {
      w.visible = visible;
    });
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

  private onPointerEnter = (e: PointerEvent) => {
    this.viewportHovered = true;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.prevPointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.prevPointerY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private onPointerMove = (e: PointerEvent) => {
    this.viewportHovered = true;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const dx = _pointerNdc.x - this.prevPointerX;
    const dy = _pointerNdc.y - this.prevPointerY;
    this.prevPointerX = _pointerNdc.x;
    this.prevPointerY = _pointerNdc.y;

    const moveDist = Math.hypot(dx, dy);
    this.pointerSpeed = Math.min(6.0, this.pointerSpeed + moveDist * 18.0);
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
    this.viewportHovered = false;
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
    // Auto-cycle architecture bloom stages every 6.2s
    if (this.autoCycle && !this.reducedMotion && dt > 0) {
      this.autoTimer += dt;
      if (this.autoTimer >= 6.2) {
        this.autoTimer = 0;
        const nextIdx = (MORPH_STATES.indexOf(this.activeState) + 1) % MORPH_STATES.length;
        this.setState(MORPH_STATES[nextIdx], true);
      }
    }

    // Smooth exponential damping on direct Bloom slider value
    if (dt > 0) {
      this.currentExploded = THREE.MathUtils.damp(this.currentExploded, this.targetExploded, 4.5, dt);
    } else {
      this.currentExploded = this.targetExploded;
    }
    const bloom = this.currentExploded;

    // Exponential damping on architecture weights
    const morphLambda = 4.2;
    for (let i = 0; i < 3; i++) {
      this.currentWeights[i] =
        dt > 0
          ? THREE.MathUtils.damp(this.currentWeights[i], this.targetWeights[i], morphLambda, dt)
          : this.targetWeights[i];
    }

    if (dt > 0) {
      this.morphPulse = THREE.MathUtils.damp(this.morphPulse, 0, 2.2, dt);
      if (this.morphPulse > 0.02) {
        this.scanProgress += dt * 3.2;
      }
    }
    this.materials.coreUniforms.uTime.value = this.elapsed;
    this.materials.coreUniforms.uMorphPulse.value = this.morphPulse;
    this.materials.coreUniforms.uScanProgress.value = this.scanProgress;
    this.materials.wireMaterial.opacity = 0.14 + this.morphPulse * 0.22;

    // Update Pink Lotus & Green Calyx Petals Kinematics
    updateLotusBloom(
      this.lotusAssembly,
      bloom,
      this.currentWeights as [number, number, number],
      this.elapsed,
      this.reducedMotion
    );

    const t = this.elapsed;
    const hoverScale = this.hoveredCore ? 1.03 : 1.0;
    if (dt > 0) {
      const s = THREE.MathUtils.damp(this.heroGroup.scale.x, hoverScale, 6, dt);
      this.heroGroup.scale.setScalar(s);
    }
    this.heroGroup.position.y = 0.16 + (this.reducedMotion ? 0 : Math.sin(t * 1.1) * 0.04);
    this.lotusAssembly.lotusGroup.rotation.y = this.reducedMotion
      ? 0.35
      : t * 0.2 + this.pointerX * 0.15;
    this.lotusAssembly.lotusGroup.rotation.x = this.reducedMotion ? 0.06 : this.pointerY * 0.1;

    // Subtle glowing pollen crystal inside the receptacle
    this.siliconCrystalMesh.rotation.y = this.reducedMotion ? 0 : -t * 0.45;
    this.siliconCrystalMesh.scale.setScalar(0.65 + bloom * 0.25);

    // Smooth hover & pointer-movement wave frequency modulation (phase-accumulated to prevent jumps)
    const targetHover = this.viewportHovered && !this.reducedMotion ? 1.0 : 0.0;
    if (dt > 0) {
      this.currentHoverMix = THREE.MathUtils.damp(this.currentHoverMix, targetHover, 4.2, dt);
      this.pointerSpeed = THREE.MathUtils.damp(this.pointerSpeed, 0, 3.6, dt);
      this.pointerFlowX = THREE.MathUtils.damp(
        this.pointerFlowX,
        this.viewportHovered ? this.pointerX : 0,
        4.5,
        dt
      );
      this.pointerFlowY = THREE.MathUtils.damp(
        this.pointerFlowY,
        this.viewportHovered ? this.pointerY : 0,
        4.5,
        dt
      );

      if (!this.reducedMotion) {
        const waveFreqSpeed = 1.65 + 3.25 * this.currentHoverMix + Math.min(2.2, this.pointerSpeed * 0.45);
        this.ribbonWavePhase += dt * waveFreqSpeed;
        this.ribbonFlowOffset += dt * (0.14 + 0.26 * this.currentHoverMix + Math.min(0.18, this.pointerSpeed * 0.04));
      }
    }

    this.materials.ribbonUniforms.uWavePhase.value = this.ribbonWavePhase;
    this.materials.ribbonUniforms.uHoverMix.value = this.currentHoverMix;
    this.materials.ribbonUniforms.uPointerFlow.value.set(this.pointerFlowX, this.pointerFlowY);
    this.materials.blueRibbonTexture.offset.x = -this.ribbonFlowOffset;

    const hoverFlowMul = 1.0 + this.currentHoverMix * 0.65;

    // Lower blue silk ribbon halo beneath lily pad
    this.busRingMesh.position.y = -0.82;
    this.busRingMesh.rotation.y = this.reducedMotion ? 0 : this.ribbonWavePhase * 0.11;

    // Sweeping Sky-Blue Stream Ribbons
    this.streamRibbonMeshes.forEach((ribbon, rIdx) => {
      const dir = rIdx % 2 === 0 ? 1 : -1;
      ribbon.rotation.y = this.reducedMotion
        ? rIdx * 1.2
        : this.ribbonWavePhase * (0.09 + rIdx * 0.035) * dir;
      ribbon.rotation.x = (rIdx - 0.5) * 0.28 + this.pointerFlowY * 0.06;
      ribbon.rotation.z = this.pointerFlowX * 0.05 * dir;
      ribbon.position.y = (rIdx - 0.5) * 0.28;
    });

    // Outer Flowing Azure Silk Ribbons choreography
    const isTorus = this.currentWeights[0];
    const isK3s = this.currentWeights[1];
    const isFituc = this.currentWeights[2];

    const gimbalSpeed = this.reducedMotion ? 0 : dt * hoverFlowMul;
    this.gimbalInner.rotation.y += gimbalSpeed * (0.28 + isTorus * 0.45);
    const targetInnerTiltX =
      Math.PI * 0.16 * (1 - isTorus) + Math.PI * 0.28 * isTorus - Math.PI * 0.10 * isK3s + this.pointerFlowY * 0.08;
    this.gimbalInner.rotation.x =
      dt > 0
        ? THREE.MathUtils.damp(this.gimbalInner.rotation.x, targetInnerTiltX, 3.8, dt)
        : targetInnerTiltX;

    this.gimbalOuter.rotation.y -= gimbalSpeed * (0.22 + isK3s * 0.35);
    const targetOuterTiltZ = -Math.PI * 0.18 * (1 - isFituc) + Math.PI * 0.12 * isFituc + this.pointerFlowX * 0.08;
    this.gimbalOuter.rotation.z =
      dt > 0
        ? THREE.MathUtils.damp(this.gimbalOuter.rotation.z, targetOuterTiltZ, 3.8, dt)
        : targetOuterTiltZ;

    this.glassCollar.rotation.y = this.reducedMotion ? 0 : this.ribbonWavePhase * 0.09;
    this.glassCollar.rotation.x = this.reducedMotion
      ? 0
      : Math.sin(this.ribbonWavePhase * 0.35) * 0.15 + this.pointerFlowY * 0.06;

    // Compact Perimeter Nodes
    for (let i = 0; i < 6; i++) {
      const pod = this.podGroups[i];
      const { angleOffset, planeSign } = this.podOrbits[i];
      const baseAngle = angleOffset + (this.reducedMotion ? 0.2 : t * (0.22 + isTorus * 0.35));

      const radius = 2.18 + isTorus * 0.18 + isK3s * 0.32 + isFituc * 0.16;
      const elevation =
        planeSign * (0.18 * (1 - isTorus) + 0.30 * isK3s) +
        isFituc * Math.sin(baseAngle * 2 + t * 1.5) * 0.35;

      pod.position.set(
        Math.cos(baseAngle) * radius,
        elevation,
        Math.sin(baseAngle) * radius
      );
      pod.lookAt(this.heroGroup.position);
    }

    // 5a. Swirling 5-Petal Baby-Pink Cherry Blossoms (Helical Wind Current)
    for (let i = 0; i < SAKURA_BLOSSOM_COUNT; i++) {
      const phi0 = this.sakuraBlossomSeeds[i * 4];
      const yBase = this.sakuraBlossomSeeds[i * 4 + 1];
      const rad = this.sakuraBlossomSeeds[i * 4 + 2];
      const sc = this.sakuraBlossomSeeds[i * 4 + 3];

      // Graceful swirling orbital speed + gentle rising spiral drift
      const windSpeed = 0.26 + (i % 5) * 0.04;
      const phi = phi0 + (this.reducedMotion ? 0 : t * windSpeed);
      const swirlRad = rad + (this.reducedMotion ? 0 : Math.sin(t * 0.8 + i) * 0.18);
      const yFloat = yBase + (this.reducedMotion ? 0 : Math.sin(t * 0.95 + phi0 * 2.0) * 0.22);

      const x = Math.cos(phi) * swirlRad;
      const z = Math.sin(phi) * swirlRad;

      _v1.set(x, yFloat, z);
      _euler.set(
        Math.sin(t * 0.7 + i) * 0.65,
        phi + t * 0.45,
        Math.cos(t * 0.6 + i) * 0.55
      );
      _quat.setFromEuler(_euler);
      _scale.setScalar(sc * (0.9 + bloom * 0.18));
      _mat4.compose(_v1, _quat, _scale);
      this.sakuraBlossomsMesh.setMatrixAt(i, _mat4);
    }
    this.sakuraBlossomsMesh.instanceMatrix.needsUpdate = true;

    // 5b. Swirling Single Notched Baby-Pink Sakura Petals (Fluttering Stream)
    for (let i = 0; i < SAKURA_PETAL_COUNT; i++) {
      const phi0 = this.sakuraPetalSeeds[i * 4];
      const yBase = this.sakuraPetalSeeds[i * 4 + 1];
      const rad = this.sakuraPetalSeeds[i * 4 + 2];
      const sc = this.sakuraPetalSeeds[i * 4 + 3];

      const windSpeed = 0.34 + (i % 7) * 0.045;
      const phi = phi0 + (this.reducedMotion ? 0 : t * windSpeed);
      const swirlRad = rad + (this.reducedMotion ? 0 : Math.cos(t * 1.1 + i * 0.4) * 0.22);
      const yFloat = yBase + (this.reducedMotion ? 0 : Math.cos(t * 1.15 + phi0) * 0.26);

      const x = Math.cos(phi) * swirlRad;
      const z = Math.sin(phi) * swirlRad;

      _v1.set(x, yFloat, z);
      _euler.set(
        t * 0.9 + i,
        phi * 1.3 + t * 0.7,
        Math.sin(t * 1.2 + i) * 0.85
      );
      _quat.setFromEuler(_euler);
      _scale.setScalar(sc);
      _mat4.compose(_v1, _quat, _scale);
      this.sakuraPetalsMesh.setMatrixAt(i, _mat4);
    }
    this.sakuraPetalsMesh.instanceMatrix.needsUpdate = true;

    // Camera Preset Exponential Damping
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
    dom.removeEventListener('pointerenter', this.onPointerEnter);
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
