import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { ArrowUpDown, GitBranch, Layers, Sparkles } from 'lucide-react';
import RepoImage from '../common/RepoImage';
import BrandMark from '../icons/BrandMarks';
import {
  computeRelationshipMatrix,
  HeatmapCellData,
  LANE_META,
  LANE_ORDER,
  NormalizedTileNode,
} from './techGraphUtils';

interface TechDependencyHeatmapProps {
  nodes: NormalizedTileNode[];
  neighborMap: Map<string, Set<string>>;
  selectedNodeId: string;
  onSelectNode: (
    nodeId: string,
    companionNodeId?: string,
    anchorEl?: HTMLElement | null
  ) => void;
}

type SortMode = 'layer' | 'degree';

const SCORE_COLORS: Record<number, string> = {
  0: 'rgba(6, 20, 12, 0.65)',
  1: 'rgba(16, 185, 129, 0.14)',
  2: '#059669',
  3: '#d97706',
  4: '#facc15',
  5: 'rgba(249, 115, 22, 0.28)',
};

export const TechDependencyHeatmap: React.FC<TechDependencyHeatmapProps> = ({
  nodes,
  neighborMap,
  selectedNodeId,
  onSelectNode,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('layer');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null);

  const orderedNodes = useMemo(() => {
    const copy = [...nodes];
    if (sortMode === 'degree') {
      return copy.sort((a, b) => {
        const degDiff = (neighborMap.get(b.id)?.size ?? 0) - (neighborMap.get(a.id)?.size ?? 0);
        if (degDiff !== 0) return degDiff;
        return LANE_ORDER.indexOf(a.category) - LANE_ORDER.indexOf(b.category);
      });
    }
    return copy.sort((a, b) => {
      const laneDiff = LANE_ORDER.indexOf(a.category) - LANE_ORDER.indexOf(b.category);
      if (laneDiff !== 0) return laneDiff;
      return (neighborMap.get(b.id)?.size ?? 0) - (neighborMap.get(a.id)?.size ?? 0);
    });
  }, [nodes, neighborMap, sortMode]);

  const { cells, nodeById } = useMemo(
    () => computeRelationshipMatrix(orderedNodes, neighborMap),
    [orderedNodes, neighborMap]
  );

  // Adaptive D3 scaleBand cell geometry so 6-tool subsets & 30-tool matrices both stay sharp
  const cellSize = useMemo(() => {
    const count = orderedNodes.length;
    if (count <= 8) return 44;
    if (count <= 14) return 34;
    if (count <= 22) return 28;
    return 24;
  }, [orderedNodes.length]);

  const matrixSpan = orderedNodes.length * cellSize;
  const xBand = useMemo(
    () =>
      d3
        .scaleBand<string>()
        .domain(orderedNodes.map((n) => n.id))
        .range([0, matrixSpan])
        .paddingInner(0.14)
        .paddingOuter(0.06),
    [orderedNodes, matrixSpan]
  );

  const yBand = useMemo(
    () =>
      d3
        .scaleBand<string>()
        .domain(orderedNodes.map((n) => n.id))
        .range([0, matrixSpan])
        .paddingInner(0.14)
        .paddingOuter(0.06),
    [orderedNodes, matrixSpan]
  );

  // D3 continuous interpolator used for smooth gradient legend & multi-bridge intensity
  const bridgeColorScale = useMemo(
    () =>
      d3
        .scaleLinear<string>()
        .domain([1, 2, 3, 4])
        .range(['rgba(16, 185, 129, 0.18)', '#059669', '#d97706', '#facc15'])
        .interpolate(d3.interpolateRgb),
    []
  );

  const activeRowId = hoveredCell?.rowId ?? selectedNodeId;
  const activeColId = hoveredCell?.colId ?? selectedNodeId;

  const activeReadout = useMemo(() => {
    if (hoveredCell) {
      const rowNode = nodeById.get(hoveredCell.rowId);
      const colNode = nodeById.get(hoveredCell.colId);
      if (rowNode && colNode) {
        return { cell: hoveredCell, rowNode, colNode };
      }
    }
    const sel = nodeById.get(selectedNodeId) ?? orderedNodes[0];
    if (!sel) return null;
    const deg = neighborMap.get(sel.id)?.size ?? 0;
    return {
      cell: {
        rowId: sel.id,
        colId: sel.id,
        rowIndex: 0,
        colIndex: 0,
        kind: 'self' as const,
        score: 5,
        degree: deg,
        sharedBridges: [],
      },
      rowNode: sel,
      colNode: sel,
    };
  }, [hoveredCell, nodeById, selectedNodeId, orderedNodes, neighborMap]);

  if (orderedNodes.length === 0) return null;

  const bandwidth = xBand.bandwidth();

  return (
    <div className="glass-panel-subtle rounded-2xl border border-white/[0.09] overflow-hidden">
      {/* Top Heatmap Control & Legend Header */}
      <div className="px-4 py-3 border-b border-white/[0.07] bg-[#040e08]/75 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex p-0.5 rounded-lg bg-[#07150d]/85 border border-white/[0.08]"
            role="group"
            aria-label="Sort heatmap tools"
          >
            <button
              type="button"
              onClick={() => setSortMode('layer')}
              className={`px-2.5 py-1.5 text-[11px] font-mono rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                sortMode === 'layer'
                  ? 'bg-emerald-500/18 text-emerald-200 border border-emerald-400/35'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Layers className="w-3 h-3" aria-hidden="true" />
              <span>By Layer</span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode('degree')}
              className={`px-2.5 py-1.5 text-[11px] font-mono rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                sortMode === 'degree'
                  ? 'bg-emerald-500/18 text-emerald-200 border border-emerald-400/35'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
              <span>By Hubs</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
            {orderedNodes.length} × {orderedNodes.length} stack adjacency matrix
          </span>
        </div>

        {/* Continuous D3 Legend Scale */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-300">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm border border-white/15 inline-block"
              style={{ backgroundColor: SCORE_COLORS[1] }}
            />
            <span className="text-zinc-400">Same Layer</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm border border-white/15 inline-block"
              style={{ backgroundColor: bridgeColorScale(2) }}
            />
            <span className="text-zinc-300">1 Bridge</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm border border-white/15 inline-block"
              style={{ backgroundColor: bridgeColorScale(3) }}
            />
            <span className="text-zinc-200">2+ Bridges</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm border border-yellow-300/60 inline-block shadow-[0_0_8px_rgba(250,204,21,0.45)]"
              style={{ backgroundColor: SCORE_COLORS[4] }}
            />
            <span className="text-yellow-200">Direct Link</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm border border-orange-400/60 inline-block"
              style={{ backgroundColor: SCORE_COLORS[5] }}
            />
            <span className="text-orange-300">Hub Degree</span>
          </span>
        </div>
      </div>

      {/* Live Pair Relationship Readout Bar (Zero-Overlap Hover Readout) */}
      {activeReadout && (
        <div className="px-4 py-2.5 border-b border-white/[0.06] bg-[#07150d]/55 flex flex-wrap items-center justify-between gap-2 min-h-[44px]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-zinc-100 font-medium">
              <RepoImage
                src={activeReadout.rowNode.tile.logoPath}
                alt={activeReadout.rowNode.tile.label}
                className="w-3.5 h-3.5 shrink-0"
                imgClassName="w-full h-full object-contain"
                fallback={
                  <BrandMark
                    brand={activeReadout.rowNode.tile.brandKey}
                    className="w-3.5 h-3.5 shrink-0"
                  />
                }
              />
              <span>{activeReadout.rowNode.tile.label}</span>
            </span>

            {activeReadout.cell.kind !== 'self' && (
              <>
                <span className="text-amber-400/85">↔</span>
                <span className="inline-flex items-center gap-1.5 text-zinc-100 font-medium">
                  <RepoImage
                    src={activeReadout.colNode.tile.logoPath}
                    alt={activeReadout.colNode.tile.label}
                    className="w-3.5 h-3.5 shrink-0"
                    imgClassName="w-full h-full object-contain"
                    fallback={
                      <BrandMark
                        brand={activeReadout.colNode.tile.brandKey}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                    }
                  />
                  <span>{activeReadout.colNode.tile.label}</span>
                </span>
              </>
            )}

            <span className="text-zinc-500">·</span>

            {activeReadout.cell.kind === 'self' && (
              <span className="text-orange-300 tabular-nums">
                Hub degree: {activeReadout.cell.degree} direct integrations (
                {LANE_META[activeReadout.rowNode.category].shortLabel})
              </span>
            )}
            {activeReadout.cell.kind === 'direct' && (
              <span className="inline-flex items-center gap-1 text-yellow-300">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                <span>Direct architectural dependency</span>
              </span>
            )}
            {activeReadout.cell.kind === 'bridge' && (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <GitBranch className="w-3 h-3" aria-hidden="true" />
                <span>
                  Connected via{' '}
                  <strong className="text-zinc-100 font-medium">
                    {activeReadout.cell.sharedBridges.slice(0, 3).join(', ')}
                    {activeReadout.cell.sharedBridges.length > 3
                      ? ` +${activeReadout.cell.sharedBridges.length - 3}`
                      : ''}
                  </strong>
                </span>
              </span>
            )}
            {activeReadout.cell.kind === 'layer' && (
              <span className="text-zinc-300">
                Same layer ({LANE_META[activeReadout.rowNode.category].label})
              </span>
            )}
            {activeReadout.cell.kind === 'none' && (
              <span className="text-zinc-400">
                Separate layers ({LANE_META[activeReadout.rowNode.category].shortLabel} /{' '}
                {LANE_META[activeReadout.colNode.category].shortLabel})
              </span>
            )}
          </div>

          <span className="text-[11px] font-mono text-zinc-400">
            Click any cell to inspect tool dossier
          </span>
        </div>
      )}

      {/* Scrollable Matrix Canvas with Sticky Left Row Axis */}
      <div
        className="overflow-x-auto bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),rgba(4,11,7,0.52)_75%)] p-3 sm:p-5"
        onMouseLeave={() => setHoveredCell(null)}
      >
        <div className="inline-block min-w-full">
          <div className="flex flex-col mx-auto" style={{ width: `${148 + matrixSpan}px` }}>
            {/* Top Column Axis Header */}
            <div className="flex items-end" style={{ paddingLeft: '148px', height: '108px' }}>
              <div className="relative" style={{ width: `${matrixSpan}px`, height: '100%' }}>
                {orderedNodes.map((colNode) => {
                  const xPos = (xBand(colNode.id) ?? 0) + bandwidth / 2;
                  const isHighlighted = activeColId === colNode.id;

                  return (
                    <button
                      key={`col-axis-${colNode.id}`}
                      type="button"
                      data-skill-popover-trigger="true"
                      onClick={(e) => onSelectNode(colNode.id, undefined, e.currentTarget)}
                      style={{
                        left: `${xPos}px`,
                        bottom: '8px',
                      }}
                      className={`absolute origin-bottom-left -rotate-45 text-[10px] sm:text-[11px] font-mono whitespace-nowrap transition-colors focus:outline-none ${
                        isHighlighted
                          ? 'text-amber-300 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {colNode.tile.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matrix Body: Sticky Left Row Axis + D3 SVG Grid */}
            <div className="flex items-start">
              {/* Sticky Left Y-Axis Labels */}
              <div
                className="sticky left-0 z-20 shrink-0 bg-[#040b07]/92 backdrop-blur-md pr-2.5 border-r border-white/[0.06]"
                style={{ width: '148px', height: `${matrixSpan}px` }}
              >
                {orderedNodes.map((rowNode) => {
                  const yPos = yBand(rowNode.id) ?? 0;
                  const isHighlighted = activeRowId === rowNode.id;
                  const degree = neighborMap.get(rowNode.id)?.size ?? 0;

                  return (
                    <button
                      key={`row-axis-${rowNode.id}`}
                      type="button"
                      data-skill-popover-trigger="true"
                      onClick={(e) => onSelectNode(rowNode.id, undefined, e.currentTarget)}
                      style={{
                        top: `${yPos}px`,
                        height: `${bandwidth}px`,
                      }}
                      className={`absolute left-0 right-2.5 px-1.5 rounded flex items-center justify-between gap-1.5 text-left transition-colors ${
                        isHighlighted
                          ? 'bg-emerald-500/15 text-amber-200'
                          : 'text-zinc-300 hover:bg-white/[0.05] hover:text-zinc-100'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <RepoImage
                          src={rowNode.tile.logoPath}
                          alt={rowNode.tile.label}
                          className="w-3.5 h-3.5 shrink-0"
                          imgClassName="w-full h-full object-contain"
                          fallback={
                            <BrandMark
                              brand={rowNode.tile.brandKey}
                              className="w-3.5 h-3.5 shrink-0"
                            />
                          }
                        />
                        <span className="text-[10px] sm:text-[11px] font-mono truncate">
                          {rowNode.tile.label}
                        </span>
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 tabular-nums shrink-0">
                        {degree}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* D3 SVG Cell Grid */}
              <svg
                width={matrixSpan}
                height={matrixSpan}
                viewBox={`0 0 ${matrixSpan} ${matrixSpan}`}
                role="grid"
                aria-label="Technical stack dependency and co-occurrence matrix"
                className="shrink-0 overflow-visible select-none"
              >
                {/* Row & Column Crosshair Guide Bands */}
                {activeRowId && yBand(activeRowId) !== undefined && (
                  <rect
                    x={0}
                    y={yBand(activeRowId)}
                    width={matrixSpan}
                    height={bandwidth}
                    fill="rgba(16, 185, 129, 0.08)"
                    pointerEvents="none"
                  />
                )}
                {activeColId && xBand(activeColId) !== undefined && (
                  <rect
                    x={xBand(activeColId)}
                    y={0}
                    width={bandwidth}
                    height={matrixSpan}
                    fill="rgba(16, 185, 129, 0.08)"
                    pointerEvents="none"
                  />
                )}

                {cells.map((cell) => {
                  const x = xBand(cell.colId) ?? 0;
                  const y = yBand(cell.rowId) ?? 0;
                  const fill =
                    cell.kind === 'bridge'
                      ? bridgeColorScale(Math.min(cell.score, 3))
                      : SCORE_COLORS[cell.score] ?? SCORE_COLORS[0];

                  const isFocused =
                    hoveredCell?.rowId === cell.rowId && hoveredCell?.colId === cell.colId;
                  const isRowOrColActive =
                    cell.rowId === activeRowId || cell.colId === activeColId;
                  const rowLabel = nodeById.get(cell.rowId)?.tile.label ?? cell.rowId;
                  const colLabel = nodeById.get(cell.colId)?.tile.label ?? cell.colId;

                  return (
                    <g key={`${cell.rowId}-${cell.colId}`}>
                      <rect
                        x={x}
                        y={y}
                        width={bandwidth}
                        height={bandwidth}
                        rx={Math.max(3, Math.min(6, bandwidth * 0.2))}
                        fill={fill}
                        stroke={
                          isFocused
                            ? '#fde047'
                            : cell.kind === 'self'
                            ? 'rgba(251, 146, 60, 0.55)'
                            : cell.kind === 'direct'
                            ? 'rgba(253, 224, 71, 0.55)'
                            : isRowOrColActive
                            ? 'rgba(52, 211, 153, 0.28)'
                            : 'rgba(255, 255, 255, 0.05)'
                        }
                        strokeWidth={isFocused ? 1.8 : 0.8}
                        className="cursor-pointer transition-opacity duration-100 focus:outline-none"
                        tabIndex={cell.kind === 'self' || cell.kind === 'direct' ? 0 : -1}
                        role="gridcell"
                        aria-label={
                          cell.kind === 'self'
                            ? `${rowLabel}: ${cell.degree} direct connections`
                            : `${rowLabel} and ${colLabel}: ${cell.kind}`
                        }
                        onMouseEnter={() => setHoveredCell(cell)}
                        onFocus={() => setHoveredCell(cell)}
                        onClick={() =>
                          onSelectNode(
                            cell.rowId,
                            cell.rowId !== cell.colId ? cell.colId : undefined
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectNode(
                              cell.rowId,
                              cell.rowId !== cell.colId ? cell.colId : undefined
                            );
                          }
                        }}
                      />

                      {/* Crisp numeric hub count inside diagonal cells */}
                      {cell.kind === 'self' && bandwidth >= 18 && (
                        <text
                          x={x + bandwidth / 2}
                          y={y + bandwidth / 2 + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          pointerEvents="none"
                          fill="#fdba74"
                          fontSize={bandwidth >= 28 ? 11 : 9}
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight={600}
                        >
                          {cell.degree}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechDependencyHeatmap;
