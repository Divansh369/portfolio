import * as THREE from 'three';
import { createLilyPadGeometry } from './morphGeometries';

export type CelestialPhaseId = 'evening' | 'night' | 'morning' | 'afternoon';

export interface CelestialPhaseSnapshot {
  id: CelestialPhaseId;
  label: string;
  windowLabel: string;
  sunDir: THREE.Vector3;
  moonDir: THREE.Vector3;
  skyZenith: THREE.Color;
  skyMid: THREE.Color;
  skyHorizon: THREE.Color;
  waterDeep: THREE.Color;
  waterShallow: THREE.Color;
  sunColor: THREE.Color;
  sunIntensity: number;
  moonColor: THREE.Color;
  moonIntensity: number;
  starVisibility: number;
  cloudTint: THREE.Color;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  keyLightColor: THREE.Color;
  keyLightIntensity: number;
  rimLightColor: THREE.Color;
  rimLightIntensity: number;
  fillLightColor: THREE.Color;
  fillLightIntensity: number;
  fogDensity: number;
  exposure: number;
}

export interface CelestialWaterEnvironment {
  rootGroup: THREE.Group;
  skyMesh: THREE.Mesh;
  waterMesh: THREE.Mesh;
  sunGroup: THREE.Group;
  sunCoreMesh: THREE.Mesh;
  sunHaloSprite: THREE.Sprite;
  moonGroup: THREE.Group;
  moonCoreMesh: THREE.Mesh;
  moonHaloSprite: THREE.Sprite;
  companionPads: Array<{
    mesh: THREE.Mesh;
    baseY: number;
    phase: number;
    baseRot: number;
  }>;
  update: (
    bloomFactor: number,
    elapsed: number,
    hoverMix: number,
    pointerX: number,
    pointerY: number,
    reducedMotion: boolean
  ) => CelestialPhaseSnapshot;
  dispose: () => void;
}

export const WATER_SURFACE_Y = -0.66;
const SKY_RADIUS = 68;
const CELESTIAL_ARC_DIST = 44;

interface PhaseKeyframe {
  stop: number;
  zenith: THREE.Color;
  mid: THREE.Color;
  horizon: THREE.Color;
  waterDeep: THREE.Color;
  waterShallow: THREE.Color;
  sunColor: THREE.Color;
  moonColor: THREE.Color;
  cloudTint: THREE.Color;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  keyColor: THREE.Color;
  rimColor: THREE.Color;
  fillColor: THREE.Color;
  sunElevation: number;
  sunAzimuth: number;
  moonElevation: number;
  moonAzimuth: number;
  sunIntensity: number;
  moonIntensity: number;
  starVisibility: number;
  hemiIntensity: number;
  keyIntensity: number;
  rimIntensity: number;
  fillIntensity: number;
  fogDensity: number;
  exposure: number;
}

