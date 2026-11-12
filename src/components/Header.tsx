import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  FileText,
  Globe,
  GraduationCap,
  Server,
  Smartphone,
  Truck,
  Workflow,
} from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';
import FloodButton from './motion/FloodButton';
import CountUp from './motion/CountUp';
import TextScramble from './motion/TextScramble';

interface Social {
  name: string;
  url: string;
  logos: string;
}

interface HeroMetric {
  value: string;
  label: string;
}

interface HeaderProps {
  name: string;
  title: string;
  socials: Social[];
  kicker?: string[];
  headline?: string;
  lead?: string;
  metrics?: HeroMetric[];
  onOpenCvModal?: () => void;
}

const defaultMetrics: HeroMetric[] = [
  { value: '70,000+', label: 'Trucks in Daily ETL' },
  { value: 'FastAPI + Spark', label: 'Internal Databricks Apps' },
  { value: 'Google Play', label: 'Live App for Udayan Care' },
  { value: 'Proxmox + Linux', label: 'Self-Hosted Lab & K3s' },
];

const metricIcons = [Truck, Workflow, Smartphone, Server];

export const Header: React.FC<HeaderProps> = ({
  name = 'Divansh Prasad',
  socials,
  kicker = ['Software Engineer', 'Daimler Truck (DTICI)', 'Bengaluru'],
  headline = 'Software Engineer building data systems and backend apps.',
  lead = 'At Daimler Truck, I work on Databricks ETL for 70,000+ trucks, FastAPI web apps, and automated OTA data workflows. I also build Flutter apps for non-profits and run my own Proxmox and Linux lab.',
  metrics = defaultMetrics,
  onOpenCvModal,
}) => {
  const heroRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  // Multi-layer 3D depth recede & subtle vertical parallax split as the hero leaves viewport
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const depthScale = useTransform(scrollYProgress, [0, 1], [1, 0.962]);
  const depthOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 0.92, 0.5]);
  const leftParallaxY = useTransform(scrollYProgress, [0, 1], [0, -10]);
  const cardParallaxY = useTransform(scrollYProgress, [0, 1], [0, -28]);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="pt-28 pb-16 md:pt-36 md:pb-20 border-b border-white/[0.08]"
    >
      <motion.div
        style={prefersReduced ? undefined : { scale: depthScale, opacity: depthOpacity }}
        className="origin-top will-change-transform"
      >
        {/* 2-Column Split Hero */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Column: Kinetic Typographic Hierarchy */}
          <motion.div
            style={prefersReduced ? undefined : { y: leftParallaxY }}
            className="lg:col-span-7 flex flex-col justify-between"
          >
            <div>
              {/* Clean Unboxed Kicker */}
              <motion.div
                className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400 mb-5"
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {kicker.map((item, idx) => (
                  <React.Fragment key={item}>
                    {idx > 0 && (
                      <span className="text-zinc-600" aria-hidden="true">
                        ·
                      </span>
                    )}
                    <span className={idx === 0 ? 'text-cyan-400 font-semibold' : ''}>{item}</span>
                  </React.Fragment>
                ))}
              </motion.div>

              {/* Kinetic SplitText Display Headline (descender-safe) */}
              <SplitText
                as="h1"
                text={headline}
                triggerOnMount={true}
                delay={0.06}
                stagger={0.045}
                className="font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight text-zinc-50 mb-6 leading-[1.08] max-w-2xl"
              />

              {/* Crisp Editorial Lead */}
              <motion.p
                className="text-base sm:text-lg text-zinc-300/90 leading-relaxed max-w-xl mb-8"
                initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                {lead}
              </motion.p>
            </div>

            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Primary & Secondary Action Row */}
              <div className="flex flex-wrap items-center gap-3 mb-7">
                {onOpenCvModal && (
                  <FloodButton
                    onClick={onOpenCvModal}
                    variant="primary"
                    chamfer={true}
                    className="px-5 py-2.5 min-h-[44px] text-sm"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span>View Resume / CV</span>
                  </FloodButton>
                )}

                <FloodButton
                  href="#projects"
                  variant="glass"
                  className="px-5 py-2.5 min-h-[44px] text-sm"
                >
                  <span>Selected Work</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 text-cyan-400"
                    aria-hidden="true"
                  />
                </FloodButton>

                <FloodButton
                  href="#homelab"
                  variant="ghost"
                  className="px-5 py-2.5 min-h-[44px] text-sm font-medium"
                >
                  <Server
                    className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-400 transition-colors"
                    aria-hidden="true"
                  />
                  <span>Proxmox Story</span>
                </FloodButton>
              </div>

              {/* Unboxed Social Links */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-mono text-zinc-500">
                {socials.map((social, idx) => (
                  <React.Fragment key={social.name}>
                    {idx > 0 && (
                      <span className="text-zinc-700" aria-hidden="true">
                        ·
                      </span>
                    )}
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link inline-flex items-center gap-1 text-zinc-400 hover:text-cyan-300 transition-colors py-1"
                    >
                      <span>{social.name}</span>
                      <ArrowUpRight
                        className="w-3 h-3 text-zinc-600 group-hover/link:text-cyan-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                        aria-hidden="true"
                      />
                    </a>
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Interactive 3D-Tilt Chamfered Glass Instrument Dossier */}
          <motion.div
            className="lg:col-span-5 flex"
            style={prefersReduced ? undefined : { y: cardParallaxY }}
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard
              tilt={true}
              spotlight={true}
              brackets={true}
              chamfer={true}
              className="p-6 sm:p-7 w-full"
            >
              <div>
                <div className="flex items-center gap-4 pb-5 border-b border-white/[0.08]">
                  <div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/25 via-cyan-500/15 to-slate-900/80 border border-cyan-400/25 flex items-center justify-center font-display font-bold text-base text-cyan-300 shrink-0 tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    aria-hidden="true"
                  >
                    DP
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-lg text-zinc-50 truncate">{name}</h2>
                    <p className="text-xs text-zinc-400 truncate">
                      Software Engineer · Daimler Truck, Bengaluru
                    </p>
                  </div>
                </div>

                {/* Crisp Specification Rows with Functional Icons */}
                <dl className="mt-4 divide-y divide-white/[0.07] text-xs">
                  <div className="py-3 flex justify-between items-center gap-4">
                    <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                      <Workflow className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                      <span>Focus</span>
                    </dt>
                    <dd className="font-mono text-zinc-100 text-right">
                      Databricks ETL · FastAPI · Flutter
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between items-center gap-4">
                    <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                      <span>Production Scale</span>
                    </dt>
                    <dd className="font-mono text-zinc-100 tabular-nums text-right">
                      <CountUp to={70000} prefix="~" suffix=" Connected Trucks" duration={1.1} />
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between items-center gap-4">
                    <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                      <span>Background</span>
                    </dt>
                    <dd className="font-mono text-zinc-100 text-right">
                      1+ Yr Full-Time · 4 Internships
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between items-center gap-4">
                    <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                      <span>Infrastructure</span>
                    </dt>
                    <dd className="font-mono text-zinc-100 text-right">
                      Proxmox VE · Linux · Docker · K3s
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between items-center gap-4">
                    <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                      <span>Education</span>
                    </dt>
                    <dd className="font-mono text-zinc-100 text-right">
                      B.Tech Data Science · MIT Manipal
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between items-center gap-4">
                    <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                      <span>Live Apps &amp; Web</span>
                    </dt>
                    <dd className="font-mono text-zinc-200 text-right">
                      diivvansh.com · fiorejoy.com
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Footer Action Links with Hover Scramble Resolve */}
              <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <a
                  href="https://pve.diivvansh.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-100 transition-colors inline-flex items-center gap-1"
                >
                  <TextScramble text="pve.diivvansh.com" trigger="hover" durationMs={320} />
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <a
                  href="https://udayan.diivvansh.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 pr-2"
                >
                  <TextScramble text="udayan.diivvansh.com" trigger="hover" durationMs={320} />
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Full-Width Frosted Glass Quantitative Proof Strip */}
        <div className="mt-14 pt-8 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {metrics.map((metric, idx) => {
            const Icon = metricIcons[idx % metricIcons.length];
            const isTruckMetric = metric.value.trim().startsWith('70,000');

            return (
              <motion.div
                key={idx}
                initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.34 + idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="glass-panel-subtle glass-panel-hover rounded-2xl p-4 sm:p-5 transition-colors duration-200"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono text-zinc-400">{metric.label}</span>
                  <Icon className="w-4 h-4 text-cyan-400/80 shrink-0" aria-hidden="true" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-display text-zinc-50 tabular-nums tracking-tight">
                  {isTruckMetric ? (
                    <CountUp to={70000} suffix="+" duration={1.15} />
                  ) : (
                    metric.value
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};

export default Header;