import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Briefcase,
  Code2,
  Cpu,
  Database,
  HeartHandshake,
  Radio,
} from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';
import TextScramble from './motion/TextScramble';

interface ExperienceType {
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
  experience: ExperienceType[];
}

const getRoleIcon = (role: string, company: string) => {
  const combined = `${role} ${company}`.toLowerCase();
  if (combined.includes('daimler')) return Code2;
  if (combined.includes('udayan')) return HeartHandshake;
  if (combined.includes('stmicroelectronics')) return Cpu;
  if (combined.includes('multiplier')) return BarChart3;
  if (combined.includes('iit')) return Radio;
  if (combined.includes('goalkeep')) return Database;
  return Briefcase;
};

interface ExperienceRowProps {
  job: ExperienceType;
  index: number;
  dimmed: boolean;
  prefersReduced: boolean | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ExperienceRow: React.FC<ExperienceRowProps> = ({
  job,
  index,
  dimmed,
  prefersReduced,
  onMouseEnter,
  onMouseLeave,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const RoleIcon = getRoleIcon(job.role, job.company);
  const isFeatured = index === 0;

  // Multi-layer spatial depth: left metadata column glides subtly against right narrative column
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
        className="hidden md:flex absolute -left-[34px] top-7 w-3 h-3 rounded-sm border border-cyan-400/50 bg-[#040711] items-center justify-center"
      >
        <div className="w-1 h-1 bg-cyan-400/80" />
      </div>

      <GlassCard
        tilt={true}
        spotlight={true}
        brackets={isFeatured}
        chamfer={isFeatured}
        dimmed={dimmed}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="p-6 sm:p-7"
      >
        <div className="grid md:grid-cols-12 gap-6 items-start">
          {/* Left Metadata Column (foreground scroll layer) */}
          <motion.div
            style={prefersReduced ? undefined : { y: metaY }}
            className="md:col-span-4 space-y-1.5"
          >
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 tabular-nums">
              <RoleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <TextScramble text={job.duration} trigger="inView" durationMs={380} />
            </div>
            <div className="text-sm font-semibold text-zinc-100 pt-1">
              {job.company}
            </div>
            <div className="text-xs text-zinc-400">{job.location}</div>
            {job.milestone && (
              <div className="text-xs font-mono text-blue-300 pt-2">
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
                  <li key={i}>{desc.trim()}</li>
                ))}
              </ul>
            )}

            {job.skills && (
              <div className="mt-4 pt-3.5 border-t border-white/[0.08] text-xs font-mono text-zinc-400 flex flex-wrap gap-y-1 items-center">
                {job.skills.split('|').map((skill, sIdx) => (
                  <React.Fragment key={skill}>
                    {sIdx > 0 && (
                      <span className="mx-1.5 text-zinc-600" aria-hidden="true">
                        /
                      </span>
                    )}
                    <span>{skill.trim()}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export const Experience: React.FC<ExperienceProps> = ({ experience }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  // Scrubbed scroll-progress rail inspired by Kimi timeline progress thread & rotating marker
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 72%', 'end 82%'],
  });

  const railHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const markerRotate = useTransform(scrollYProgress, [0, 1], [0, 720]);

  return (
    <section id="experience" className="py-20 border-b border-white/[0.08]">
      {/* Section Header */}
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
          <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Career History</span>
        </span>
        <SplitText
          as="h2"
          text="Work Experience & Volunteering"
          stagger={0.04}
          className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-3 block"
        />
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Data pipelines, fleet software, and cloud applications at Daimler Truck, alongside end-to-end product engineering for Udayan Care NGO and data science internships.
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
            className="w-full bg-gradient-to-b from-blue-400 via-cyan-400 to-blue-500 origin-top relative"
          >
            {/* Rotating diamond/square tracer node sliding down the progress rail */}
            {!prefersReduced && (
              <motion.div
                style={{ rotate: markerRotate }}
                className="w-2.5 h-2.5 bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.85)] -translate-x-[4px] absolute -bottom-1 left-0 rounded-[2px]"
              />
            )}
          </motion.div>
        </div>

        <div className="space-y-5">
          {experience.map((job, index) => (
            <ExperienceRow
              key={`${job.role}-${index}`}
              job={job}
              index={index}
              dimmed={hoveredIndex !== null && hoveredIndex !== index}
              prefersReduced={prefersReduced}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;