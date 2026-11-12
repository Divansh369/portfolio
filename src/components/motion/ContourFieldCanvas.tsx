import React, { useEffect, useRef } from 'react';

interface ContourFieldCanvasProps {
  className?: string;
}

type TierName = 'mobile' | 'tablet' | 'desktop';

interface SceneTier {
  name: TierName;
  maxDpr: number;
  cellSize: number;
  trailSamples: number;
  pointerWake: boolean;
  frameInterval: number;
}

interface Ripple {
  x: number;
  y: number;
  born: number;
}

const getSceneTier = (): SceneTier => {
  if (typeof window === 'undefined') {
    return {
      name: 'desktop',
      maxDpr: 1.5,
      cellSize: 44,
      trailSamples: 16,
      pointerWake: true,
      frameInterval: 0,
    };
  }
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const width = window.innerWidth;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  const saver = Boolean(nav.connection?.saveData) || (nav.deviceMemory ?? 8) <= 2;

  const name: TierName =
    width < 768 || (coarse && width < 1024)
      ? 'mobile'
      : coarse || width < 1280
        ? 'tablet'
        : 'desktop';

  return {
    name,
    maxDpr: name === 'mobile' || saver ? 1 : name === 'tablet' ? 1.25 : 1.75,
    cellSize: name === 'mobile' ? 56 : name === 'tablet' ? 48 : 42,
    trailSamples: name === 'mobile' || saver ? 0 : name === 'tablet' ? 10 : 16,
    pointerWake: name !== 'mobile' && !coarse && !saver,
    frameInterval: name === 'desktop' ? 0 : 1000 / 60 - 2,
  };
};

/** Distance from point P to segment AB — capsule distance for liquid pointer wake. */
const segmentDistSq = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const denom = bax * bax + bay * bay;
  const h = denom > 1e-4 ? Math.max(0, Math.min(1, (pax * bax + pay * bay) / denom)) : 0;
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return dx * dx + dy * dy;
};

/**
 * Adaptive full-viewport ambient 2D canvas:
 * 1) Scene-tier adaptive DPR, cell pitch & loop gating
 * 2) Analytic 4-sine marching-squares topographic contour waves
 * 3) Liquid capsule pointer wake (recent pointer trail buffer + velocity pace gating)
 * 4) Click/tap Gaussian pressure ripples + halftone lattice squaring-up under high wake
 */
