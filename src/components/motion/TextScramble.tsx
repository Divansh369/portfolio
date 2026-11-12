import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface TextScrambleProps {
  text: string;
  trigger?: 'inView' | 'hover' | 'both' | 'change';
  durationMs?: number;
  className?: string;
}

const GLYPHS = '0123456789abcdef';

/**
 * React Bits DecryptedText / Scramble pattern:
 * - Resolves technical monospace labels, endpoints, dates, or rotated IPs
 * - Preserves punctuation/spaces so line width never jumps or shifts layout
 * - Respects prefers-reduced-motion cleanly and renders accessible plain text
 */
export const TextScramble: React.FC<TextScrambleProps> = ({
  text,
  trigger = 'inView',
  durationMs = 420,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const prefersReduced = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const rafRef = useRef<number>(0);

  const runScramble = () => {
    if (prefersReduced || typeof window === 'undefined') {
      setDisplay(text);
      return;
    }

    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const len = text.length;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const locked = Math.floor(progress * len);

      let out = '';
      for (let i = 0; i < len; i++) {
        const ch = text[i];
        if (i < locked || /[\s.,:/\-+·~]/.test(ch)) {
          out += ch;
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setDisplay(out);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (trigger === 'inView' || trigger === 'both') {
      if (inView) {
        runScramble();
      }
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, text, trigger, prefersReduced]);

  useEffect(() => {
    if (trigger === 'change') {
      runScramble();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [text]);

  return (
    <span
      ref={ref}
      onMouseEnter={trigger === 'hover' || trigger === 'both' ? runScramble : undefined}
      className={className}
      aria-label={text}
    >
      <span aria-hidden="true">{prefersReduced ? text : display}</span>
    </span>
  );
};

export default TextScramble;
