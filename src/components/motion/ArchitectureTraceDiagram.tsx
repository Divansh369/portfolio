import React, { useEffect, useRef, useState } from 'react';
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

type PipelineMode = 'proxmox' | 'databricks';

interface PipelineNode {
  id: string;
  step: string;
  label: string;
  shortTitle: string;
  endpoint: string;
  summary: string;
  stack: string;
  x: number;
  y: number;
  triggerProgress: number;
  icon: React.ComponentType<{ className?: string }>;
}

const PROXMOX_NODES: PipelineNode[] = [
  {
    id: 'client',
    step: '01',
    label: 'Client & Mobile Apps',
    shortTitle: 'FiT-UC / Browser',
    endpoint: 'diivvansh.com',
    summary:
      'Flutter Care Leaver mobile users (20–30 monthly active users on Google Play) and browser sessions enter via HTTPS.',
    stack: 'Flutter (Android) / HTTPS / TLS 1.3',
    x: 80,
    y: 96,
    triggerProgress: 0.02,
    icon: Globe,
  },
  {
    id: 'cloudflare',
    step: '02',
    label: 'Zero-Trust Edge',
    shortTitle: 'Cloudflare Tunnel',
    endpoint: 'udayan.diivvansh.com',
    summary:
      'Outbound-only cloudflared daemon exposes internal sub-services cleanly with zero open firewall ports on home broadband.',
    stack: 'Cloudflare Zero-Trust / WireGuard Tailscale',
    x: 290,
    y: 44,
    triggerProgress: 0.27,
    icon: ShieldCheck,
  },
  {
    id: 'proxmox',
    step: '03',
    label: 'Hypervisor & Bridge',
    shortTitle: 'Proxmox VE 8 Bridge',
    endpoint: 'pve.diivvansh.com',
    summary:
      'Consolidated Proxmox VE 8 server routes Linux bridge traffic (vmbr0) between isolated LXC containers and K3s virtual machines, with PBS snapshots.',
    stack: 'Proxmox VE 8 / vmbr0 / PBS Deduplicated Backups',
    x: 500,
    y: 96,
    triggerProgress: 0.51,
    icon: Server,
  },
  {
    id: 'traefik',
    step: '04',
    label: 'L2 Ingress & VIP',
    shortTitle: 'MetalLB + Traefik',
    endpoint: '192.168.1.180',
    summary:
      'MetalLB announces bare-metal Layer-2 virtual IPs while Traefik ingress controller distributes sessions round-robin across replicas.',
    stack: 'MetalLB L2 VIP / Traefik Ingress / CoreDNS',
    x: 710,
    y: 44,
    triggerProgress: 0.76,
    icon: Network,
  },
  {
    id: 'workloads',
    step: '05',
    label: 'LXCs & 6-Node K3s',
    shortTitle: 'NocoDB / Auth / Pods',
    endpoint: 'k3s-masters (3) + workers (3)',
    summary:
      'Production NocoDB REST API, Node.js auth server, Gotify alert relay (LXCs), and HA NGINX pods (3 K3s masters + 3 workers).',
    stack: 'LXC (Debian/Alpine) / K3s / NocoDB / Gotify',
    x: 920,
    y: 96,
    triggerProgress: 0.98,
    icon: Boxes,
  },
];