const KEYFRAMES: PhaseKeyframe[] = [
  // 0.00 -> Evening: Dusk (Amber-rose sunset dipping on left, soft violet sky, crescent/pearl moon rising on right)
  {
    stop: 0.0,
    zenith: new THREE.Color('#13112c'),
    mid: new THREE.Color('#4c1d57'),
    horizon: new THREE.Color('#f97316'),
    waterDeep: new THREE.Color('#071326'),
    waterShallow: new THREE.Color('#1a2244'),
    sunColor: new THREE.Color('#ff8a3d'),
    moonColor: new THREE.Color('#dbeafe'),
    cloudTint: new THREE.Color('#fb7185'),
    hemiSky: new THREE.Color('#c084fc'),
    hemiGround: new THREE.Color('#09202e'),
    keyColor: new THREE.Color('#ffb482'),
    rimColor: new THREE.Color('#f472b6'),
    fillColor: new THREE.Color('#38bdf8'),
    sunElevation: 0.14,
    sunAzimuth: -0.44,
    moonElevation: 0.05,
    moonAzimuth: 0.42,
    sunIntensity: 0.92,
    moonIntensity: 0.35,
    starVisibility: 0.25,
    hemiIntensity: 0.56,
    keyIntensity: 1.18,
    rimIntensity: 1.15,
    fillIntensity: 0.55,
    fogDensity: 0.015,
    exposure: 0.94,
  },
  // 0.25 -> Dusk turning into Deep Night (Sun below horizon, starry indigo canopy, Moon glowing high)
  {
    stop: 0.25,
    zenith: new THREE.Color('#030714'),
    mid: new THREE.Color('#0b1636'),
    horizon: new THREE.Color('#1e2954'),
    waterDeep: new THREE.Color('#020817'),
    waterShallow: new THREE.Color('#08203e'),
    sunColor: new THREE.Color('#fb7185'),
    moonColor: new THREE.Color('#e2e8f0'),
    cloudTint: new THREE.Color('#334155'),
    hemiSky: new THREE.Color('#64748b'),
    hemiGround: new THREE.Color('#02131d'),
    keyColor: new THREE.Color('#cbd5e1'),
    rimColor: new THREE.Color('#818cf8'),
    fillColor: new THREE.Color('#0ea5e9'),
    sunElevation: -0.18,
    sunAzimuth: -0.58,
    moonElevation: 0.36,
    moonAzimuth: 0.18,
    sunIntensity: 0.0,
    moonIntensity: 0.95,
    starVisibility: 1.0,
    hemiIntensity: 0.48,
    keyIntensity: 0.96,
    rimIntensity: 0.95,
    fillIntensity: 0.52,
    fogDensity: 0.014,
    exposure: 0.88,
  },
  // 0.48 -> Midnight to Pre-Dawn (Moon gliding left, first rose-indigo dawn light warming the eastern horizon)
  {
    stop: 0.48,
    zenith: new THREE.Color('#091330'),
    mid: new THREE.Color('#27275c'),
    horizon: new THREE.Color('#9d4edd'),
    waterDeep: new THREE.Color('#05122b'),
    waterShallow: new THREE.Color('#13315c'),
    sunColor: new THREE.Color('#fda4af'),
    moonColor: new THREE.Color('#e0f2fe'),
    cloudTint: new THREE.Color('#c084fc'),
    hemiSky: new THREE.Color('#93c5fd'),
    hemiGround: new THREE.Color('#063235'),
    keyColor: new THREE.Color('#e0f2fe'),
    rimColor: new THREE.Color('#f472b6'),
    fillColor: new THREE.Color('#22d3ee'),
    sunElevation: -0.04,
    sunAzimuth: 0.48,
    moonElevation: 0.32,
    moonAzimuth: -0.18,
    sunIntensity: 0.18,
    moonIntensity: 0.72,
    starVisibility: 0.58,
    hemiIntensity: 0.62,
    keyIntensity: 1.08,
    rimIntensity: 1.02,
    fillIntensity: 0.58,
    fogDensity: 0.015,
    exposure: 0.94,
  },
  // 0.72 -> Morning: Dawn to Bright Morning Noon (Sun climbing gracefully into crisp azure sky, Moon setting softly)
  {
    stop: 0.72,
    zenith: new THREE.Color('#1d4ed8'),
    mid: new THREE.Color('#38bdf8'),
    horizon: new THREE.Color('#fed7aa'),
    waterDeep: new THREE.Color('#063751'),
    waterShallow: new THREE.Color('#0e7490'),
    sunColor: new THREE.Color('#fffbeb'),
    moonColor: new THREE.Color('#bae6fd'),
    cloudTint: new THREE.Color('#fff7ed'),
    hemiSky: new THREE.Color('#bae6fd'),
    hemiGround: new THREE.Color('#0b4635'),
    keyColor: new THREE.Color('#fff4d9'),
    rimColor: new THREE.Color('#f9a8d4'),
    fillColor: new THREE.Color('#10b981'),
    sunElevation: 0.34,
    sunAzimuth: 0.24,
    moonElevation: 0.06,
    moonAzimuth: -0.44,
    sunIntensity: 1.0,
    moonIntensity: 0.14,
    starVisibility: 0.0,
    hemiIntensity: 0.78,
    keyIntensity: 1.48,
    rimIntensity: 0.92,
    fillIntensity: 0.64,
    fogDensity: 0.011,
    exposure: 1.06,
  },
  // 1.00 -> Afternoon: Golden Noon to Evening (Luminous open blossom bathed in warm golden-hour sunlight & shimmering water)
  {
    stop: 1.0,
    zenith: new THREE.Color('#0284c7'),
    mid: new THREE.Color('#60a5fa'),
    horizon: new THREE.Color('#fdba74'),
    waterDeep: new THREE.Color('#072e4c'),
    waterShallow: new THREE.Color('#0891b2'),
    sunColor: new THREE.Color('#fde047'),
    moonColor: new THREE.Color('#e2e8f0'),
    cloudTint: new THREE.Color('#fed7aa'),
    hemiSky: new THREE.Color('#fde68a'),
    hemiGround: new THREE.Color('#084c3e'),
    keyColor: new THREE.Color('#ffe4b5'),
    rimColor: new THREE.Color('#fb7185'),
    fillColor: new THREE.Color('#38bdf8'),
    sunElevation: 0.24,
    sunAzimuth: -0.22,
    moonElevation: -0.06,
    moonAzimuth: 0.45,
    sunIntensity: 1.0,
    moonIntensity: 0.08,
    starVisibility: 0.0,
    hemiIntensity: 0.74,
    keyIntensity: 1.42,
    rimIntensity: 1.06,
    fillIntensity: 0.62,
    fogDensity: 0.012,
    exposure: 1.04,
  },
];

