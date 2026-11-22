import React, { useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import CornerBrackets from './CornerBrackets';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
  spotlight?: boolean;
  brackets?: boolean;
  chamfer?: boolean;
  interactive?: boolean;
  dimmed?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

/**
 * Multi-layered Optical GlassCard:
 * - 3D spring perspective tilt on fine pointer hover
 * - Cursor-tracking radial spotlight glaze
 * - Directional diagonal specular sheen responding to pointer angle
 * - Optional chamfered hardware bottom-right corner with matching SVG stroke outline
 * - Expanding CornerBrackets micro-framing
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  tilt = true,
  spotlight = true,
  brackets = false,
  chamfer = false,
  interactive = true,
  dimmed = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);

  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const glareAngleRaw = useMotionValue(122);

  const springConfig = { stiffness: 280, damping: 22, mass: 0.6 };
  const rotateX = useSpring(rotateXRaw, springConfig);
  const rotateY = useSpring(rotateYRaw, springConfig);
  const glareAngle = useSpring(glareAngleRaw, { stiffness: 180, damping: 26 });

  const spotlightBg = useMotionTemplate`radial-gradient(420px circle at ${mouseX}px ${mouseY}px, rgba(16, 185, 129, 0.22), rgba(249, 115, 22, 0.08) 45%, transparent 72%)`;
  const specularGlare = useMotionTemplate`linear-gradient(${glareAngle}deg, transparent 20%, rgba(255, 255, 255, 0.08) 48%, rgba(250, 204, 21, 0.12) 52%, transparent 80%)`;

  const canTilt = tilt && !prefersReduced;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width - 0.5) * 2;
    const py = (y / rect.height - 0.5) * 2;

    if (spotlight) {
      mouseX.set(x);
      mouseY.set(y);
      glareAngleRaw.set(120 + px * 26 - py * 14);
    }

    if (canTilt) {
      // Amplified tactile 3D perspective tilt lean
      rotateXRaw.set(-py * 6.2);
      rotateYRaw.set(px * 6.2);
    }
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    setHovered(true);
    handlePointerMove(e);
    onMouseEnter?.();
  };

  const handlePointerLeave = () => {
    setHovered(false);
    rotateXRaw.set(0);
    rotateYRaw.set(0);
    glareAngleRaw.set(122);
    onMouseLeave?.();
  };

  const chamferClip = chamfer
    ? 'polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)'
    : undefined;

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{
        transformPerspective: 1000,
        rotateX: canTilt ? rotateX : 0,
        rotateY: canTilt ? rotateY : 0,
        opacity: dimmed ? 0.42 : 1,
        clipPath: chamferClip,
      }}
      className={`group relative ${
        chamfer
          ? 'glass-panel-chamfer rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
          : `glass-panel rounded-2xl ${interactive ? 'glass-panel-hover' : ''}`
      } transition-[opacity,border-color,box-shadow] duration-300 ${className}`}
    >
      {/* Chamfer SVG Vector Perimeter Stroke (handles the diagonal bevel cleanly) */}
      {chamfer && (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full z-20"
        >
          <path
            d="M 2 0.2 H 98 Q 99.8 0.2 99.8 2 V 93 L 94 99.8 H 2 Q 0.2 99.8 0.2 98 V 2 Q 0.2 0.2 2 0.2 Z"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="stroke-white/15 group-hover:stroke-amber-400/50 transition-colors duration-300"
            strokeWidth="1"
          />
          <path
            d="M 99.5 92 L 93.2 99.5"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="stroke-amber-400/55 group-hover:stroke-yellow-300 transition-colors duration-300"
            strokeWidth="1.5"
          />
        </svg>
      )}

      {/* Dynamic Cursor Spotlight Glaze */}
      {spotlight && !prefersReduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
          style={{
            background: spotlightBg,
            opacity: hovered ? 1 : 0,
          }}
        />
      )}

      {/* Directional Diagonal Specular Sheen */}
      {spotlight && !prefersReduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
          style={{
            background: specularGlare,
            opacity: hovered ? 0.9 : 0,
          }}
        />
      )}

      {/* Subtle top-edge optical specular catchlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />

      {brackets && <CornerBrackets hideBottomRight={chamfer} />}

      <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
    </motion.div>
  );
};

export default GlassCard;
