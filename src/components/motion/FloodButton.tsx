import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

interface FloodButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  variant?: 'primary' | 'glass' | 'ghost';
  chamfer?: boolean;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
}

/**
 * Interactive FloodButton:
 * - Left-to-right liquid flood fill sweep on hover (scaleX 0 -> 1)
 * - Subtle React Bits magnetic spring pull on fine pointer hover
 * - Optional beveled hardware chamfer variant with crisp cyan edge highlight
 * - Accessible min height, focus-visible ring, single-line enforcement
 */
export const FloodButton: React.FC<FloodButtonProps> = ({
  children,
  onClick,
  href,
  target,
  rel,
  variant = 'primary',
  chamfer = false,
  className = '',
  disabled = false,
  ariaLabel,
  title,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const txRaw = useMotionValue(0);
  const tyRaw = useMotionValue(0);
  const tx = useSpring(txRaw, { stiffness: 320, damping: 24 });
  const ty = useSpring(tyRaw, { stiffness: 320, damping: 24 });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReduced || disabled || e.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
    txRaw.set(dx);
    tyRaw.set(dy);
  };

  const handleLeave = () => {
    setIsHovered(false);
    txRaw.set(0);
    tyRaw.set(0);
  };

  const baseStyles = `group relative inline-flex items-center justify-center gap-2 overflow-hidden ${
    chamfer ? 'rounded-tl-xl rounded-tr-xl rounded-bl-xl' : 'rounded-xl'
  } font-semibold transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed`;

  const variantClasses = chamfer
    ? variant === 'primary'
      ? 'bg-gradient-to-r from-blue-600/95 to-blue-500/95 text-white shadow-[0_10px_28px_-6px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.28)]'
      : 'bg-[#0a101f]/80 backdrop-blur-xl text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:text-[#040711]'
    : variant === 'primary'
      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border border-cyan-300/30 shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.25)]'
      : variant === 'glass'
        ? 'bg-slate-900/55 backdrop-blur-xl text-zinc-100 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-cyan-400/40'
        : 'bg-transparent backdrop-blur-md text-zinc-300 border border-white/10 hover:text-white hover:border-white/25';

  const floodColor =
    variant === 'primary'
      ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
      : chamfer
        ? 'bg-cyan-400'
        : 'bg-white/[0.08]';

  const clipStyle = chamfer
    ? { clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%)' }
    : undefined;

  const innerContent = (
    <>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${floodColor} transition-transform duration-300 ease-[cubic-bezier(0.33,0,0,1)] origin-left ${
          isHovered && !disabled ? 'scale-x-100' : 'scale-x-0'
        }`}
      />
      {chamfer && (
        <svg
          aria-hidden="true"
          viewBox="0 0 220 50"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full z-20"
        >
          <path
            d="M0.7 0.7H219.3V41L210.5 49.3H0.7Z"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className={
              isHovered
                ? 'stroke-cyan-300/90 transition-colors duration-200'
                : 'stroke-cyan-400/40 transition-colors duration-200'
            }
            strokeWidth="1"
          />
        </svg>
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  );

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handleLeave}
      style={{ x: prefersReduced ? 0 : tx, y: prefersReduced ? 0 : ty }}
      whileTap={!disabled && !prefersReduced ? { scale: 0.98 } : undefined}
      className="inline-flex"
    >
      {href ? (
        <a
          href={href}
          target={target}
          rel={rel}
          aria-label={ariaLabel}
          title={title}
          onClick={onClick}
          style={clipStyle}
          className={`${baseStyles} ${variantClasses} ${className}`}
        >
          {innerContent}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
          title={title}
          style={clipStyle}
          className={`${baseStyles} ${variantClasses} ${className}`}
        >
          {innerContent}
        </button>
      )}
    </motion.div>
  );
};

export default FloodButton;
