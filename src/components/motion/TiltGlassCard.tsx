import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface TiltGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTiltDeg?: number;
  enableGlare?: boolean;
}

/**
 * High-performance 3D perspective tilt glass card with pointer-following specular sheen.
 * Automatically falls back to standard smooth elevation under prefers-reduced-motion.
 */
export const TiltGlassCard: React.FC<TiltGlassCardProps> = ({
  children,
  className = '',
  maxTiltDeg = 7,
  enableGlare = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Normalized coordinates from center: [-1, 1]
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    // Inverted tilt on Y produces natural physical leaning toward mouse
    setTilt({
      x: -normY * maxTiltDeg,
      y: normX * maxTiltDeg,
    });

    if (enableGlare) {
      setGlare({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        opacity: 0.22,
      });
    }
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      animate={
        prefersReduced
          ? {}
          : {
              rotateX: tilt.x,
              rotateY: tilt.y,
            }
      }
      transition={{
        type: 'spring',
        stiffness: 340,
        damping: 24,
        mass: 0.5,
      }}
      style={{
        transformPerspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      className={`relative rounded-2xl glass-panel overflow-hidden transition-shadow duration-300 ${className}`}
      {...(props as any)}
    >
      {/* Dynamic Specular Sheen Glare Overlay */}
      {enableGlare && !prefersReduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(circle 320px at ${glare.x}% ${glare.y}%, rgba(250, 204, 21, 0.28), transparent 75%)`,
          }}
        />
      )}

      {/* Card Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
};

export default TiltGlassCard;
