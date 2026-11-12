import * as THREE from 'three';

export type MorphStateId = 'proxmox' | 'databricks' | 'k3s' | 'fituc';

export const MORPH_STATES: MorphStateId[] = ['proxmox', 'databricks', 'k3s', 'fituc'];

interface SurfacePoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Evaluate one of 4 closed parametric (u in [0, 2π], v in [0, π]) surfaces.
 * Every state shares exact vertex indexing and integer periodicity in `u` plus
 * polar collapse sin(v) in X/Z so hardware morphTarget blending stays smooth and watertight.
 */
function evaluateSurface(state: MorphStateId, u: number, v: number, out: SurfacePoint): void {
  const sinV = Math.sin(v);
  const cosV = Math.cos(v);
  const sinU = Math.sin(u);
  const cosU = Math.cos(u);

  const sx = sinV * cosU;
  const sy = cosV;
  const sz = sinV * sinU;

  if (state === 'proxmox') {
    // Superellipsoid Monolith with machined vertical rack channels & chamfered shoulders
    const p = 3.8;
    const norm = Math.pow(
      Math.pow(Math.abs(sx), p) + Math.pow(Math.abs(sy), p) + Math.pow(Math.abs(sz), p) + 1e-6,
      1 / p
    );
    const inv = 1 / norm;
    const groove = 1 + 0.032 * Math.cos(12 * u) * Math.pow(sinV, 1.5) - 0.025 * Math.pow(Math.cos(6 * v), 8);
    const scale = 1.16 * inv * groove;
    out.x = sx * scale;
    out.y = sy * scale * 1.06;
    out.z = sz * scale;
    return;
  }

  if (state === 'databricks') {
    // High-throughput Biconcave Accelerator Toroid with helical data-stream ridges
    const ridge = 0.065 * Math.sin(3 * u + 4 * v) + 0.035 * Math.cos(6 * u - 2 * v);
    const radial = (0.48 + 1.02 * Math.pow(sinV, 1.45) + ridge) * sinV;
    const heightEnvelope = 0.34 + 0.32 * Math.pow(sinV, 0.85) + 0.06 * Math.cos(3 * u);
    out.x = radial * cosU;
    out.y = cosV * heightEnvelope;
    out.z = radial * sinU;
    return;
  }

  if (state === 'k3s') {
    // 6-Lobed Hexagonal Quorum Cluster Manifold (3 master upper ribs + 3 worker lower ribs)
    const hexLobe = 0.34 * Math.cos(6 * u) * Math.pow(sinV, 2.2);
    const staggeredTri = 0.16 * Math.cos(3 * u) * Math.sin(2 * v);
    const waist = -0.14 * Math.cos(4 * v);
    const r = (1.14 + hexLobe + staggeredTri + waist) * (1 + 0.022 * Math.sin(12 * v));
    out.x = sx * r;
    out.y = sy * r * 0.94;
    out.z = sz * r;
    return;
  }

  // 'fituc': Organic Tri-Harmonic Wave Field (cross-platform streaming & analytics ripple)
  const harmonicA = 0.24 * Math.sin(3 * u) * Math.sin(4 * v);
  const harmonicB = 0.14 * Math.cos(5 * v + 2 * u) * Math.pow(sinV, 1.2);
  const r = 1.18 + harmonicA + harmonicB;
  out.x = sx * r;
  out.y = sy * r;
  out.z = sz * r;
}

const _pCenter: SurfacePoint = { x: 0, y: 0, z: 0 };
const _pU: SurfacePoint = { x: 0, y: 0, z: 0 };
const _pV: SurfacePoint = { x: 0, y: 0, z: 0 };

function computeSurfaceNormal(
  state: MorphStateId,
  u: number,
  v: number,
  outNormal: THREE.Vector3
): void {
  const eps = 0.0025;
  if (v < 0.004) {
    outNormal.set(0, 1, 0);
    return;
  }
  if (v > Math.PI - 0.004) {
    outNormal.set(0, -1, 0);
    return;
  }

  evaluateSurface(state, u, v, _pCenter);
  evaluateSurface(state, u + eps, v, _pU);
  evaluateSurface(state, u, Math.min(Math.PI - 0.001, v + eps), _pV);

  const dux = _pU.x - _pCenter.x;
  const duy = _pU.y - _pCenter.y;
  const duz = _pU.z - _pCenter.z;

  const dvx = _pV.x - _pCenter.x;
  const dvy = _pV.y - _pCenter.y;
  const dvz = _pV.z - _pCenter.z;

  // Cross product dV x dU points strictly outward on right-handed spherical (u, v)
  const nx = dvy * duz - dvz * duy;
  const ny = dvz * dux - dvx * duz;
  const nz = dvx * duy - dvy * dux;
  outNormal.set(nx, ny, nz);

  if (outNormal.lengthSq() < 1e-10) {
    outNormal.set(_pCenter.x, _pCenter.y, _pCenter.z);
  }
  outNormal.normalize();
}

/**
 * Generates the shared-topology base BufferGeometry (State 0: 'proxmox')
 * populated with morphAttributes.position + morphAttributes.normal for States 1..3.
 * Used identically by both the PBR core mesh and the synchronized holographic wireframe shell.
 */
