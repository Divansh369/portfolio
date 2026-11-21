import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import {
  Archive,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Code2,
  Cpu,
  Database,
  FolderGit2,
  Globe,
  Images,
  Layers,
  LayoutGrid,
  Network,
  Search,
  Terminal,
  X,
} from 'lucide-react';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';
import RepoImage from './common/RepoImage';
import BrandMark from './icons/BrandMarks';
import { ProgressMilestone, Project, ProjectStatus } from '../types';
import { resolveItemId } from '../utils/itemId';

export type { Project };

interface ProjectsProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  projects: Project[];
  progressMilestones?: ProgressMilestone[];
  showArchivedByDefault?: boolean;
  onViewDetails: (project: Project) => void;
  onOpenGallery?: (payload: {
    itemId: string;
    title: string;
    subtitle?: string;
    milestones: ProgressMilestone[];
  }) => void;
}

const getProjectIcon = (project: Project) => {
  const combined = `${project.name} ${project.category || ''} ${project.stack || ''}`.toLowerCase();
  if (combined.includes('etl') || combined.includes('spark') || combined.includes('postgres')) {
    return Database;
  }
  if (combined.includes('k8s') || combined.includes('kubernetes') || combined.includes('nginx')) {
    return Network;
  }
  if (combined.includes('web') || combined.includes('platform')) {
    return Globe;
  }
  if (combined.includes('gpu') || combined.includes('cuda') || combined.includes('ml')) {
    return Cpu;
  }
  if (combined.includes('algorithm') || combined.includes('cli')) {
    return Code2;
  }
  return Terminal;
};

const getProjectLogoFallback = (project: Project) => {
  const firstStack = project.stack?.split('|')[0]?.trim();
  if (firstStack) {
    return <BrandMark brand={firstStack} className="w-6 h-6" />;
  }
  const ProjectIcon = getProjectIcon(project);
  return <ProjectIcon className="w-5 h-5 text-cyan-300" aria-hidden="true" />;
};

const isArchivedStatus = (status?: ProjectStatus): boolean =>
  status === 'archived' || status === 'unmaintained';

const getStatusBadgeMeta = (
  status?: ProjectStatus
): { label: string; dotClass: string; textClass: string } | null => {
  switch (status) {
    case 'live':
      return {
        label: 'Live',
        dotClass: 'bg-emerald-400',
        textClass: 'text-emerald-400',
      };
    case 'wip':
      return {
        label: 'In Progress',
        dotClass: 'bg-amber-400',
        textClass: 'text-amber-300',
      };
    case 'archived':
      return {
        label: 'Archived',
        dotClass: 'bg-zinc-500',
        textClass: 'text-zinc-400',
      };
    case 'unmaintained':
      return {
        label: 'Not Maintained',
        dotClass: 'bg-amber-500/80',
        textClass: 'text-amber-300/90',
      };
    default:
      return null;
  }
};

