import React from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Precision scroll progress hairline driven via Framer Motion useScroll + spring smoothing.
 */
export const ScrollProgressRail: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const prefersReduced = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-[70] pointer-events-none bg-transparent print-hide"
    >
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 origin-left shadow-[0_0_12px_rgba(34,211,238,0.55)]"
        style={{ scaleX: prefersReduced ? scrollYProgress : scaleX }}
      />
    </div>
  );
};

export default ScrollProgressRail;
