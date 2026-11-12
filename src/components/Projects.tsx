import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Code2,
  Cpu,
  Database,
  FolderGit2,
  Globe,
  LayoutGrid,
  Network,
  Search,
  Smartphone,
  Terminal,
  X,
} from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';

export interface Project {
  name: string;
  category?: string;
  badge?: string;
  description: string;
  url?: string;
  details?: string;
  stack?: string;
  logo?: string;
}

interface ProjectsProps {
  title: string;
  subtitle?: string;
  projects: Project[];
  onViewDetails: (project: Project) => void;
}

type FilterType = 'All' | 'Enterprise & Apps' | 'Infrastructure & ML';

const categoryFilters: Array<{
  key: FilterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'All', label: 'All', icon: LayoutGrid },
  { key: 'Enterprise & Apps', label: 'Enterprise & Apps', icon: Briefcase },
  { key: 'Infrastructure & ML', label: 'Infrastructure & ML', icon: Cpu },
];

const getProjectIcon = (project: Project) => {
  const name = project.name.toLowerCase();
  if (name.includes('databricks') || name.includes('dtici')) return Database;
  if (name.includes('udayan') || name.includes('fit-uc')) return Smartphone;
  if (name.includes('nginx') || name.includes('k3s') || name.includes('load balancer'))
    return Network;
  if (name.includes('fiorejoy') || name.includes('avigna')) return Globe;
  if (name.includes('cuda') || name.includes('pokeroyale') || name.includes('cynthia')) return Cpu;
  if (name.includes('leetcode') || name.includes('bookstore')) return Code2;
  return Terminal;
};

export const Projects: React.FC<ProjectsProps> = ({
  title,
  subtitle,
  projects,
  onViewDetails,
}) => {
  const [filter, setFilter] = useState<FilterType>('All');
  const [search, setSearch] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();

  // Press '/' to jump into project stack search smoothly (ignoring active text inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        project.name.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        (project.stack && project.stack.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filter === 'All') return true;
      if (filter === 'Enterprise & Apps') {
        return (
          project.name.includes('DTICI') ||
          project.name.includes('Udayan') ||
          project.name.includes('Fiorejoy') ||
          project.name.includes('AvignaTattva')
        );
      }
      if (filter === 'Infrastructure & ML') {
        return (
          project.name.includes('NGINX') ||
          project.name.includes('K3s') ||
          project.name.includes('PokeRoyale') ||
          project.name.includes('CUDA') ||
          project.name.includes('LeetCode') ||
          project.name.includes('Labs') ||
          project.name.includes('Cynthia') ||
          project.name.includes('BookStore')
        );
      }
      return true;
    });
  }, [projects, filter, search]);

  return (
    <section id="projects" className="py-20 border-b border-white/[0.08]">
      {/* Section Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
            <FolderGit2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Selected Works</span>
            <span className="text-zinc-600" aria-hidden="true">
              ·
            </span>
            <span className="text-zinc-400 tabular-nums">
              {filteredProjects.length} of {projects.length} builds
            </span>
          </span>
          <SplitText
            as="h2"
            text={title}
            stagger={0.04}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 block"
          />
          {subtitle && (
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
          )}
        </div>

        {/* Frosted Filter Tabs with layoutId Spring & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <LayoutGroup id="project-filter-tabs">
            <div
              role="tablist"
              aria-label="Filter projects by category"
              className="flex items-center gap-1 p-1 glass-panel-subtle rounded-xl"
            >
              {categoryFilters.map(({ key, label, icon: Icon }) => {
                const selected = filter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setFilter(key)}
                    className={`relative px-3.5 py-2 min-h-[36px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                      selected ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="project-filter-active-bg"
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600/90 shadow-[0_4px_16px_-4px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.2)]"
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" aria-hidden="true" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="text"
              aria-label="Filter projects by technology or keyword"
              placeholder="Search stack... (/)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearch('');
                  searchInputRef.current?.blur();
                }
              }}
              className="px-3.5 py-2 pl-9 pr-8 min-h-[42px] text-xs glass-panel-subtle rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 w-44 sm:w-52 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Frosted Glass Grid with Sibling-Dimming Hover Focus */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => {
            const isGithub = project.url && project.url.includes('github.com');
            const isPlayStore = project.url && project.url.includes('play.google.com');
            const hasExternalLink = project.url && project.url !== '#';
            const ProjectIcon = getProjectIcon(project);
            const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
            const isFeatured = index === 0;

            return (
              <motion.div
                key={project.name}
                layout={!prefersReduced}
                initial={prefersReduced ? false : { opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReduced ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.24, delay: Math.min(index, 5) * 0.03 }}
                className={isFeatured && filteredProjects.length > 2 ? 'md:col-span-2 flex' : 'flex'}
              >
                <GlassCard
                  tilt={true}
                  spotlight={true}
                  brackets={isFeatured}
                  chamfer={isFeatured}
                  dimmed={isDimmed}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="p-6 w-full"
                >
                  <div>
                    {/* Single Clean Unboxed Kicker with Project Domain Icon */}
                    <div className="flex items-center justify-between gap-2 text-xs font-mono text-zinc-400 mb-3.5">
                      <span className="inline-flex items-center gap-2 truncate">
                        <ProjectIcon
                          className="w-3.5 h-3.5 text-cyan-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">
                          {project.category || (isGithub ? 'Open Source' : 'System Build')}
                          {project.badge ? ` · ${project.badge}` : ''}
                        </span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-lg sm:text-xl font-bold text-zinc-50 mb-2.5 tracking-tight group-hover:text-cyan-50 transition-colors">
                      {project.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-zinc-300/90 leading-relaxed mb-5">
                      {project.description}
                    </p>
                  </div>

                  <div>
                    {/* Slash-Separated Tech Stack (Unboxed Metadata) */}
                    {project.stack && (
                      <div className="text-xs font-mono text-zinc-400 mb-5 flex flex-wrap gap-y-1 items-center">
                        {project.stack.split('|').map((tech, tIdx) => (
                          <React.Fragment key={tech}>
                            {tIdx > 0 && (
                              <span className="mx-1.5 text-zinc-600" aria-hidden="true">
                                /
                              </span>
                            )}
                            <span>{tech}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* Card Footer Actions */}
                    <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => onViewDetails(project)}
                        className="group/btn font-medium text-zinc-200 hover:text-white transition-colors inline-flex items-center gap-1.5 py-1 cursor-pointer"
                      >
                        <span>Architecture Details</span>
                        <ArrowRight
                          className="w-3.5 h-3.5 text-cyan-400 group-hover/btn:translate-x-1 transition-transform"
                          aria-hidden="true"
                        />
                      </button>

                      {hasExternalLink && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 py-1 pr-2 whitespace-nowrap shrink-0"
                        >
                          <span>{isPlayStore ? 'Google Play' : isGithub ? 'GitHub' : 'Open'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 && (
        <div className="py-16 text-center text-zinc-400 text-sm font-mono glass-panel-subtle rounded-2xl mt-4">
          No projects matched &quot;{search}&quot;. Clear the search bar or switch filter tabs.
        </div>
      )}
    </section>
  );
};

export default Projects;