import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Code2, Database, Globe, Info, Server, Workflow } from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';
import TechStackGraph from './motion/TechStackGraph';
import SkillToolPopover, { ActiveSkillPopover } from './motion/SkillToolPopover';
import { inferCategory, LANE_META, resolveSkillProficiency, resolveSkillTileMeta } from './motion/techGraphUtils';
import BrandMark from './icons/BrandMarks';
import { SkillIconTile } from '../types';

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
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  skills: Skill[];
  softSkills: SoftSkill[];
  iconTiles?: SkillIconTile[];
  categories?: SkillCategory[];
  languages?: string[];
}

const categoryIcons = [Code2, Database, Server];

export const Skills: React.FC<SkillsProps> = ({
  eyebrow = 'Capabilities & Tools',
  title = 'Technical Stack & Working Style',
  subtitle = 'Core programming languages, frameworks, data platforms, and operational infrastructure tooling.',
  skills,
  softSkills,
  iconTiles,
  categories,
  languages = ['English (Fluent)'],
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activePopover, setActivePopover] = useState<ActiveSkillPopover | null>(null);
  const prefersReduced = useReducedMotion();

  const effectiveIconTiles = useMemo<SkillIconTile[]>(() => {
    if (iconTiles && iconTiles.length > 0) return iconTiles;
    return skills.map((sk) => ({
      label: sk.skill,
      logoPath: sk.logo && (sk.logo.includes('/') || sk.logo.includes('.')) ? sk.logo : undefined,
      brandKey: sk.logo && !sk.logo.includes('/') ? sk.logo : sk.skill,
    }));
  }, [iconTiles, skills]);

  const activeCategories = useMemo<SkillCategory[]>(() => {
    if (categories && categories.length > 0) return categories;
    if (skills.length === 0) return [];
    return [
      {
        name: 'Core Technologies',
        desc: 'Primary languages, frameworks, and tools used across builds.',
        items: skills.map((s) => s.skill),
      },
    ];
  }, [categories, skills]);

  const handleCategorySkillClick = (itemLabel: string, anchorEl: HTMLElement) => {
    const tile = resolveSkillTileMeta(itemLabel, effectiveIconTiles);
    const rect = anchorEl.getBoundingClientRect();
    setActivePopover((prev) =>
      prev && prev.tile.label === tile.label
        ? null
        : {
            tile,
            anchorRect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              bottom: rect.bottom,
              right: rect.right,
            },
          }
    );
  };

  return (
    <section id="skills" className="py-24 sm:py-28 border-b border-white/[0.08]">
      {/* Section Header */}
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400/90 mb-2">
          <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
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

      {/* Interactive D3 Stack Graph, Dependency Heatmap & Tools Grid */}
      {effectiveIconTiles.length > 0 && <TechStackGraph tiles={effectiveIconTiles} />}

      {/* Categorized Frosted Glass Stack Cards */}
      {activeCategories.length > 0 && (
        <div
          className={`grid grid-cols-1 ${
            activeCategories.length === 1
              ? 'md:grid-cols-1'
              : activeCategories.length === 2
              ? 'md:grid-cols-2'
              : 'md:grid-cols-3'
          } gap-5 mb-12`}
        >
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
                    <div className="flex items-center gap-2.5 mb-5">
                      <CategoryIcon className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                      <h3 className="font-display text-lg font-bold text-zinc-50 tracking-tight">
                        {cat.name}
                      </h3>
                    </div>

                    <ul className="divide-y divide-white/[0.07] text-xs font-mono text-zinc-200 border-t border-white/[0.07]">
                      {cat.items.map((item) => {
                        const resolvedTile = resolveSkillTileMeta(item, effectiveIconTiles);
                        const prof = resolveSkillProficiency(resolvedTile);
                        const itemCategory = inferCategory(resolvedTile);
                        const accentHex = LANE_META[itemCategory].accentHex;
                        const isOpen = activePopover?.tile.label === resolvedTile.label;

                        return (
                          <li key={item}>
                            <button
                              type="button"
                              data-skill-popover-trigger="true"
                              onClick={(e) => handleCategorySkillClick(item, e.currentTarget)}
                              aria-expanded={isOpen}
                              aria-label={`${item} — ${prof.years} (${prof.proficiency}% proficiency), click for summary and links`}
                              className={`w-full py-2.5 px-1.5 -mx-1.5 rounded-md flex flex-col gap-1.5 text-left transition-colors cursor-pointer group ${
                                isOpen
                                  ? 'bg-emerald-500/12 text-amber-200'
                                  : 'hover:bg-white/[0.04] hover:text-emerald-100'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span className="inline-flex items-center gap-2 min-w-0">
                                  <BrandMark
                                    brand={item}
                                    className="w-3.5 h-3.5 shrink-0 opacity-90 group-hover:scale-110 transition-transform"
                                  />
                                  <span className="truncate">{item}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                                    {prof.years}
                                  </span>
                                  <Info
                                    className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                                      isOpen
                                        ? 'text-amber-300 opacity-100'
                                        : 'text-zinc-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                                    }`}
                                    aria-hidden="true"
                                  />
                                </span>
                              </div>
                              <div
                                aria-hidden="true"
                                className="h-[2px] w-full rounded-full bg-white/[0.07] overflow-hidden"
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${prof.proficiency}%`,
                                    backgroundColor: accentHex,
                                    opacity: isOpen ? 1 : 0.72,
                                  }}
                                />
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Focus Areas & Spoken Languages */}
      {(softSkills.length > 0 || languages.length > 0) && (
        <div className="pt-10 border-t border-white/[0.08] grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8">
            <h3 className="font-display text-base font-bold text-zinc-100 mb-4 inline-flex items-center gap-2">
              <Workflow className="w-4 h-4 text-emerald-400" aria-hidden="true" />
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
              <Globe className="w-4 h-4 text-emerald-400" aria-hidden="true" />
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
      )}

      <SkillToolPopover popover={activePopover} onClose={() => setActivePopover(null)} />
    </section>
  );
};

export default Skills;