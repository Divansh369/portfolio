import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Code2,
  Database,
  FileText,
  Globe,
  GraduationCap,
  HeartHandshake,
  Layers,
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
import RepoImage from './common/RepoImage';
import BrandMark from './icons/BrandMarks';
import { DossierLink, DossierRow, Social } from '../types';

interface HeroMetric {
  value: string;
  label: string;
  countTo?: number;
  countSuffix?: string;
}

interface HeaderProps {
  name: string;
  title: string;
  location?: string;
  avatarUrl?: string;
  socials: Social[];
  kicker?: string[];
  headline?: string;
  lead?: string;
  secondaryAction?: {
    label: string;
    href: string;
  };
  dossierSubtitle?: string;
  dossierRows?: DossierRow[];
  dossierLinks?: DossierLink[];
  metrics?: HeroMetric[];
  onOpenCvModal?: () => void;
}

const defaultMetrics: HeroMetric[] = [
  { value: 'Full-Stack', label: 'Web & Backend Delivery' },
  { value: 'Data Systems', label: 'Pipelines & Analytics' },
  { value: 'Open Source', label: 'Shipped Applications' },
  { value: 'Linux & Cloud', label: 'Self-Hosted Infrastructure' },
];

const metricIcons = [Truck, Workflow, Smartphone, Server];

const getDossierIcon = (key?: string) => {
  switch ((key || '').toLowerCase()) {
    case 'truck':
      return Truck;
    case 'briefcase':
      return Briefcase;
    case 'server':
      return Server;
    case 'graduation':
      return GraduationCap;
    case 'globe':
      return Globe;
    case 'database':
      return Database;
    case 'code':
      return Code2;
    case 'heart':
      return HeartHandshake;
    case 'layers':
      return Layers;
    case 'workflow':
    default:
      return Workflow;
  }
};

