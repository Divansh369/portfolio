import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

// CRC32 lookup table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePngRgba(width: number, height: number, rgba: Uint8Array): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter type 0
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * stride + 1);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function blendPixel(
  buf: Uint8Array,
  idx: number,
  r: number,
  g: number,
  b: number,
  alpha: number
) {
  const a = Math.max(0, Math.min(1, alpha));
  buf[idx] = Math.round(mix(buf[idx], r, a));
  buf[idx + 1] = Math.round(mix(buf[idx + 1], g, a));
  buf[idx + 2] = Math.round(mix(buf[idx + 2], b, a));
  buf[idx + 3] = 255;
}

/**
 * Renders the geometric glowing lotus + water ripple emblem at arbitrary size.
 * safeScale < 1 adds maskable safe-zone margin around the central icon mark.
 */
function renderLotusIconPng(size: number, safeScale: number, roundedCorners: boolean): Buffer {
  const buf = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = (x / (size - 1)) * 2 - 1;
      const ny = (y / (size - 1)) * 2 - 1;

      // Deep midnight-indigo to twilight pond radial backdrop
      const radial = Math.sqrt(nx * nx + (ny + 0.1) * (ny + 0.1));
      const bgGlow = Math.exp(-radial * radial * 2.2);
      buf[idx] = Math.round(mix(4, 14, bgGlow));
      buf[idx + 1] = Math.round(mix(7, 32, bgGlow));
      buf[idx + 2] = Math.round(mix(17, 68, bgGlow));
      buf[idx + 3] = 255;

      // Scaled coordinates inside safe zone
      const sx = nx / safeScale;
      const sy = ny / safeScale;

      // Pond ripple rings near base
      const ringDist1 = Math.abs(Math.sqrt((sx * 0.85) ** 2 + ((sy - 0.36) * 4.5) ** 2) - 0.52);
      const ringAlpha1 = smoothstep(0.06, 0.0, ringDist1) * 0.42;
      if (ringAlpha1 > 0.005) {
        blendPixel(buf, idx, 56, 189, 248, ringAlpha1);
      }

      // Lotus petals parameterized by tilt angles around lower center (0, 0.34)
      const petals: Array<{
        angle: number;
        len: number;
        width: number;
        colorA: [number, number, number];
        colorB: [number, number, number];
        alpha: number;
      }> = [
        { angle: -0.92, len: 0.72, width: 0.24, colorA: [29, 78, 216], colorB: [56, 189, 248], alpha: 0.72 },
        { angle: 0.92, len: 0.72, width: 0.24, colorA: [29, 78, 216], colorB: [56, 189, 248], alpha: 0.72 },
        { angle: -0.48, len: 0.84, width: 0.26, colorA: [190, 24, 93], colorB: [244, 114, 182], alpha: 0.88 },
        { angle: 0.48, len: 0.84, width: 0.26, colorA: [190, 24, 93], colorB: [244, 114, 182], alpha: 0.88 },
        { angle: 0.0, len: 0.94, width: 0.27, colorA: [14, 116, 144], colorB: [186, 230, 253], alpha: 0.96 },
      ];

      for (const petal of petals) {
        const px = sx;
        const py = sy - 0.34;
        const cosA = Math.cos(petal.angle);
        const sinA = Math.sin(petal.angle);
        const u = px * cosA + py * sinA;
        const v = -(-px * sinA + py * cosA); // grows upward from 0..len

        if (v >= -0.02 && v <= petal.len) {
          const t = Math.max(0, Math.min(1, v / petal.len));
          const halfW = petal.width * Math.sin(Math.pow(t, 0.72) * Math.PI);
          const dist = Math.abs(u) - halfW;
          const edge = smoothstep(0.025, -0.015, dist) * smoothstep(0.0, 0.08, t);
          if (edge > 0.005) {
            const cr = mix(petal.colorA[0], petal.colorB[0], t);
            const cg = mix(petal.colorA[1], petal.colorB[1], t);
            const cb = mix(petal.colorA[2], petal.colorB[2], t);
            blendPixel(buf, idx, cr, cg, cb, edge * petal.alpha);
          }
        }
      }

      // Luminous golden center seed glow
      const coreDist = Math.sqrt(sx * sx + (sy + 0.04) * (sy + 0.04));
      const coreAlpha = smoothstep(0.11, 0.03, coreDist) * 0.92;
      if (coreAlpha > 0.005) {
        blendPixel(buf, idx, 254, 240, 138, coreAlpha);
      }

      // Subtle rounded border highlight on standard icons
      if (roundedCorners) {
        const ax = Math.abs(nx);
        const ay = Math.abs(ny);
        const cornerRadius = 0.24;
        const qx = Math.max(ax - (1 - cornerRadius), 0);
        const qy = Math.max(ay - (1 - cornerRadius), 0);
        const roundedDist = Math.sqrt(qx * qx + qy * qy) - cornerRadius;
        if (roundedDist > 0) {
          const alphaOut = Math.round(smoothstep(0.02, 0.0, roundedDist) * 255);
          buf[idx + 3] = alphaOut;
        } else if (Math.abs(roundedDist + 0.03) < 0.018) {
          blendPixel(buf, idx, 56, 189, 248, 0.35);
        }
      }
    }
  }

  return encodePngRgba(size, size, buf);
}

