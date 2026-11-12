import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Code2, Database, Globe, Server, Workflow } from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';

export interface Skill {
  skill: string;
  logo?: string;
  'Skill Category'?: string;
}

export interface SoftSkill {
  skill: string;
}

export interface SkillCategory {
  name: string;
  desc: string;
  items: string[];
}

interface SkillsProps {
  skills: Skill[];
  softSkills: SoftSkill[];
  categories?: SkillCategory[];
  languages?: string[];
}

const defaultCategories: SkillCategory[] = [
  {
    name: 'Languages & App Development',
    desc: 'Production software, backend APIs, cross-platform mobile apps, and automation scripting.',
    items: [
      'Python',
      'C++ & CUDA',
      'SQL & PostgreSQL',
      'Dart & Flutter',
      'TypeScript & JavaScript',
      'FastAPI & Node.js',
      'React',
      'Go (Systems & Games)',
      'Java',
    ],
  },
  {
    name: 'Big Data, ML & Analytics',
    desc: 'Fleet telemetry pipelines, distributed processing, and BI reporting.',
    items: [
      'Databricks',
      'Apache Spark',
      'Delta Lake',
      'OTA Fleet Data Collection',
      'Pandas & NumPy',
      'Scikit-learn & TensorFlow',
      'Power BI & Apache Superset',
      'Kobo Toolbox & Glide Apps',
    ],
  },
  {
    name: 'Infrastructure, Linux & Virtualization',
    desc: 'Bare-metal Linux, hypervisors, cluster networking, and self-hosted backends.',
    items: [
      'Proxmox VE & PBS Backups',
      'Debian · Kali · Alpine Linux',
      'Docker & Docker Compose',
      'Kubernetes (K3s) & NGINX',
      'MetalLB & Traefik',
      'Tailscale & Cloudflare Tunnels',
      'NocoDB · Redis · MinIO',
      'AWS & Git',
    ],
  },
];

const categoryIcons = [Code2, Database, Server];

export const Skills: React.FC<SkillsProps> = ({
  softSkills,
  categories,
  languages = ['English (Fluent)', 'Hindi (Fluent)'],
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();
  const activeCategories =
    categories && categories.length > 0 ? categories : defaultCategories;

  return (
    <section id="skills" className="py-20 border-b border-white/[0.08]">
      {/* Section Header */}
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
          <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Capabilities &amp; Tools</span>
        </span>
        <SplitText
          as="h2"
          text="Technical Stack & Working Style"
          stagger={0.04}
          className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-3 block"
        />
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Practical tools used daily across Databricks fleet pipelines, full-stack mobile products, and self-hosted Linux virtualization.
        </p>
      </div>

      {/* 3-Column Frosted Glass Stack Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {activeCategories.map((cat, idx) => {
          const CategoryIcon = categoryIcons[idx % categoryIcons.length];
          const dimmed = hoveredIndex !== null && hoveredIndex !== idx;

          return (
            <motion.div
              key={cat.name}
              initial={prefersReduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.28, delay: idx * 0.05 }}
              className="flex"
            >
              <GlassCard
                tilt={true}
                spotlight={true}
                dimmed={dimmed}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="p-6 w-full"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <CategoryIcon className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-lg font-bold text-zinc-50 tracking-tight">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-5">{cat.desc}</p>

                  <ul className="divide-y divide-white/[0.07] text-xs font-mono text-zinc-200 border-t border-white/[0.07]">
                    {cat.items.map((item) => (
                      <li key={item} className="py-2.5">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Focus Areas & Spoken Languages */}
      <div className="pt-8 border-t border-white/[0.08] grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <h3 className="font-display text-base font-bold text-zinc-100 mb-4 inline-flex items-center gap-2">
            <Workflow className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Engineering Practices &amp; Ownership</span>
          </h3>
          {softSkills.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-xs font-mono text-zinc-300">
              {softSkills.map((s, idx) => (
                <div
                  key={idx}
                  className="py-2.5 border-b border-white/[0.07] flex items-center justify-between"
                >
                  <span>{s.skill}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <h3 className="font-display text-base font-bold text-zinc-100 mb-4 inline-flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Spoken Languages</span>
          </h3>
          <div className="divide-y divide-white/[0.07] border-t border-b border-white/[0.07] text-xs font-mono text-zinc-300">
            {languages.map((lang) => (
              <div key={lang} className="py-2.5">
                {lang}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;