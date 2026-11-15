import * as THREE from 'three';

export type MorphStateId = 'proxmox' | 'databricks' | 'k3s' | 'fituc';

export const MORPH_STATES: MorphStateId[] = ['proxmox', 'databricks', 'k3s', 'fituc'];

export interface LotusPetalAssembly {
  lotusGroup: THREE.Group;
  outerPetalPivots: THREE.Group[];
  midPetalPivots: THREE.Group[];
  innerPetalPivots: THREE.Group[];
  greenPetalPivots: THREE.Group[];
  stamenGroup: THREE.Group;
  stamenMesh: THREE.InstancedMesh;
  receptacleMesh: THREE.Mesh;
  stemMesh: THREE.Mesh;
  lilyPadMesh: THREE.Mesh;
  petalMeshes: THREE.Mesh[];
  wireframeMeshes: THREE.Mesh[];
  disposables: THREE.BufferGeometry[];
}

/**
 * Procedural sculpted double-curved 3D Lotus Petal geometry.
 * Plump curved profile that arches gently outward from the base and cups gracefully
 * UPWARD toward a tapered lotus tip — never drooping downward like spikes.
 */
export function createPetalGeometry(
  length = 1.55,
  maxWidth = 0.68,
  outwardBelly = 0.16,
  upwardCup = 0.28,
  transverseCup = 0.20,
  uSegments = 18,
  vSegments = 26
): THREE.BufferGeometry {
  const cols = uSegments + 1;
  const rows = vSegments + 1;
  const vertCount = cols * rows;

  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);

  let idx3 = 0;
  let idx2 = 0;

  for (let iv = 0; iv <= vSegments; iv++) {
    const v = iv / vSegments; // 0 at hinge base, 1 at tip

    // Classic plump lotus petal silhouette: fuller middle, graceful pointed tip
    const sinProfile = Math.sin(Math.pow(v, 0.85) * Math.PI);
    const widthEnvelope = Math.pow(sinProfile, 0.62) * (1.0 - 0.12 * v);
    const halfW = maxWidth * 0.5 * widthEnvelope;

    // Longitudinal curvature along Y/Z:
    // +Z is outward away from center; -Z is inward back toward flower center (upward cup).
    // Belly slightly outward near v=0.35, then curve gracefully inward/upward toward tip v=1.0
    const y = v * length;
    const belly = Math.sin(v * Math.PI * 0.9) * outwardBelly * length;
    const tipInwardCup = Math.pow(v, 1.95) * upwardCup * length;
    const zBase = belly - tipInwardCup;

    for (let iu = 0; iu <= uSegments; iu++) {
      const uNorm = (iu / uSegments) * 2 - 1; // -1 to +1
      const x = uNorm * halfW;

      // Concave spoon cupping across petal width (bowed outward in center so inside faces center)
      const cup = (1.0 - uNorm * uNorm) * transverseCup * widthEnvelope;
      const z = zBase + cup;

      positions[idx3] = x;
      positions[idx3 + 1] = y;
      positions[idx3 + 2] = z;

      uvs[idx2] = (uNorm + 1) * 0.5;
      uvs[idx2 + 1] = v;

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

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Creates a broad sculptural green lotus lily-pad leaf geometry with classic V-notch and gentle wave.
 */
export function createLilyPadGeometry(radius = 1.65): THREE.BufferGeometry {
  const segments = 56;
  const rings = 12;
  const notchAngle = 0.34; // Classic V-notch opening
  const maxAngle = Math.PI * 2 - notchAngle;

  const cols = segments + 1;
  const rows = rings + 1;
  const vertCount = cols * rows;

  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);

  let idx3 = 0;
  let idx2 = 0;

  for (let ir = 0; ir <= rings; ir++) {
    const rFrac = ir / rings;
    const r = rFrac * radius;

    for (let is = 0; is <= segments; is++) {
      const sFrac = is / segments;
      const angle = notchAngle * 0.5 + sFrac * maxAngle;

      // Subtle botanical rim undulation
      const rimWave = Math.sin(angle * 7.0) * 0.045 * Math.pow(rFrac, 2.2);
      const cupLip = Math.pow(rFrac, 3.2) * 0.09;

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = rimWave + cupLip;

      positions[idx3] = x;
      positions[idx3 + 1] = y;
      positions[idx3 + 2] = z;

      uvs[idx2] = (x / (radius * 2)) + 0.5;
      uvs[idx2 + 1] = (z / (radius * 2)) + 0.5;

      idx3 += 3;
      idx2 += 2;
    }
  }

  const indices: number[] = [];
  for (let ir = 0; ir < rings; ir++) {
    for (let is = 0; is < segments; is++) {
      const a = ir * cols + is;
      const b = a + cols;
      const c = a + cols + 1;
      const d = a + 1;

      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Creates a single delicate notched baby-pink Cherry Blossom (Sakura) petal BufferGeometry
 * with the signature soft heart-shaped notch at its outer tip.
 */
export function createSingleSakuraPetalGeometry(
  length = 0.13,
  width = 0.095
): THREE.BufferGeometry {
  const uSegs = 8;
  const vSegs = 10;
  const cols = uSegs + 1;
  const rows = vSegs + 1;
  const vertCount = cols * rows;

  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);

  let idx3 = 0;
  let idx2 = 0;

  for (let iv = 0; iv <= vSegs; iv++) {
    const v = iv / vSegs;
    // Swells wide near outer third (v ~ 0.72), narrow at base
    const wEnv = Math.sin(Math.pow(v, 0.65) * Math.PI * 0.92);
    const halfW = width * 0.5 * wEnv;

    for (let iu = 0; iu <= uSegs; iu++) {
      const uNorm = (iu / uSegs) * 2 - 1;
      const x = uNorm * halfW;

      // Signature sakura V-notch at tip center (uNorm near 0, v near 1)
      const notchDepth = Math.exp(-uNorm * uNorm * 14.0) * Math.pow(v, 5.0) * 0.24 * length;
      const z = v * length - notchDepth;
      // Gentle cupped upward bowl curve
      const y = (1.0 - uNorm * uNorm) * 0.015 * wEnv + Math.sin(v * Math.PI) * 0.018;

      positions[idx3] = x;
      positions[idx3 + 1] = y;
      positions[idx3 + 2] = z;

      uvs[idx2] = (uNorm + 1) * 0.5;
      uvs[idx2 + 1] = v;

      idx3 += 3;
      idx2 += 2;
    }
  }

  const indices: number[] = [];
  for (let iv = 0; iv < vSegs; iv++) {
    for (let iu = 0; iu < uSegs; iu++) {
      const a = iv * cols + iu;
      const b = a + cols;
      const c = a + cols + 1;
      const d = a + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Merges 5 sculpted notched Sakura petals radially into a complete 3D Cherry Blossom flower geometry.
 */
export function createCherryBlossomGeometry(petalLength = 0.14): THREE.BufferGeometry {
  const singlePetal = createSingleSakuraPetalGeometry(petalLength, petalLength * 0.8);
  const posAttr = singlePetal.getAttribute('position') as THREE.BufferAttribute;
  const uvAttr = singlePetal.getAttribute('uv') as THREE.BufferAttribute;
  const indexAttr = singlePetal.getIndex()!;

  const vertPerPetal = posAttr.count;
  const idxPerPetal = indexAttr.count;
  const petalCount = 5;

  const totalPos = new Float32Array(vertPerPetal * petalCount * 3);
  const totalUv = new Float32Array(vertPerPetal * petalCount * 2);
  const totalIdx = new Uint16Array(idxPerPetal * petalCount);

  const tmpVec = new THREE.Vector3();
  const rotMat = new THREE.Matrix4();
  const tiltMat = new THREE.Matrix4().makeRotationX(-0.32); // Cup petals upward cleanly
  const transMat = new THREE.Matrix4().makeTranslation(0, 0, 0.012);

  for (let p = 0; p < petalCount; p++) {
    const angle = (p / petalCount) * Math.PI * 2;
    rotMat.makeRotationY(angle).multiply(tiltMat).multiply(transMat);

    const vOffset3 = p * vertPerPetal * 3;
    const vOffset2 = p * vertPerPetal * 2;
    const vBase = p * vertPerPetal;

    for (let i = 0; i < vertPerPetal; i++) {
      tmpVec.fromBufferAttribute(posAttr, i).applyMatrix4(rotMat);
      totalPos[vOffset3 + i * 3] = tmpVec.x;
      totalPos[vOffset3 + i * 3 + 1] = tmpVec.y;
      totalPos[vOffset3 + i * 3 + 2] = tmpVec.z;

      totalUv[vOffset2 + i * 2] = uvAttr.getX(i);
      totalUv[vOffset2 + i * 2 + 1] = uvAttr.getY(i);
    }

    const iOffset = p * idxPerPetal;
    for (let i = 0; i < idxPerPetal; i++) {
      totalIdx[iOffset + i] = indexAttr.getX(i) + vBase;
    }
  }

  singlePetal.dispose();

  const blossomGeo = new THREE.BufferGeometry();
  blossomGeo.setIndex(new THREE.BufferAttribute(totalIdx, 1));
  blossomGeo.setAttribute('position', new THREE.BufferAttribute(totalPos, 3));
  blossomGeo.setAttribute('uv', new THREE.BufferAttribute(totalUv, 2));
  blossomGeo.computeVertexNormals();
  blossomGeo.computeBoundingBox();
  blossomGeo.computeBoundingSphere();

  return blossomGeo;
}

/**
 * Builds the complete multi-tier procedural 3D Blooming Pink Lotus with Green Petals/Lily Pad:
 * - 10 Outer Pink Petals (Tier 1)
 * - 8 Middle Pink Petals (Tier 2, staggered)
 * - 6 Inner Pink Corolla Petals (Tier 3)
 * - 8 Green Outer Calyx Petals cradling the flower base
 * - Broad notched Green Lily Pad leaf resting below
 * - Golden-green Seedpod Receptacle + 36 Golden Stamen filaments
 * - Botanical green stem
 */
export function createLotusFlowerAssembly(
  petalMaterial: THREE.Material,
  wireMaterial: THREE.Material,
  greenPetalMaterial: THREE.Material,
  stamenMaterial: THREE.Material,
  receptacleMaterial: THREE.Material,
  stemMaterial: THREE.Material,
  lilyPadMaterial: THREE.Material
): LotusPetalAssembly {
  const lotusGroup = new THREE.Group();
  lotusGroup.name = 'LotusFlowerAssembly';

  const outerPetalPivots: THREE.Group[] = [];
  const midPetalPivots: THREE.Group[] = [];
  const innerPetalPivots: THREE.Group[] = [];
  const greenPetalPivots: THREE.Group[] = [];
  const petalMeshes: THREE.Mesh[] = [];
  const wireframeMeshes: THREE.Mesh[] = [];
  const disposables: THREE.BufferGeometry[] = [];

  // Cupped upward lotus petal geometries (belly outward near base, cup gracefully inward/upward at tip)
  const outerPetalGeo = createPetalGeometry(1.56, 0.72, 0.18, 0.25, 0.22, 18, 26);
  const midPetalGeo = createPetalGeometry(1.38, 0.62, 0.14, 0.26, 0.20, 16, 22);
  const innerPetalGeo = createPetalGeometry(1.14, 0.50, 0.10, 0.28, 0.18, 14, 20);
  const greenPetalGeo = createPetalGeometry(1.18, 0.52, 0.22, 0.16, 0.14, 14, 18);
  const lilyPadGeo = createLilyPadGeometry(1.75);
  disposables.push(outerPetalGeo, midPetalGeo, innerPetalGeo, greenPetalGeo, lilyPadGeo);

  function mountPetal(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    wireMat: THREE.Material,
    radius: number,
    angle: number,
    baseTiltX: number,
    yOffset = 0,
    scale = 1.0
  ): { pivot: THREE.Group; mesh: THREE.Mesh; wire: THREE.Mesh } {
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius);
    pivot.rotation.y = -angle + Math.PI * 0.5; // +Z points radially outward

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = baseTiltX;
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const wire = new THREE.Mesh(geo, wireMat);
    wire.rotation.copy(mesh.rotation);
    wire.scale.setScalar(scale * 1.003);
    wire.visible = false;

    pivot.add(mesh);
    pivot.add(wire);
    lotusGroup.add(pivot);

    petalMeshes.push(mesh);
    wireframeMeshes.push(wire);

    return { pivot, mesh, wire };
  }

  // 1. Tier 1: 10 Outer Pink Lotus Petals
  const outerCount = 10;
  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2;
    const { pivot } = mountPetal(
      outerPetalGeo,
      petalMaterial,
      wireMaterial,
      0.44,
      angle,
      0.52,
      0.02,
      1.0
    );
    outerPetalPivots.push(pivot);
  }

  // 2. Tier 2: 8 Middle Pink Lotus Petals (staggered)
  const midCount = 8;
  for (let i = 0; i < midCount; i++) {
    const angle = (i / midCount) * Math.PI * 2 + Math.PI / midCount;
    const { pivot } = mountPetal(
      midPetalGeo,
      petalMaterial,
      wireMaterial,
      0.32,
      angle,
      0.34,
      0.06,
      0.96
    );
    midPetalPivots.push(pivot);
  }

  // 3. Tier 3: 6 Inner Pink Corolla Petals
  const innerCount = 6;
  for (let i = 0; i < innerCount; i++) {
    const angle = (i / innerCount) * Math.PI * 2 + Math.PI / 6;
    const { pivot } = mountPetal(
      innerPetalGeo,
      petalMaterial,
      wireMaterial,
      0.20,
      angle,
      0.18,
      0.10,
      0.92
    );
    innerPetalPivots.push(pivot);
  }

  // 4. Tier 4: 8 Botanical Green Outer Petals / Calyx Guard Leaves
  const greenCount = 8;
  for (let i = 0; i < greenCount; i++) {
    const angle = (i / greenCount) * Math.PI * 2 + Math.PI / 8;
    const { pivot } = mountPetal(
      greenPetalGeo,
      greenPetalMaterial,
      wireMaterial,
      0.46,
      angle,
      0.96,
      -0.06,
      0.95
    );
    greenPetalPivots.push(pivot);
  }

  // 5. Central Lotus Seedpod Receptacle (flat-top golden-green chalice pod)
  const receptGeo = new THREE.CylinderGeometry(0.32, 0.16, 0.34, 32);
  const receptacleMesh = new THREE.Mesh(receptGeo, receptacleMaterial);
  receptacleMesh.position.set(0, 0.18, 0);
  receptacleMesh.castShadow = true;
  receptacleMesh.receiveShadow = true;
  lotusGroup.add(receptacleMesh);
  disposables.push(receptGeo);

  // 6. Ring of 36 Golden-Amber Lotus Stamen Filaments
  const stamenCount = 36;
  const stamenGeo = new THREE.CylinderGeometry(0.011, 0.015, 0.38, 8);
  stamenGeo.translate(0, 0.19, 0);
  disposables.push(stamenGeo);

  const stamenMesh = new THREE.InstancedMesh(stamenGeo, stamenMaterial, stamenCount);
  stamenMesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < stamenCount; i++) {
    const angle = (i / stamenCount) * Math.PI * 2;
    const rad = 0.33 + (i % 2) * 0.035;
    dummy.position.set(Math.cos(angle) * rad, 0.18, Math.sin(angle) * rad);
    dummy.rotation.y = -angle + Math.PI * 0.5;
    dummy.rotation.x = 0.22 + (i % 3) * 0.05;
    dummy.scale.set(1, 0.82 + (i % 5) * 0.08, 1);
    dummy.updateMatrix();
    stamenMesh.setMatrixAt(i, dummy.matrix);
  }
  stamenMesh.instanceMatrix.needsUpdate = true;
  const stamenGroup = new THREE.Group();
  stamenGroup.add(stamenMesh);
  lotusGroup.add(stamenGroup);

  // 7. Botanical Green Stem
  const stemGeo = new THREE.CylinderGeometry(0.11, 0.15, 1.85, 24);
  const stemMesh = new THREE.Mesh(stemGeo, stemMaterial);
  stemMesh.position.set(0, -1.0, 0);
  stemMesh.castShadow = true;
  stemMesh.receiveShadow = true;
  lotusGroup.add(stemMesh);
  disposables.push(stemGeo);

  // 8. Sculpted Green Lily Pad Leaf resting at base
  const lilyPadMesh = new THREE.Mesh(lilyPadGeo, lilyPadMaterial);
  lilyPadMesh.position.set(0, -0.78, 0);
  lilyPadMesh.rotation.y = 0.4;
  lilyPadMesh.receiveShadow = true;
  lotusGroup.add(lilyPadMesh);

  return {
    lotusGroup,
    outerPetalPivots,
    midPetalPivots,
    innerPetalPivots,
    greenPetalPivots,
    stamenGroup,
    stamenMesh,
    receptacleMesh,
    stemMesh,
    lilyPadMesh,
    petalMeshes,
    wireframeMeshes,
    disposables,
  };
}

/**
 * Updates blooming unfolding angles so petals open smoothly from a compact rose-pink bud
 * to a graceful chalice-shaped open blossom without ever drooping awkwardly downward.
 */
export function updateLotusBloom(
  assembly: LotusPetalAssembly,
  bloomFactor: number,
  modeWeights: [number, number, number],
  elapsed: number,
  reducedMotion: boolean
): void {
  const isTorus = modeWeights[0];
  const isK3s = modeWeights[1];
  const isFituc = modeWeights[2];

  const breath = reducedMotion ? 0 : Math.sin(elapsed * 1.15) * 0.018;
  const b = Math.max(0, Math.min(1, bloomFactor + breath));

  // Smooth non-linear ease for dramatic petal staging (outer petals open first, inner follow)
  const bOuter = Math.pow(b, 0.82);
  const bMid = Math.max(0, Math.min(1, (b - 0.08) / 0.92));
  const bInner = Math.pow(Math.max(0, Math.min(1, (b - 0.16) / 0.84)), 1.05);

  // 1. Outer Pink Petals: Tight closed bud (0.06 rad, cupped inward) -> Dramatic wide open (1.36 rad)
  const outerTilt = THREE.MathUtils.lerp(0.06, 1.36, bOuter);
  const outerSpread = THREE.MathUtils.lerp(0.86, 1.34, bOuter);
  assembly.outerPetalPivots.forEach((pivot, i) => {
    const wave = reducedMotion ? 0 : Math.sin(elapsed * 1.6 + i * 0.6) * 0.024 * b;
    const k3sFlare = isK3s * (i % 2 === 0 ? 0.12 : -0.06);
    const mesh = pivot.children[0] as THREE.Mesh;
    mesh.rotation.x = outerTilt + wave + k3sFlare;
    const wire = pivot.children[1] as THREE.Mesh;
    if (wire) wire.rotation.x = mesh.rotation.x;
    pivot.scale.set(outerSpread, THREE.MathUtils.lerp(0.92, 1.08, bOuter), outerSpread);
  });

  // 2. Middle Pink Petals: Tight bud (-0.02 rad kissing inward) -> Wide flare (1.02 rad)
  const midTilt = THREE.MathUtils.lerp(-0.02, 1.02, bMid);
  const midSpread = THREE.MathUtils.lerp(0.88, 1.22, bMid);
  assembly.midPetalPivots.forEach((pivot, i) => {
    const wave = reducedMotion ? 0 : Math.cos(elapsed * 1.8 + i * 0.8) * 0.022 * b;
    const databricksSpiral = isTorus * 0.08 * Math.sin(i * 1.2 + elapsed);
    const mesh = pivot.children[0] as THREE.Mesh;
    mesh.rotation.x = midTilt + wave + databricksSpiral;
    const wire = pivot.children[1] as THREE.Mesh;
    if (wire) wire.rotation.x = mesh.rotation.x;
    pivot.scale.set(midSpread, 1, midSpread);
  });

  // 3. Inner Pink Corolla Petals: Tightly closed over heart (-0.12 rad) -> Open crown (0.68 rad)
  const innerTilt = THREE.MathUtils.lerp(-0.12, 0.68, bInner);
  const innerSpread = THREE.MathUtils.lerp(0.84, 1.15, bInner);
  assembly.innerPetalPivots.forEach((pivot, i) => {
    const wave = reducedMotion ? 0 : Math.sin(elapsed * 2.1 + i * 1.0) * 0.018 * b;
    const fitucHarmonic = isFituc * 0.06 * Math.sin(elapsed * 2.6 + i);
    const mesh = pivot.children[0] as THREE.Mesh;
    mesh.rotation.x = innerTilt + wave + fitucHarmonic;
    const wire = pivot.children[1] as THREE.Mesh;
    if (wire) wire.rotation.x = mesh.rotation.x;
    pivot.scale.set(innerSpread, 1, innerSpread);
  });

  // 4. Green Outer Petals / Calyx Guard Leaves: Cradle tightly at bud (0.44 rad) -> Wide emerald star (1.38 rad)
  const greenTilt = THREE.MathUtils.lerp(0.44, 1.38, bOuter);
  const greenSpread = THREE.MathUtils.lerp(0.9, 1.22, bOuter);
  assembly.greenPetalPivots.forEach((pivot, i) => {
    const wave = reducedMotion ? 0 : Math.sin(elapsed * 1.4 + i) * 0.018;
    const mesh = pivot.children[0] as THREE.Mesh;
    mesh.rotation.x = greenTilt + wave;
    const wire = pivot.children[1] as THREE.Mesh;
    if (wire) wire.rotation.x = mesh.rotation.x;
    pivot.scale.set(greenSpread, 1, greenSpread);
  });

  // 5. Golden Stamen & Seedpod Receptacle: Rises and expands visibly as inner corolla opens
  assembly.stamenGroup.position.y = THREE.MathUtils.lerp(-0.04, 0.1, bInner);
  assembly.stamenGroup.scale.set(
    THREE.MathUtils.lerp(0.62, 1.25, bInner),
    THREE.MathUtils.lerp(0.75, 1.15, bInner),
    THREE.MathUtils.lerp(0.62, 1.25, bInner)
  );
  assembly.receptacleMesh.position.y = THREE.MathUtils.lerp(0.12, 0.28, bInner);
  assembly.receptacleMesh.scale.setScalar(THREE.MathUtils.lerp(0.78, 1.12, bInner));

  // Subtle lily pad float rotation
  assembly.lilyPadMesh.rotation.y = reducedMotion ? 0.4 : 0.4 + Math.sin(elapsed * 0.4) * 0.06;
}

/**
 * Creates a smooth sculpted 3D flowing silk ribbon band along an undulating closed orbital path.
 * Produces a wide, fluid, wavy silk strip with subtle pitch twist and clean normals/UVs.
 */
export function createFlowingBlueRibbonGeometry(
  radius = 2.05,
  ribbonWidth = 0.085,
  waveAmpY = 0.28,
  waveFreq = 3,
  twistTurns = 2,
  segments = 160,
  widthSegments = 4
): THREE.BufferGeometry {
  const cols = widthSegments + 1;
  const rows = segments + 1;
  const vertCount = cols * rows;

  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);

  const center = new THREE.Vector3();
  const nextCenter = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const binormal = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const ribbonDir = new THREE.Vector3();

  function evalPath(t: number, out: THREE.Vector3) {
    const theta = t * Math.PI * 2;
    const r = radius + Math.sin(theta * 2) * 0.14;
    out.set(
      Math.cos(theta) * r,
      Math.sin(theta * waveFreq) * waveAmpY,
      Math.sin(theta) * r
    );
  }

  let idx3 = 0;
  let idx2 = 0;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    evalPath(t, center);
    evalPath(t + 0.002, nextCenter);
    tangent.subVectors(nextCenter, center).normalize();

    binormal.crossVectors(tangent, up).normalize();
    normal.crossVectors(binormal, tangent).normalize();

    // Gentle ribbon twist & subtle organic flutter along the orbital flow
    const twist = t * Math.PI * 2 * twistTurns + Math.sin(t * Math.PI * 4) * 0.35;
    const cosTw = Math.cos(twist);
    const sinTw = Math.sin(twist);

    ribbonDir
      .copy(binormal)
      .multiplyScalar(cosTw)
      .addScaledVector(normal, sinTw)
      .normalize();

    // Taper width smoothly slightly at periodic crests for silk elegance
    const localHalfW = ribbonWidth * 0.5 * (0.85 + 0.25 * Math.sin(t * Math.PI * 2 * waveFreq));

    for (let j = 0; j <= widthSegments; j++) {
      const wFrac = (j / widthSegments) * 2 - 1; // -1 to +1
      // Subtle silk camber across ribbon width
      const camber = (1 - wFrac * wFrac) * 0.012;

      positions[idx3] = center.x + ribbonDir.x * wFrac * localHalfW + normal.x * camber;
      positions[idx3 + 1] = center.y + ribbonDir.y * wFrac * localHalfW + normal.y * camber;
      positions[idx3 + 2] = center.z + ribbonDir.z * wFrac * localHalfW + normal.z * camber;

      uvs[idx2] = t * 4.0;
      uvs[idx2 + 1] = (wFrac + 1) * 0.5;

      idx3 += 3;
      idx2 += 2;
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < widthSegments; j++) {
      const a = i * cols + j;
      const b = a + cols;
      const c = a + cols + 1;
      const d = a + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();

  return geo;
}

/**
 * Legacy-compatible export signature for machined ring fallback if needed
 */
export function createMachinedRingGeometry(
  innerR: number,
  outerR: number,
  _halfHeight: number,
  segments = 140
): THREE.BufferGeometry {
  return createFlowingBlueRibbonGeometry((innerR + outerR) * 0.5, 0.075, 0.22, 3, 1, segments, 4);
}

/**
 * Composite 4-part sapphire telemetry node rig
 */
export function createSatelliteNodeParts(): {
  chassisGeo: THREE.ExtrudeGeometry;
  collarGeo: THREE.CylinderGeometry;
  opticGeo: THREE.BoxGeometry;
  probeGeo: THREE.CylinderGeometry;
} {
  const s = 0.09;
  const bevel = 0.018;
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
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  chassisGeo.center();

  const collarGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.04, 24);
  const opticGeo = new THREE.BoxGeometry(0.036, 0.022, 0.16);
  const probeGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.14, 12);

  return { chassisGeo, collarGeo, opticGeo, probeGeo };
}

export function createInternalTelemetryCoreGeometry(): THREE.BufferGeometry {
  const geo = new THREE.OctahedronGeometry(0.32, 2);
  geo.computeVertexNormals();
  return geo;
}

export function createOpticalBusRingGeometry(): THREE.BufferGeometry {
  return createFlowingBlueRibbonGeometry(1.78, 0.068, 0.08, 4, 1, 140, 4);
}

/**
 * Creates 3 delicate flowing blue silk ribbon loops weaving smoothly around the lotus
 */
export function createFloatingStreamRibbonGeometries(): THREE.BufferGeometry[] {
  return [
    createFlowingBlueRibbonGeometry(1.98, 0.072, 0.34, 2, 2, 160, 4),
    createFlowingBlueRibbonGeometry(2.26, 0.064, 0.26, 3, -2, 160, 4),
  ];
}