export const Header: React.FC<HeaderProps> = ({
  name = 'Developer Portfolio',
  title = 'Software Engineer',
  location,
  avatarUrl = './images/profile.jpg',
  socials,
  kicker = ['Software Engineer', 'Systems & Applications'],
  headline = 'Software Engineer building scalable data systems and applications.',
  lead = 'Designing production APIs, distributed data pipelines, cross-platform applications, and resilient Linux infrastructure.',
  secondaryAction,
  dossierSubtitle,
  dossierRows,
  dossierLinks = [],
  metrics = defaultMetrics,
  onOpenCvModal,
}) => {
  const heroRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const depthScale = useTransform(scrollYProgress, [0, 1], [1, 0.962]);
  const depthOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 0.92, 0.5]);
  const leftParallaxY = useTransform(scrollYProgress, [0, 1], [0, -10]);
  const cardParallaxY = useTransform(scrollYProgress, [0, 1], [0, -28]);

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'PF';

  const resolvedSubtitle =
    dossierSubtitle || (location ? `${title} · ${location}` : title);

  const effectiveDossierRows: DossierRow[] =
    dossierRows && dossierRows.length > 0
      ? dossierRows
      : [
          { label: 'Role', value: title, icon: 'briefcase' },
          ...(location ? [{ label: 'Location', value: location, icon: 'globe' }] : []),
          ...(kicker.length > 0
            ? [{ label: 'Focus', value: kicker.join(' · '), icon: 'workflow' }]
            : []),
        ];

  return (
    <section
      id="hero"
      ref={heroRef}
      className="pt-24 pb-14 sm:pt-28 sm:pb-16 md:pt-36 md:pb-20 border-b border-white/[0.08]"
    >
      <motion.div
        style={prefersReduced ? undefined : { scale: depthScale, opacity: depthOpacity }}
        className="origin-top will-change-transform"
      >
        {/* 2-Column Split Hero */}
        <div className="grid lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-stretch">
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
                  <React.Fragment key={`${item}-${idx}`}>
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
                className="font-display text-[2rem] sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight text-zinc-50 mb-5 sm:mb-6 leading-[1.1] max-w-2xl"
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
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-7">
                {onOpenCvModal && (
                  <FloodButton
                    onClick={onOpenCvModal}
                    variant="primary"
                    chamfer={true}
                    className="w-full sm:w-auto justify-center px-5 py-2.5 min-h-[44px] text-sm"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span>View Resume / CV</span>
                  </FloodButton>
                )}

                <FloodButton
                  href="#projects"
                  variant="glass"
                  className="flex-1 sm:flex-none justify-center px-4 sm:px-5 py-2.5 min-h-[44px] text-sm"
                >
                  <span>Selected Work</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 text-cyan-400"
                    aria-hidden="true"
                  />
                </FloodButton>

                {secondaryAction && (
                  <FloodButton
                    href={secondaryAction.href}
                    variant="ghost"
                    className="flex-1 sm:flex-none justify-center px-4 sm:px-5 py-2.5 min-h-[44px] text-sm font-medium"
                  >
                    <Server
                      className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-400 transition-colors"
                      aria-hidden="true"
                    />
                    <span>{secondaryAction.label}</span>
                  </FloodButton>
                )}
              </div>

              {/* Social Contact Links with Repo Icons & Brand SVG Fallbacks */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs font-mono">
                {socials.map((social) => {
                  const isMail = social.url.startsWith('mailto:');
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target={isMail ? undefined : '_blank'}
                      rel={isMail ? undefined : 'noopener noreferrer'}
                      className="group/link inline-flex items-center gap-2 px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-[34px] rounded-xl glass-panel-subtle glass-panel-hover text-zinc-300 hover:text-cyan-200 transition-all"
                    >
                      <RepoImage
                        src={social.logos}
                        alt={social.name}
                        className="w-4 h-4 rounded-[3px] shrink-0"
                        imgClassName="w-full h-full object-contain rounded-[3px]"
                        fallback={
                          <BrandMark
                            brand={social.name}
                            className="w-4 h-4 text-zinc-300 group-hover/link:text-cyan-300 transition-colors"
                          />
                        }
                      />
                      <span>{social.name}</span>
                      <ArrowUpRight
                        className="w-3 h-3 text-zinc-500 group-hover/link:text-cyan-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                        aria-hidden="true"
                      />
                    </a>
                  );
                })}
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
                  <RepoImage
                    src={avatarUrl || './images/profile.jpg'}
                    alt={name}
                    loading="eager"
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/25 via-cyan-500/15 to-slate-900/80 border border-cyan-400/35 shrink-0 shadow-[0_10px_28px_-12px_rgba(34,211,238,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]"
                    imgClassName="w-full h-full object-cover"
                    fallback={
                      <span className="font-display font-bold text-lg text-cyan-300 tracking-tight">
                        {initials}
                      </span>
                    }
                  />
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-lg text-zinc-50 truncate">{name}</h2>
                    <p className="text-xs text-zinc-400 truncate">{resolvedSubtitle}</p>
                  </div>
                </div>

                {/* Crisp Specification Rows with Functional Icons */}
                <dl className="mt-4 divide-y divide-white/[0.07] text-xs">
                  {effectiveDossierRows.map((row) => {
                    const RowIcon = getDossierIcon(row.icon);
                    return (
                      <div key={row.label} className="py-3 flex justify-between items-center gap-3">
                        <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                          <RowIcon className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                          <span>{row.label}</span>
                        </dt>
                        <dd className="font-mono text-zinc-100 text-right tabular-nums min-w-0 break-words">
                          {typeof row.countTo === 'number' ? (
                            <CountUp
                              to={row.countTo}
                              prefix={row.countPrefix || ''}
                              suffix={row.countSuffix || ''}
                              duration={1.1}
                            />
                          ) : (
                            row.value
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>

              {/* Footer Action Links with Hover Scramble Resolve */}
              {dossierLinks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  {dossierLinks.map((link, idx) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`py-1 transition-colors inline-flex items-center gap-1 ${
                        idx === dossierLinks.length - 1
                          ? 'text-cyan-400 hover:text-cyan-300 pr-2'
                          : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      <TextScramble text={link.label} trigger="hover" durationMs={320} />
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* Full-Width Frosted Glass Quantitative Proof Strip */}
        <div className="mt-10 sm:mt-14 pt-8 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {metrics.map((metric, idx) => {
            const Icon = metricIcons[idx % metricIcons.length];

            return (
              <motion.div
                key={`${metric.label}-${idx}`}
                initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.34 + idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="glass-panel-subtle glass-panel-hover rounded-2xl p-3.5 sm:p-5 transition-colors duration-200 min-w-0"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono text-zinc-400 truncate">{metric.label}</span>
                  <Icon className="w-4 h-4 text-cyan-400/80 shrink-0" aria-hidden="true" />
                </div>
                <div className="text-lg sm:text-2xl font-bold font-display text-zinc-50 tabular-nums tracking-tight break-words">
                  {typeof metric.countTo === 'number' ? (
                    <CountUp
                      to={metric.countTo}
                      suffix={metric.countSuffix || ''}
                      duration={1.15}
                    />
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