const DATABRICKS_NODES: PipelineNode[] = [
  {
    id: 'fleet',
    step: '01',
    label: 'Connected Commercial Fleet',
    shortTitle: '~70,000 Trucks',
    endpoint: 'Daily Telemetry Stream',
    summary:
      'Daily operational telemetry and vehicle diagnostic records ingested across roughly 70,000 connected commercial trucks.',
    stack: 'Connected Vehicle Telemetry / Fleet Events',
    x: 80,
    y: 96,
    triggerProgress: 0.02,
    icon: Truck,
  },
  {
    id: 'ota',
    step: '02',
    label: 'OTA Collection & Test Rig',
    shortTitle: 'OTA Hardware Test Rig',
    endpoint: 'Pre-Rollout Validation',
    summary:
      'Automated Over-The-Air (OTA) data collection scripts authored and validated on hardware test rigs prior to live fleet rollout.',
    stack: 'Python / C++ / Automated OTA Workflows',
    x: 290,
    y: 44,
    triggerProgress: 0.27,
    icon: Radio,
  },
  {
    id: 'spark',
    step: '03',
    label: 'Distributed Processing',
    shortTitle: 'Databricks Spark ETL',
    endpoint: 'Apache Spark Jobs',
    summary:
      'Distributed Apache Spark ETL jobs partitioned, tuned, and monitored daily to process multi-million-row telemetry batches reliably.',
    stack: 'Databricks / Apache Spark / Python / SQL',
    x: 500,
    y: 96,
    triggerProgress: 0.51,
    icon: Workflow,
  },
  {
    id: 'delta',
    step: '04',
    label: 'Curated Storage',
    shortTitle: 'Delta Lake Tables',
    endpoint: 'Multi-Million Rows',
    summary:
      'Optimized Delta Lake storage tables replacing fragmented legacy data extracts with fast analytical query views.',
    stack: 'Delta Lake / Partitioned Parquet / SQL',
    x: 710,
    y: 44,
    triggerProgress: 0.76,
    icon: Database,
  },
  {
    id: 'app',
    step: '05',
    label: 'Internal Databricks App',
    shortTitle: 'FastAPI + React UI',
    endpoint: 'Replaced Power BI',
    summary:
      'Custom internal web application built with FastAPI, Node.js, and React inside Databricks to supersede sluggish legacy BI dashboards.',
    stack: 'FastAPI / React / Node.js / TypeScript',
    x: 920,
    y: 96,
    triggerProgress: 0.98,
    icon: Layers,
  },
];

const TRACE_PATH_D =
  'M 80 96 H 150 C 190 96 180 44 220 44 H 360 C 400 44 390 96 430 96 H 570 C 610 96 600 44 640 44 H 780 C 820 44 810 96 850 96 H 920';

/**
 * Interactive Signal Trace Visualizer adapted from Kimi's Season Circuit Trace:
 * - Draws the real topology path with subtle crawling dashed conduits
 * - Sweeps a glowing cyan trace with a bright white filament hot head that
 *   modulates pace smoothly around S-bends and triggers corner-node flares on arrival
 * - Lets visitors inspect every real hop or switch between Proxmox/K3s & Databricks Fleet flows
 */
