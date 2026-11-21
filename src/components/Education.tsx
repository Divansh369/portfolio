import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Award, BookOpen, GraduationCap } from 'lucide-react';
import { Certificate } from '../types';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';
import RepoImage from './common/RepoImage';
import BrandMark from './icons/BrandMarks';

export interface EducationType {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
  logo?: string;
}

interface EducationProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  education: EducationType[];
  certificates?: Certificate[];
}

export const Education: React.FC<EducationProps> = ({
  eyebrow = 'Academic History & Credentials',
  title = 'Education & Certifications',
  subtitle = 'Academic degrees, foundational coursework, and verified technical certifications.',
  education,
  certificates,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  return (
    <section id="education" className="py-16 sm:py-20 border-b border-white/[0.08]">
      {/* Section Header */}
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
          <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{eyebrow}</span>
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

      {/* 3-Column Academic Frosted Glass Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {education.map((edu, index) => {
          const dimmed = hoveredIndex !== null && hoveredIndex !== index;
          return (
            <motion.div
              key={`${edu.institution}-${edu.degree}-${index}`}
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.28, delay: index * 0.05 }}
              className="flex"
            >
              <GlassCard
                tilt={true}
                spotlight={true}
                dimmed={dimmed}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="p-6 w-full"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
                    <RepoImage
                      src={edu.logo}
                      alt={edu.institution}
                      className="w-11 h-11 rounded-xl border border-white/15 bg-white/95 p-1 shrink-0"
                      imgClassName="w-full h-full object-contain rounded-lg"
                      fallback={
                        <span className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg">
                          <BrandMark brand={edu.institution} className="w-6 h-6" />
                        </span>
                      }
                    />
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 tabular-nums">
                      <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{edu.duration}</span>
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-zinc-50 mb-1.5 tracking-tight">
                    {edu.institution}
                  </h3>
                  <p className="text-sm text-zinc-300 mb-6">{edu.degree}</p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-xs font-mono flex justify-between items-baseline gap-2">
                  <span className="text-zinc-400">Score</span>
                  <span className="text-zinc-50 font-semibold tabular-nums">{edu.gpa}</span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Certifications 2-Column Frosted Ledger */}
      {certificates && certificates.length > 0 && (
        <div className="mt-12 pt-10 border-t border-white/[0.08]">
          <h3 className="font-display text-lg font-bold text-zinc-100 mb-6 inline-flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Certifications</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-3.5">
            {certificates.map((cert, idx) => (
              <div
                key={`${cert.name}-${idx}`}
                className="glass-panel-subtle glass-panel-hover rounded-xl px-4 py-3.5 min-h-[48px] flex items-center justify-between gap-3 text-sm transition-colors"
              >
                <span className="inline-flex items-center gap-2.5 text-zinc-200 font-medium min-w-0">
                  <RepoImage
                    src={cert.logo}
                    alt={cert.name}
                    className="w-4 h-4 shrink-0"
                    imgClassName="w-full h-full object-contain"
                    fallback={<BrandMark brand={cert.name} className="w-4 h-4 shrink-0" />}
                  />
                  <span className="line-clamp-2 sm:truncate">{cert.name}</span>
                </span>
                <span className="text-xs font-mono text-cyan-400/90 whitespace-nowrap shrink-0 tabular-nums">
                  {cert.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Education;