export const ContourFieldCanvas: React.FC<ContourFieldCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mq =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    let tier = getSceneTier();
    let W = window.innerWidth;
    let H = window.innerHeight;
    let dpr = Math.min(tier.maxDpr, window.devicePixelRatio || 1);

    const resize = () => {
      tier = getSceneTier();
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(tier.maxDpr, window.devicePixelRatio || 1);
      const cw = Math.max(1, Math.round(W * dpr));
      const ch = Math.max(1, Math.round(H * dpr));
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
    };

    resize();
    window.addEventListener('resize', resize);

    const ptr = {
      x: W * 0.65,
      y: H * 0.32,
      sx: W * 0.65,
      sy: H * 0.32,
      prevSx: W * 0.65,
      prevSy: H * 0.32,
      inside: 0,
      over: 0,
      pace: 0,
      seen: false,
    };

    const trailX = new Float32Array(20);
    const trailY = new Float32Array(20);
    const fillTrail = (x: number, y: number) => {
      for (let i = 0; i < 20; i++) {
        trailX[i] = x;
        trailY[i] = y;
      }
    };
    fillTrail(ptr.sx, ptr.sy);

    const ripples: Ripple[] = [];

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.inside = 1;
      if (!ptr.seen) {
        ptr.sx = ptr.x;
        ptr.sy = ptr.y;
        ptr.prevSx = ptr.x;
        ptr.prevSy = ptr.y;
        fillTrail(ptr.x, ptr.y);
        ptr.seen = true;
      }
    };

    const onDown = (e: PointerEvent) => {
      if (mq?.matches) return;
      ripples.push({ x: e.clientX, y: e.clientY, born: performance.now() });
      if (ripples.length > 4) ripples.shift();
    };

    const onLeave = () => {
      ptr.inside = 0;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    const fieldValue = (nx: number, ny: number, t: number): number => {
      const qx = nx + Math.sin(ny * 0.8 + t * 0.45) * 0.24;
      const qy = ny + Math.cos(nx * 0.7 - t * 0.38) * 0.24;
      let f = Math.sin(qx * 1.05 + t * 0.42) * 0.5;
      f += Math.sin(qy * 0.9 - t * 0.32) * 0.45;
      f += Math.sin((qx + qy) * 0.68 + t * 0.25) * 0.35;
      f += Math.sin((qx - qy) * 0.92 - t * 0.38) * 0.25;
      return f * 0.5 + 0.5;
    };

    const interp = (a: number, b: number, iso: number): number => {
      const denom = b - a;
      if (Math.abs(denom) < 1e-5) return 0.5;
      return Math.max(0, Math.min(1, (iso - a) / denom));
    };

    let raf = 0;
    let last = -1;
    let lastTick = 0;
    let elapsed = 0;

    const drawFrame = (now: number) => {
      const reduced = !!(mq && mq.matches);
      if (!reduced) {
        raf = requestAnimationFrame(drawFrame);
      }

      if (tier.frameInterval > 0 && lastTick > 0 && now - lastTick < tier.frameInterval && !reduced) {
        return;
      }
      lastTick = now;

      const dt = last < 0 ? 0.016 : Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!reduced && !document.hidden) {
        elapsed += dt;
      }

      // Exponential pointer smoothing + velocity pace easing
      const eP = 1 - Math.exp(-dt * 14);
      const eO = 1 - Math.exp(-dt / 0.16);
      ptr.prevSx = ptr.sx;
      ptr.prevSy = ptr.sy;
      ptr.sx += (ptr.x - ptr.sx) * eP;
      ptr.sy += (ptr.y - ptr.sy) * eP;
      ptr.over += (ptr.inside - ptr.over) * eO;

      if (tier.pointerWake && tier.trailSamples > 1) {
        const moveDist = Math.hypot(ptr.sx - ptr.prevSx, ptr.sy - ptr.prevSy);
        const speedNorm = Math.min(1, moveDist / Math.max(1, dt * 760));
        const paceRate = speedNorm > ptr.pace ? 0.14 : 0.06;
        ptr.pace += (speedNorm - ptr.pace) * (1 - Math.exp(-dt * (paceRate * 60)));

        // Shift ring buffer
        const n = Math.min(20, tier.trailSamples);
        for (let i = n - 1; i > 0; i--) {
          trailX[i] = trailX[i - 1];
          trailY[i] = trailY[i - 1];
        }
        trailX[0] = ptr.sx;
        trailY[0] = ptr.sy;
      }

      // Prune expired ripples
      while (ripples.length > 0 && (now - ripples[0].born) > 1500) {
        ripples.shift();
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // 1. Deep Midnight Foundation
      ctx.fillStyle = '#040711';
      ctx.fillRect(0, 0, W, H);

      // Ambient drifting deep cobalt & cyan depth pools
      const driftX1 = Math.sin(elapsed * 0.14) * 58;
      const driftY1 = Math.cos(elapsed * 0.11) * 42;
      const driftX2 = Math.cos(elapsed * 0.12) * 68;
      const driftY2 = Math.sin(elapsed * 0.16) * 46;

      const g1 = ctx.createRadialGradient(
        W * 0.2 + driftX1,
        H * 0.16 + driftY1,
        0,
        W * 0.2 + driftX1,
        H * 0.16 + driftY1,
        Math.max(W, H) * 0.62
      );
      g1.addColorStop(0, 'rgba(37, 99, 235, 0.17)');
      g1.addColorStop(0.45, 'rgba(29, 78, 216, 0.065)');
      g1.addColorStop(1, 'rgba(4, 7, 17, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      const g2 = ctx.createRadialGradient(
        W * 0.8 + driftX2,
        H * 0.54 + driftY2,
        0,
        W * 0.8 + driftX2,
        H * 0.54 + driftY2,
        Math.max(W, H) * 0.56
      );
      g2.addColorStop(0, 'rgba(6, 182, 212, 0.13)');
      g2.addColorStop(0.5, 'rgba(14, 116, 144, 0.045)');
      g2.addColorStop(1, 'rgba(4, 7, 17, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      if (ptr.over > 0.01 && tier.pointerWake) {
        const gp = ctx.createRadialGradient(ptr.sx, ptr.sy, 0, ptr.sx, ptr.sy, 340);
        gp.addColorStop(0, `rgba(34, 211, 238, ${(0.095 * ptr.over).toFixed(4)})`);
        gp.addColorStop(0.45, `rgba(37, 99, 235, ${(0.05 * ptr.over).toFixed(4)})`);
        gp.addColorStop(1, 'rgba(4, 7, 17, 0)');
        ctx.fillStyle = gp;
        ctx.fillRect(0, 0, W, H);
      }

      // 2. Analytic Marching-Squares Contours + Ripple Interference
      const cell = tier.cellSize;
      const cols = Math.ceil(W / cell) + 1;
      const rows = Math.ceil(H / cell) + 1;
      const values = new Float32Array(cols * rows);
      const t = elapsed * 0.38;
      const aspect = W / Math.max(1, H);
      const hasRipples = ripples.length > 0;

      for (let r = 0; r < rows; r++) {
        const py = r * cell;
        const y = py / Math.max(1, H);
        const ny = (y - 0.5) * 3.1;
        for (let c = 0; c < cols; c++) {
          const px = c * cell;
          const x = px / Math.max(1, W);
          const nx = (x - 0.5) * 3.1 * aspect;
          let v = fieldValue(nx, ny, t);

          if (hasRipples) {
            for (let k = 0; k < ripples.length; k++) {
              const rp = ripples[k];
              const age = (now - rp.born) / 1000;
              const d = Math.hypot(px - rp.x, py - rp.y);
              const waveFront = age * 460;
              const band = Math.exp(-Math.pow((d - waveFront) / 95, 2));
              v += Math.sin((d - waveFront) * 0.055) * band * Math.exp(-age * 2.1) * 0.12;
            }
          }
          values[r * cols + c] = v;
        }
      }

      const isoLevels = [0.22, 0.44, 0.66, 0.88];
      ctx.lineCap = 'round';
      ctx.lineWidth = 1;

      for (let lIdx = 0; lIdx < isoLevels.length; lIdx++) {
        const iso = isoLevels[lIdx];
        ctx.beginPath();
        ctx.strokeStyle =
          lIdx % 2 === 0 ? 'rgba(148, 163, 184, 0.068)' : 'rgba(34, 211, 238, 0.058)';

        for (let r = 0; r < rows - 1; r++) {
          const y0 = r * cell;
          const y1 = y0 + cell;
          for (let c = 0; c < cols - 1; c++) {
            const x0 = c * cell;
            const x1 = x0 + cell;
            const v00 = values[r * cols + c];
            const v10 = values[r * cols + c + 1];
            const v11 = values[(r + 1) * cols + c + 1];
            const v01 = values[(r + 1) * cols + c];

            const pts: Array<[number, number]> = [];
            if ((v00 < iso) !== (v10 < iso)) {
              pts.push([x0 + interp(v00, v10, iso) * cell, y0]);
            }
            if ((v10 < iso) !== (v11 < iso)) {
              pts.push([x1, y0 + interp(v10, v11, iso) * cell]);
            }
            if ((v11 < iso) !== (v01 < iso)) {
              pts.push([x0 + interp(v01, v11, iso) * cell, y1]);
            }
            if ((v01 < iso) !== (v00 < iso)) {
              pts.push([x0, y0 + interp(v00, v01, iso) * cell]);
            }

            if (pts.length >= 2) {
              ctx.moveTo(pts[0][0], pts[0][1]);
              ctx.lineTo(pts[1][0], pts[1][1]);
              if (pts.length === 4) {
                ctx.moveTo(pts[2][0], pts[2][1]);
                ctx.lineTo(pts[3][0], pts[3][1]);
              }
            }
          }
        }
        ctx.stroke();
      }

      // Draw expanding subtle click wave rings
      for (let k = 0; k < ripples.length; k++) {
        const rp = ripples[k];
        const age = (now - rp.born) / 1000;
        const radius = age * 460;
        const alpha = Math.max(0, (1 - age / 1.45) * 0.28);
        if (alpha > 0.005) {
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }
      }

      // 3. Architectural Halftone Lattice + Liquid Capsule Wake + Reticle Squaring
      const pitch = tier.name === 'mobile' ? 44 : 38;
      const hr = 175;
      const hrSq = hr * hr;
      const wakeSamples = tier.pointerWake ? tier.trailSamples : 0;
      const wakeActive = tier.pointerWake && ptr.over > 0.02 && ptr.pace > 0.04;
      const wakeRadiusBase = 62 + ptr.pace * 52;

      for (let rowIdx = 0, y = pitch * 0.5; y < H; rowIdx++, y += pitch) {
        const dyCursor = Math.abs(y - ptr.sy);
        const onRowAxis = tier.pointerWake && ptr.over > 0.05 && dyCursor < pitch * 0.48;

        for (let colIdx = 0, x = pitch * 0.5; x < W; colIdx++, x += pitch) {
          const dx = x - ptr.sx;
          const dy = y - ptr.sy;
          const d2 = dx * dx + dy * dy;

          let influence = 0;
          if (tier.pointerWake && ptr.over > 0.01 && d2 < hrSq * 2.5) {
            influence = Math.exp(-d2 / hrSq) * ptr.over;
          }

          // Capsule pointer trail wake evaluation (Kimi trail wake philosophy)
          let wakeBoost = 0;
          if (wakeActive && wakeSamples > 1 && d2 < hrSq * 6.5) {
            for (let i = 0; i < wakeSamples - 1; i++) {
              const weight = Math.pow(1 - i / (wakeSamples - 1), 1.5);
              if (weight <= wakeBoost) break;
              const linkR = wakeRadiusBase * weight;
              const sd2 = segmentDistSq(
                x,
                y,
                trailX[i],
                trailY[i],
                trailX[i + 1],
                trailY[i + 1]
              );
              if (sd2 < linkR * linkR) {
                const f = Math.exp(-sd2 / Math.max(1, linkR * linkR * 0.45)) * weight * ptr.pace;
                if (f > wakeBoost) wakeBoost = f;
              }
            }
          }

          // Click wave illumination
          let rippleBoost = 0;
          if (hasRipples) {
            for (let k = 0; k < ripples.length; k++) {
              const rp = ripples[k];
              const age = (now - rp.born) / 1000;
              const distToRing = Math.abs(Math.hypot(x - rp.x, y - rp.y) - age * 460);
              if (distToRing < 70) {
                const rb = (1 - distToRing / 70) * Math.max(0, 1 - age / 1.4) * 0.7;
                if (rb > rippleBoost) rippleBoost = rb;
              }
            }
          }

          const onColAxis = tier.pointerWake && ptr.over > 0.05 && Math.abs(dx) < pitch * 0.48;
          const reticleBoost =
            (onRowAxis || onColAxis) && d2 < hrSq * 4.2
              ? 0.25 * Math.exp(-d2 / (hrSq * 3.5)) * ptr.over
              : 0;

          const total = Math.min(1, influence + reticleBoost + wakeBoost * 0.85 + rippleBoost);
          if (total > 0.08) {
            // Squaring up into subtle parity chequer near peak pointer/wake (Kimi Season halftone)
            const parityFilled = ((colIdx + rowIdx) & 1) === 0;
            const side =
              total > 0.42 && parityFilled
                ? 2.6 + total * 3.0
                : 1.5 + total * 2.2;
            ctx.fillStyle = `rgba(56, 189, 248, ${(0.12 + total * 0.46).toFixed(3)})`;
            ctx.fillRect(x - side * 0.5, y - side * 0.5, side, side);
          } else {
            ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
            ctx.fillRect(x - 0.65, y - 0.65, 1.3, 1.3);
          }
        }
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!mq?.matches && !raf) {
        last = -1;
        raf = requestAnimationFrame(drawFrame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    raf = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 z-0 pointer-events-none block print-hide ${className}`}
    />
  );
};

export default ContourFieldCanvas;
