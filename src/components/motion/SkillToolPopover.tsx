import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';
import RepoImage from '../common/RepoImage';
import BrandMark from '../icons/BrandMarks';
import { SkillIconTile } from '../../types';
import { inferCategory, LANE_META, resolveSkillProficiency } from './techGraphUtils';

export interface ActiveSkillPopover {
  tile: SkillIconTile;
  anchorRect: {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
  };
}

interface SkillToolPopoverProps {
  popover: ActiveSkillPopover | null;
  onClose: () => void;
}

export const SkillToolPopover: React.FC<SkillToolPopoverProps> = ({ popover, onClose }) => {
  const prefersReduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'above' | 'below' }>({
    top: 0,
    left: 0,
    placement: 'below',
  });

  useLayoutEffect(() => {
    if (!popover || typeof window === 'undefined') return;

    const cardWidth = Math.min(352, window.innerWidth - 24);
    const estimatedHeight = cardRef.current?.offsetHeight || 196;
    const { anchorRect } = popover;
    const margin = 10;

    // Horizontal center relative to clicked icon, clamped strictly inside viewport
    let left = anchorRect.left + anchorRect.width / 2 - cardWidth / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - cardWidth - 12));

    // Prefer opening below the icon unless near bottom viewport edge
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    let placement: 'above' | 'below' = 'below';
    let top = anchorRect.bottom + margin;

    if (spaceBelow < estimatedHeight + margin + 12 && spaceAbove > estimatedHeight + margin + 12) {
      placement = 'above';
      top = anchorRect.top - estimatedHeight - margin;
    } else if (top + estimatedHeight > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - estimatedHeight - 12);
    }

    setCoords({ top, left, placement });
  }, [popover]);

  useEffect(() => {
    if (!popover) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (cardRef.current?.contains(target)) return;
      if (target.closest('[data-skill-popover-trigger="true"]')) return;
      onClose();
    };

    const handleScrollOrResize = () => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [popover, onClose]);

  if (typeof document === 'undefined') return null;

  const tile = popover?.tile;
  const category = tile ? inferCategory(tile) : 'infra';
  const categoryMeta = LANE_META[category];
  const prof = tile ? resolveSkillProficiency(tile) : null;

  return createPortal(
    <AnimatePresence>
      {popover && tile && (
        <motion.div
          ref={cardRef}
          role="dialog"
          aria-modal="false"
          aria-label={`${tile.label} summary and links`}
          initial={
            prefersReduced
              ? false
              : {
                  opacity: 0,
                  scale: 0.96,
                  y: coords.placement === 'above' ? 6 : -6,
                }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: 'min(352px, calc(100vw - 24px))',
            zIndex: 80,
          }}
          className="glass-panel rounded-2xl border border-amber-400/35 p-4 shadow-[0_24px_56px_-14px_rgba(2,10,6,0.92),0_0_24px_rgba(16,185,129,0.16)] text-left"
        >
          {/* Header Row: Tool Identity + Dismiss */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#040e08]/95 border border-white/[0.12] flex items-center justify-center shrink-0">
                <RepoImage
                  src={tile.logoPath}
                  alt={tile.label}
                  className="w-5 h-5"
                  imgClassName="w-full h-full object-contain"
                  fallback={<BrandMark brand={tile.brandKey} className="w-5 h-5" />}
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-display text-sm font-bold text-zinc-50 leading-tight truncate">
                  {tile.label}
                </h4>
                <div className="text-[11px] font-mono text-emerald-300/90 truncate mt-0.5">
                  {categoryMeta.shortLabel}
                  {tile.isFoss ? ' · FOSS' : ''}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${tile.label} popup`}
              className="p-1.5 -m-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* One-line Summary */}
          <p className="text-xs text-zinc-300 leading-relaxed mb-3">
            {tile.summary ||
              `Core ${categoryMeta.shortLabel} tool integrated across production workflows.`}
          </p>

          {/* Subtle Experience & Proficiency Indicator */}
          {prof && (
            <div className="mb-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400">
                  {prof.years} · <span className="text-zinc-300">{prof.levelLabel}</span>
                </span>
                <span className="text-amber-300/95 tabular-nums">{prof.proficiency}%</span>
              </div>
              <div
                className="h-1 w-full rounded-full bg-white/[0.08] overflow-hidden"
                role="progressbar"
                aria-valuenow={prof.proficiency}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${tile.label} proficiency ${prof.proficiency}%`}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${prof.proficiency}%`,
                    backgroundColor: categoryMeta.accentHex,
                  }}
                />
              </div>
            </div>
          )}

          {/* Official Website & GitHub Repository Links */}
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-white/[0.08]">
            {tile.websiteUrl ? (
              <a
                href={tile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border border-emerald-400/35 bg-emerald-500/12 hover:bg-emerald-500/22 text-xs font-mono text-emerald-100 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                <span>Official Site</span>
              </a>
            ) : (
              <span className="text-[11px] font-mono text-zinc-500">Internal / Custom Tool</span>
            )}

            {tile.githubUrl && (
              <a
                href={tile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border border-white/[0.14] bg-[#040e08]/85 hover:border-amber-400/45 hover:text-amber-100 text-xs font-mono text-zinc-200 transition-colors whitespace-nowrap"
              >
                <BrandMark brand="github" className="w-3.5 h-3.5 shrink-0" />
                <span>GitHub Repo</span>
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SkillToolPopover;