function createRadialGlowTexture(innerHex: string, midHex: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size * 0.5;
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0.0, innerHex);
    grad.addColorStop(0.28, midHex);
    grad.addColorStop(0.65, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createMoonSurfaceTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size * 0.4, size * 0.38, 12, size * 0.5, size * 0.5, size * 0.55);
    grad.addColorStop(0.0, '#f8fafc');
    grad.addColorStop(0.55, '#cbd5e1');
    grad.addColorStop(1.0, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Subtle botanical-soft lunar maria & craters
    const craters = [
      [0.34, 0.36, 0.14, 0.18],
      [0.56, 0.42, 0.18, 0.16],
      [0.45, 0.62, 0.12, 0.15],
      [0.64, 0.28, 0.08, 0.14],
      [0.28, 0.58, 0.09, 0.12],
      [0.52, 0.24, 0.06, 0.11],
    ];
    craters.forEach(([xF, yF, rF, alpha]) => {
      const x = xF * size;
      const y = yF * size;
      const r = rF * size;
      const cg = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
      cg.addColorStop(0, `rgba(100, 116, 139, ${alpha})`);
      cg.addColorStop(0.75, `rgba(71, 85, 105, ${alpha * 0.7})`);
      cg.addColorStop(1, 'rgba(148, 163, 184, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function getPhaseMetadata(bloom: number): {
  id: CelestialPhaseId;
  label: string;
  windowLabel: string;
} {
  if (bloom < 0.24) {
    return {
      id: 'evening',
      label: 'Evening',
      windowLabel: 'Dusk -> Night',
    };
  }
  if (bloom < 0.56) {
    return {
      id: 'night',
      label: 'Night',
      windowLabel: 'Midnight -> Dawn',
    };
  }
  if (bloom < 0.82) {
    return {
      id: 'morning',
      label: 'Morning',
      windowLabel: 'Dawn -> Noon',
    };
  }
  return {
    id: 'afternoon',
    label: 'Afternoon',
    windowLabel: 'Noon -> Evening',
  };
}

function azElToVec3(azimuth: number, elevation: number, out: THREE.Vector3): THREE.Vector3 {
  const cosEl = Math.cos(elevation);
  // Azimuth 0 looks toward -Z (straight behind the lotus from Front/Iso view)
  out.set(
    Math.sin(azimuth) * cosEl,
    Math.sin(elevation),
    -Math.cos(azimuth) * cosEl
  ).normalize();
  return out;
}

export function createCelestialWaterEnvironment(
  lilyPadMaterial: THREE.Material,
  maxAnisotropy: number
): CelestialWaterEnvironment {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'CelestialWaterEnvironment';

  const snapshot: CelestialPhaseSnapshot = {
    id: 'evening',
    label: 'Evening',
    windowLabel: 'Dusk -> Night',
    sunDir: new THREE.Vector3(-0.4, 0.14, -0.9).normalize(),
    moonDir: new THREE.Vector3(0.4, 0.08, -0.9).normalize(),
    skyZenith: KEYFRAMES[0].zenith.clone(),
    skyMid: KEYFRAMES[0].mid.clone(),
    skyHorizon: KEYFRAMES[0].horizon.clone(),
    waterDeep: KEYFRAMES[0].waterDeep.clone(),
    waterShallow: KEYFRAMES[0].waterShallow.clone(),
    sunColor: KEYFRAMES[0].sunColor.clone(),
    sunIntensity: KEYFRAMES[0].sunIntensity,
    moonColor: KEYFRAMES[0].moonColor.clone(),
    moonIntensity: KEYFRAMES[0].moonIntensity,
    starVisibility: KEYFRAMES[0].starVisibility,
    cloudTint: KEYFRAMES[0].cloudTint.clone(),
    hemiSky: KEYFRAMES[0].hemiSky.clone(),
    hemiGround: KEYFRAMES[0].hemiGround.clone(),
    hemiIntensity: KEYFRAMES[0].hemiIntensity,
    keyLightColor: KEYFRAMES[0].keyColor.clone(),
    keyLightIntensity: KEYFRAMES[0].keyIntensity,
    rimLightColor: KEYFRAMES[0].rimColor.clone(),
    rimLightIntensity: KEYFRAMES[0].rimIntensity,
    fillLightColor: KEYFRAMES[0].fillColor.clone(),
    fillLightIntensity: KEYFRAMES[0].fillIntensity,
    fogDensity: KEYFRAMES[0].fogDensity,
    exposure: KEYFRAMES[0].exposure,
  };

  // ==================== 1. ATMOSPHERIC PROCEDURAL SKY DOME ====================
  const skyGeo = new THREE.SphereGeometry(SKY_RADIUS, 48, 32);
  const skyUniforms = {
    uTime: { value: 0 },
    uSkyZenith: { value: snapshot.skyZenith },
    uSkyMid: { value: snapshot.skyMid },
    uSkyHorizon: { value: snapshot.skyHorizon },
    uCloudTint: { value: snapshot.cloudTint },
    uSunDir: { value: snapshot.sunDir },
    uSunColor: { value: snapshot.sunColor },
    uSunIntensity: { value: snapshot.sunIntensity },
    uMoonDir: { value: snapshot.moonDir },
    uMoonColor: { value: snapshot.moonColor },
    uMoonIntensity: { value: snapshot.moonIntensity },
    uStarVisibility: { value: snapshot.starVisibility },
  };

  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSkyZenith;
      uniform vec3 uSkyMid;
      uniform vec3 uSkyHorizon;
      uniform vec3 uCloudTint;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uSunIntensity;
      uniform vec3 uMoonDir;
      uniform vec3 uMoonColor;
      uniform float uMoonIntensity;
      uniform float uStarVisibility;

      varying vec3 vWorldDir;

      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float noise2D(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbmMist(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 3; i++) {
          v += amp * noise2D(p);
          p *= 2.07;
          amp *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, -0.25, 1.0);
        float hPos = max(0.0, h);

        // Zenith -> Mid -> Glowing Horizon Atmospheric Gradient
        vec3 col = mix(uSkyHorizon, uSkyMid, smoothstep(0.0, 0.26, hPos));
        col = mix(col, uSkyZenith, smoothstep(0.22, 0.85, hPos));

        // Soft warm/cool Mie scattering glow around sun
        float sunCos = max(0.0, dot(dir, normalize(uSunDir)));
        float sunHalo = pow(sunCos, 6.0) * 0.42 + pow(sunCos, 36.0) * 0.55;
        float horizonBoost = 1.0 - smoothstep(0.0, 0.42, hPos);
        col += uSunColor * sunHalo * uSunIntensity * (0.65 + 0.55 * horizonBoost);

        // Soft lunar halo glow
        float moonCos = max(0.0, dot(dir, normalize(uMoonDir)));
        float moonHalo = pow(moonCos, 16.0) * 0.25 + pow(moonCos, 90.0) * 0.45;
        col += uMoonColor * moonHalo * uMoonIntensity;

        // Subtle drifting evening/dawn horizon mist & soft cloud wisps
        if (hPos > 0.005 && hPos < 0.48) {
          float angle = atan(dir.x, -dir.z);
          vec2 cloudUv = vec2(angle * 3.2 + uTime * 0.012, hPos * 9.5);
          float mist = fbmMist(cloudUv);
          float bandMask = smoothstep(0.02, 0.14, hPos) * (1.0 - smoothstep(0.18, 0.45, hPos));
          col = mix(col, uCloudTint, smoothstep(0.45, 0.85, mist) * bandMask * 0.28);
        }

        // Procedural twinkling starfield in upper evening/night hemisphere
        if (uStarVisibility > 0.01 && hPos > 0.04) {
          vec2 starGrid = vec2(atan(dir.x, -dir.z) * 42.0, asin(clamp(dir.y, -1.0, 1.0)) * 42.0);
          vec2 cell = floor(starGrid);
          vec2 local = fract(starGrid) - 0.5;
          float rnd = hash21(cell);
          if (rnd > 0.915) {
            vec2 offset = vec2(hash21(cell + 13.7), hash21(cell + 29.3)) - 0.5;
            float d = length(local - offset * 0.65);
            float twinkle = 0.62 + 0.38 * sin(uTime * (1.8 + rnd * 3.5) + rnd * 62.8);
            float starBright = smoothstep(0.16, 0.01, d) * twinkle * smoothstep(0.04, 0.25, hPos);
            col += mix(vec3(0.82, 0.9, 1.0), vec3(1.0, 0.92, 0.86), fract(rnd * 31.7)) * starBright * uStarVisibility * 1.15;
          }
        }

        // Blend seamlessly below horizon toward deep horizon mist
        if (h < 0.0) {
          col = mix(uSkyHorizon, uSkyMid * 0.5, smoothstep(0.0, -0.25, h));
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.position.y = WATER_SURFACE_Y;
  skyMesh.renderOrder = -10;
  rootGroup.add(skyMesh);

  // ==================== 2. SUN & MOON CELESTIAL BODIES ====================
  const sunGlowTex = createRadialGlowTexture('rgba(255,250,220,0.95)', 'rgba(251,146,60,0.42)');
  const moonGlowTex = createRadialGlowTexture('rgba(241,245,249,0.88)', 'rgba(147,197,253,0.34)');
  const moonSurfaceTex = createMoonSurfaceTexture(maxAnisotropy);

  const sunGroup = new THREE.Group();
  const sunGeo = new THREE.SphereGeometry(1.45, 28, 20);
  const sunMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fffbeb'),
    fog: false,
  });
  const sunCoreMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunCoreMesh);

  const sunHaloMat = new THREE.SpriteMaterial({
    map: sunGlowTex,
    color: new THREE.Color('#fdba74'),
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const sunHaloSprite = new THREE.Sprite(sunHaloMat);
  sunHaloSprite.scale.set(9.5, 9.5, 1);
  sunGroup.add(sunHaloSprite);
  rootGroup.add(sunGroup);

  const moonGroup = new THREE.Group();
  const moonGeo = new THREE.SphereGeometry(1.18, 28, 20);
  const moonMat = new THREE.MeshStandardMaterial({
    map: moonSurfaceTex,
    color: new THREE.Color('#f1f5f9'),
    emissive: new THREE.Color('#94a3b8'),
    emissiveMap: moonSurfaceTex,
    emissiveIntensity: 0.85,
    roughness: 0.88,
    metalness: 0.0,
    fog: false,
  });
  const moonCoreMesh = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moonCoreMesh);

  const moonHaloMat = new THREE.SpriteMaterial({
    map: moonGlowTex,
    color: new THREE.Color('#bae6fd'),
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const moonHaloSprite = new THREE.Sprite(moonHaloMat);
  moonHaloSprite.scale.set(7.5, 7.5, 1);
  moonGroup.add(moonHaloSprite);
  rootGroup.add(moonGroup);

  // ==================== 3. REFLECTIVE LOTUS POND WATER SURFACE ====================
  const waterGeo = new THREE.PlaneGeometry(132, 132, 96, 96);
  waterGeo.rotateX(-Math.PI / 2);

  const waterUniforms = {
    uTime: { value: 0 },
    uHoverMix: { value: 0 },
    uPointerOffset: { value: new THREE.Vector2(0, 0) },
    uWaterDeep: { value: snapshot.waterDeep },
    uWaterShallow: { value: snapshot.waterShallow },
    uSkyHorizon: { value: snapshot.skyHorizon },
    uSkyMid: { value: snapshot.skyMid },
    uSunDir: { value: snapshot.sunDir },
    uSunColor: { value: snapshot.sunColor },
    uSunIntensity: { value: snapshot.sunIntensity },
    uMoonDir: { value: snapshot.moonDir },
    uMoonColor: { value: snapshot.moonColor },
    uMoonIntensity: { value: snapshot.moonIntensity },
  };

  const waterMat = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    transparent: false,
    vertexShader: `
      uniform float uTime;
      uniform float uHoverMix;
      varying vec3 vWorldPos;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        float dist = length(worldPos.xz);

        // Gentle concentric lotus ripple + broad slow pond swell
        float lotusRipple = sin(dist * 5.2 - uTime * 2.0) * 0.018 * exp(-dist * 0.22);
        float swell = sin(worldPos.x * 0.45 + uTime * 0.85) * cos(worldPos.z * 0.4 - uTime * 0.72) * 0.025;
        worldPos.y += (lotusRipple + swell) * (1.0 + uHoverMix * 0.35);

        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uHoverMix;
      uniform vec2 uPointerOffset;
      uniform vec3 uWaterDeep;
      uniform vec3 uWaterShallow;
      uniform vec3 uSkyHorizon;
      uniform vec3 uSkyMid;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uSunIntensity;
      uniform vec3 uMoonDir;
      uniform vec3 uMoonColor;
      uniform float uMoonIntensity;

      varying vec3 vWorldPos;

      // Analytical surface height for crisp multi-frequency water normals
      float waveHeight(vec2 p) {
        float dist = length(p);
        float hoverMul = 1.0 + 0.42 * uHoverMix;

        // Concentric ripples radiating outward from the floating lotus
        float radial = sin(dist * 7.5 - uTime * (2.2 + 0.9 * uHoverMix)) * exp(-dist * 0.28) * 0.022 * hoverMul;

        // Secondary delicate pointer ripple when hovering over the pond
        vec2 pDiff = p - uPointerOffset * 2.4;
        float pDist = length(pDiff);
        float hoverRipple = sin(pDist * 10.5 - uTime * 3.6) * exp(-pDist * 0.75) * 0.014 * uHoverMix;

        // Layered intersecting breeze wavelets across the pond surface
        float w1 = sin(p.x * 1.45 + p.y * 0.95 + uTime * 1.15) * 0.016;
        float w2 = cos(p.x * 2.3 - p.y * 1.85 - uTime * 1.45) * 0.011;
        float w3 = sin(p.x * 4.4 + p.y * 3.6 + uTime * 2.1) * 0.0055;

        return radial + hoverRipple + w1 + w2 + w3;
      }

      void main() {
        vec2 p = vWorldPos.xz;
        float dist = length(p);

        // Finite difference normal from analytical wave height
        float eps = 0.045;
        float hC = waveHeight(p);
        float hX = waveHeight(p + vec2(eps, 0.0));
        float hZ = waveHeight(p + vec2(0.0, eps));
        vec3 N = normalize(vec3(hC - hX, eps * 1.35, hC - hZ));

        vec3 V = normalize(cameraPosition - vWorldPos);
        float NdotV = clamp(dot(N, V), 0.0, 1.0);

        // Schlick Fresnel for realistic water reflectivity from overhead vs horizon angles
        float fresnel = 0.04 + 0.96 * pow(1.0 - NdotV, 4.2);

        // Sky reflection tint blending horizon warmth and mid-sky zenith
        vec3 R = reflect(-V, N);
        float reflElev = clamp(R.y, 0.0, 1.0);
        vec3 skyRefl = mix(uSkyHorizon, uSkyMid, smoothstep(0.0, 0.42, reflElev));

        // Base pond water depth gradient (translucent near lotus, deeper outward)
        float shallowMask = exp(-dist * 0.14);
        vec3 waterBody = mix(uWaterDeep, uWaterShallow, shallowMask * 0.78);

        // Soft botanical pink & cyan reflection bounce directly around the floating flower
        float auraDist = exp(-dist * 0.55);
        waterBody += vec3(0.18, 0.05, 0.12) * auraDist * 0.35;
        waterBody += vec3(0.03, 0.14, 0.24) * exp(-abs(dist - 1.95) * 1.8) * (0.28 + 0.22 * uHoverMix);

        vec3 col = mix(waterBody, skyRefl, fresnel * 0.82);

        // Soft ambient darkening right beneath the lily pad so lotus rests solidly on water
        float padShadow = 1.0 - 0.52 * exp(-(dist * dist) / 2.25);
        col *= padShadow;

        // Shimmering specular Sun reflection path across wave crests
        if (uSunIntensity > 0.02) {
          vec3 sDir = normalize(vec3(uSunDir.x, max(0.03, uSunDir.y), uSunDir.z));
          vec3 Hsun = normalize(sDir + V);
          float specCore = pow(max(0.0, dot(N, Hsun)), 150.0);
          float specGlitter = pow(max(0.0, dot(N, Hsun)), 26.0) * 0.28;
          col += uSunColor * (specCore * 1.65 + specGlitter) * uSunIntensity;
        }

        // Cool shimmering Silver Moonbeam reflection track at night/dusk/dawn
        if (uMoonIntensity > 0.02) {
          vec3 mDir = normalize(vec3(uMoonDir.x, max(0.04, uMoonDir.y), uMoonDir.z));
          vec3 Hmoon = normalize(mDir + V);
          float mSpec = pow(max(0.0, dot(N, Hmoon)), 110.0);
          float mTrail = pow(max(0.0, dot(N, Hmoon)), 18.0) * 0.22;
          col += uMoonColor * (mSpec * 1.25 + mTrail) * uMoonIntensity;
        }

        // Horizon atmospheric mist dissolve so distant water seamlessly meets the horizon sky
        float horizonFog = smoothstep(14.0, 56.0, dist);
        col = mix(col, uSkyHorizon, horizonFog);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = WATER_SURFACE_Y;
  waterMesh.receiveShadow = true;
  rootGroup.add(waterMesh);

  // ==================== 4. FLOATING COMPANION LILY PADS ====================
  const companionGeo = createLilyPadGeometry(0.68);
  const companionSpecs = [
    { x: -2.45, z: -1.45, scale: 1.0, rot: 1.25, phase: 0.4 },
    { x: 2.35, z: 1.15, scale: 0.82, rot: -1.85, phase: 2.1 },
    { x: -1.85, z: 2.1, scale: 0.65, rot: 2.75, phase: 3.9 },
  ];
  const companionPads = companionSpecs.map((spec) => {
    const mesh = new THREE.Mesh(companionGeo, lilyPadMaterial);
    mesh.position.set(spec.x, WATER_SURFACE_Y + 0.015, spec.z);
    mesh.scale.setScalar(spec.scale);
    mesh.rotation.y = spec.rot;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);
    return {
      mesh,
      baseY: WATER_SURFACE_Y + 0.015,
      phase: spec.phase,
      baseRot: spec.rot,
    };
  });

  return {
    rootGroup,
    skyMesh,
    waterMesh,
    sunGroup,
    sunCoreMesh,
    sunHaloSprite,
    moonGroup,
    moonCoreMesh,
    moonHaloSprite,
    companionPads,
    update: (bloomFactor, elapsed, hoverMix, pointerX, pointerY, reducedMotion) => {
      const b = Math.max(0, Math.min(1, bloomFactor));

      // Locate surrounding keyframe pair
      let k0 = KEYFRAMES[0];
      let k1 = KEYFRAMES[KEYFRAMES.length - 1];
      for (let i = 0; i < KEYFRAMES.length - 1; i++) {
        if (b >= KEYFRAMES[i].stop && b <= KEYFRAMES[i + 1].stop) {
          k0 = KEYFRAMES[i];
          k1 = KEYFRAMES[i + 1];
          break;
        }
      }

      const span = Math.max(0.0001, k1.stop - k0.stop);
      const rawT = Math.max(0, Math.min(1, (b - k0.stop) / span));
      // Smooth Hermite step for lush organic dusk/dawn transitions
      const t = rawT * rawT * (3 - 2 * rawT);

      snapshot.skyZenith.copy(k0.zenith).lerp(k1.zenith, t);
      snapshot.skyMid.copy(k0.mid).lerp(k1.mid, t);
      snapshot.skyHorizon.copy(k0.horizon).lerp(k1.horizon, t);
      snapshot.waterDeep.copy(k0.waterDeep).lerp(k1.waterDeep, t);
      snapshot.waterShallow.copy(k0.waterShallow).lerp(k1.waterShallow, t);
      snapshot.sunColor.copy(k0.sunColor).lerp(k1.sunColor, t);
      snapshot.moonColor.copy(k0.moonColor).lerp(k1.moonColor, t);
      snapshot.cloudTint.copy(k0.cloudTint).lerp(k1.cloudTint, t);
      snapshot.hemiSky.copy(k0.hemiSky).lerp(k1.hemiSky, t);
      snapshot.hemiGround.copy(k0.hemiGround).lerp(k1.hemiGround, t);
      snapshot.keyLightColor.copy(k0.keyColor).lerp(k1.keyColor, t);
      snapshot.rimLightColor.copy(k0.rimColor).lerp(k1.rimColor, t);
      snapshot.fillLightColor.copy(k0.fillColor).lerp(k1.fillColor, t);

      snapshot.sunIntensity = THREE.MathUtils.lerp(k0.sunIntensity, k1.sunIntensity, t);
      snapshot.moonIntensity = THREE.MathUtils.lerp(k0.moonIntensity, k1.moonIntensity, t);
      snapshot.starVisibility = THREE.MathUtils.lerp(k0.starVisibility, k1.starVisibility, t);
      snapshot.hemiIntensity = THREE.MathUtils.lerp(k0.hemiIntensity, k1.hemiIntensity, t);
      snapshot.keyLightIntensity = THREE.MathUtils.lerp(k0.keyIntensity, k1.keyIntensity, t);
      snapshot.rimLightIntensity = THREE.MathUtils.lerp(k0.rimIntensity, k1.rimIntensity, t);
      snapshot.fillLightIntensity = THREE.MathUtils.lerp(k0.fillIntensity, k1.fillIntensity, t);
      snapshot.fogDensity = THREE.MathUtils.lerp(k0.fogDensity, k1.fogDensity, t);
      snapshot.exposure = THREE.MathUtils.lerp(k0.exposure, k1.exposure, t);

      const sunEl = THREE.MathUtils.lerp(k0.sunElevation, k1.sunElevation, t);
      const sunAz = THREE.MathUtils.lerp(k0.sunAzimuth, k1.sunAzimuth, t);
      const moonEl = THREE.MathUtils.lerp(k0.moonElevation, k1.moonElevation, t);
      const moonAz = THREE.MathUtils.lerp(k0.moonAzimuth, k1.moonAzimuth, t);

      azElToVec3(sunAz, sunEl, snapshot.sunDir);
      azElToVec3(moonAz, moonEl, snapshot.moonDir);

      // Place Sun & Moon celestial meshes cleanly above horizon sky sphere
      sunGroup.position.copy(snapshot.sunDir).multiplyScalar(CELESTIAL_ARC_DIST);
      sunGroup.position.y += WATER_SURFACE_Y;
      sunGroup.visible = sunEl > -0.14;
      sunMat.color.copy(snapshot.sunColor);
      sunHaloMat.color.copy(snapshot.sunColor);
      sunHaloMat.opacity = Math.max(0.05, snapshot.sunIntensity * 0.85);

      moonGroup.position.copy(snapshot.moonDir).multiplyScalar(CELESTIAL_ARC_DIST);
      moonGroup.position.y += WATER_SURFACE_Y;
      moonGroup.visible = moonEl > -0.12;
      moonMat.emissive.copy(snapshot.moonColor);
      moonMat.emissiveIntensity = 0.45 + snapshot.moonIntensity * 0.65;
      moonHaloMat.color.copy(snapshot.moonColor);
      moonHaloMat.opacity = Math.max(0.05, snapshot.moonIntensity * 0.72);

      // Update GLSL Sky & Water uniforms
      skyUniforms.uTime.value = elapsed;
      skyUniforms.uSunIntensity.value = snapshot.sunIntensity;
      skyUniforms.uMoonIntensity.value = snapshot.moonIntensity;
      skyUniforms.uStarVisibility.value = snapshot.starVisibility;

      waterUniforms.uTime.value = elapsed;
      waterUniforms.uHoverMix.value = hoverMix;
      waterUniforms.uPointerOffset.value.set(pointerX, pointerY);
      waterUniforms.uSunIntensity.value = snapshot.sunIntensity;
      waterUniforms.uMoonIntensity.value = snapshot.moonIntensity;

      // Gentle buoyant water bobbing on companion lily pads
      companionPads.forEach((pad) => {
        if (reducedMotion) {
          pad.mesh.position.y = pad.baseY;
          pad.mesh.rotation.y = pad.baseRot;
          return;
        }
        pad.mesh.position.y = pad.baseY + Math.sin(elapsed * 1.35 + pad.phase) * 0.016;
        pad.mesh.rotation.x = Math.sin(elapsed * 0.9 + pad.phase) * 0.025;
        pad.mesh.rotation.z = Math.cos(elapsed * 0.85 + pad.phase) * 0.025;
      });

      const meta = getPhaseMetadata(b);
      snapshot.id = meta.id;
      snapshot.label = meta.label;
      snapshot.windowLabel = meta.windowLabel;

      return snapshot;
    },
    dispose: () => {
      skyGeo.dispose();
      skyMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
      sunGeo.dispose();
      sunMat.dispose();
      sunHaloMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      moonHaloMat.dispose();
      companionGeo.dispose();
      sunGlowTex.dispose();
      moonGlowTex.dispose();
      moonSurfaceTex.dispose();
    },
  };
}
