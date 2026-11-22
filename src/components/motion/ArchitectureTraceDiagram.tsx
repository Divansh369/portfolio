import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, LayoutGroup } from 'framer-motion';
import {
  Boxes,
  Database,
  Globe,
  Layers,
  Network,
  Radio,
  RotateCcw,
  Server,
  ShieldCheck,
  Truck,
  Workflow,
} from 'lucide-react';
import TextScramble from './TextScramble';
import { ArchitectureTraceModeConfig, ArchitectureTraceNodeConfig } from '../../types';

interface PipelineNode extends ArchitectureTraceNodeConfig {
  x: number;
  y: number;
  triggerProgress: number;
  iconComp: React.ComponentType<{ className?: string }>;
}

const NODE_COORDINATES = [
  { x: 80, y: 96, triggerProgress: 0.02 },
  { x: 290, y: 44, triggerProgress: 0.27 },
  { x: 500, y: 96, triggerProgress: 0.51 },
  { x: 710, y: 44, triggerProgress: 0.76 },
  { x: 920, y: 96, triggerProgress: 0.98 },
];

const getTraceIcon = (iconKey?: string) => {
  switch ((iconKey || '').toLowerCase()) {
    case 'globe':
      return Globe;
    case 'shield':
      return ShieldCheck;
    case 'server':
      return Server;
    case 'network':
      return Network;
    case 'boxes':
      return Boxes;
    case 'truck':
      return Truck;
    case 'radio':
      return Radio;
    case 'workflow':
      return Workflow;
    case 'database':
      return Database;
    case 'layers':
      return Layers;
    default:
      return Server;
  }
};

const DEFAULT_TRACE_MODES: ArchitectureTraceModeConfig[] = [
  {
    id: 'primary',
    label: 'Cluster & Edge Ingress',
    headline: 'End-to-End Request Flow: Client to Managed Cluster',
    nodes: [
      {
        id: 'client',
        step: '01',
        label: 'Client & Mobile Apps',
        shortTitle: 'Web / Mobile Client',
        endpoint: 'https-edge',
        summary: 'External browser and mobile client requests arrive over TLS.',
        stack: 'HTTPS / TLS 1.3 / Edge CDN',
        icon: 'globe',
      },
      {
        id: 'tunnel',
        step: '02',
        label: 'Zero-Trust Tunnel',
        shortTitle: 'Encrypted Tunnel',
        endpoint: 'zero-trust-edge',
        summary: 'Outbound-only encrypted tunnel forwards requests without opening host ports.',
        stack: 'Zero-Trust Edge / WireGuard Mesh',
        icon: 'shield',
      },
      {
        id: 'host',
        step: '03',
        label: 'Hypervisor & Bridge',
        shortTitle: 'Compute Host Bridge',
        endpoint: 'vmbr0',
        summary: 'Virtual bridge routes packets between isolated containers and worker VMs.',
        stack: 'Linux Bridge / Snapshots / Virtualization',
        icon: 'server',
      },
      {
        id: 'ingress',
        step: '04',
        label: 'L2 Ingress & VIP',
        shortTitle: 'VIP + Ingress Proxy',
        endpoint: '10.0.0.10',
        summary: 'Layer-2 virtual IP and reverse-proxy ingress balance sessions across replicas.',
        stack: 'Layer-2 VIP / Reverse Proxy / DNS',
        icon: 'network',
      },
      {
        id: 'workloads',
        step: '05',
        label: 'Containers & Workers',
        shortTitle: 'APIs / DB / Pods',
        endpoint: 'worker-pool',
        summary: 'Stateless APIs, relational data stores, and replicated worker containers serve requests.',
        stack: 'Containers / Worker Pool / REST APIs',
        icon: 'boxes',
      },
    ],
  },
  {
    id: 'secondary',
    label: 'Streaming ETL Pipeline',
    headline: 'Data Pipeline Flow: Event Ingestion to Internal App',
    nodes: [
      {
        id: 'source',
        step: '01',
        label: 'Connected Event Sources',
        shortTitle: 'Event Producers',
        endpoint: 'telemetry-stream',
        summary: 'Continuous event payloads streamed from distributed external sources.',
        stack: 'Event Telemetry / Streaming Source',
        icon: 'truck',
      },
      {
        id: 'ingest',
        step: '02',
        label: 'Automated Collection',
        shortTitle: 'Validated Collection',
        endpoint: 'staging-rig',
        summary: 'Automated extraction scripts validated on test environments prior to rollout.',
        stack: 'Python / C++ / Automated Validation',
        icon: 'radio',
      },
      {
        id: 'etl',
        step: '03',
        label: 'Distributed Processing',
        shortTitle: 'Distributed ETL',
        endpoint: 'batch-and-stream',
        summary: 'Partitioned Spark/ETL pipelines clean, join, and aggregate daily datasets.',
        stack: 'Apache Spark / Python / SQL',
        icon: 'workflow',
      },
      {
        id: 'storage',
        step: '04',
        label: 'Curated Storage',
        shortTitle: 'Analytical Tables',
        endpoint: 'curated-tables',
        summary: 'Optimized columnar storage tables supporting fast interactive queries.',
        stack: 'Columnar Storage / Parquet / SQL',
        icon: 'database',
      },
      {
        id: 'app',
        step: '05',
        label: 'Internal Web App',
        shortTitle: 'API + Frontend UI',
        endpoint: 'internal-portal',
        summary: 'Custom internal API and React UI replacing slow legacy BI dashboards.',
        stack: 'FastAPI / React / TypeScript',
        icon: 'layers',
      },
    ],
  },
];