export const Projects: React.FC<ProjectsProps> = ({
  eyebrow = 'Selected Works',
  title,
  subtitle,
  projects,
  progressMilestones = [],
  showArchivedByDefault = true,
  onViewDetails,
  onOpenGallery,
}) => {
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState<boolean>(showArchivedByDefault);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    setShowArchived(showArchivedByDefault);
  }, [showArchivedByDefault]);

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

  // Omit hidden projects and apply clean deterministic prioritization:
  // Active/Live/WIP before Archived/Unmaintained -> featured -> priority asc -> original order
  const visibleOrderedProjects = useMemo(() => {
    return projects
      .filter((p) => p.status !== 'hidden')
      .map((project, originalIdx) => ({ project, originalIdx }))
      .sort((a, b) => {
        const aArch = isArchivedStatus(a.project.status) ? 1 : 0;
        const bArch = isArchivedStatus(b.project.status) ? 1 : 0;
        if (aArch !== bArch) return aArch - bArch;

        const aFeat = a.project.featured ? 0 : 1;
        const bFeat = b.project.featured ? 0 : 1;
        if (aFeat !== bFeat) return aFeat - bFeat;

        const aPrio = a.project.priority ?? a.originalIdx + 100;
        const bPrio = b.project.priority ?? b.originalIdx + 100;
        if (aPrio !== bPrio) return aPrio - bPrio;

        return a.originalIdx - b.originalIdx;
      })
      .map((entry) => entry.project);
  }, [projects]);

  const archivedCount = useMemo(
    () => visibleOrderedProjects.filter((p) => isArchivedStatus(p.status)).length,
    [visibleOrderedProjects]
  );

  // Dynamically derive category filter tabs from visible projects
  const dynamicFilterTabs = useMemo(() => {
    const groups = new Set<string>();
    visibleOrderedProjects.forEach((p) => {
      const grp = (p.filterGroup || p.category || '').trim();
      if (grp) groups.add(grp);
    });

    const tabs: Array<{
      key: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [{ key: 'All', label: 'All', icon: LayoutGrid }];

    Array.from(groups).forEach((grp, idx) => {
      const icon = idx === 0 ? Briefcase : idx === 1 ? Cpu : Layers;
      tabs.push({ key: grp, label: grp, icon });
    });

    return tabs;
  }, [visibleOrderedProjects]);

  const hasExplicitFeatured = useMemo(
    () => visibleOrderedProjects.some((p) => p.featured === true),
    [visibleOrderedProjects]
  );

  const filteredProjects = useMemo(() => {
    return visibleOrderedProjects.filter((project) => {
      if (!showArchived && isArchivedStatus(project.status)) {
        return false;
      }

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        project.name.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        (project.category && project.category.toLowerCase().includes(q)) ||
        (project.stack && project.stack.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (filter === 'All') return true;

      const projectGroup = (project.filterGroup || project.category || '').trim();
      return projectGroup === filter;
    });
  }, [visibleOrderedProjects, filter, search, showArchived]);

  const activePoolCount = showArchived
    ? visibleOrderedProjects.length
    : visibleOrderedProjects.length - archivedCount;

  return (
    <section id="projects" className="py-20 border-b border-white/[0.08]">
      {/* Section Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
            <FolderGit2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{eyebrow}</span>
            <span className="text-zinc-600" aria-hidden="true">
              ·
            </span>
            <span className="text-zinc-400 tabular-nums">
              {filteredProjects.length} of {activePoolCount} builds
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

        {/* Frosted Filter Tabs with layoutId Spring, Archived Toggle & Search */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          {dynamicFilterTabs.length > 1 && (
            <LayoutGroup id="project-filter-tabs">
              <div
                role="tablist"
                aria-label="Filter projects by category"
                className="flex items-center gap-1 p-1 glass-panel-subtle rounded-xl overflow-x-auto scrollbar-none w-full sm:w-auto"
              >
                {dynamicFilterTabs.map(({ key, label, icon: Icon }) => {
                  const selected = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setFilter(key)}
                      className={`relative px-3.5 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
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
          )}

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
            {archivedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowArchived((prev) => !prev)}
                aria-pressed={showArchived}
                className={`px-3 py-2 min-h-[42px] text-xs font-mono rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                  showArchived
                    ? 'glass-panel-subtle border-cyan-400/30 text-zinc-200 hover:text-white'
                    : 'glass-panel-subtle border-white/10 text-zinc-400 hover:text-zinc-100'
                }`}
                title="Toggle visibility of archived and unmaintained projects"
              >
                <Archive className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                <span>
                  {showArchived
                    ? `Showing Archived (${archivedCount})`
                    : `Show Archived (${archivedCount})`}
                </span>
              </button>
            )}

            <div className="relative flex-1 sm:flex-none">
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
                className="px-3.5 py-2 pl-9 pr-8 min-h-[42px] text-xs glass-panel-subtle rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 w-full sm:w-52 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Frosted Glass Grid with Sibling-Dimming Hover Focus */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => {
            const isGithub = project.url && project.url.includes('github.com');
            const isPlayStore = project.url && project.url.includes('play.google.com');
            const hasExternalLink = Boolean(project.url && project.url !== '#');
            const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
            const isFeatured =
              project.featured === true || (!hasExplicitFeatured && index === 0);
            const hasBanner = Boolean(project.logo) && project.cardStyle === 'banner';
            const statusMeta = getStatusBadgeMeta(project.status);
            const isDeemphasized = isArchivedStatus(project.status);
            const itemId = resolveItemId(project.id, project.name);
            const itemMilestones = progressMilestones.filter((m) => m.itemId === itemId);

            return (
              <motion.div
                key={project.name}
                layout={!prefersReduced}
                initial={prefersReduced ? false : { opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: isDeemphasized ? 0.84 : 1, y: 0, scale: 1 }}
                exit={prefersReduced ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.24, delay: Math.min(index, 5) * 0.03 }}
                className={`${
                  isFeatured && filteredProjects.length > 2 ? 'md:col-span-2 flex' : 'flex'
                } ${isDeemphasized ? 'hover:opacity-100 transition-opacity' : ''}`}
              >
                <GlassCard
                  tilt={true}
                  spotlight={true}
                  brackets={isFeatured}
                  chamfer={isFeatured}
                  dimmed={isDimmed}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="w-full overflow-hidden flex flex-col"
                >
                  {/* Visual Banner Artwork Header */}
                  {hasBanner && (
                    <div className="relative h-40 sm:h-44 w-full overflow-hidden border-b border-white/[0.08] bg-[#060a14]">
                      <RepoImage
                        src={project.logo}
                        alt={`${project.name} preview`}
                        className="w-full h-full block"
                        imgClassName={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
                          isDeemphasized ? 'grayscale-[30%]' : ''
                        }`}
                        fallback={
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-[#0a1428] to-cyan-950/50 flex items-center justify-center">
                            {getProjectLogoFallback(project)}
                          </div>
                        }
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/25 to-transparent"
                      />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Kicker + Optional Lifecycle Status Label */}
                      <div className="flex items-center justify-between gap-2 text-xs font-mono text-zinc-400 mb-3">
                        <span className="inline-flex items-center gap-2 truncate">
                          <span className="truncate">
                            {project.category || (isGithub ? 'Open Source' : 'System Build')}
                            {project.badge ? ` · ${project.badge}` : ''}
                          </span>
                        </span>
                        {statusMeta && (
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium shrink-0 ${statusMeta.textClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`}
                              aria-hidden="true"
                            />
                            <span>{statusMeta.label}</span>
                          </span>
                        )}
                      </div>

                      {/* Title Row with Emblem Logo Thumbnail on compact cards */}
                      <div className="flex items-center gap-3 mb-2.5">
                        {!hasBanner && (
                          <RepoImage
                            src={project.logo}
                            alt={`${project.name} icon`}
                            className="w-9 h-9 rounded-lg border border-white/15 bg-white/[0.06] shrink-0"
                            imgClassName={`w-full h-full ${
                              project.logo?.toLowerCase().includes('.svg')
                                ? 'object-contain bg-white/95 p-1'
                                : 'object-cover'
                            }`}
                            fallback={getProjectLogoFallback(project)}
                          />
                        )}
                        <h3 className="font-display text-lg sm:text-xl font-bold text-zinc-50 tracking-tight group-hover:text-cyan-50 transition-colors">
                          {project.name}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-zinc-300/90 leading-relaxed mb-5">
                        {project.description}
                      </p>
                    </div>

                    <div>
                      {/* Stack with Clean Subtle Brand Marks */}
                      {project.stack && (
                        <div className="text-xs font-mono text-zinc-400 mb-5 flex flex-wrap gap-y-1.5 items-center">
                          {project.stack.split('|').map((tech, tIdx) => (
                            <React.Fragment key={tech}>
                              {tIdx > 0 && (
                                <span className="mx-1.5 text-zinc-600" aria-hidden="true">
                                  /
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <BrandMark brand={tech} className="w-3.5 h-3.5 shrink-0 opacity-90" />
                                <span>{tech}</span>
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onViewDetails(project)}
                            className="group/btn font-medium text-zinc-200 hover:text-white transition-colors inline-flex items-center gap-1.5 min-h-[40px] py-1 cursor-pointer"
                          >
                            <span>View Details</span>
                            <ArrowRight
                              className="w-3.5 h-3.5 text-cyan-400 group-hover/btn:translate-x-1 transition-transform"
                              aria-hidden="true"
                            />
                          </button>

                          {onOpenGallery && itemMilestones.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenGallery({
                                  itemId,
                                  title: project.name,
                                  subtitle: project.category,
                                  milestones: itemMilestones,
                                })
                              }
                              className="font-mono text-[11px] text-cyan-300/90 hover:text-cyan-200 transition-colors inline-flex items-center gap-1.5 min-h-[40px] py-1 cursor-pointer"
                              title="Open chronological build progress gallery"
                            >
                              <Images className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span className="tabular-nums">Progress ({itemMilestones.length})</span>
                            </button>
                          )}
                        </div>

                        {hasExternalLink && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 min-h-[40px] py-1 pr-2 whitespace-nowrap shrink-0"
                          >
                            <span>
                              {isPlayStore ? 'Google Play' : isGithub ? 'GitHub' : 'Visit Website'}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
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
          {search
            ? `No projects matched "${search}". Clear the search bar or switch filter tabs.`
            : 'No visible projects match the current filter criteria.'}
        </div>
      )}
    </section>
  );
};

export default Projects;