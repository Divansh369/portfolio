import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Briefcase,
  Code2,
  Cpu,
  Database,
  HeartHandshake,
  Images,
  Radio,
} from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';
import TextScramble from './motion/TextScramble';
import RepoImage from './common/RepoImage';
import BrandMark from './icons/BrandMarks';
import { ProgressMilestone } from '../types';
import { resolveItemId } from '../utils/itemId';
import { splitQuantifiedSegments } from '../utils/atsAnalyzer';

interface ExperienceType {
  id?: string;
  role: string;
  company: string;
  location: string;
  duration: string;
  milestone?: string;
  description: string;
  skills: string;
  logo?: string;
}

interface ExperienceProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  activeRoleLabel?: string;
  experience: ExperienceType[];
  progressMilestones?: ProgressMilestone[];
  onOpenGallery?: (payload: {
    itemId: string;
    title: string;
    subtitle?: string;
    milestones: ProgressMilestone[];
  }) => void;
}

const getRoleIcon = (role: string, company: string) => {
  const combined = `${role} ${company}`.toLowerCase();
  if (combined.includes('volunteer') || combined.includes('ngo')) return HeartHandshake;
  if (combined.includes('verification') || combined.includes('hardware')) return Cpu;
  if (combined.includes('analyst') || combined.includes('bi')) return BarChart3;
  if (combined.includes('iot') || combined.includes('embedded')) return Radio;
  if (combined.includes('data')) return Database;
  if (combined.includes('engineer') || combined.includes('developer')) return Code2;
  return Briefcase;
};

interface ExperienceRowProps {
  job: ExperienceType;
  index: number;
  dimmed: boolean;
  prefersReduced: boolean | null;
  milestones: ProgressMilestone[];
  onOpenGallery?: (payload: {
    itemId: string;
    title: string;
    subtitle?: string;
    milestones: ProgressMilestone[];
  }) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ExperienceRow: React.FC<ExperienceRowProps> = ({
  job,
  index,
  dimmed,
  prefersReduced,
  milestones,
  onOpenGallery,
  onMouseEnter,
  onMouseLeave,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const RoleIcon = getRoleIcon(job.role, job.company);
  const isFeatured = index === 0;
  const itemId = resolveItemId(job.id, job.role, job.company);

  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ['start end', 'end start'],
  });

  const metaY = useTransform(scrollYProgress, [0, 1], [10, -10]);
  const bodyY = useTransform(scrollYProgress, [0, 1], [-4, 4]);

