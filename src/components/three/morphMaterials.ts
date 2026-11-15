import * as THREE from 'three';

export interface MorphMaterialShaderUniforms {
  uTime: { value: number };
  uMorphPulse: { value: number };
  uScanProgress: { value: number };
  uAccent: { value: THREE.Color };
}

export interface BlueRibbonShaderUniforms {
  uWavePhase: { value: number };
  uHoverMix: { value: number };
  uPointerFlow: { value: THREE.Vector2 };
}

export interface MorphMaterialsBundle {
  petalMaterial: THREE.MeshPhysicalMaterial;
  greenPetalMaterial: THREE.MeshStandardMaterial;
  lilyPadMaterial: THREE.MeshStandardMaterial;
  stamenMaterial: THREE.MeshStandardMaterial;
  receptacleMaterial: THREE.MeshStandardMaterial;
  stemMaterial: THREE.MeshStandardMaterial;
  sakuraBlossomMaterial: THREE.MeshStandardMaterial;
  sakuraPetalMaterial: THREE.MeshStandardMaterial;
  coreUniforms: MorphMaterialShaderUniforms;
  ribbonUniforms: BlueRibbonShaderUniforms;
  wireMaterial: THREE.MeshBasicMaterial;
  titaniumMaterial: THREE.MeshStandardMaterial;
  chassisMaterial: THREE.MeshStandardMaterial;
  opticBarMaterial: THREE.MeshStandardMaterial;
  opticalGlassMaterial: THREE.MeshPhysicalMaterial;
  pedestalSideMaterial: THREE.MeshStandardMaterial;
  pedestalTopMaterial: THREE.MeshStandardMaterial;
  contactShadowMaterial: THREE.MeshBasicMaterial;
  siliconCrystalMaterial: THREE.MeshPhysicalMaterial;
  busRingMaterial: THREE.MeshPhysicalMaterial;
  streamRibbonMaterial: THREE.MeshPhysicalMaterial;
  petalTexture: THREE.CanvasTexture;
  greenLeafTexture: THREE.CanvasTexture;
  blueRibbonTexture: THREE.CanvasTexture;
  dialTexture: THREE.CanvasTexture;
  contactShadowTexture: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Procedural Pink Lotus Petal Texture:
 * Soft creamy-blush base transitioning into rich rose-pink body and deep magenta-pink tips,
 * veined with delicate botanical longitudinal striations.
 */
function createPinkLotusPetalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Vertical gradient along V (note Canvas Y=0 is top which maps to UV v=1 petal tip!)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#be185d'); // Deep magenta-rose petal tip (v=1)
    grad.addColorStop(0.22, '#db2777'); // Rich crimson-pink upper lobe
    grad.addColorStop(0.55, '#ec4899'); // Vibrant rose pink body
    grad.addColorStop(0.84, '#f9a8d4'); // Soft baby pink lower throat
    grad.addColorStop(1.0, '#fdf2f8'); // Creamy blush hinge base (v=0)
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle darker edge blush around lateral margins
    const edgeGrad = ctx.createLinearGradient(0, 0, w, 0);
    edgeGrad.addColorStop(0.0, 'rgba(157, 23, 77, 0.35)');
    edgeGrad.addColorStop(0.25, 'rgba(157, 23, 77, 0.0)');
    edgeGrad.addColorStop(0.75, 'rgba(157, 23, 77, 0.0)');
    edgeGrad.addColorStop(1.0, 'rgba(157, 23, 77, 0.35)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, w, h);

    // Fine botanical petal veins radiating fan-wise from bottom center to top
    ctx.lineCap = 'round';
    const veinCount = 21;
    for (let i = 0; i < veinCount; i++) {
      const t = i / (veinCount - 1); // 0 to 1
      const spreadX = (t - 0.5) * w * 0.96;
      const startX = w * 0.5 + (t - 0.5) * w * 0.14;
      const midX = w * 0.5 + spreadX * 0.62;
      const endX = w * 0.5 + spreadX;

      ctx.beginPath();
      ctx.moveTo(startX, h);
      ctx.quadraticCurveTo(midX, h * 0.45, endX, 0);

      const isCenterVein = Math.abs(t - 0.5) < 0.06;
      ctx.strokeStyle = isCenterVein
        ? 'rgba(131, 24, 67, 0.34)'
        : 'rgba(157, 23, 77, 0.22)';
      ctx.lineWidth = isCenterVein ? 3.0 : 1.5;
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural Botanical Emerald Green Texture for outer calyx leaves & lily pad
 */
function createGreenLeafTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 16, w * 0.5, h * 0.5, w * 0.52);
    grad.addColorStop(0.0, '#166534'); // Rich emerald center
    grad.addColorStop(0.55, '#15803d'); // Vibrant botanical leaf green
    grad.addColorStop(0.88, '#14532d'); // Deep forest rim
    grad.addColorStop(1.0, '#052e16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle radial leaf veins
    const c = w * 0.5;
    const veinRays = 18;
    for (let i = 0; i < veinRays; i++) {
      const a = (i / veinRays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(a) * w * 0.48, c + Math.sin(a) * h * 0.48);
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.22)';
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural dark pond calibration dial texture with subtle emerald & rose rings on pure black.
 */
function createDialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const c = size * 0.5;
    const bg = ctx.createRadialGradient(c, c, size * 0.04, c, c, size * 0.5);
    bg.addColorStop(0, '#04120c');
    bg.addColorStop(0.6, '#03080a');
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    const rings = [0.22, 0.34, 0.43, 0.47];
    rings.forEach((rFrac, i) => {
      ctx.beginPath();
      ctx.arc(c, c, size * rFrac, 0, Math.PI * 2);
      ctx.strokeStyle =
        i === 2
          ? 'rgba(244, 114, 182, 0.28)'
          : i === 1
          ? 'rgba(57, 255, 20, 0.22)'
          : 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = i === 2 ? 2 : 1.25;
      if (i === 1) ctx.setLineDash([8, 10]);
      else ctx.setLineDash([]);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const tickCount = 72;
    for (let i = 0; i < tickCount; i++) {
      const a = (i / tickCount) * Math.PI * 2;
      const major = i % 6 === 0;
      const rInner = size * (major ? 0.395 : 0.412);
      const rOuter = size * 0.43;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * rInner, c + Math.sin(a) * rInner);
      ctx.lineTo(c + Math.cos(a) * rOuter, c + Math.sin(a) * rOuter);
      ctx.strokeStyle = major ? 'rgba(244, 114, 182, 0.38)' : 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = major ? 2 : 1;
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural soft radial contact shadow texture
 */
function createContactShadowTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const c = size * 0.5;
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural Flowing Sky-Blue Silk Ribbon Texture with luminous cyan core and sapphire edges
 */
function createBlueRibbonTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Vertical gradient across ribbon width (edges slightly deeper azure, bright sky-blue heart)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#0284c7');
    grad.addColorStop(0.22, '#38bdf8');
    grad.addColorStop(0.5, '#bae6fd');
    grad.addColorStop(0.78, '#38bdf8');
    grad.addColorStop(1.0, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft longitudinal silk thread highlights
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.42)';
    ctx.lineWidth = 2;
    [0.32, 0.5, 0.68].forEach((yFrac) => {
      ctx.beginPath();
      ctx.moveTo(0, h * yFrac);
      ctx.lineTo(w, h * yFrac);
      ctx.stroke();
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createMorphMaterials(
  isSoftwareGl: boolean,
  maxAnisotropy: number
): MorphMaterialsBundle {
  const petalTexture = createPinkLotusPetalTexture(maxAnisotropy);
  const greenLeafTexture = createGreenLeafTexture(maxAnisotropy);
  const blueRibbonTexture = createBlueRibbonTexture(maxAnisotropy);
  const dialTexture = createDialTexture(maxAnisotropy);
  const contactShadowTexture = createContactShadowTexture(maxAnisotropy);

  const coreUniforms: MorphMaterialShaderUniforms = {
    uTime: { value: 0 },
    uMorphPulse: { value: 0 },
    uScanProgress: { value: -1.5 },
    uAccent: { value: new THREE.Color('#f472b6') },
  };

  const ribbonUniforms: BlueRibbonShaderUniforms = {
    uWavePhase: { value: 0 },
    uHoverMix: { value: 0 },
    uPointerFlow: { value: new THREE.Vector2(0, 0) },
  };

  function applyBlueRibbonWaveShader(
    mat: THREE.MeshPhysicalMaterial,
    phaseOffset: number
  ): void {
    mat.customProgramCacheKey = () => `blue-ribbon-wave-${phaseOffset}`;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWavePhase = ribbonUniforms.uWavePhase;
      shader.uniforms.uHoverMix = ribbonUniforms.uHoverMix;
      shader.uniforms.uPointerFlow = ribbonUniforms.uPointerFlow;

      shader.vertexShader =
        `uniform float uWavePhase;
        uniform float uHoverMix;
        uniform vec2 uPointerFlow;
        varying float vRibbonLoopAngle;
        varying float vRibbonWaveCrest;
        ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float loopAngle = uv.x * 1.57079632679;
        vRibbonLoopAngle = loopAngle;

        // Primary gentle silk wave + higher-frequency ripple awakened smoothly on hover
        float primaryWave = sin(loopAngle * 3.0 - uWavePhase + ${phaseOffset.toFixed(2)});
        float hoverRipple = cos(loopAngle * 6.0 + uWavePhase * 1.45 - ${(phaseOffset * 0.7).toFixed(2)});
        float combinedWave = primaryWave * (0.045 + 0.035 * uHoverMix) + hoverRipple * (0.015 + 0.042 * uHoverMix);

        // Directional breeze sway following pointer movement across the 3D viewport
        float pointerSweep = (uPointerFlow.x * cos(loopAngle) + uPointerFlow.y * sin(loopAngle)) * 0.075;

        transformed.y += combinedWave + pointerSweep;
        float radialLen = max(0.001, length(transformed.xz));
        vec2 radialDir = transformed.xz / radialLen;
        transformed.xz += radialDir * (primaryWave * (0.025 + 0.032 * uHoverMix));

        vRibbonWaveCrest = 0.5 + 0.5 * sin(loopAngle * 4.0 - uWavePhase * 1.25 + ${phaseOffset.toFixed(2)});`
      );

      shader.fragmentShader =
        `uniform float uHoverMix;
        varying float vRibbonLoopAngle;
        varying float vRibbonWaveCrest;
        ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float crestHighlight = pow(vRibbonWaveCrest, 3.0);
        vec3 flowTint = vec3(0.28, 0.78, 1.0);
        totalEmissiveRadiance += flowTint * crestHighlight * (0.18 + 0.48 * uHoverMix);`
      );
    };
  }

  // 1. Lush Velvet Pink Lotus Petal Material (Zero white specular glare blowout!)
  const petalMaterial = new THREE.MeshPhysicalMaterial({
    map: petalTexture,
    color: new THREE.Color('#ffffff'), // Multiplies cleanly with rich pink petalTexture
    emissive: new THREE.Color('#831843'), // Deep rose subsurface undertone
    emissiveIntensity: 0.24,
    metalness: 0.0,
    roughness: 0.62, // Soft velvety flower petal scatter (prevents mirror-white studio reflection)
    clearcoat: 0.06,
    clearcoatRoughness: 0.55,
    sheen: 0.65,
    sheenColor: new THREE.Color('#fbcfe8'),
    sheenRoughness: 0.68,
    side: THREE.DoubleSide,
    envMapIntensity: 0.28, // Keep low so IBL lights don't wash out pink pigment
  });

  petalMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = coreUniforms.uTime;
    shader.uniforms.uMorphPulse = coreUniforms.uMorphPulse;
    shader.uniforms.uScanProgress = coreUniforms.uScanProgress;
    shader.uniforms.uAccent = coreUniforms.uAccent;

    shader.vertexShader =
      `varying vec3 vLotusWorldPos;\nvarying vec2 vLotusUv;\n` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vLotusWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vLotusUv = uv;`
    );

    shader.fragmentShader =
      `uniform float uTime;
      uniform float uMorphPulse;
      uniform float uScanProgress;
      uniform vec3 uAccent;
      varying vec3 vLotusWorldPos;
      varying vec2 vLotusUv;
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      vec3 viewDirLotus = normalize(vViewPosition);
      float fresnelLotus = pow(1.0 - max(0.0, dot(viewDirLotus, normalize(normal))), 3.0);

      // Soft translucent pink subsurface glow at petal margins and upper edge
      vec3 roseRim = vec3(0.95, 0.35, 0.62);
      float tipGlow = smoothstep(0.35, 1.0, vLotusUv.y);

      // Wavefront pulse sweep during architecture switches
      float scanDist = abs(vLotusWorldPos.y - uScanProgress);
      float scanBand = exp(-(scanDist * scanDist) / 0.08) * uMorphPulse;

      totalEmissiveRadiance += (roseRim * fresnelLotus * (0.28 + 0.32 * tipGlow)) +
                               (uAccent * scanBand * 1.15);`
    );
  };

  // 2. Botanical Emerald Green Outer Calyx Petals
  const greenPetalMaterial = new THREE.MeshStandardMaterial({
    map: greenLeafTexture,
    color: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#052e16'),
    emissiveIntensity: 0.25,
    metalness: 0.02,
    roughness: 0.52,
    side: THREE.DoubleSide,
    envMapIntensity: 0.38,
  });

  // 3. Green Floating Lily Pad Material
  const lilyPadMaterial = new THREE.MeshStandardMaterial({
    map: greenLeafTexture,
    color: new THREE.Color('#d1fae5'),
    emissive: new THREE.Color('#064e3b'),
    emissiveIntensity: 0.22,
    metalness: 0.04,
    roughness: 0.44,
    side: THREE.DoubleSide,
    envMapIntensity: 0.45,
  });

  // 4. Warm Golden Lotus Stamen Filaments
  const stamenMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fde047'),
    emissive: new THREE.Color('#f59e0b'),
    emissiveIntensity: 0.85,
    metalness: 0.1,
    roughness: 0.35,
  });

  // 5. Central Botanical Chartreuse-Green Seedpod Receptacle
  const receptacleMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#65a30d'),
    emissive: new THREE.Color('#365314'),
    emissiveIntensity: 0.35,
    metalness: 0.05,
    roughness: 0.62,
    envMapIntensity: 0.35,
  });

  // 6. Botanical Green Stem
  const stemMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#15803d'),
    emissive: new THREE.Color('#052e16'),
    emissiveIntensity: 0.2,
    metalness: 0.05,
    roughness: 0.56,
    envMapIntensity: 0.35,
  });

  // 7. Baby-Pink Cherry Blossom (5-petal flowers)
  const sakuraBlossomMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fbcfe8'), // Soft baby pink
    emissive: new THREE.Color('#f472b6'),
    emissiveIntensity: 0.26,
    metalness: 0.0,
    roughness: 0.65,
    side: THREE.DoubleSide,
    envMapIntensity: 0.25,
  });

  // 8. Baby-Pink Floating Single Cherry Blossom Petals
  const sakuraPetalMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fce7f3'), // Delicate blush baby pink
    emissive: new THREE.Color('#f9a8d4'),
    emissiveIntensity: 0.24,
    metalness: 0.0,
    roughness: 0.68,
    side: THREE.DoubleSide,
    envMapIntensity: 0.22,
  });

  // Toggleable subtle sky-blue CAD wireframe overlay
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    wireframe: true,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Flowing Luminous Azure / Sky-Blue Silk Ribbons (replacing dark metallic rings)
  const titaniumMaterial = new THREE.MeshPhysicalMaterial({
    map: blueRibbonTexture,
    color: new THREE.Color('#7dd3fc'),
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.72,
    metalness: 0.08,
    roughness: 0.28,
    sheen: 0.9,
    sheenColor: new THREE.Color('#e0f2fe'),
    sheenRoughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
    envMapIntensity: 0.55,
  });

  // Deep Sapphire Node Pods matching blue ribbon aesthetic
  const chassisMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0c4a6e'),
    emissive: new THREE.Color('#0369a1'),
    emissiveIntensity: 0.35,
    metalness: 0.45,
    roughness: 0.38,
    envMapIntensity: 0.65,
  });

  const opticBarMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#38bdf8'),
    emissive: new THREE.Color('#38bdf8'),
    emissiveIntensity: 1.15,
    metalness: 0.1,
    roughness: 0.2,
  });

  // Delicate Luminous Sky-Blue Glass Ribbon Collar
  const opticalGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#7dd3fc'),
    emissive: new THREE.Color('#0ea5e9'),
    emissiveIntensity: 0.48,
    metalness: 0.0,
    roughness: 0.14,
    transmission: isSoftwareGl ? 0.0 : 0.78,
    transparent: true,
    opacity: isSoftwareGl ? 0.42 : 0.78,
    ior: 1.48,
    thickness: 0.5,
    attenuationColor: new THREE.Color('#38bdf8'),
    attenuationDistance: 2.0,
    clearcoat: 0.8,
    depthWrite: false,
  });

  const pedestalSideMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#040a14'),
    metalness: 0.7,
    roughness: 0.48,
    envMapIntensity: 0.45,
  });

  const pedestalTopMaterial = new THREE.MeshStandardMaterial({
    map: dialTexture,
    metalness: 0.55,
    roughness: 0.52,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const contactShadowMaterial = new THREE.MeshBasicMaterial({
    map: contactShadowTexture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const siliconCrystalMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fbbf24'),
    emissive: new THREE.Color('#d97706'),
    emissiveIntensity: 0.55,
    metalness: 0.25,
    roughness: 0.25,
    clearcoat: 0.8,
    transparent: true,
    opacity: 0.85,
  });

  // Lower Blue Water-Silk Ribbon Halo below the lily pad
  const busRingMaterial = new THREE.MeshPhysicalMaterial({
    map: blueRibbonTexture,
    color: new THREE.Color('#38bdf8'),
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.65,
    metalness: 0.05,
    roughness: 0.3,
    sheen: 0.85,
    sheenColor: new THREE.Color('#bae6fd'),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.76,
  });

  // Sweeping Translucent Cerulean & Baby-Blue Silk Stream Ribbons
  const streamRibbonMaterial = new THREE.MeshPhysicalMaterial({
    map: blueRibbonTexture,
    color: new THREE.Color('#60a5fa'),
    emissive: new THREE.Color('#0ea5e9'),
    emissiveIntensity: 0.78,
    roughness: 0.26,
    metalness: 0.06,
    sheen: 0.9,
    sheenColor: new THREE.Color('#e0f2fe'),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.84,
  });

  // Attach synchronized wave & hover-flow shader across all blue silk ribbons
  applyBlueRibbonWaveShader(titaniumMaterial, 0.0);
  applyBlueRibbonWaveShader(opticalGlassMaterial, 1.4);
  applyBlueRibbonWaveShader(busRingMaterial, 2.6);
  applyBlueRibbonWaveShader(streamRibbonMaterial, 3.8);

  return {
    petalMaterial,
    greenPetalMaterial,
    lilyPadMaterial,
    stamenMaterial,
    receptacleMaterial,
    stemMaterial,
    sakuraBlossomMaterial,
    sakuraPetalMaterial,
    coreUniforms,
    ribbonUniforms,
    wireMaterial,
    titaniumMaterial,
    chassisMaterial,
    opticBarMaterial,
    opticalGlassMaterial,
    pedestalSideMaterial,
    pedestalTopMaterial,
    contactShadowMaterial,
    siliconCrystalMaterial,
    busRingMaterial,
    streamRibbonMaterial,
    petalTexture,
    greenLeafTexture,
    blueRibbonTexture,
    dialTexture,
    contactShadowTexture,
    dispose: () => {
      petalTexture.dispose();
      greenLeafTexture.dispose();
      blueRibbonTexture.dispose();
      dialTexture.dispose();
      contactShadowTexture.dispose();
      petalMaterial.dispose();
      greenPetalMaterial.dispose();
      lilyPadMaterial.dispose();
      stamenMaterial.dispose();
      receptacleMaterial.dispose();
      stemMaterial.dispose();
      sakuraBlossomMaterial.dispose();
      sakuraPetalMaterial.dispose();
      wireMaterial.dispose();
      titaniumMaterial.dispose();
      chassisMaterial.dispose();
      opticBarMaterial.dispose();
      opticalGlassMaterial.dispose();
      pedestalSideMaterial.dispose();
      pedestalTopMaterial.dispose();
      contactShadowMaterial.dispose();
      siliconCrystalMaterial.dispose();
      busRingMaterial.dispose();
      streamRibbonMaterial.dispose();
    },
  };
}