export const ArchitectureTraceDiagram: React.FC = () => {
  const [mode, setMode] = useState<PipelineMode>('proxmox');
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

  const nodes = mode === 'proxmox' ? PROXMOX_NODES : DATABRICKS_NODES;
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
      // Decelerate slightly into node S-bends, accelerate on straight conduits
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

      // Trigger synchronous arrival flare as head passes each node
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
  }, [inView, mode, runCounter, prefersReduced]);

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
          <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Network className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Interactive System Signal Trace</span>
          </span>
          <h3 className="font-display text-lg sm:text-xl font-bold text-zinc-50 tracking-tight">
            {mode === 'proxmox'
              ? 'End-to-End Request Flow: Client to Proxmox VE 8 & K3s'
              : 'Fleet Telemetry Flow: Connected Trucks to Databricks App'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <LayoutGroup id="trace-mode-switch">
            <div
              role="tablist"
              aria-label="Select architecture trace flow"
              className="flex items-center gap-1 p-1 glass-panel-subtle rounded-xl"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'proxmox'}
                onClick={() => {
                  setMode('proxmox');
                  setSelectedIndex(2);
                }}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'proxmox' ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {mode === 'proxmox' && (
                  <motion.span
                    layoutId="trace-mode-active"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600/90"
                  />
                )}
                <span className="relative z-10">Proxmox &amp; K3s Ingress</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mode === 'databricks'}
                onClick={() => {
                  setMode('databricks');
                  setSelectedIndex(2);
                }}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'databricks' ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {mode === 'databricks' && (
                  <motion.span
                    layoutId="trace-mode-active"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600/90"
                  />
                )}
                <span className="relative z-10">Databricks Fleet ETL</span>
              </button>
            </div>
          </LayoutGroup>

          <button
            type="button"
            onClick={() => setRunCounter((c) => c + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-zinc-300 hover:text-cyan-300 glass-panel-subtle rounded-xl hover:border-cyan-400/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
              <filter id="trace-cyan-glow" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="head-filament" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="35%" stopColor="#22d3ee" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Base muted conduit geometry (reference path) */}
            <path
              ref={pathRef}
              d={TRACE_PATH_D}
              fill="none"
              stroke="rgba(148, 163, 184, 0.22)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />

            {/* Additive Glow Circuit Fill */}
            <path
              ref={traceGlowRef}
              d={TRACE_PATH_D}
              fill="none"
              stroke={traceCooling ? 'rgba(56, 189, 248, 0.35)' : 'rgba(34, 211, 238, 0.72)'}
              strokeWidth={traceCooling ? '2.5' : '4'}
              strokeLinecap="round"
              filter="url(#trace-cyan-glow)"
              className="transition-[stroke,stroke-width] duration-700"
            />

            {/* Sharp Inner Core Stroke */}
            <path
              ref={traceCoreRef}
              d={TRACE_PATH_D}
              fill="none"
              stroke={traceCooling ? 'rgba(186, 230, 253, 0.45)' : 'rgba(224, 242, 254, 0.92)'}
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Traveling Hot Filament Head */}
            <g ref={headGroupRef} style={{ opacity: 0 }}>
              <circle r="15" fill="url(#head-filament)" />
              <circle r="3.5" fill="#ffffff" />
            </g>

            {/* 5 Interactive Hardware Nodes */}
            {nodes.map((node, idx) => {
              const isSelected = selectedIndex === idx;
              const isFlaring = flaredIdx === idx;
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  {isFlaring && (
                    <circle
                      r="20"
                      fill="none"
                      stroke="rgba(34, 211, 238, 0.75)"
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    r={isSelected ? '12' : '9'}
                    fill="#070c18"
                    stroke={
                      isSelected || isFlaring
                        ? '#22d3ee'
                        : 'rgba(148, 163, 184, 0.45)'
                    }
                    strokeWidth={isSelected ? '2' : '1.5'}
                  />
                  <circle
                    r={isSelected ? '4.5' : '3'}
                    fill={isSelected || isFlaring ? '#38bdf8' : '#94a3b8'}
                  />
                </g>
              );
            })}
          </svg>

          {/* Accessible Overlay Node Selector Buttons aligned visually below/over hops */}
          <div className="grid grid-cols-5 gap-3 mt-2">
            {nodes.map((node, idx) => {
              const Icon = node.icon;
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/[0.09] border-cyan-400/50 shadow-[0_0_24px_-8px_rgba(34,211,238,0.45)]'
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[11px] font-mono ${
                        isSelected ? 'text-cyan-400' : 'text-zinc-500'
                      }`}
                    >
                      {node.step}
                    </span>
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-cyan-300' : 'text-zinc-400'
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
              className={`px-3 py-2 rounded-xl text-xs font-mono border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200'
                  : 'glass-panel-subtle text-zinc-400'
              }`}
            >
              {node.step} · {node.shortTitle}
            </button>
          );
        })}
      </div>

      {/* Active Node Architectural Detail Strip */}
      <div className="relative z-10 mt-5 pt-5 border-t border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-cyan-400 font-semibold">
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

        <div className="text-xs font-mono text-zinc-400 glass-panel-subtle px-3.5 py-2.5 rounded-xl shrink-0">
          {activeNode.stack}
        </div>
      </div>
    </div>
  );
};

export default ArchitectureTraceDiagram;