/**
 * Generates a 1200x630 OpenGraph / Twitter social preview image depicting the glowing lotus pond sky horizon.
 */
function renderOgCardPng(width = 1200, height = 630): Buffer {
  const buf = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    const isWater = v > 0.58;
    const horizonDist = Math.abs(v - 0.58);

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const u = x / (width - 1);
      const cx = (u - 0.5) * (width / height);
      const cy = v - 0.58;

      // Sky gradient + twilight/dawn dusk glow at horizon
      let r = mix(4, 15, smoothstep(0.0, 0.58, v));
      let g = mix(8, 30, smoothstep(0.0, 0.58, v));
      let b = mix(20, 74, smoothstep(0.0, 0.58, v));

      if (isWater) {
        r = mix(10, 4, smoothstep(0.58, 1.0, v));
        g = mix(24, 9, smoothstep(0.58, 1.0, v));
        b = mix(56, 22, smoothstep(0.58, 1.0, v));
      }

      // Warm horizon dawn ribbon + sun orb on the right
      const horizonGlow = Math.exp(-horizonDist * 14.0);
      r = mix(r, 56, horizonGlow * 0.42);
      g = mix(g, 145, horizonGlow * 0.46);
      b = mix(b, 224, horizonGlow * 0.55);

      const sunDist = Math.sqrt((u - 0.78) ** 2 * ((width / height) ** 2) + (v - 0.28) ** 2);
      const sunHalo = Math.exp(-sunDist * 7.5);
      const sunDisc = smoothstep(0.075, 0.055, sunDist);
      r = mix(r, 253, sunHalo * 0.35 + sunDisc * 0.9);
      g = mix(g, 186, sunHalo * 0.25 + sunDisc * 0.85);
      b = mix(b, 116, sunHalo * 0.2 + sunDisc * 0.75);

      // Subtle architectural grid lines in lower pond half
      if (isWater) {
        const ripple = Math.abs(Math.sin((cy * 38) + Math.cos(cx * 7) * 0.8));
        if (ripple < 0.055) {
          const lineFade = (1 - ripple / 0.055) * 0.14 * (1 - horizonDist * 1.4);
          r = mix(r, 56, Math.max(0, lineFade));
          g = mix(g, 189, Math.max(0, lineFade));
          b = mix(b, 248, Math.max(0, lineFade));
        }
      }

      // Centerpiece Lotus Silhouette glowing above pond line
      const lx = (u - 0.5) * 2.8;
      const ly = (v - 0.62) * 3.1;
      const lotusPetals = [-0.95, -0.48, 0, 0.48, 0.95];
      for (const ang of lotusPetals) {
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        const pu = lx * cosA + ly * sinA;
        const pv = -(-lx * sinA + ly * cosA);
        if (pv >= 0 && pv <= 0.92) {
          const pt = pv / 0.92;
          const halfW = 0.24 * Math.sin(Math.pow(pt, 0.72) * Math.PI);
          const d = Math.abs(pu) - halfW;
          const edge = smoothstep(0.02, -0.015, d) * smoothstep(0, 0.08, pt);
          if (edge > 0.005) {
            const isPink = Math.abs(ang) > 0.2 && Math.abs(ang) < 0.7;
            const pr = isPink ? mix(190, 244, pt) : mix(29, 125, pt);
            const pg = isPink ? mix(24, 114, pt) : mix(78, 211, pt);
            const pb = isPink ? mix(93, 208, pt) : mix(216, 252, pt);
            r = mix(r, pr, edge * 0.85);
            g = mix(g, pg, edge * 0.85);
            b = mix(b, pb, edge * 0.85);
          }
        }
      }

      buf[idx] = Math.round(r);
      buf[idx + 1] = Math.round(g);
      buf[idx + 2] = Math.round(b);
      buf[idx + 3] = 255;
    }
  }

  return encodePngRgba(width, height, buf);
}

async function main() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'pwa-192x192.png'),
    renderLotusIconPng(192, 0.86, true)
  );
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'pwa-512x512.png'),
    renderLotusIconPng(512, 0.86, true)
  );
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'),
    renderLotusIconPng(512, 0.68, false)
  );
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'apple-touch-icon.png'),
    renderLotusIconPng(180, 0.8, false)
  );
  fs.writeFileSync(path.join(PUBLIC_DIR, 'og-card.png'), renderOgCardPng(1200, 630));

  console.log(
    'Generated PWA & SEO image assets in public/: pwa-192x192.png, pwa-512x512.png, pwa-maskable-512x512.png, apple-touch-icon.png, og-card.png'
  );
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
