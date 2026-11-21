import React, { useId, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Cpu,
  Database,
  ExternalLink,
  GitBranch,
  Layers,
  LayoutGrid,
  Network,
  RotateCcw,
  Server,
} from 'lucide-react';
import RepoImage from '../common/RepoImage';
import BrandMark from '../icons/BrandMarks';
import { SkillIconTile } from '../../types';

export type TechCategoryId = 'infra' | 'languages' | 'data' | 'apps';

interface TechStackGraphProps {
  tiles: SkillIconTile[];
}

interface ResolvedNode {
  id: string;
  index: number;
  tile: SkillIconTile;
  category: TechCategoryId;
  xPct: number;
  yPct: number;
  svgX: number;
  svgY: number;
}

interface GraphEdge {
  key: string;
  fromIndex: number;
  toIndex: number;
}

const LANE_META: Record<
  TechCategoryId,
  {
    label: string;
    shortLabel: string;
    accentHex: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  infra: {
    label: 'Infrastructure & Linux',
    shortLabel: 'Infra & Linux',
    accentHex: '#22d3ee',
    icon: Server,
  },
  languages: {
    label: 'Languages & Compute',
    shortLabel: 'Languages',
    accentHex: '#38bdf8',
    icon: Cpu,
  },
  data: {
    label: 'Data & ML Pipelines',
    shortLabel: 'Data & ML',
    accentHex: '#60a5fa',
    icon: Database,
  },
  apps: {
    label: 'Apps, APIs & Analytics',
    shortLabel: 'Apps & APIs',
    accentHex: '#818cf8',
    icon: Layers,
  },
};

const LANE_ORDER: TechCategoryId[] = ['infra', 'languages', 'data', 'apps'];

const normalizeToken = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();

const inferCategory = (tile: SkillIconTile): TechCategoryId => {
  if (tile.category && LANE_ORDER.includes(tile.category)) {
    return tile.category;
  }
  const key = normalizeToken(`${tile.brandKey} ${tile.label}`);
  if (
    key.includes('linux') ||
    key.includes('bash') ||
    key.includes('shell') ||
    key.includes('proxmox') ||
    key.includes('docker') ||
    key.includes('kube') ||
    key.includes('k3s') ||
    key.includes('traefik') ||
    key.includes('nginx') ||
    key.includes('raspberry') ||
    key.includes('git') ||
    key.includes('aws') ||
    key.includes('tailscale')
  ) {
    return 'infra';
  }
  if (
    key.includes('spark') ||
    key.includes('apache') ||
    key.includes('databricks') ||
    key.includes('postgres') ||
    key.includes('sql') ||
    key.includes('pandas') ||
    key.includes('numpy') ||
    key.includes('scikit') ||
    key.includes('tensorflow') ||
    key.includes('pytorch') ||
    key.includes('redis') ||
    key.includes('minio')
  ) {
    return 'data';
  }
  if (
    key.includes('fastapi') ||
    key.includes('node') ||
    key.includes('react') ||
    key.includes('flutter') ||
    key.includes('nocodb') ||
    key.includes('powerbi') ||
    key.includes('office') ||
    key.includes('godot')
  ) {
    return 'apps';
  }
  return 'languages';
};

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 640;

const buildBezierPath = (x1: number, y1: number, x2: number, y2: number): string => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) < 38) {
    // Same column or steep vertical curve: bow cleanly outward so lines don't pass behind sibling cards
    const bow = x1 > SVG_WIDTH * 0.5 ? -54 : 54;
    return `M ${x1} ${y1} C ${x1 + bow} ${y1 + dy * 0.28}, ${x2 + bow} ${y2 - dy * 0.28}, ${x2} ${y2}`;
  }
  const handle = Math.max(Math.abs(dx) * 0.45, 54);
  const c1x = dx >= 0 ? x1 + handle : x1 - handle;
  const c2x = dx >= 0 ? x2 - handle : x2 + handle;
  return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
};