export function createMorphCoreGeometry(
  uSegments = 76,
  vSegments = 54
): THREE.BufferGeometry {
  const cols = uSegments + 1;
  const rows = vSegments + 1;
  const vertCount = cols * rows;

  const basePos = new Float32Array(vertCount * 3);
  const baseNorm = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);

  const morphTargets = MORPH_STATES.slice(1).map(() => ({
    pos: new Float32Array(vertCount * 3),
    norm: new Float32Array(vertCount * 3),
  }));

  const tmpPt: SurfacePoint = { x: 0, y: 0, z: 0 };
  const tmpNorm = new THREE.Vector3();

  let idx3 = 0;
  let idx2 = 0;

  for (let iv = 0; iv <= vSegments; iv++) {
    const vFrac = iv / vSegments;
    const v = vFrac * Math.PI;

    for (let iu = 0; iu <= uSegments; iu++) {
      const uFrac = iu / uSegments;
      const u = uFrac * Math.PI * 2;

      uvs[idx2] = uFrac;
      uvs[idx2 + 1] = 1 - vFrac;

      // Base state (index 0: 'proxmox')
      evaluateSurface(MORPH_STATES[0], u, v, tmpPt);
      computeSurfaceNormal(MORPH_STATES[0], u, v, tmpNorm);
      basePos[idx3] = tmpPt.x;
      basePos[idx3 + 1] = tmpPt.y;
      basePos[idx3 + 2] = tmpPt.z;
      baseNorm[idx3] = tmpNorm.x;
      baseNorm[idx3 + 1] = tmpNorm.y;
      baseNorm[idx3 + 2] = tmpNorm.z;

      // Morph targets 0..2 ('databricks', 'k3s', 'fituc')
      for (let m = 0; m < morphTargets.length; m++) {
        const state = MORPH_STATES[m + 1];
        evaluateSurface(state, u, v, tmpPt);
        computeSurfaceNormal(state, u, v, tmpNorm);
        morphTargets[m].pos[idx3] = tmpPt.x;
        morphTargets[m].pos[idx3 + 1] = tmpPt.y;
        morphTargets[m].pos[idx3 + 2] = tmpPt.z;
        morphTargets[m].norm[idx3] = tmpNorm.x;
        morphTargets[m].norm[idx3 + 1] = tmpNorm.y;
        morphTargets[m].norm[idx3 + 2] = tmpNorm.z;
      }

      idx3 += 3;
      idx2 += 2;
    }
  }

  const indices: number[] = [];
  for (let iv = 0; iv < vSegments; iv++) {
    for (let iu = 0; iu < uSegments; iu++) {
      const a = iv * cols + iu;
      const b = a + cols;
      const c = a + cols + 1;
      const d = a + 1;

      if (iv !== 0) indices.push(a, b, d);
      if (iv !== vSegments - 1) indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(basePos, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(baseNorm, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  geometry.morphAttributes.position = morphTargets.map(
    (t) => new THREE.BufferAttribute(t.pos, 3)
  );
  geometry.morphAttributes.normal = morphTargets.map(
    (t) => new THREE.BufferAttribute(t.norm, 3)
  );

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Generates machined Chamfered Gimbal Rings via LatheGeometry with crisp step bevels.
 */
export function createMachinedRingGeometry(
  innerR: number,
  outerR: number,
  halfHeight: number,
  segments = 72
): THREE.LatheGeometry {
  const bevel = Math.min(0.018, (outerR - innerR) * 0.25);
  const profile: THREE.Vector2[] = [
    new THREE.Vector2(innerR, -halfHeight + bevel),
    new THREE.Vector2(innerR + bevel, -halfHeight),
    new THREE.Vector2(outerR - bevel, -halfHeight),
    new THREE.Vector2(outerR, -halfHeight + bevel),
    new THREE.Vector2(outerR, halfHeight - bevel),
    new THREE.Vector2(outerR - bevel, halfHeight),
    new THREE.Vector2(innerR + bevel, halfHeight),
    new THREE.Vector2(innerR, halfHeight - bevel),
    new THREE.Vector2(innerR, -halfHeight + bevel),
  ];
  const geo = new THREE.LatheGeometry(profile, segments);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a single composite satellite node rig (3-part procedural assembly:
 * beveled chassis housing + machined collar ring + glowing cyan optic bar).
 */
export function createSatelliteNodeParts(): {
  chassisGeo: THREE.ExtrudeGeometry;
  collarGeo: THREE.CylinderGeometry;
  opticGeo: THREE.BoxGeometry;
} {
  const s = 0.14;
  const bevel = 0.025;
  const hexShape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(angle) * s;
    const y = Math.sin(angle) * s;
    if (i === 0) hexShape.moveTo(x, y);
    else hexShape.lineTo(x, y);
  }
  hexShape.closePath();

  const chassisGeo = new THREE.ExtrudeGeometry(hexShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  chassisGeo.center();

  const collarGeo = new THREE.CylinderGeometry(0.115, 0.125, 0.055, 16);
  const opticGeo = new THREE.BoxGeometry(0.05, 0.032, 0.24);

  return { chassisGeo, collarGeo, opticGeo };
}
