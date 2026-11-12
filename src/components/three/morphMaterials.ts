import * as THREE from 'three';

export interface MorphMaterialShaderUniforms {
  uTime: { value: number };
  uMorphPulse: { value: number };
  uScanProgress: { value: number };
  uAccent: { value: THREE.Color };
}

export interface MorphMaterialsBundle {
  coreMaterial: THREE.MeshPhysicalMaterial;
  coreUniforms: MorphMaterialShaderUniforms;
  wireMaterial: THREE.MeshBasicMaterial;
  titaniumMaterial: THREE.MeshStandardMaterial;
  chassisMaterial: THREE.MeshStandardMaterial;
  opticBarMaterial: THREE.MeshStandardMaterial;
  opticalGlassMaterial: THREE.MeshPhysicalMaterial;
  pedestalSideMaterial: THREE.MeshStandardMaterial;
  pedestalTopMaterial: THREE.MeshStandardMaterial;
  contactShadowMaterial: THREE.MeshBasicMaterial;
  shardMaterial: THREE.MeshPhysicalMaterial;
  dialTexture: THREE.CanvasTexture;
  contactShadowTexture: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Procedural high-contrast studio dial markings CanvasTexture for the grounded base pedestal.
 */
function createDialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const c = size * 0.5;
    // Matte obsidian anodized background
    const bg = ctx.createRadialGradient(c, c, size * 0.04, c, c, size * 0.5);
    bg.addColorStop(0, '#0c1324');
    bg.addColorStop(0.65, '#070b17');
    bg.addColorStop(1, '#040711');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Subtle concentric calibration tracks
    const rings = [0.22, 0.34, 0.43, 0.47];
    rings.forEach((rFrac, i) => {
      ctx.beginPath();
      ctx.arc(c, c, size * rFrac, 0, Math.PI * 2);
      ctx.strokeStyle = i === 2 ? 'rgba(34, 211, 238, 0.28)' : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = i === 2 ? 2 : 1.25;
      if (i === 1) ctx.setLineDash([8, 10]);
      else ctx.setLineDash([]);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Degree hairline ticks around perimeter
    const tickCount = 72;
    for (let i = 0; i < tickCount; i++) {
      const a = (i / tickCount) * Math.PI * 2;
      const major = i % 6 === 0;
      const rInner = size * (major ? 0.395 : 0.412);
      const rOuter = size * 0.43;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * rInner, c + Math.sin(a) * rInner);
      ctx.lineTo(c + Math.cos(a) * rOuter, c + Math.sin(a) * rOuter);
      ctx.strokeStyle = major ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = major ? 2 : 1;
      ctx.stroke();
    }

    // Orthogonal reticle axes
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(c - size * 0.45, c);
    ctx.lineTo(c - size * 0.14, c);
    ctx.moveTo(c + size * 0.14, c);
    ctx.lineTo(c + size * 0.45, c);
    ctx.moveTo(c, c - size * 0.45);
    ctx.lineTo(c, c - size * 0.14);
    ctx.moveTo(c, c + size * 0.14);
    ctx.lineTo(c, c + size * 0.45);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural soft radial contact shadow CanvasTexture for grounded studio realism.
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
    grad.addColorStop(0, 'rgba(2, 4, 12, 0.88)');
    grad.addColorStop(0.38, 'rgba(4, 8, 22, 0.58)');
    grad.addColorStop(0.72, 'rgba(6, 14, 34, 0.18)');
    grad.addColorStop(1, 'rgba(4, 7, 17, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createMorphMaterials(
  isSoftwareGl: boolean,
  maxAnisotropy: number
): MorphMaterialsBundle {
  const dialTexture = createDialTexture(maxAnisotropy);
  const contactShadowTexture = createContactShadowTexture(maxAnisotropy);

  const coreUniforms: MorphMaterialShaderUniforms = {
    uTime: { value: 0 },
    uMorphPulse: { value: 0 },
    uScanProgress: { value: -1.5 },
    uAccent: { value: new THREE.Color('#22d3ee') },
  };

  // Primary Anodized Cobalt Metallic Clearcoat Hull extended via onBeforeCompile
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#142546'),
    metalness: 0.86,
    roughness: 0.22,
    clearcoat: 0.94,
    clearcoatRoughness: 0.14,
    iridescence: 0.42,
    iridescenceIOR: 1.38,
    envMapIntensity: 1.45,
    emissive: new THREE.Color('#07192e'),
    emissiveIntensity: 0.35,
  });

  coreMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = coreUniforms.uTime;
    shader.uniforms.uMorphPulse = coreUniforms.uMorphPulse;
    shader.uniforms.uScanProgress = coreUniforms.uScanProgress;
    shader.uniforms.uAccent = coreUniforms.uAccent;

    shader.vertexShader =
      `varying vec3 vMorphPos;\nvarying vec2 vMorphUv;\n` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <morphtarget_vertex>',
      `#include <morphtarget_vertex>
      vMorphPos = transformed;
      vMorphUv = uv;`
    );

    shader.fragmentShader =
      `uniform float uTime;
      uniform float uMorphPulse;
      uniform float uScanProgress;
      uniform vec3 uAccent;
      varying vec3 vMorphPos;
      varying vec2 vMorphUv;
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      vec3 viewDirM = normalize(vViewPosition);
      float fresnelRim = pow(1.0 - max(0.0, dot(viewDirM, normalize(normal))), 3.1);

      // Travelling cyan morph wavefront sweep during transitions
      float scanDist = abs(vMorphPos.y - uScanProgress);
      float scanBand = exp(-(scanDist * scanDist) / 0.055) * uMorphPulse;

      // Subtle architectural contour hairlines mapped onto live morph surface
      float latLine = smoothstep(0.47, 0.495, abs(fract(vMorphUv.y * 16.0 - uTime * 0.03) - 0.5));
      float lonLine = smoothstep(0.482, 0.498, abs(fract(vMorphUv.x * 24.0) - 0.5));
      float gridTrace = max(latLine, lonLine * 0.65) * (0.14 + 0.65 * uMorphPulse);

      totalEmissiveRadiance += uAccent * (fresnelRim * (0.28 + 0.52 * uMorphPulse) + scanBand * 1.45 + gridTrace * 0.38);`
    );
  };

  // Optional toggleable wireframe overlay sharing exact vertex morphAttributes
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#38bdf8'),
    wireframe: true,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Secondary Brushed Titanium Gimbal Rings (contrast roughness/metalness vs core: +0.26 delta)
  const titaniumMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9fb3c8'),
    metalness: 0.92,
    roughness: 0.46,
    envMapIntensity: 1.25,
  });

  // Composite Satellite Node Matte Powdercoat Housing (distinct roughness +0.28 vs titanium collar)
  const chassisMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1b2538'),
    metalness: 0.34,
    roughness: 0.74,
    envMapIntensity: 0.9,
  });

  // Satellite Pod Glowing Cyan Optic Indicator Bars
  const opticBarMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#38bdf8'),
    emissive: new THREE.Color('#22d3ee'),
    emissiveIntensity: 1.15,
    metalness: 0.2,
    roughness: 0.22,
  });

  // Transmissive Sapphire Optical Ring (with safe software-WebGL translucent fallback)
  const opticalGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#bae6fd'),
    metalness: 0.0,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0.0 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.28 : 1.0,
    ior: 1.54,
    thickness: 1.2,
    attenuationColor: new THREE.Color('#22d3ee'),
    attenuationDistance: 2.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    depthWrite: false,
    envMapIntensity: 1.4,
  });

  // Grounded Pedestal Matte Side & Procedural Dial Top
  const pedestalSideMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#090e1c'),
    metalness: 0.28,
    roughness: 0.78,
  });

  const pedestalTopMaterial = new THREE.MeshStandardMaterial({
    map: dialTexture,
    metalness: 0.16,
    roughness: 0.84,
    envMapIntensity: 0.75,
  });

  const contactShadowMaterial = new THREE.MeshBasicMaterial({
    map: contactShadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.75,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Instanced Orbital Micro-Shards
  const shardMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#67e8f9'),
    metalness: 0.75,
    roughness: 0.2,
    clearcoat: 0.8,
    emissive: new THREE.Color('#0ea5e9'),
    emissiveIntensity: 0.45,
  });

  return {
    coreMaterial,
    coreUniforms,
    wireMaterial,
    titaniumMaterial,
    chassisMaterial,
    opticBarMaterial,
    opticalGlassMaterial,
    pedestalSideMaterial,
    pedestalTopMaterial,
    contactShadowMaterial,
    shardMaterial,
    dialTexture,
    contactShadowTexture,
    dispose: () => {
      coreMaterial.dispose();
      wireMaterial.dispose();
      titaniumMaterial.dispose();
      chassisMaterial.dispose();
      opticBarMaterial.dispose();
      opticalGlassMaterial.dispose();
      pedestalSideMaterial.dispose();
      pedestalTopMaterial.dispose();
      contactShadowMaterial.dispose();
      shardMaterial.dispose();
      dialTexture.dispose();
      contactShadowTexture.dispose();
    },
  };
}