export const TechStackGraph: React.FC<TechStackGraphProps> = ({ tiles }) => {
  const prefersReduced = useReducedMotion();
  const gradientBaseId = useId().replace(/:/g, '');

  const [activeFilter, setActiveFilter] = useState<'all' | TechCategoryId>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'grid'>('graph');
  const [selectedId, setSelectedId] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [lockedFocusId, setLockedFocusId] = useState<string | null>(null);

  const normalizedTiles = useMemo(() => {
    const usedIds = new Set<string>();
    return tiles.map((tile, idx) => {
      const base = normalizeToken(tile.label || tile.brandKey) || `tool-${idx}`;
      const id = usedIds.has(base) ? `${base}-${idx}` : base;
      usedIds.add(id);
      return {
        id,
        tile,
        category: inferCategory(tile),
      };
    });
  }, [tiles]);

  const availableCategories = useMemo(() => {
    const present = new Set(normalizedTiles.map((item) => item.category));
    return LANE_ORDER.filter((cat) => present.has(cat));
  }, [normalizedTiles]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return normalizedTiles;
    return normalizedTiles.filter((item) => item.category === activeFilter);
  }, [normalizedTiles, activeFilter]);

  const laneLayoutMeta = useMemo(() => {
    const activeLanes = LANE_ORDER.filter((lane) =>
      filteredItems.some((item) => item.category === lane)
    );
    const entries = activeLanes.map((lane) => {
      const count = filteredItems.filter((item) => item.category === lane).length;
      const weight = count > 9 ? 2.05 : 1;
      return { lane, count, weight };
    });
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0) || 1;
    let cursor = 0;
    return entries.map((e) => {
      const startPct = (cursor / totalWeight) * 100;
      const widthPct = (e.weight / totalWeight) * 100;
      cursor += e.weight;
      return {
        ...e,
        startPct,
        widthPct,
      };
    });
  }, [filteredItems]);

  const { layoutNodes, maxRowsNeeded } = useMemo(() => {
    if (filteredItems.length === 0) {
      return { layoutNodes: [] as ResolvedNode[], maxRowsNeeded: 1 };
    }

    // Single-category view: distribute evenly across a spacious 2D canvas
    if (activeFilter !== 'all') {
      const cols =
        filteredItems.length > 12
          ? 4
          : Math.min(4, Math.max(2, Math.ceil(Math.sqrt(filteredItems.length))));
      const rows = Math.ceil(filteredItems.length / cols);
      const nodes = filteredItems.map((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const staggerY = col % 2 === 1 && rows > 1 ? 2.8 : 0;
        const xPct = cols === 1 ? 50 : 14 + (col / (cols - 1)) * 72;
        const yPct = rows === 1 ? 50 : 14 + (row / Math.max(rows - 1, 1)) * 72 + staggerY;
        return {
          ...item,
          index: idx,
          xPct,
          yPct,
          svgX: (xPct / 100) * SVG_WIDTH,
          svgY: (yPct / 100) * SVG_HEIGHT,
        };
      });
      return { layoutNodes: nodes, maxRowsNeeded: rows };
    }

    // Full multi-lane architectural flow layout with proportional multi-subcolumn support
    const result: ResolvedNode[] = [];
    let runningIndex = 0;
    let deepestRows = 1;

    laneLayoutMeta.forEach(({ lane, startPct, widthPct }) => {
      const laneItems = filteredItems.filter((item) => item.category === lane);
      const count = laneItems.length;
      const useTwoSubCols = count > 9;

      if (useTwoSubCols) {
        const rows = Math.ceil(count / 2);
        deepestRows = Math.max(deepestRows, rows);
        const leftX = startPct + widthPct * 0.27;
        const rightX = startPct + widthPct * 0.73;

        laneItems.forEach((item, pos) => {
          const subCol = pos % 2;
          const row = Math.floor(pos / 2);
          const staggerY = subCol === 1 && rows > 1 ? 2.4 : 0;
          const xPct = subCol === 0 ? leftX : rightX;
          const yPct = rows === 1 ? 50 : 11 + (row / (rows - 1)) * 76 + staggerY;

          result.push({
            ...item,
            index: runningIndex++,
            xPct,
            yPct,
            svgX: (xPct / 100) * SVG_WIDTH,
            svgY: (yPct / 100) * SVG_HEIGHT,
          });
        });
      } else {
        deepestRows = Math.max(deepestRows, count);
        const centerX = startPct + widthPct * 0.5;
        const staggerSpan = Math.min(widthPct * 0.14, 2.8);

        laneItems.forEach((item, pos) => {
          const staggerX = count >= 4 ? (pos % 2 === 0 ? -staggerSpan : staggerSpan) : 0;
          const xPct = Math.min(93, Math.max(7, centerX + staggerX));
          const yPct = count === 1 ? 50 : 11 + (pos / (count - 1)) * 78;

          result.push({
            ...item,
            index: runningIndex++,
            xPct,
            yPct,
            svgX: (xPct / 100) * SVG_WIDTH,
            svgY: (yPct / 100) * SVG_HEIGHT,
          });
        });
      }
    });

    return { layoutNodes: result, maxRowsNeeded: deepestRows };
  }, [filteredItems, activeFilter, laneLayoutMeta]);

  const edges = useMemo<GraphEdge[]>(() => {
    if (layoutNodes.length < 2) return [];

    const lookup = new Map<string, number>();
    layoutNodes.forEach((node, idx) => {
      lookup.set(node.id, idx);
      lookup.set(normalizeToken(node.tile.label), idx);
      const bk = normalizeToken(node.tile.brandKey);
      if (!lookup.has(bk)) {
        lookup.set(bk, idx);
      }
    });

    const seen = new Set<string>();
    const list: GraphEdge[] = [];

    layoutNodes.forEach((node, fromIdx) => {
      const conns = node.tile.connections || [];
      conns.forEach((rawTarget) => {
        const toIdx = lookup.get(normalizeToken(rawTarget));
        if (toIdx === undefined || toIdx === fromIdx) return;
        const lo = Math.min(fromIdx, toIdx);
        const hi = Math.max(fromIdx, toIdx);
        const edgeKey = `${lo}-${hi}`;
        if (!seen.has(edgeKey)) {
          seen.add(edgeKey);
          list.push({
            key: edgeKey,
            fromIndex: lo,
            toIndex: hi,
          });
        }
      });
    });

    // Graceful fallback for cloned configs that haven't authored `connections` yet
    if (list.length === 0) {
      for (let i = 0; i < layoutNodes.length - 1; i++) {
        list.push({
          key: `seq-${i}-${i + 1}`,
          fromIndex: i,
          toIndex: i + 1,
        });
      }
    }

    return list;
  }, [layoutNodes]);

  const activeSelectionId = useMemo(() => {
    if (selectedId && layoutNodes.some((n) => n.id === selectedId)) return selectedId;
    return layoutNodes[0]?.id ?? '';
  }, [selectedId, layoutNodes]);

  // Hovering previews connections & summary live; clicking locks focus until toggled off
  const focusNodeId = hoveredId ?? lockedFocusId;
  const inspectorNodeId = hoveredId ?? activeSelectionId;

  const inspectorNode = useMemo(
    () => layoutNodes.find((n) => n.id === inspectorNodeId) ?? layoutNodes[0] ?? null,
    [layoutNodes, inspectorNodeId]
  );

  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    layoutNodes.forEach((n) => map.set(n.id, new Set()));
    edges.forEach((edge) => {
      const a = layoutNodes[edge.fromIndex];
      const b = layoutNodes[edge.toIndex];
      if (!a || !b) return;
      map.get(a.id)?.add(b.id);
      map.get(b.id)?.add(a.id);
    });
    return map;
  }, [layoutNodes, edges]);

  const highlightedId = focusNodeId ?? inspectorNode?.id ?? null;
  const activeNeighborIds = useMemo(
    () => (highlightedId ? neighborMap.get(highlightedId) ?? new Set<string>() : new Set<string>()),
    [highlightedId, neighborMap]
  );

  const inspectorNeighbors = useMemo(() => {
    if (!inspectorNode) return [];
    const set = neighborMap.get(inspectorNode.id);
    if (!set) return [];
    return layoutNodes.filter((n) => set.has(n.id));
  }, [inspectorNode, neighborMap, layoutNodes]);

  // Mobile radial hub-and-spoke layout
  const mobileOrbitalData = useMemo(() => {
    if (!inspectorNode) return { neighbors: [], points: [] as Array<{ node: ResolvedNode; x: number; y: number }> };
    const neighbors = inspectorNeighbors.slice(0, 6);
    const cx = 180;
    const cy = 112;
    const rx = 122;
    const ry = 76;

    const points = neighbors.map((node, idx) => {
      const angle =
        neighbors.length === 1
          ? 0
          : -Math.PI * 0.85 + (idx / (neighbors.length - 1)) * Math.PI * 1.7;
      return {
        node,
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry,
      };
    });
    return { neighbors, points };
  }, [inspectorNode, inspectorNeighbors]);

  if (tiles.length === 0) return null;

  const handleSelectNode = (id: string) => {
    setSelectedId(id);
    setLockedFocusId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mb-12 space-y-4">
      {/* Toolbar: Domain Filters + Graph/Grid Toggle */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="tablist"
          aria-label="Filter technical stack by architectural layer"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'all'}
            onClick={() => {
              setActiveFilter('all');
              setLockedFocusId(null);
            }}
            className={`relative px-3 py-2 min-h-[40px] text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 border ${
              activeFilter === 'all'
                ? 'text-cyan-200 border-cyan-400/40 bg-cyan-500/10'
                : 'text-zinc-400 border-white/[0.07] bg-slate-900/50 hover:text-zinc-100 hover:border-white/20'
            }`}
          >
            <span>All Stack ({normalizedTiles.length})</span>
          </button>

          {availableCategories.map((catId) => {
            const meta = LANE_META[catId];
            const Icon = meta.icon;
            const count = normalizedTiles.filter((t) => t.category === catId).length;
            const active = activeFilter === catId;

            return (
              <button
                key={catId}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveFilter(catId);
                  setLockedFocusId(null);
                }}
                className={`relative px-3 py-2 min-h-[40px] text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border ${
                  active
                    ? 'text-cyan-200 border-cyan-400/40 bg-cyan-500/10'
                    : 'text-zinc-400 border-white/[0.07] bg-slate-900/50 hover:text-zinc-100 hover:border-white/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {meta.shortLabel} ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Reset Focus + View Switcher */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
          {lockedFocusId && (
            <button
              type="button"
              onClick={() => setLockedFocusId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-xs font-mono text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear Lock</span>
            </button>
          )}

          <div
            className="inline-flex p-1 rounded-lg bg-slate-950/80 border border-white/[0.08]"
            role="group"
            aria-label="Switch technical stack display mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              aria-pressed={viewMode === 'graph'}
              className={`relative px-3 py-1.5 min-h-[36px] text-xs font-mono rounded-md inline-flex items-center gap-1.5 transition-colors ${
                viewMode === 'graph' ? 'text-cyan-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {viewMode === 'graph' && (
                <motion.span
                  layoutId="tech-view-pill"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-md bg-cyan-500/15 border border-cyan-400/35"
                />
              )}
              <Network className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
              <span className="relative z-10">Architecture Graph</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={`relative px-3 py-1.5 min-h-[36px] text-xs font-mono rounded-md inline-flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' ? 'text-cyan-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {viewMode === 'grid' && (
                <motion.span
                  layoutId="tech-view-pill"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-md bg-cyan-500/15 border border-cyan-400/35"
                />
              )}
              <LayoutGrid className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
              <span className="relative z-10">All Tools Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Visualization Canvas */}
      {viewMode === 'graph' ? (
        <div className="glass-panel-subtle rounded-2xl border border-white/[0.09] overflow-hidden relative">
          {/* Desktop / Tablet Connected Architecture Graph (md+) */}
          <div className="hidden md:block">
            {/* Architectural Column Headers (proportional to lane subcolumns) */}
            {activeFilter === 'all' && (
              <div
                className="grid border-b border-white/[0.07] bg-slate-950/60"
                style={{
                  gridTemplateColumns: laneLayoutMeta.map((l) => `${l.weight}fr`).join(' '),
                }}
              >
                {laneLayoutMeta.map(({ lane }) => {
                  const meta = LANE_META[lane];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={lane}
                      className="px-3 py-2.5 flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-300 border-r last:border-r-0 border-white/[0.06]"
                    >
                      <Icon className="w-3.5 h-3.5 text-cyan-400/90 shrink-0" aria-hidden="true" />
                      <span className="truncate">{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Graph Area */}
            <div
              className="relative w-full select-none overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.06),rgba(2,6,23,0.4)_70%)]"
              style={{
                height: `${Math.max(520, Math.min(680, maxRowsNeeded * 64 + 80))}px`,
              }}
            >
              {/* Proportional vertical lane dividers matching headers */}
              {activeFilter === 'all' &&
                laneLayoutMeta.slice(0, -1).map((meta) => (
                  <div
                    key={`divider-${meta.lane}`}
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 border-r border-dashed border-white/[0.06] pointer-events-none"
                    style={{
                      left: `${meta.startPct + meta.widthPct}%`,
                    }}
                  />
                ))}

              {/* Animated SVG Connection Wires */}
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <defs>
                  <linearGradient id={`${gradientBaseId}-edge`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id={`${gradientBaseId}-glow`} x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {edges.map((edge, idx) => {
                  const a = layoutNodes[edge.fromIndex];
                  const b = layoutNodes[edge.toIndex];
                  if (!a || !b) return null;

                  const d = buildBezierPath(a.svgX, a.svgY, b.svgX, b.svgY);
                  const isEdgeActive =
                    highlightedId !== null && (a.id === highlightedId || b.id === highlightedId);
                  const isDimmed = focusNodeId !== null && !isEdgeActive;

                  return (
                    <g key={edge.key}>
                      {/* Base curve */}
                      <path
                        d={d}
                        fill="none"
                        stroke={
                          isEdgeActive
                            ? `url(#${gradientBaseId}-edge)`
                            : 'rgba(148, 163, 184, 0.22)'
                        }
                        strokeWidth={isEdgeActive ? 2.25 : 1.15}
                        strokeOpacity={isDimmed ? 0.14 : isEdgeActive ? 0.95 : 0.45}
                        filter={isEdgeActive ? `url(#${gradientBaseId}-glow)` : undefined}
                        style={{ transition: 'stroke-opacity 180ms ease, stroke-width 180ms ease' }}
                      />

                      {/* Flowing animated energy pulse along active edges */}
                      {isEdgeActive && !prefersReduced && (
                        <>
                          <path
                            d={d}
                            fill="none"
                            stroke="#67e8f9"
                            strokeWidth="2.2"
                            strokeDasharray="6 10"
                            strokeOpacity="0.85"
                          >
                            <animate
                              attributeName="stroke-dashoffset"
                              from="32"
                              to="0"
                              dur={`${1.35 + (idx % 3) * 0.25}s`}
                              repeatCount="indefinite"
                            />
                          </path>
                          <circle r="3.6" fill="#a5f3fc" filter={`url(#${gradientBaseId}-glow)`}>
                            <animateMotion
                              dur={`${1.9 + (idx % 4) * 0.35}s`}
                              repeatCount="indefinite"
                              path={d}
                            />
                          </circle>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Positioned Interactive Nodes */}
              {layoutNodes.map((node, idx) => {
                const isSelected = inspectorNode?.id === node.id;
                const isNeighbor = activeNeighborIds.has(node.id);
                const isDimmed =
                  focusNodeId !== null && node.id !== focusNodeId && !isNeighbor;

                return (
                  <motion.button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelectNode(node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setSelectedId(node.id)}
                    initial={prefersReduced ? false : { opacity: 0, scale: 0.88 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.28, delay: Math.min(idx * 0.015, 0.35) }}
                    aria-label={`${node.tile.label} — inspect tool details and connections`}
                    aria-pressed={isSelected}
                    style={{
                      left: `${node.xPct}%`,
                      top: `${node.yPct}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl px-2 py-1.5 flex items-center gap-1.5 lg:gap-2 border backdrop-blur-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isSelected
                        ? 'z-30 bg-slate-900/95 border-cyan-300/80 shadow-[0_0_24px_rgba(34,211,238,0.28)] scale-[1.06]'
                        : isNeighbor
                        ? 'z-20 bg-slate-900/90 border-cyan-400/50 shadow-[0_0_16px_rgba(56,189,248,0.16)]'
                        : 'z-10 bg-slate-950/85 border-white/[0.11] hover:border-cyan-400/50 hover:bg-slate-900/90'
                    } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                  >
                    <RepoImage
                      src={node.tile.logoPath}
                      alt={node.tile.label}
                      className="w-4 h-4 lg:w-5 lg:h-5 shrink-0"
                      imgClassName="w-full h-full object-contain"
                      fallback={
                        <BrandMark brand={node.tile.brandKey} className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                      }
                    />
                    <span className="text-[11px] font-mono text-zinc-100 whitespace-nowrap max-w-[88px] lg:max-w-[118px] truncate">
                      {node.tile.label}
                    </span>
                  </motion.button>
                );
              })}

              {/* Bottom Graph Micro-Legend */}
              <div className="pointer-events-none absolute bottom-2.5 right-3.5 text-[10px] font-mono text-zinc-400/85 bg-slate-950/70 px-2.5 py-1 rounded border border-white/[0.06]">
                Hover or tap any node to trace stack dependencies
              </div>
            </div>
          </div>

          {/* Mobile (< md) Adaptive Hub-and-Spoke Interactive Constellation */}
          <div className="md:hidden p-4 space-y-4 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.08),transparent_70%)]">
            {/* Horizontal touch-friendly selector strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
              {layoutNodes.map((node) => {
                const isSelected = inspectorNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelectNode(node.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border inline-flex items-center gap-2 shrink-0 text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-100'
                        : 'bg-slate-950/75 border-white/[0.09] text-zinc-300'
                    }`}
                  >
                    <RepoImage
                      src={node.tile.logoPath}
                      alt={node.tile.label}
                      className="w-4 h-4 shrink-0"
                      imgClassName="w-full h-full object-contain"
                      fallback={
                        <BrandMark brand={node.tile.brandKey} className="w-4 h-4 shrink-0" />
                      }
                    />
                    <span>{node.tile.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Compact SVG Hub & Neighbor Spoke Map */}
            {inspectorNode && (
              <div className="relative w-full h-[228px] rounded-xl border border-white/[0.07] bg-slate-950/60 overflow-hidden">
                <svg
                  viewBox="0 0 360 224"
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  {mobileOrbitalData.points.map(({ node, x, y }, idx) => {
                    const path = `M 180 112 Q ${(180 + x) / 2} ${Math.min(112, y) - 14}, ${x} ${y}`;
                    return (
                      <g key={node.id}>
                        <path
                          d={path}
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="1.6"
                          strokeOpacity="0.55"
                        />
                        {!prefersReduced && (
                          <circle r="3" fill="#67e8f9">
                            <animateMotion
                              dur={`${1.6 + idx * 0.25}s`}
                              repeatCount="indefinite"
                              path={path}
                            />
                          </circle>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Center Selected Hub */}
                <div
                  style={{ left: '50%', top: '50%' }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-300/75 shadow-[0_0_20px_rgba(34,211,238,0.28)] flex items-center gap-2 z-20"
                >
                  <RepoImage
                    src={inspectorNode.tile.logoPath}
                    alt={inspectorNode.tile.label}
                    className="w-5 h-5 shrink-0"
                    imgClassName="w-full h-full object-contain"
                    fallback={
                      <BrandMark brand={inspectorNode.tile.brandKey} className="w-5 h-5 shrink-0" />
                    }
                  />
                  <span className="text-xs font-mono font-semibold text-zinc-50 whitespace-nowrap">
                    {inspectorNode.tile.label}
                  </span>
                </div>

                {/* Connected Neighbors */}
                {mobileOrbitalData.points.map(({ node, x, y }) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelectNode(node.id)}
                    style={{ left: `${(x / 360) * 100}%`, top: `${(y / 224) * 100}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1.5 min-h-[36px] rounded-lg bg-slate-950/90 border border-cyan-400/35 hover:border-cyan-300/75 flex items-center gap-1.5 z-10 max-w-[128px]"
                  >
                    <RepoImage
                      src={node.tile.logoPath}
                      alt={node.tile.label}
                      className="w-3.5 h-3.5 shrink-0"
                      imgClassName="w-full h-full object-contain"
                      fallback={
                        <BrandMark brand={node.tile.brandKey} className="w-3.5 h-3.5 shrink-0" />
                      }
                    />
                    <span className="text-[10px] font-mono text-zinc-200 truncate">
                      {node.tile.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grid View Mode */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {layoutNodes.map((node) => {
            const isSelected = inspectorNode?.id === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedId(node.id)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(node.id);
                  }
                }}
                aria-pressed={isSelected}
                className={`rounded-xl px-3 py-3.5 flex flex-col justify-between gap-2.5 border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-slate-900/95 border-cyan-400/65 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
                    : 'glass-panel-subtle glass-panel-hover border-white/[0.08]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <RepoImage
                    src={node.tile.logoPath}
                    alt={node.tile.label}
                    className="w-7 h-7 shrink-0"
                    imgClassName="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    fallback={
                      <BrandMark brand={node.tile.brandKey} className="w-7 h-7 shrink-0" />
                    }
                  />
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {node.tile.websiteUrl && (
                      <a
                        href={node.tile.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${node.tile.label} Official Website`}
                        aria-label={`${node.tile.label} Official Website`}
                        className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                    {node.tile.githubUrl && (
                      <a
                        href={node.tile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${node.tile.label} GitHub Repository`}
                        aria-label={`${node.tile.label} GitHub Repository`}
                        className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors"
                      >
                        <BrandMark brand="github" className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono font-medium text-zinc-100 leading-tight truncate">
                    {node.tile.label}
                  </div>
                  {node.tile.isFoss && (
                    <div className="text-[10px] font-mono text-cyan-400/80 mt-0.5">FOSS</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Tool Dossier Inspector Bar (One-line Summary, Connected Nodes, Website & GitHub Links) */}
      {inspectorNode && (
        <div className="glass-panel rounded-2xl border border-white/[0.1] p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-slate-950/85 border border-white/[0.1] flex items-center justify-center shrink-0">
                <RepoImage
                  src={inspectorNode.tile.logoPath}
                  alt={inspectorNode.tile.label}
                  className="w-6 h-6"
                  imgClassName="w-full h-full object-contain"
                  fallback={
                    <BrandMark brand={inspectorNode.tile.brandKey} className="w-6 h-6" />
                  }
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-display text-base sm:text-lg font-bold text-zinc-50 tracking-tight">
                    {inspectorNode.tile.label}
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-300/90 border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 rounded">
                    {LANE_META[inspectorNode.category].label}
                  </span>
                  {inspectorNode.tile.isFoss && (
                    <span className="text-[11px] font-mono text-emerald-300/90 border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                      FOSS
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {inspectorNode.tile.summary ||
                    `Core ${LANE_META[inspectorNode.category].shortLabel} technology connected across the production architecture.`}
                </p>
              </div>
            </div>

            {/* External Official Website & GitHub Repo Links */}
            {(inspectorNode.tile.websiteUrl || inspectorNode.tile.githubUrl) && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {inspectorNode.tile.websiteUrl && (
                  <a
                    href={inspectorNode.tile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-white/[0.12] bg-slate-950/75 hover:border-cyan-400/50 hover:text-cyan-200 text-xs font-mono text-zinc-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                    <span>Website</span>
                  </a>
                )}
                {inspectorNode.tile.githubUrl && (
                  <a
                    href={inspectorNode.tile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-white/[0.12] bg-slate-950/75 hover:border-cyan-400/50 hover:text-cyan-200 text-xs font-mono text-zinc-200 transition-colors"
                  >
                    <BrandMark brand="github" className="w-3.5 h-3.5 shrink-0" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Connected Stack Links */}
          {inspectorNeighbors.length > 0 && (
            <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mr-1">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400/80" aria-hidden="true" />
                <span>Connected to:</span>
              </span>
              {inspectorNeighbors.map((neighbor) => (
                <button
                  key={neighbor.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(neighbor.id);
                    setLockedFocusId(neighbor.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-white/[0.09] bg-slate-950/60 hover:border-cyan-400/50 hover:bg-slate-900 text-[11px] font-mono text-zinc-200 transition-colors"
                >
                  <RepoImage
                    src={neighbor.tile.logoPath}
                    alt={neighbor.tile.label}
                    className="w-3.5 h-3.5 shrink-0"
                    imgClassName="w-full h-full object-contain"
                    fallback={
                      <BrandMark brand={neighbor.tile.brandKey} className="w-3.5 h-3.5 shrink-0" />
                    }
                  />
                  <span>{neighbor.tile.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TechStackGraph;
