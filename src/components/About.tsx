import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Briefcase,
  Code2,
  Compass,
  Database,
  Globe,
  GraduationCap,
  HeartHandshake,
  Server,
  Truck,
  User,
} from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';

interface AboutFact {
  label: string;
  value: string;
  icon?: string;
}

interface AboutProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  facts?: AboutFact[];
  bio: string[];
  interests?: string[];
}

const getFactIcon = (iconKey?: string) => {
  switch ((iconKey || '').toLowerCase()) {
    case 'briefcase':
      return Briefcase;
    case 'truck':
      return Truck;
    case 'heart':
      return HeartHandshake;
    case 'server':
      return Server;
    case 'graduation':
      return GraduationCap;
    case 'database':
      return Database;
    case 'code':
      return Code2;
    case 'globe':
    default:
      return Globe;
  }
};

export const About: React.FC<AboutProps> = ({
  eyebrow = 'Background',
  title = 'Engineering Approach & Focus',
  subtitle = 'Building reliable software, distributed systems, and practical infrastructure end-to-end.',
  facts = [],
  bio,
  interests,
}) => {
  const prefersReduced = useReducedMotion();

  return (
    <section id="about" className="py-24 sm:py-28 border-b border-white/[0.08]">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Summary & Frosted Fact Sheet */}
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400/90 mb-2">
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{eyebrow}</span>
          </span>
          <SplitText
            as="h2"
            text={title}
            stagger={0.04}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-4 block"
          />
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            {subtitle}
          </p>

          {facts.length > 0 && (
            <GlassCard tilt={true} spotlight={true} brackets={true} className="p-6">
              <dl className="divide-y divide-white/[0.07] text-xs font-mono">
                {facts.map((fact) => {
                  const FactIcon = getFactIcon(fact.icon);
                  return (
                    <div key={fact.label} className="py-2.5 flex justify-between items-center gap-4">
                      <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                        <FactIcon className="w-3.5 h-3.5 text-emerald-400/80" aria-hidden="true" />
                        <span>{fact.label}</span>
                      </dt>
                      <dd className="text-zinc-100 font-semibold text-right">{fact.value}</dd>
                    </div>
                  );
                })}
              </dl>
            </GlassCard>
          )}

          {interests && interests.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/[0.08] text-xs font-mono text-zinc-400">
              <span className="inline-flex items-center gap-2 text-zinc-400 mb-2">
                <Compass className="w-3.5 h-3.5 text-amber-400/80" aria-hidden="true" />
                <span>Outside Engineering</span>
              </span>
              <div className="flex flex-wrap items-center gap-y-1">
                {interests.map((item, idx) => (
                  <React.Fragment key={item}>
                    {idx > 0 && (
                      <span className="mx-2 text-zinc-600" aria-hidden="true">
                        /
                      </span>
                    )}
                    <span className="text-zinc-200">{item}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Clean Open Editorial Prose */}
        <motion.div
          className="lg:col-span-7 space-y-6 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl"
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3 }}
        >
          {bio.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default About;