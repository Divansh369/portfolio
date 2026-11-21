import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  FolderOpen,
  ImagePlus,
  Layers,
  Lightbulb,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ProgressMilestone } from '../types';
import { resolveRepoAsset } from './common/RepoImage';
import CornerBrackets from './motion/CornerBrackets';

interface ProgressGalleryModalProps {
  isOpen: boolean;
  itemTitle: string;
  itemSubtitle?: string;
  itemId: string;
  milestones: ProgressMilestone[];
  onClose: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
    scale: 0.985,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    scale: 0.985,
  }),
};

const BlueprintPlaceholder: React.FC<{
  milestone: ProgressMilestone;
  index: number;
  itemId: string;
}> = ({ milestone, index, itemId }) => {
  const stepNum = String(index + 1).padStart(2, '0');
  const suggestedLocalPath = `/images/gallery/${itemId}/${stepNum}.webp`;

  return (
    <div className="relative w-full h-full min-h-[210px] sm:min-h-[360px] rounded-xl overflow-hidden bg-[#050a16] border border-cyan-400/20 flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Blueprint Architectural Micro-Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,211,238,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.14),transparent_70%)]"
      />

      {/* Corner Calibration Marks */}
      <span aria-hidden="true" className="absolute top-3 left-3 w-3 h-3 border-t border-l border-cyan-400/50" />
      <span aria-hidden="true" className="absolute top-3 right-3 w-3 h-3 border-t border-r border-cyan-400/50" />
      <span aria-hidden="true" className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-cyan-400/50" />
      <span aria-hidden="true" className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-cyan-400/50" />

      {/* Top Wireframe Metadata */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <span className="inline-flex items-center gap-2 text-cyan-300">
          <Compass className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Blueprint Schematic · Step {stepNum}</span>
        </span>
        <span className="text-zinc-400 tabular-nums">
          {milestone.date} <span aria-hidden="true">·</span> {milestone.phase}
        </span>
      </div>

      {/* Central Wireframe Graphic & Idea Preview */}
      <div className="relative z-10 my-auto py-6 flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl border border-dashed border-cyan-400/45 bg-cyan-500/[0.08] flex items-center justify-center mb-4">
          <ImagePlus className="w-6 h-6 text-cyan-300" aria-hidden="true" />
        </div>
        <div className="font-display text-lg sm:text-xl font-bold text-zinc-100 tracking-tight mb-2">
          {milestone.title}
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-3">
          {milestone.ideaNote}
        </p>
      </div>

      {/* Drop-In Asset Path / URL Guide */}
      <div className="relative z-10 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
        <span className="inline-flex items-center gap-1.5 text-zinc-300">
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
          <span>Add photo or URL for itemId:</span>
          <code className="text-cyan-300">{itemId}</code>
        </span>
        <code className="text-zinc-400 truncate max-w-full sm:max-w-[260px]" title={suggestedLocalPath}>
          mediaUrl: "{suggestedLocalPath}"
        </code>
      </div>
    </div>
  );
};

export const ProgressGalleryModal: React.FC<ProgressGalleryModalProps> = ({
  isOpen,
  itemTitle,
  itemSubtitle,
  itemId,
  milestones,
  onClose,
}) => {
  const prefersReduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imgFailedMap, setImgFailedMap] = useState<Record<string, boolean>>({});
  const touchStartXRef = useRef<number | null>(null);

  const orderedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [milestones]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(0);
    setDirection(1);
    setImgFailedMap({});
  }, [isOpen, itemId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && orderedMilestones.length > 1) {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % orderedMilestones.length);
      } else if (e.key === 'ArrowLeft' && orderedMilestones.length > 1) {
        setDirection(-1);
        setActiveIndex((prev) => (prev - 1 + orderedMilestones.length) % orderedMilestones.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, orderedMilestones.length, onClose]);

  const current = orderedMilestones[activeIndex];
  const resolvedMedia = current?.mediaUrl ? resolveRepoAsset(current.mediaUrl) : '';
  const hasWorkingImage =
    Boolean(resolvedMedia) &&
    current?.mediaType !== 'link' &&
    !imgFailedMap[current?.id || ''];

  const goToIndex = (targetIdx: number) => {
    if (targetIdx === activeIndex) return;
    setDirection(targetIdx > activeIndex ? 1 : -1);
    setActiveIndex(targetIdx);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || orderedMilestones.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) < 45) return;
    if (deltaX < 0) {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % orderedMilestones.length);
    } else {
      setDirection(-1);
      setActiveIndex((prev) => (prev - 1 + orderedMilestones.length) % orderedMilestones.length);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          className="fixed inset-0 bg-[#02040a]/88 z-[110] flex justify-center items-center p-2.5 sm:p-6 backdrop-blur-lg overflow-y-auto"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${itemTitle} Progress Gallery`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="glass-panel rounded-2xl max-w-5xl w-full relative overflow-hidden flex flex-col max-h-[94dvh] my-auto"
            onClick={(e) => e.stopPropagation()}
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.95, y: 18 }
            }
            animate={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12 }
            }
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <CornerBrackets />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-4 sm:px-6 border-b border-white/[0.08] bg-[#050914]/75">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-400/90 mb-1">
                  <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Evolution &amp; Build Log</span>
                  <span className="text-zinc-600" aria-hidden="true">·</span>
                  <span className="text-zinc-400 tabular-nums">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(orderedMilestones.length).padStart(2, '0')}
                  </span>
                </div>
                <h2 className="font-display text-lg sm:text-2xl font-bold text-zinc-50 tracking-tight truncate">
                  {itemTitle}
                </h2>
                {itemSubtitle && (
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{itemSubtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {orderedMilestones.length > 1 && (
                  <div className="flex items-center gap-1 mr-1">
                    <button
                      type="button"
                      onClick={() =>
                        goToIndex((activeIndex - 1 + orderedMilestones.length) % orderedMilestones.length)
                      }
                      aria-label="Previous milestone"
                      className="p-2 min-w-[44px] min-h-[44px] rounded-xl glass-panel-subtle hover:border-cyan-400/40 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => goToIndex((activeIndex + 1) % orderedMilestones.length)}
                      aria-label="Next milestone"
                      className="p-2 min-w-[44px] min-h-[44px] rounded-xl glass-panel-subtle hover:border-cyan-400/40 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close progress gallery"
                  className="p-2 min-w-[44px] min-h-[44px] rounded-xl glass-panel-subtle text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Animated Stage + Editorial Rationale */}
            <div
              className="flex-1 overflow-y-auto p-3.5 sm:p-6"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current.id}
                  custom={direction}
                  variants={prefersReduced ? undefined : slideVariants}
                  initial={prefersReduced ? { opacity: 0 } : 'enter'}
                  animate={prefersReduced ? { opacity: 1 } : 'center'}
                  exit={prefersReduced ? { opacity: 0 } : 'exit'}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="grid lg:grid-cols-12 gap-4 sm:gap-6 items-stretch"
                >
                  {/* Visual Canvas / Blueprint Placeholder */}
                  <div className="lg:col-span-7 flex flex-col">
                    {hasWorkingImage ? (
                      <div className="relative w-full h-full min-h-[210px] sm:min-h-[360px] rounded-xl overflow-hidden border border-white/[0.1] bg-[#040711] flex items-center justify-center">
                        <img
                          src={resolvedMedia}
                          alt={`${itemTitle} - ${current.title}`}
                          referrerPolicy="no-referrer"
                          onLoad={(e) => {
                            if (e.currentTarget.naturalWidth === 0) {
                              setImgFailedMap((prev) => ({ ...prev, [current.id]: true }));
                            }
                          }}
                          onError={() =>
                            setImgFailedMap((prev) => ({ ...prev, [current.id]: true }))
                          }
                          className="w-full h-full max-h-[260px] sm:max-h-[420px] object-contain"
                        />
                        {current.caption && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 text-xs text-zinc-200">
                            {current.caption}
                          </div>
                        )}
                      </div>
                    ) : (
                      <BlueprintPlaceholder
                        milestone={current}
                        index={activeIndex}
                        itemId={itemId}
                      />
                    )}
                  </div>

                  {/* Idea, Iteration & Outcome Dossier */}
                  <div className="lg:col-span-5 flex flex-col justify-between glass-panel-subtle rounded-xl p-5 sm:p-6 space-y-5">
                    <div className="space-y-4">
                      {/* Clean Unboxed Date & Phase Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 text-cyan-300 tabular-nums">
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{current.date}</span>
                        </span>
                        <span className="text-zinc-600" aria-hidden="true">·</span>
                        <span className="text-zinc-200 font-medium">{current.phase}</span>
                      </div>

                      <h3 className="font-display text-xl font-bold text-zinc-50 tracking-tight leading-snug">
                        {current.title}
                      </h3>

                      <div className="pt-3 border-t border-white/[0.08] space-y-2">
                        <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400">
                          <Lightbulb className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Idea &amp; Iteration Context</span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {current.ideaNote}
                        </p>
                      </div>

                      {current.outcome && (
                        <div className="pt-3 border-t border-white/[0.08] space-y-2">
                          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>What Shipped / Result</span>
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed">
                            {current.outcome}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2 text-xs font-mono text-zinc-500">
                      <span>Swipe or use ← / → keys</span>
                      {current.mediaUrl && current.mediaType === 'link' && (
                        <a
                          href={current.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                        >
                          <span>Open Media Link</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Chronological Interactive Scrub Timeline Rail */}
            <div className="p-4 sm:px-6 border-t border-white/[0.08] bg-[#050914]/85 overflow-x-auto">
              <div className="flex items-stretch gap-2.5 min-w-max">
                {orderedMilestones.map((m, idx) => {
                  const selected = idx === activeIndex;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => goToIndex(idx)}
                      className={`group text-left px-3.5 py-2.5 min-h-[44px] rounded-xl border transition-all cursor-pointer flex flex-col justify-center min-w-[165px] max-w-[230px] ${
                        selected
                          ? 'bg-gradient-to-r from-blue-600/25 to-cyan-500/20 border-cyan-400/55 text-white'
                          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/25 text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums mb-0.5">
                        <span className={selected ? 'text-cyan-300' : 'text-zinc-500'}>
                          {String(idx + 1).padStart(2, '0')} · {m.date}
                        </span>
                        <span className="truncate text-[10px] opacity-80">{m.phase}</span>
                      </div>
                      <div className="text-xs font-medium truncate">{m.title}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProgressGalleryModal;
