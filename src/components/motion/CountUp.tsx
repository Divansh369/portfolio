import React, { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

interface CountUpProps {
  to: number;
  from?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

/**
 * React Bits CountUp pattern using Framer Motion's imperative `animate()`.
 * Immediately readable in DOM on reduced-motion and uses tabular numerals.
 */
export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  suffix = '',
  prefix = '',
  duration = 1.15,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const prefersReduced = useReducedMotion();
  const [val, setVal] = useState<number>(prefersReduced ? to : from);
  const formattedFinal = `${prefix}${to.toLocaleString('en-US')}${suffix}`;

  useEffect(() => {
    if (prefersReduced) {
      setVal(to);
      return;
    }
    if (!inView) return;

    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setVal(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, from, to, duration, prefersReduced]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`} aria-label={formattedFinal}>
      <span aria-hidden="true">
        {prefersReduced ? formattedFinal : `${prefix}${val.toLocaleString('en-US')}${suffix}`}
      </span>
    </span>
  );
};

export default CountUp;