const TRACE_PATH_D =
  'M 80 96 H 150 C 190 96 180 44 220 44 H 360 C 400 44 390 96 430 96 H 570 C 610 96 600 44 640 44 H 780 C 820 44 810 96 850 96 H 920';

interface ArchitectureTraceDiagramProps {
  traces?: ArchitectureTraceModeConfig[];
}

export const ArchitectureTraceDiagram: React.FC<ArchitectureTraceDiagramProps> = ({ traces }) => {
  const modeConfigs = useMemo(
    () => (traces && traces.length > 0 ? traces : DEFAULT_TRACE_MODES),
    [traces]
  );

  const [modeId, setModeId] = useState<string>(modeConfigs[0].id);
  const [selectedIndex, setSelectedIndex] = useState<number>(2);
  const [runCounter, setRunCounter] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const traceGlowRef = useRef<SVGPathElement>(null);
  const traceCoreRef = useRef<SVGPathElement>(null);
  const headGroupRef = useRef<SVGGElement>(null);

  const [flaredIdx, setFlaredIdx] = useState<number>(-1);
  const [traceCooling, setTraceCooling] = useState<boolean>(false);

  const inView = useInView(containerRef, { once: true, amount: 0.35 });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!modeConfigs.some((m) => m.id === modeId)) {
      setModeId(modeConfigs[0].id);
    }
  }, [modeConfigs, modeId]);

  const activeConfig = modeConfigs.find((m) => m.id === modeId) || modeConfigs[0];

  const nodes: PipelineNode[] = useMemo(() => {
    return activeConfig.nodes.slice(0, 5).map((node, i) => {
      const coord = NODE_COORDINATES[i] || NODE_COORDINATES[NODE_COORDINATES.length - 1];
      return {
        ...node,
        ...coord,
        iconComp: getTraceIcon(node.icon),
      };
    });
  }, [activeConfig]);

  const activeNode = nodes[selectedIndex] || nodes[0];

  useEffect(() => {
    const pathEl = pathRef.current;
    const glowEl = traceGlowRef.current;
    const coreEl = traceCoreRef.current;
    const headEl = headGroupRef.current;
    if (!pathEl || !glowEl || !coreEl || !headEl) return;

    const totalLen = pathEl.getTotalLength();
    glowEl.style.strokeDasharray = `${totalLen}`;
    coreEl.style.strokeDasharray = `${totalLen}`;

    if (prefersReduced) {
      glowEl.style.strokeDashoffset = '0';
      coreEl.style.strokeDashoffset = '0';
      headEl.style.opacity = '0';
      setTraceCooling(true);
      return;
    }

    if (!inView) return;

    let raf = 0;
    const start = performance.now();
    const duration = 3100;
    let lastFlared = -1;
    setTraceCooling(false);
    setFlaredIdx(-1);

    const frame = (now: number) => {
      const raw = Math.min(1, (now - start) / duration);
      const modulated = Math.max(
        0,
        Math.min(1, raw - Math.sin(raw * Math.PI * 8) * 0.022)
      );

      const offset = totalLen * (1 - modulated);
      glowEl.style.strokeDashoffset = `${offset}`;
      coreEl.style.strokeDashoffset = `${offset}`;

      const pt = pathEl.getPointAtLength(modulated * totalLen);
      headEl.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
      headEl.style.opacity = raw >= 0.99 ? `${Math.max(0, (1 - raw) * 80)}` : '1';

      let activeArrival = -1;
      for (let i = 0; i < nodes.length; i++) {
        if (Math.abs(modulated - nodes[i].triggerProgress) < 0.055) {
          activeArrival = i;
          break;
        }
      }
      if (activeArrival !== lastFlared) {
        lastFlared = activeArrival;
        setFlaredIdx(activeArrival);
      }

      if (raw < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setTraceCooling(true);
        setFlaredIdx(-1);
        headEl.style.opacity = '0';
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [inView, modeId, runCounter, prefersReduced, nodes]);

  return (
    <div
      ref={containerRef}
      className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden"
    >
      {/* Subtle architectural dot backing */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Top Controls Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
            <Network className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Interactive System Signal Trace</span>
          </span>
          <h3 className="font-display text-lg sm:text-xl font-bold text-zinc-50 tracking-tight">
            {activeConfig.headline}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {modeConfigs.length > 1 && (
            <LayoutGroup id="trace-mode-switch">
              <div
                role="tablist"
                aria-label="Select architecture trace flow"
                className="flex items-center gap-1 p-1 glass-panel-subtle rounded-xl overflow-x-auto scrollbar-none max-w-full"
              >
                {modeConfigs.map((cfg) => {
                  const selected = modeId === cfg.id;
                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => {
                        setModeId(cfg.id);
                        setSelectedIndex(2);
                      }}
                      className={`relative px-3 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selected ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {selected && (
                        <motion.span
                          layoutId="trace-mode-active"
                          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600"
                        />
                      )}
                      <span className="relative z-10">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          )}

          <button
            type="button"
            onClick={() => setRunCounter((c) => c + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-mono text-zinc-300 hover:text-amber-300 glass-panel-subtle rounded-xl hover:border-amber-400/45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Replay signal trace animation"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Replay Trace</span>
          </button>
        </div>
      </div>

      {/* Desktop SVG Glowing Signal Circuit (md+) */}
      <div className="relative z-10 mt-6 hidden md:block">
        <div className="relative w-full">
          <svg
            viewBox="0 0 1000 144"
            className="w-full h-auto overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <filter id="trace-emerald-glow" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="head-filament" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="35%" stopColor="#facc15" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>
            </defs>

            <path
              ref={pathRef}
              d={TRACE_PATH_D}
              fill="none"
              stroke="rgba(167, 243, 208, 0.2)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            <path
              ref={traceGlowRef}
              d={TRACE_PATH_D}
              fill="none"
              stroke={traceCooling ? 'rgba(52, 211, 153, 0.42)' : 'rgba(250, 204, 21, 0.78)'}
              strokeWidth={traceCooling ? '2.5' : '4'}
              strokeLinecap="round"
              filter="url(#trace-emerald-glow)"
              className="transition-[stroke,stroke-width] duration-700"
            />

            <path
              ref={traceCoreRef}
              d={TRACE_PATH_D}
              fill="none"
              stroke={traceCooling ? 'rgba(167, 243, 208, 0.5)' : 'rgba(254, 243, 199, 0.92)'}
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            <g ref={headGroupRef} style={{ opacity: 0 }}>
              <circle r="15" fill="url(#head-filament)" />
              <circle r="3.5" fill="#ffffff" />
            </g>

            {nodes.map((node, idx) => {
              const isSelected = selectedIndex === idx;
              const isFlaring = flaredIdx === idx;
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  {isFlaring && (
                    <circle
                      r="20"
                      fill="none"
                      stroke="rgba(250, 204, 21, 0.78)"
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    r={isSelected ? '12' : '9'}
                    fill="#05120b"
                    stroke={
                      isSelected || isFlaring
                        ? '#facc15'
                        : 'rgba(167, 243, 208, 0.4)'
                    }
                    strokeWidth={isSelected ? '2' : '1.5'}
                  />
                  <circle
                    r={isSelected ? '4.5' : '3'}
                    fill={isSelected || isFlaring ? '#34d399' : '#94a3b8'}
                  />
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-5 gap-3 mt-2">
            {nodes.map((node, idx) => {
              const Icon = node.iconComp;
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/[0.1] border-amber-400/50 shadow-[0_0_24px_-8px_rgba(250,204,21,0.38)]'
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[11px] font-mono ${
                        isSelected ? 'text-emerald-400' : 'text-zinc-500'
                      }`}
                    >
                      {node.step}
                    </span>
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-amber-300' : 'text-zinc-400'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="font-display text-xs font-bold text-zinc-100 truncate">
                    {node.shortTitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Compact Hop Switcher (< md) */}
      <div className="relative z-10 mt-5 flex flex-wrap gap-2 md:hidden">
        {nodes.map((node, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-2 min-h-[42px] rounded-xl text-xs font-mono border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/15 border-amber-400/50 text-amber-200'
                  : 'glass-panel-subtle text-zinc-400'
              }`}
            >
              {node.step} · {node.shortTitle}
            </button>
          );
        })}
      </div>

      {/* Active Node Architectural Detail Strip */}
      {activeNode && (
        <div className="relative z-10 mt-5 pt-5 border-t border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-emerald-400 font-semibold">
                Hop {activeNode.step} · {activeNode.label}
              </span>
              <span className="text-zinc-600" aria-hidden="true">
                /
              </span>
              <TextScramble
                text={activeNode.endpoint}
                trigger="change"
                durationMs={340}
                className="text-zinc-200"
              />
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {activeNode.summary}
            </p>
          </div>

          <div className="text-xs font-mono text-zinc-400 glass-panel-subtle px-3.5 py-2.5 rounded-xl shrink-0 max-w-full break-words">
            {activeNode.stack}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitectureTraceDiagram;