  return (
    <motion.div
      ref={rowRef}
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.28, delay: Math.min(index, 4) * 0.04 }}
      className="relative"
    >
      {/* Static subtle timeline node tick for alignment on md+ */}
      <div
        aria-hidden="true"
        className="hidden md:flex absolute -left-[34px] top-7 w-3 h-3 rounded-sm border border-amber-400/60 bg-[#040b07] items-center justify-center"
      >
        <div className="w-1 h-1 bg-amber-400/90" />
      </div>

      <GlassCard
        tilt={true}
        spotlight={true}
        brackets={isFeatured}
        chamfer={isFeatured}
        dimmed={dimmed}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="p-6 sm:p-8"
      >
        <div className="grid md:grid-cols-12 gap-4 md:gap-6 items-start">
          {/* Left Metadata Column (foreground scroll layer) */}
          <motion.div
            style={prefersReduced ? undefined : { y: metaY }}
            className="md:col-span-4 space-y-2"
          >
            <div className="flex items-center gap-3 pb-1">
              <RepoImage
                src={job.logo}
                alt={job.company}
                className="w-11 h-11 rounded-xl border border-white/15 bg-white/95 p-1 shrink-0 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.65)]"
                imgClassName="w-full h-full object-contain rounded-lg"
                fallback={
                  <span className="w-full h-full flex items-center justify-center bg-[#07150d] rounded-lg">
                    <BrandMark brand={job.company} className="w-6 h-6" />
                  </span>
                }
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-100 leading-snug">
                  {job.company}
                </div>
                <div className="text-xs text-zinc-400">{job.location}</div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 tabular-nums pt-0.5">
              <RoleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <TextScramble text={job.duration} trigger="inView" durationMs={380} />
            </div>
            {job.milestone && (
              <div className="text-xs font-mono text-amber-300 pt-1">
                {job.milestone}
              </div>
            )}
          </motion.div>

          {/* Right Role & Responsibilities Column (counter-depth scroll layer) */}
          <motion.div
            style={prefersReduced ? undefined : { y: bodyY }}
            className="md:col-span-8"
          >
            <h3 className="font-display text-xl font-bold text-zinc-50 mb-3 tracking-tight">
              {job.role}
            </h3>

            {job.description && (
              <ul className="space-y-2 text-sm text-zinc-300 leading-relaxed list-disc pl-5">
                {job.description.split('|').map((desc, i) => (
                  <li key={i}>
                    {splitQuantifiedSegments(desc.trim()).map((seg, sIdx) =>
                      seg.highlight ? (
                        <strong key={sIdx} className="font-semibold text-zinc-50">
                          {seg.text}
                        </strong>
                      ) : (
                        <React.Fragment key={sIdx}>{seg.text}</React.Fragment>
                      )
                    )}
                  </li>
                ))}
              </ul>
            )}

            {(job.skills || (onOpenGallery && milestones.length > 0)) && (
              <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
                {job.skills ? (
                  <div className="truncate text-zinc-400">
                    {(() => {
                      const list = job.skills
                        .split('|')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const head = list.slice(0, 5).join(' · ');
                      return list.length > 5 ? `${head} · +${list.length - 5}` : head;
                    })()}
                  </div>
                ) : (
                  <span />
                )}

                {onOpenGallery && milestones.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenGallery({
                        itemId,
                        title: `${job.role} — ${job.company}`,
                        subtitle: `${job.location} · ${job.duration}`,
                        milestones,
                      })
                    }
                    className="inline-flex items-center gap-1.5 min-h-[40px] py-1 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer shrink-0 tabular-nums"
                  >
                    <Images className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Work Timeline ({milestones.length})</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export const Experience: React.FC<ExperienceProps> = ({
  eyebrow = 'Career History',
  title = 'Work Experience & Volunteering',
  subtitle = 'Production software engineering, data pipelines, community impact builds, and technical internships.',
  activeRoleLabel,
  experience,
  progressMilestones = [],
  onOpenGallery,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 72%', 'end 82%'],
  });

  const railHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const markerRotate = useTransform(scrollYProgress, [0, 1], [0, 720]);

  return (
    <section id="experience" className="py-24 sm:py-28 border-b border-white/[0.08]">
      {/* Section Header */}
      <div className="mb-14">
        <span className="inline-flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-400/90 mb-2">
          <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{eyebrow}</span>
          {activeRoleLabel && (
            <>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className="text-zinc-300">Tailored for {activeRoleLabel}</span>
            </>
          )}
        </span>
        <SplitText
          as="h2"
          text={title}
          stagger={0.04}
          className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-3 block"
        />
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Interactive Vertical Scroll-Scrubbed Rail + Frosted Glass Career Cards */}
      <div ref={timelineRef} className="relative md:pl-10">
        {/* Scroll-Scrubbed Progress Track (Desktop md+) */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute left-3 top-2 bottom-2 w-px bg-white/[0.12]"
        >
          <motion.div
            style={prefersReduced ? { height: '100%' } : { height: railHeight }}
            className="w-full bg-gradient-to-b from-emerald-400 via-yellow-400 to-orange-500 origin-top relative"
          >
            {!prefersReduced && (
              <motion.div
                style={{ rotate: markerRotate }}
                className="w-2.5 h-2.5 bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.85)] -translate-x-[4px] absolute -bottom-1 left-0 rounded-[2px]"
              />
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          {experience.map((job, index) => {
            const jobId = resolveItemId(job.id, job.role, job.company);
            const jobMilestones = progressMilestones.filter((m) => m.itemId === jobId);
            return (
              <ExperienceRow
                key={`${job.role}-${index}`}
                job={job}
                index={index}
                dimmed={hoveredIndex !== null && hoveredIndex !== index}
                prefersReduced={prefersReduced}
                milestones={jobMilestones}
                onOpenGallery={onOpenGallery}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Experience;