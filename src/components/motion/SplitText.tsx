import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  animateBy?: 'words' | 'chars';
  delay?: number;
  stagger?: number;
  triggerOnMount?: boolean;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

/**
 * Kinetic SplitText reveal (React Bits + Kimi text-engine pattern):
 * - Zero overflow-hidden clipping so descenders (g, p, y, j) stay cleanly unclipped.
 * - Includes sr-only semantic copy for assistive tech while spans are aria-hidden.
 */
export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  animateBy = 'words',
  delay = 0,
  stagger = 0.045,
  triggerOnMount = false,
  align = 'left',
  as: Tag = 'span',
}) => {
  const prefersReduced = useReducedMotion();
  const displayClass = Tag === 'span' ? 'inline-block' : 'block';

  if (prefersReduced) {
    return <Tag className={`${displayClass} ${className}`}>{text}</Tag>;
  }

  const units = animateBy === 'chars' ? Array.from(text) : text.split(/\s+/).filter(Boolean);

  return (
    <Tag className={`relative ${displayClass} ${className}`}>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden="true"
        className={`flex flex-wrap gap-x-[0.26em] ${
          align === 'center' ? 'justify-center' : 'justify-start'
        }`}
      >
        {units.map((unit, idx) => {
          const itemDelay = delay + idx * stagger;
          if (triggerOnMount) {
            return (
              <motion.span
                key={`${unit}-${idx}`}
                className="inline-block will-change-transform"
                initial={{ opacity: 0, y: '0.32em' }}
                animate={{ opacity: 1, y: '0em' }}
                transition={{
                  type: 'spring',
                  stiffness: 175,
                  damping: 22,
                  delay: itemDelay,
                }}
              >
                {unit}
              </motion.span>
            );
          }

          return (
            <motion.span
              key={`${unit}-${idx}`}
              className="inline-block will-change-transform"
              initial={{ opacity: 0, y: '0.32em' }}
              whileInView={{ opacity: 1, y: '0em' }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                type: 'spring',
                stiffness: 175,
                damping: 22,
                delay: itemDelay,
              }}
            >
              {unit}
            </motion.span>
          );
        })}
      </span>
    </Tag>
  );
};

export default SplitText;
