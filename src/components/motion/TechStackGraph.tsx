import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ExternalLink,
  GitBranch,
  Grid3X3,
  LayoutGrid,
  Maximize2,
  Move,
  Network,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import RepoImage from '../common/RepoImage';
import BrandMark from '../icons/BrandMarks';
import { SkillIconTile } from '../../types';
import TechDependencyHeatmap from './TechDependencyHeatmap';
import SkillToolPopover, { ActiveSkillPopover } from './SkillToolPopover';
import {
  buildEdgesFromNodes,
  buildNeighborMap,
  GRAPH_HEIGHT,
  GRAPH_WIDTH,
  LANE_META,
  LANE_ORDER,
  NormalizedTileNode,
  normalizeTiles,
  resolveSkillProficiency,
  TechCategoryId,
} from './techGraphUtils';

interface TechStackGraphProps {
  tiles: SkillIconTile[];
}

interface PositionedGraphNode extends NormalizedTileNode {
  x: number;
  y: number;
}

interface ForceSimDatum extends d3.SimulationNodeDatum {
  id: string;
  category: TechCategoryId;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
}

interface ForceSimLink extends d3.SimulationLinkDatum<ForceSimDatum> {
  source: string | ForceSimDatum;
  target: string | ForceSimDatum;
}

const buildD3EdgePath = (x1: number, y1: number, x2: number, y2: number): string => {
  const dx = Math.abs(x2 - x1);
  if (dx < 46) {
    const dy = y2 - y1;
    const bow = x1 > GRAPH_WIDTH * 0.5 ? -58 : 58;
    return `M ${x1} ${y1} C ${x1 + bow} ${y1 + dy * 0.28}, ${x2 + bow} ${y2 - dy * 0.28}, ${x2} ${y2}`;
  }
  const linkGen = d3
    .linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>()
    .x((d) => d[0])
    .y((d) => d[1]);
  return linkGen({ source: [x1, y1], target: [x2, y2] }) || `M ${x1} ${y1} L ${x2} ${y2}`;
};

