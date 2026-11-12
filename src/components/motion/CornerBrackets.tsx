import React from 'react';

interface CornerBracketsProps {
  className?: string;
  size?: number;
  hideBottomRight?: boolean;
}

/**
 * Architectural L-bracket instrument framing adapted from spatial HUD panels.
 * Draws the 10x10 corner stroke path anchored at corners with outward
 * expansion on parent `.group` hover (`--bracket-spread` effect).
 */
export const CornerBrackets: React.FC<CornerBracketsProps> = ({
  className = 'text-white/25 group-hover:text-cyan-400/85',
  size = 10,
  hideBottomRight = false,
}) => {
  const sharedSize = { width: size, height: size };
  const motionClasses =
    'transition-all duration-500 ease-[cubic-bezier(0.33,0,0,1)]';

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      {/* Top-Left */}
      <svg
        viewBox="0 0 10.5 10.5"
        fill="none"
        style={sharedSize}
        className={`absolute top-2.5 left-2.5 -scale-x-100 group-hover:-translate-x-1 group-hover:-translate-y-1 ${motionClasses}`}
      >
        <path d="M0 0.5H10V10.5" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Top-Right */}
      <svg
        viewBox="0 0 10.5 10.5"
        fill="none"
        style={sharedSize}
        className={`absolute top-2.5 right-2.5 group-hover:translate-x-1 group-hover:-translate-y-1 ${motionClasses}`}
      >
        <path d="M0 0.5H10V10.5" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Bottom-Left */}
      <svg
        viewBox="0 0 10.5 10.5"
        fill="none"
        style={sharedSize}
        className={`absolute bottom-2.5 left-2.5 -scale-100 group-hover:-translate-x-1 group-hover:translate-y-1 ${motionClasses}`}
      >
        <path d="M0 0.5H10V10.5" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Bottom-Right */}
      {!hideBottomRight && (
        <svg
          viewBox="0 0 10.5 10.5"
          fill="none"
          style={sharedSize}
          className={`absolute bottom-2.5 right-2.5 -scale-y-100 group-hover:translate-x-1 group-hover:translate-y-1 ${motionClasses}`}
        >
          <path d="M0 0.5H10V10.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      )}
    </div>
  );
};

export default CornerBrackets;
