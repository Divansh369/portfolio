import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface SectionStop {
  id: string;
  label: string;
}

interface SectionDockProps {
  homelabLabel?: string;
  showSystems3d?: boolean;
  showHomelab?: boolean;
  stops?: SectionStop[];
}

/**
 * Subtle right-edge glass section index dock on wide desktop screens (1360px+).
 * Keeps the top navbar cleanly 3-zone while allowing instant section scrubbing.
 */
export const SectionDock: React.FC<SectionDockProps> = ({
  homelabLabel = 'Infrastructure',
  showSystems3d = true,
  showHomelab = true,
  stops,
}) => {
  const [activeId, setActiveId] = useState<string>('hero');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  const sectionStops = useMemo<SectionStop[]>(() => {
    if (stops && stops.length > 0) return stops;
    return [
      { id: 'hero', label: 'Overview' },
      ...(showSystems3d ? [{ id: 'systems-3d', label: '3D View' }] : []),
      { id: 'projects', label: 'Projects' },
      ...(showHomelab ? [{ id: 'homelab', label: homelabLabel }] : []),
      { id: 'experience', label: 'Experience' },
      { id: 'skills', label: 'Skills' },
      { id: 'education', label: 'Education' },
      { id: 'contact', label: 'Contact' },
    ];
  }, [stops, showSystems3d, showHomelab, homelabLabel]);

  useEffect(() => {
    const elements = sectionStops
      .map((stop) => document.getElementById(stop.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-32% 0px -54% 0px', threshold: 0.01 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionStops]);

  const handleJump = (id: string) => {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      return;
    }
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <aside
      aria-label="Section index"
      className="hidden min-[1360px]:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-1.5 glass-panel-subtle px-2 py-3 rounded-2xl print-hide"
    >
      {sectionStops.map((stop) => {
        const isActive = activeId === stop.id;
        const isHovered = hoveredId === stop.id;
        return (
          <div key={stop.id} className="relative flex items-center">
            {isHovered && (
              <motion.span
                initial={prefersReduced ? false : { opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="absolute right-9 px-2.5 py-1 rounded-lg glass-panel text-[11px] font-mono text-zinc-100 whitespace-nowrap pointer-events-none"
              >
                {stop.label}
              </motion.span>
            )}

            <button
              type="button"
              onClick={() => handleJump(stop.id)}
              onMouseEnter={() => setHoveredId(stop.id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-label={`Jump to ${stop.label}`}
              aria-current={isActive ? 'location' : undefined}
              className="relative w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-white/[0.06]"
            >
              {isActive && (
                <motion.span
                  layoutId="section-dock-indicator"
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  className="absolute w-3.5 h-3.5 rounded-full border border-amber-400/70 bg-amber-400/15"
                />
              )}
              <span
                className={`block rounded-full transition-all duration-200 ${
                  isActive
                    ? 'w-1.5 h-1.5 bg-emerald-400'
                    : 'w-1 h-1 bg-zinc-500 hover:bg-zinc-200'
                }`}
              />
            </button>
          </div>
        );
      })}
    </aside>
  );
};

export default SectionDock;