export const TechStackGraph: React.FC<TechStackGraphProps> = ({ tiles }) => {
  const prefersReduced = useReducedMotion();
  const gradientBaseId = useId().replace(/:/g, '');

  const [activeFilter, setActiveFilter] = useState<'all' | TechCategoryId>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'heatmap' | 'grid'>('graph');
  const [selectedId, setSelectedId] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [lockedFocusId, setLockedFocusId] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<ActiveSkillPopover | null>(null);

  // Interactive D3 Zoom & Node Pin Overrides
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [zoomState, setZoomState] = useState<{ k: number; x: number; y: number }>({
    k: 1,
    x: 0,
    y: 0,
  });
  const [dragOverrides, setDragOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragSessionRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startNodeX: number;
    startNodeY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const normalizedTiles = useMemo(() => normalizeTiles(tiles), [tiles]);

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
      const weight = count > 9 ? 1.85 : 1;
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

  const edges = useMemo(() => buildEdgesFromNodes(filteredItems), [filteredItems]);

  const neighborMap = useMemo(
    () => buildNeighborMap(filteredItems, edges),
    [filteredItems, edges]
  );

  // D3 Force-Directed Layout Engine (Clustered by Architectural Lane)
  const { settledNodes, maxRowsNeeded } = useMemo(() => {
    if (filteredItems.length === 0) {
      return { settledNodes: [] as PositionedGraphNode[], maxRowsNeeded: 1 };
    }

    let deepestRows = 1;
    const simNodes: ForceSimDatum[] = [];

    if (activeFilter !== 'all') {
      const cols =
        filteredItems.length > 12
          ? 4
          : Math.min(4, Math.max(2, Math.ceil(Math.sqrt(filteredItems.length))));
      const rows = Math.ceil(filteredItems.length / cols);
      deepestRows = rows;

      filteredItems.forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const staggerY = col % 2 === 1 && rows > 1 ? 18 : 0;
        const tx = cols === 1 ? GRAPH_WIDTH * 0.5 : 130 + (col / (cols - 1)) * (GRAPH_WIDTH - 260);
        const ty =
          rows === 1
            ? GRAPH_HEIGHT * 0.5
            : 96 + (row / Math.max(rows - 1, 1)) * (GRAPH_HEIGHT - 190) + staggerY;
        simNodes.push({
          id: item.id,
          category: item.category,
          targetX: tx,
          targetY: ty,
          x: tx,
          y: ty,
        });
      });
    } else {
      laneLayoutMeta.forEach(({ lane, startPct, widthPct }) => {
        const laneItems = filteredItems.filter((item) => item.category === lane);
        // Sort most-connected hubs slightly toward vertical middle for cleaner edges
        const sortedLane = [...laneItems].sort((a, b) => {
          const degB = neighborMap.get(b.id)?.size ?? 0;
          const degA = neighborMap.get(a.id)?.size ?? 0;
          return degB - degA;
        });

        // Interleave from center outward so hub tools sit near middle rather than corners
        const interleaved: typeof laneItems = new Array(sortedLane.length);
        let midL = Math.floor((sortedLane.length - 1) / 2);
        let midR = midL + 1;
        sortedLane.forEach((item, idx) => {
          if (idx % 2 === 0 && midL >= 0) {
            interleaved[midL--] = item;
          } else if (midR < sortedLane.length) {
            interleaved[midR++] = item;
          } else if (midL >= 0) {
            interleaved[midL--] = item;
          }
        });

        const count = interleaved.length;
        const useTwoSubCols = count > 9;
        const leftX = ((startPct + widthPct * 0.28) / 100) * GRAPH_WIDTH;
        const rightX = ((startPct + widthPct * 0.72) / 100) * GRAPH_WIDTH;
        const centerX = ((startPct + widthPct * 0.5) / 100) * GRAPH_WIDTH;

        if (useTwoSubCols) {
          const rows = Math.ceil(count / 2);
          deepestRows = Math.max(deepestRows, rows);
          interleaved.forEach((item, pos) => {
            const subCol = pos % 2;
            const row = Math.floor(pos / 2);
            const staggerY = subCol === 1 && rows > 1 ? 16 : 0;
            const tx = subCol === 0 ? leftX : rightX;
            const ty =
              rows === 1
                ? GRAPH_HEIGHT * 0.5
                : 72 + (row / (rows - 1)) * (GRAPH_HEIGHT - 150) + staggerY;
            simNodes.push({
              id: item.id,
              category: item.category,
              targetX: tx,
              targetY: ty,
              x: tx,
              y: ty,
            });
          });
        } else {
          deepestRows = Math.max(deepestRows, count);
          const staggerSpan = Math.min((widthPct / 100) * GRAPH_WIDTH * 0.14, 28);
          interleaved.forEach((item, pos) => {
            const staggerX = count >= 4 ? (pos % 2 === 0 ? -staggerSpan : staggerSpan) : 0;
            const tx = Math.min(GRAPH_WIDTH - 65, Math.max(65, centerX + staggerX));
            const ty =
              count === 1 ? GRAPH_HEIGHT * 0.5 : 74 + (pos / (count - 1)) * (GRAPH_HEIGHT - 150);
            simNodes.push({
              id: item.id,
              category: item.category,
              targetX: tx,
              targetY: ty,
              x: tx,
              y: ty,
            });
          });
        }
      });
    }

    const simLinks: ForceSimLink[] = edges.map((e) => ({
      source: e.fromId,
      target: e.toId,
    }));

    const simulation = d3
      .forceSimulation<ForceSimDatum>(simNodes)
      .force(
        'link',
        d3
          .forceLink<ForceSimDatum, ForceSimLink>(simLinks)
          .id((d) => d.id)
          .distance(activeFilter === 'all' ? 115 : 135)
          .strength(0.16)
      )
      .force('charge', d3.forceManyBody<ForceSimDatum>().strength(activeFilter === 'all' ? -155 : -210))
      .force('collide', d3.forceCollide<ForceSimDatum>(activeFilter === 'all' ? 42 : 52).strength(0.9))
      .force('x', d3.forceX<ForceSimDatum>((d) => d.targetX).strength(activeFilter === 'all' ? 0.86 : 0.65))
      .force('y', d3.forceY<ForceSimDatum>((d) => d.targetY).strength(0.75))
      .stop();

    for (let i = 0; i < 160; i++) {
      simulation.tick();
    }

    const coordById = new Map<string, { x: number; y: number }>();
    simNodes.forEach((n) => {
      coordById.set(n.id, {
        x: Math.min(GRAPH_WIDTH - 58, Math.max(58, n.x)),
        y: Math.min(GRAPH_HEIGHT - 44, Math.max(44, n.y)),
      });
    });

    const positioned: PositionedGraphNode[] = filteredItems.map((item) => {
      const coord = coordById.get(item.id) ?? { x: GRAPH_WIDTH / 2, y: GRAPH_HEIGHT / 2 };
      return {
        ...item,
        x: coord.x,
        y: coord.y,
      };
    });

    return { settledNodes: positioned, maxRowsNeeded: deepestRows };
  }, [filteredItems, activeFilter, laneLayoutMeta, edges, neighborMap]);

  // Apply interactive user drag overrides on top of settled D3 simulation coordinates
  const layoutNodes = useMemo<PositionedGraphNode[]>(() => {
    return settledNodes.map((node) => {
      const custom = dragOverrides[node.id];
      return custom ? { ...node, x: custom.x, y: custom.y } : node;
    });
  }, [settledNodes, dragOverrides]);

  const layoutNodeById = useMemo(() => {
    const map = new Map<string, PositionedGraphNode>();
    layoutNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [layoutNodes]);

  // Attach D3 zoom/pan to the SVG canvas (explicitly protecting normal vertical page wheel scrolling)
  useEffect(() => {
    if (viewMode !== 'graph' || !svgRef.current) return;

    const svgEl = svgRef.current;
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.65, 2.2])
      .filter((event) => {
        // Never hijack unmodified vertical mouse wheel scrolling on the page;
        // users can zoom via +/- toolbar buttons, touch pinch, or Ctrl/Cmd+Wheel.
        if (event.type === 'wheel') {
          return Boolean(event.ctrlKey || event.metaKey);
        }
        return !event.button;
      })
      .on('zoom', (event) => {
        setZoomState({
          k: event.transform.k,
          x: event.transform.x,
          y: event.transform.y,
        });
      });

    zoomBehaviorRef.current = zoom;
    const selection = d3.select(svgEl);
    selection.call(zoom);

    return () => {
      selection.on('.zoom', null);
    };
  }, [viewMode, activeFilter]);

  const handleZoomBy = useCallback(
    (factor: number) => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      const sel = d3.select(svgRef.current);
      if (prefersReduced) {
        sel.call(zoomBehaviorRef.current.scaleBy, factor);
      } else {
        sel.transition().duration(220).call(zoomBehaviorRef.current.scaleBy, factor);
      }
    },
    [prefersReduced]
  );

  const handleResetLayout = useCallback(() => {
    setDragOverrides({});
    if (svgRef.current && zoomBehaviorRef.current) {
      const sel = d3.select(svgRef.current);
      if (prefersReduced) {
        sel.call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
      } else {
        sel.transition().duration(240).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
      }
    }
  }, [prefersReduced]);

  // Node pointer-drag handlers synchronized with D3 viewBox + current zoomState
  useEffect(() => {
    if (!draggingId) return;

    const handlePointerMove = (e: PointerEvent) => {
      const session = dragSessionRef.current;
      const container = canvasContainerRef.current;
      if (!session || !container) return;

      const dxScreen = e.clientX - session.startClientX;
      const dyScreen = e.clientY - session.startClientY;
      if (Math.hypot(dxScreen, dyScreen) > 4) {
        session.moved = true;
      }

      const rect = container.getBoundingClientRect();
      const dxViewBox = (dxScreen * (GRAPH_WIDTH / Math.max(rect.width, 1))) / zoomState.k;
      const dyViewBox = (dyScreen * (GRAPH_HEIGHT / Math.max(rect.height, 1))) / zoomState.k;

      const nextX = Math.min(GRAPH_WIDTH - 52, Math.max(52, session.startNodeX + dxViewBox));
      const nextY = Math.min(GRAPH_HEIGHT - 40, Math.max(40, session.startNodeY + dyViewBox));

      setDragOverrides((prev) => ({
        ...prev,
        [session.id]: { x: nextX, y: nextY },
      }));
    };

    const handlePointerUp = () => {
      if (dragSessionRef.current?.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 60);
      }
      dragSessionRef.current = null;
      setDraggingId(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingId, zoomState.k]);

  const activeSelectionId = useMemo(() => {
    if (selectedId && layoutNodes.some((n) => n.id === selectedId)) return selectedId;
    return layoutNodes[0]?.id ?? '';
  }, [selectedId, layoutNodes]);

  const focusNodeId = hoveredId ?? lockedFocusId;
  const inspectorNodeId = hoveredId ?? activeSelectionId;

  const inspectorNode = useMemo(
    () => layoutNodes.find((n) => n.id === inspectorNodeId) ?? layoutNodes[0] ?? null,
    [layoutNodes, inspectorNodeId]
  );

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
    if (!inspectorNode) {
      return { neighbors: [], points: [] as Array<{ node: PositionedGraphNode; x: number; y: number }> };
    }
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

  const hasCustomViewport =
    Object.keys(dragOverrides).length > 0 ||
    Math.abs(zoomState.k - 1) > 0.02 ||
    Math.abs(zoomState.x) > 2 ||
    Math.abs(zoomState.y) > 2;

  const handleSelectNode = (id: string, anchorEl?: HTMLElement | null) => {
    if (suppressClickRef.current) return;
    setSelectedId(id);
    setLockedFocusId((prev) => (prev === id ? null : id));

    const targetNode = layoutNodeById.get(id);
    if (anchorEl && targetNode) {
      const rect = anchorEl.getBoundingClientRect();
      setActivePopover((prev) =>
        prev && prev.tile.label === targetNode.tile.label
          ? null
          : {
              tile: targetNode.tile,
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
    }
  };

  return (
    <div className="mb-12 space-y-4">
      {/* Toolbar: Domain Filters + Force Graph / Heatmap / Grid Switcher */}
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
                ? 'text-emerald-200 border-amber-400/45 bg-emerald-500/15'
                : 'text-zinc-400 border-white/[0.07] bg-[#07150d]/60 hover:text-zinc-100 hover:border-white/20'
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
                    ? 'text-emerald-200 border-amber-400/45 bg-emerald-500/15'
                    : 'text-zinc-400 border-white/[0.07] bg-[#07150d]/60 hover:text-zinc-100 hover:border-white/20'
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

        {/* Right Controls: Clear Lock + 3-Way View Switcher */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
          {lockedFocusId && (
            <button
              type="button"
              onClick={() => setLockedFocusId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-amber-400/40 bg-amber-500/10 text-xs font-mono text-amber-300 hover:bg-amber-500/20 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear Lock</span>
            </button>
          )}

          <div
            className="inline-flex p-1 rounded-lg bg-[#040e08]/85 border border-white/[0.08] overflow-x-auto max-w-full"
            role="group"
            aria-label="Switch technical stack visualization mode"
          >
            <button
              type="button"
              onClick={() => {
                setViewMode('graph');
                setActivePopover(null);
              }}
              aria-pressed={viewMode === 'graph'}
              className={`relative px-3 py-1.5 min-h-[36px] text-xs font-mono rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                viewMode === 'graph' ? 'text-amber-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {viewMode === 'graph' && (
                <motion.span
                  layoutId="tech-view-pill"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-md bg-emerald-500/15 border border-amber-400/40"
                />
              )}
              <Network className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
              <span className="relative z-10">Force Graph</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('heatmap');
                setActivePopover(null);
              }}
              aria-pressed={viewMode === 'heatmap'}
              className={`relative px-3 py-1.5 min-h-[36px] text-xs font-mono rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                viewMode === 'heatmap' ? 'text-amber-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {viewMode === 'heatmap' && (
                <motion.span
                  layoutId="tech-view-pill"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-md bg-emerald-500/15 border border-amber-400/40"
                />
              )}
              <Grid3X3 className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
              <span className="relative z-10">Heatmap</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                setActivePopover(null);
              }}
              aria-pressed={viewMode === 'grid'}
              className={`relative px-3 py-1.5 min-h-[36px] text-xs font-mono rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                viewMode === 'grid' ? 'text-amber-200' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {viewMode === 'grid' && (
                <motion.span
                  layoutId="tech-view-pill"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-md bg-emerald-500/15 border border-amber-400/40"
                />
              )}
              <LayoutGrid className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
              <span className="relative z-10">Tools Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Visualization Canvas */}
      {viewMode === 'graph' ? (
        <div className="glass-panel-subtle rounded-2xl border border-white/[0.09] overflow-hidden relative">
          {/* Desktop / Tablet D3 Force Dependency Graph (md+) */}
          <div className="hidden md:block">
            {/* Architectural Column Headers */}
            {activeFilter === 'all' && (
              <div
                className="grid border-b border-white/[0.07] bg-[#040e08]/75"
                style={{
                  gridTemplateColumns: laneLayoutMeta.map((l) => `${l.weight}fr`).join(' '),
                }}
              >
                {laneLayoutMeta.map(({ lane, count }) => {
                  const meta = LANE_META[lane];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={lane}
                      className="px-3 py-2.5 flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-300 border-r last:border-r-0 border-white/[0.06]"
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" aria-hidden="true" />
                      <span className="truncate">{meta.label}</span>
                      <span className="text-[10px] text-zinc-500 tabular-nums">({count})</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* D3 Graph Stage */}
            <div
              ref={canvasContainerRef}
              className="relative w-full select-none overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.07),rgba(4,11,7,0.52)_72%)]"
              style={{
                height: `${Math.max(540, Math.min(680, maxRowsNeeded * 64 + 90))}px`,
              }}
            >
              {/* Proportional Vertical Lane Dividers */}
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

              {/* D3 Zoom/Pan & Curved Link Layer */}
              <svg
                ref={svgRef}
                viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
                preserveAspectRatio="none"
                aria-label="Interactive D3 force-directed technical dependency graph"
                className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
              >
                <defs>
                  <linearGradient id={`${gradientBaseId}-edge`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.92" />
                    <stop offset="50%" stopColor="#facc15" stopOpacity="1" />
                    <stop offset="100%" stopColor="#fb923c" stopOpacity="0.92" />
                  </linearGradient>
                  <filter id={`${gradientBaseId}-glow`} x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <g transform={`translate(${zoomState.x}, ${zoomState.y}) scale(${zoomState.k})`}>
                  {edges.map((edge, idx) => {
                    const a = layoutNodeById.get(edge.fromId);
                    const b = layoutNodeById.get(edge.toId);
                    if (!a || !b) return null;

                    const d = buildD3EdgePath(a.x, a.y, b.x, b.y);
                    const isEdgeActive =
                      highlightedId !== null && (a.id === highlightedId || b.id === highlightedId);
                    const isDimmed = focusNodeId !== null && !isEdgeActive;

                    return (
                      <g key={edge.key}>
                        <path
                          d={d}
                          fill="none"
                          stroke={
                            isEdgeActive
                              ? `url(#${gradientBaseId}-edge)`
                              : 'rgba(110, 231, 183, 0.22)'
                          }
                          strokeWidth={isEdgeActive ? 2.2 : 1.15}
                          strokeOpacity={isDimmed ? 0.14 : isEdgeActive ? 0.95 : 0.45}
                          filter={isEdgeActive ? `url(#${gradientBaseId}-glow)` : undefined}
                          style={{
                            transition: 'stroke-opacity 180ms ease, stroke-width 180ms ease',
                          }}
                        />

                        {isEdgeActive && !prefersReduced && (
                          <>
                            <path
                              d={d}
                              fill="none"
                              stroke="#facc15"
                              strokeWidth="2.1"
                              strokeDasharray="6 10"
                              strokeOpacity="0.88"
                            >
                              <animate
                                attributeName="stroke-dashoffset"
                                from="32"
                                to="0"
                                dur={`${1.35 + (idx % 3) * 0.25}s`}
                                repeatCount="indefinite"
                              />
                            </path>
                            <circle r="3.5" fill="#fde047" filter={`url(#${gradientBaseId}-glow)`}>
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
                </g>
              </svg>

              {/* Draggable Interactive Node Layer Mapped to D3 Coordinates + Zoom Transform */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {layoutNodes.map((node, idx) => {
                  const tx = node.x * zoomState.k + zoomState.x;
                  const ty = node.y * zoomState.k + zoomState.y;
                  const xPct = (tx / GRAPH_WIDTH) * 100;
                  const yPct = (ty / GRAPH_HEIGHT) * 100;

                  const isSelected = inspectorNode?.id === node.id;
                  const isNeighbor = activeNeighborIds.has(node.id);
                  const isDimmed =
                    focusNodeId !== null && node.id !== focusNodeId && !isNeighbor;
                  const isBeingDragged = draggingId === node.id;
                  const degree = neighborMap.get(node.id)?.size ?? 0;
                  const prof = resolveSkillProficiency(node.tile);
                  const laneHex = LANE_META[node.category].accentHex;

                  return (
                    <motion.button
                      key={node.id}
                      type="button"
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.stopPropagation();
                        dragSessionRef.current = {
                          id: node.id,
                          startClientX: e.clientX,
                          startClientY: e.clientY,
                          startNodeX: node.x,
                          startNodeY: node.y,
                          moved: false,
                        };
                        setDraggingId(node.id);
                      }}
                      onClick={(e) => handleSelectNode(node.id, e.currentTarget)}
                      data-skill-popover-trigger="true"
                      onMouseEnter={() => {
                        if (!draggingId) setHoveredId(node.id);
                      }}
                      onMouseLeave={() => {
                        if (!draggingId) setHoveredId(null);
                      }}
                      onFocus={() => setSelectedId(node.id)}
                      initial={prefersReduced ? false : { opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.05 }}
                      transition={{ duration: 0.24, delay: Math.min(idx * 0.012, 0.3) }}
                      title={`${node.tile.label} · ${prof.years} (${prof.levelLabel})`}
                      aria-label={`${node.tile.label}, ${prof.years} (${prof.proficiency}% proficiency), ${degree} connections — click to inspect or drag to reposition`}
                      aria-pressed={isSelected}
                      style={{
                        left: `${xPct}%`,
                        top: `${yPct}%`,
                      }}
                      className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-xl px-2 pt-1.5 pb-1 flex flex-col items-stretch gap-1 border backdrop-blur-md transition-[border-color,background-color,box-shadow,opacity] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        isBeingDragged ? 'cursor-grabbing z-40' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'z-30 bg-[#07150d]/95 border-amber-300/80 shadow-[0_0_24px_rgba(250,204,21,0.28)]'
                          : isNeighbor
                          ? 'z-20 bg-[#07150d]/90 border-emerald-400/50 shadow-[0_0_16px_rgba(16,185,129,0.18)]'
                          : 'z-10 bg-[#040e08]/90 border-white/[0.11] hover:border-amber-400/50 hover:bg-[#07150d]/90'
                      } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                    >
                      <span className="flex items-center gap-1.5 lg:gap-2 pointer-events-none">
                        <RepoImage
                          src={node.tile.logoPath}
                          alt={node.tile.label}
                          className="w-4 h-4 lg:w-5 lg:h-5 shrink-0"
                          imgClassName="w-full h-full object-contain"
                          fallback={
                            <BrandMark
                              brand={node.tile.brandKey}
                              className="w-4 h-4 lg:w-5 lg:h-5 shrink-0"
                            />
                          }
                        />
                        <span className="text-[11px] font-mono text-zinc-100 whitespace-nowrap max-w-[92px] lg:max-w-[120px] truncate">
                          {node.tile.label}
                        </span>
                        <span className="text-[9px] font-mono text-amber-300/80 tabular-nums">
                          {degree}
                        </span>
                      </span>
                      {/* Subtle Proficiency Hairline Bar */}
                      <span
                        aria-hidden="true"
                        className="w-full h-[2px] rounded-full bg-white/[0.08] overflow-hidden pointer-events-none"
                      >
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${prof.proficiency}%`,
                            backgroundColor: laneHex,
                            opacity: isSelected || isNeighbor ? 0.95 : 0.68,
                          }}
                        />
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Top-Right D3 Zoom & Layout Controls */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1 rounded-lg bg-[#040e08]/85 border border-white/[0.1] p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => handleZoomBy(1.22)}
                  title="Zoom in graph"
                  aria-label="Zoom in graph"
                  className="p-1.5 rounded text-zinc-300 hover:text-amber-200 hover:bg-white/[0.06] transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleZoomBy(0.82)}
                  title="Zoom out graph"
                  aria-label="Zoom out graph"
                  className="p-1.5 rounded text-zinc-300 hover:text-amber-200 hover:bg-white/[0.06] transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                {hasCustomViewport && (
                  <button
                    type="button"
                    onClick={handleResetLayout}
                    title="Reset zoom and node positions"
                    aria-label="Reset zoom and node positions"
                    className="px-2 py-1 rounded text-[10px] font-mono text-emerald-300 hover:bg-emerald-500/15 inline-flex items-center gap-1 transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Bottom D3 Micro-Instructions */}
              <div className="pointer-events-none absolute bottom-2.5 right-3.5 z-20 inline-flex items-center gap-2 text-[10px] font-mono text-zinc-400/90 bg-[#040e08]/80 px-2.5 py-1 rounded border border-white/[0.06]">
                <Move className="w-3 h-3 text-emerald-400/80" aria-hidden="true" />
                <span>Drag nodes or pan canvas · Hover/tap to trace {edges.length} edges</span>
              </div>
            </div>
          </div>

          {/* Mobile (< md) Adaptive Hub-and-Spoke Interactive Constellation */}
          <div className="md:hidden p-4 space-y-4 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)]">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
              {layoutNodes.map((node) => {
                const isSelected = inspectorNode?.id === node.id;
                const prof = resolveSkillProficiency(node.tile);
                return (
                  <button
                    key={node.id}
                    type="button"
                    data-skill-popover-trigger="true"
                    onClick={(e) => handleSelectNode(node.id, e.currentTarget)}
                    className={`min-h-[44px] px-3 pt-2 pb-1.5 rounded-xl border inline-flex flex-col justify-center gap-1 shrink-0 text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/15 border-amber-400/60 text-amber-100'
                        : 'bg-[#040e08]/80 border-white/[0.09] text-zinc-300'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
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
                    </span>
                    <span
                      aria-hidden="true"
                      className="w-full h-[2px] rounded-full bg-white/[0.08] overflow-hidden"
                    >
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${prof.proficiency}%`,
                          backgroundColor: LANE_META[node.category].accentHex,
                        }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            {inspectorNode && (
              <div className="relative w-full h-[228px] rounded-xl border border-white/[0.07] bg-[#040e08]/65 overflow-hidden">
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
                          stroke="#10b981"
                          strokeWidth="1.6"
                          strokeOpacity="0.6"
                        />
                        {!prefersReduced && (
                          <circle r="3" fill="#facc15">
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

                <div
                  style={{ left: '50%', top: '50%' }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-[#07150d] border border-amber-300/75 shadow-[0_0_20px_rgba(250,204,21,0.26)] flex items-center gap-2 z-20"
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

                {mobileOrbitalData.points.map(({ node, x, y }) => (
                  <button
                    key={node.id}
                    type="button"
                    data-skill-popover-trigger="true"
                    onClick={(e) => handleSelectNode(node.id, e.currentTarget)}
                    style={{ left: `${(x / 360) * 100}%`, top: `${(y / 224) * 100}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1.5 min-h-[36px] rounded-lg bg-[#040e08]/92 border border-emerald-400/35 hover:border-amber-300/75 flex items-center gap-1.5 z-10 max-w-[128px]"
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
      ) : viewMode === 'heatmap' ? (
        <TechDependencyHeatmap
          nodes={filteredItems}
          neighborMap={neighborMap}
          selectedNodeId={inspectorNode?.id ?? ''}
          onSelectNode={(primaryId, _companionId, anchorEl) => {
            handleSelectNode(primaryId, anchorEl);
          }}
        />
      ) : (
        /* Grid View Mode */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {layoutNodes.map((node) => {
            const isSelected = inspectorNode?.id === node.id;
            const prof = resolveSkillProficiency(node.tile);
            const laneHex = LANE_META[node.category].accentHex;

            return (
              <div
                key={node.id}
                data-skill-popover-trigger="true"
                onClick={(e) => handleSelectNode(node.id, e.currentTarget)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectNode(node.id, e.currentTarget);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={`${node.tile.label} · ${prof.years} (${prof.proficiency}% proficiency)`}
                className={`rounded-xl px-3 py-3.5 flex flex-col justify-between gap-2.5 border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-[#07150d]/95 border-amber-400/65 shadow-[0_0_18px_rgba(250,204,21,0.18)]'
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
                        className="p-1 rounded text-zinc-400 hover:text-amber-300 hover:bg-white/[0.06] transition-colors"
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
                        className="p-1 rounded text-zinc-400 hover:text-amber-300 hover:bg-white/[0.06] transition-colors"
                      >
                        <BrandMark brand="github" className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-mono font-medium text-zinc-100 leading-tight truncate">
                    {node.tile.label}
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                    <span className="text-zinc-400 tabular-nums">{prof.years}</span>
                    {node.tile.isFoss ? (
                      <span className="text-emerald-400/85">FOSS</span>
                    ) : (
                      <span className="text-zinc-500">{prof.levelLabel}</span>
                    )}
                  </div>
                  <div
                    className="h-1 w-full rounded-full bg-white/[0.07] overflow-hidden"
                    role="progressbar"
                    aria-valuenow={prof.proficiency}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${node.tile.label} experience indicator`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${prof.proficiency}%`,
                        backgroundColor: laneHex,
                        opacity: isSelected ? 1 : 0.78,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Synchronized Interactive Tool Dossier Inspector Bar */}
      {inspectorNode && (
        <div className="glass-panel rounded-2xl border border-white/[0.1] p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#040e08]/85 border border-white/[0.1] flex items-center justify-center shrink-0">
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
                  <span className="text-[11px] font-mono text-emerald-300/90 border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {LANE_META[inspectorNode.category].label}
                  </span>
                  {inspectorNode.tile.isFoss && (
                    <span className="text-[11px] font-mono text-amber-300/90 border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 rounded">
                      FOSS
                    </span>
                  )}
                  {(() => {
                    const prof = resolveSkillProficiency(inspectorNode.tile);
                    return (
                      <span className="inline-flex items-center gap-2 text-[11px] font-mono text-zinc-300 tabular-nums ml-0.5">
                        <span>{prof.years}</span>
                        <span className="w-16 h-1.5 rounded-full bg-white/[0.09] overflow-hidden inline-block align-middle">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${prof.proficiency}%`,
                              backgroundColor: LANE_META[inspectorNode.category].accentHex,
                            }}
                          />
                        </span>
                        <span className="text-amber-300">{prof.proficiency}%</span>
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {inspectorNode.tile.summary ||
                    `Core ${LANE_META[inspectorNode.category].shortLabel} technology connected across the production architecture.`}
                </p>
              </div>
            </div>

            {(inspectorNode.tile.websiteUrl || inspectorNode.tile.githubUrl) && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {inspectorNode.tile.websiteUrl && (
                  <a
                    href={inspectorNode.tile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-white/[0.12] bg-[#040e08]/75 hover:border-amber-400/50 hover:text-amber-200 text-xs font-mono text-zinc-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>Website</span>
                  </a>
                )}
                {inspectorNode.tile.githubUrl && (
                  <a
                    href={inspectorNode.tile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-white/[0.12] bg-[#040e08]/75 hover:border-amber-400/50 hover:text-amber-200 text-xs font-mono text-zinc-200 transition-colors"
                  >
                    <BrandMark brand="github" className="w-3.5 h-3.5 shrink-0" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {inspectorNeighbors.length > 0 && (
            <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mr-1">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400/80" aria-hidden="true" />
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-white/[0.09] bg-[#040e08]/65 hover:border-amber-400/50 hover:bg-[#07150d] text-[11px] font-mono text-zinc-200 transition-colors"
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

      {/* Click-Triggered Skill Icon Popup / Tooltip */}
      <SkillToolPopover popover={activePopover} onClose={() => setActivePopover(null)} />
    </div>
  );
};

export default TechStackGraph;
