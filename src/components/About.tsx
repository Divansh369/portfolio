import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Briefcase,
  Compass,
  GraduationCap,
  HeartHandshake,
  Server,
  Truck,
  User,
} from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';

interface AboutProps {
  bio: string[];
  interests?: string[];
}

export const About: React.FC<AboutProps> = ({ bio, interests }) => {
  const prefersReduced = useReducedMotion();

  return (
    <section id="about" className="py-20 border-b border-white/[0.08]">
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Summary & Frosted Fact Sheet */}
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Background</span>
          </span>
          <SplitText
            as="h2"
            text="Engineering Across Fleet Data, Apps & Linux"
            stagger={0.04}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-4 block"
          />
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            Day-to-day focus on Databricks data pipelines and fleet data software, paired with solo non-profit product delivery and hands-on Proxmox virtualization.
          </p>

          <GlassCard tilt={true} spotlight={true} brackets={true} className="p-6">
            <dl className="divide-y divide-white/[0.07] text-xs font-mono">
              <div className="py-2.5 flex justify-between items-center gap-4">
                <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                  <span>Current Role</span>
                </dt>
                <dd className="text-zinc-100 font-semibold text-right">
                  Software Engineer · Daimler Truck
                </dd>
              </div>
              <div className="py-2.5 flex justify-between items-center gap-4">
                <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                  <span>Fleet Scale</span>
                </dt>
                <dd className="text-zinc-200 tabular-nums text-right">
                  ~70,000 Connected Trucks
                </dd>
              </div>
              <div className="py-2.5 flex justify-between items-center gap-4">
                <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                  <HeartHandshake className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                  <span>Volunteering</span>
                </dt>
                <dd className="text-zinc-200 text-right">Udayan Care (FiT-UC Lead)</dd>
              </div>
              <div className="py-2.5 flex justify-between items-center gap-4">
                <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                  <span>Infrastructure</span>
                </dt>
                <dd className="text-zinc-200 text-right">Proxmox VE 8 · LXC · K3s</dd>
              </div>
              <div className="py-2.5 flex justify-between items-center gap-4">
                <dt className="text-zinc-400 shrink-0 inline-flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                  <span>Degree</span>
                </dt>
                <dd className="text-zinc-200 text-right">B.Tech Data Science · MIT Manipal</dd>
              </div>
            </dl>
          </GlassCard>

          {interests && interests.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/[0.08] text-xs font-mono text-zinc-400">
              <span className="inline-flex items-center gap-2 text-zinc-400 mb-2">
                <Compass className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
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

        {/* Right Column: Clean Readable Narrative inside Frosted Panes */}
        <motion.div
          className="lg:col-span-7 space-y-5 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl"
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3 }}
        >
          {bio.map((paragraph, index) => (
            <div
              key={index}
              className="glass-panel-subtle rounded-2xl p-5 sm:p-6 transition-colors hover:border-white/20"
            >
              <p>{paragraph}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default About;