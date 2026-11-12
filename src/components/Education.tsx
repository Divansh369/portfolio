import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Award, BookOpen, GraduationCap } from 'lucide-react';
import { Certificate } from '../types';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';

export interface EducationType {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
}

interface EducationProps {
  education: EducationType[];
  certificates?: Certificate[];
}

export const Education: React.FC<EducationProps> = ({ education, certificates }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  return (
    <section id="education" className="py-20 border-b border-white/[0.08]">
      {/* Section Header */}
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
          <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Academic History &amp; Credentials</span>
        </span>
        <SplitText
          as="h2"
          text="Education & Certifications"
          stagger={0.04}
          className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-3 block"
        />
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          B.Tech in Data Science from Manipal Institute of Technology alongside CBSE schooling in New Delhi and completed coursework certifications.
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
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 tabular-nums mb-2">
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{edu.duration}</span>
                  </span>
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
                className="glass-panel-subtle glass-panel-hover rounded-xl px-4 py-3.5 flex items-baseline justify-between gap-4 text-sm transition-colors"
              >
                <span className="text-zinc-200 font-medium">{cert.name}</span>
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