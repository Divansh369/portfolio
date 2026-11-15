import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Cpu,
  Globe,
  HardDrive,
  Layers,
  Network,
  Server,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import {
  HomelabDevice,
  HomelabEvolutionStage,
  HomelabLesson,
  Platform,
  SectionsConfig,
  VM,
} from '../types';
import NginxLoadBalancerDemo from './NginxLoadBalancerDemo';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';
import ArchitectureTraceDiagram from './motion/ArchitectureTraceDiagram';
import TextScramble from './motion/TextScramble';
import RepoImage from './common/RepoImage';
import BrandMark from './icons/BrandMarks';

interface HomelabProps {
  config?: SectionsConfig['homelab'];
  evolution?: HomelabEvolutionStage[];
  devices: HomelabDevice[];
  vms: VM[];
  platforms: Platform[];
  consolidationNote?: string;
  network?: {
    domains?: string[];
    overlay?: string;
    ingress?: string;
    loadBalancer?: string;
  };
}

const defaultEvolution: HomelabEvolutionStage[] = [
  {
    stage: 'Phase 01 · Bare-Metal Linux & Containers',
    title: 'Single-Node Linux & Docker Compose',
    summary:
      'Started self-hosting on bare-metal Linux hosts, orchestrating containerized services manually with Docker Engine and Docker Compose.',
    learnings: [
      'Configured Linux networking, firewall rules, systemd daemons, and persistent volume permissions.',
      'Automated repeatable deployments and log rotation across local services.',
    ],
    stack: 'Linux / Docker / Docker Compose / systemd',
  },
  {
    stage: 'Phase 02 · Virtualization & Automated Backups',
    title: 'Multi-Node Virtualization & Snapshots',
    summary:
      'Evolved into structured virtualization with separated container and VM workloads plus automated incremental backups.',
    learnings: [
      'Configured quorum voting, failover groups, and live workload migration across nodes.',
      'Verified disaster recovery restores with scheduled snapshot retention policies.',
    ],
    stack: 'Hypervisor / HA Quorum / LXC / KVM',
  },
  {
    stage: 'Phase 03 · Consolidated Host & Cluster Orchestration',
    title: 'Production Containers & Kubernetes Cluster',
    summary:
      'Unified workloads onto a primary low-power server hosting production containers alongside a multi-node Kubernetes cluster.',
    learnings: [
      'Operates production backend APIs and databases inside isolated containers.',
      'Runs ingress routing and load-balanced pods behind zero-trust tunnels and WireGuard meshes.',
    ],
    stack: 'Kubernetes / Reverse Proxy / Zero-Trust Ingress / WireGuard',
  },
];

const stageIcons = [Terminal, Layers, Server];

const defaultLessons: HomelabLesson[] = [
  {
    topic: 'High Availability & Quorum',
    icon: 'shield',
    detail:
      'Understanding odd-node quorum voting, avoiding split-brain states, and migrating workloads safely during maintenance.',
  },
  {
    topic: 'Deduplicated Snapshot Backups',
    icon: 'harddrive',
    detail:
      'Practicing chunk deduplication, snapshot pruning policies, and rapid bare-metal restore verification.',
  },
  {
    topic: 'Containers vs Virtual Machines',
    icon: 'boxes',
    detail:
      'Running lightweight system containers for web services and databases while isolating orchestration nodes inside VMs.',
  },
  {
    topic: 'Bridged Networking & Zero-Trust Ingress',
    icon: 'network',
    detail:
      'Segmenting virtual bridge traffic behind WireGuard overlays and encrypted tunnels without exposing open ports.',
  },
];

const getLessonIcon = (key?: string) => {
  switch ((key || '').toLowerCase()) {
    case 'shield':
      return ShieldCheck;
    case 'harddrive':
      return HardDrive;
    case 'boxes':
      return Boxes;
    case 'network':
      return Network;
    default:
      return ShieldCheck;
  }
};

const getNodeVendorBrand = (hostname: string, type: string): string => {
  const s = `${hostname} ${type}`.toLowerCase();
  if (s.includes('asus') || s.includes('rog')) return 'asus';
  if (s.includes('proxmox') || s.includes('pve')) return 'proxmox';
  return 'linux';
};

const getCpuBrand = (cpu: string): string => {
  const s = cpu.toLowerCase();
  if (s.includes('amd') || s.includes('ryzen')) return 'amd';
  if (s.includes('intel')) return 'intel';
  return 'intel';
};

const getGpuBrand = (gpu: string): string => {
  const s = gpu.toLowerCase();
  if (s.includes('nvidia') || s.includes('rtx') || s.includes('geforce')) return 'nvidia';
  if (s.includes('amd') || s.includes('radeon')) return 'amd';
  return 'intel';
};

export const Homelab: React.FC<HomelabProps> = ({
  config,
  evolution,
  devices,
  vms,
  platforms,
  consolidationNote,
  network,
}) => {
  const showLoadBalancer = config?.loadBalancerDemo?.enabled !== false;
  const [activeTab, setActiveTab] = useState<'evolution' | 'services' | 'loadbalancer'>('evolution');
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  const stages = evolution && evolution.length > 0 ? evolution : defaultEvolution;
  const lessons = config?.lessons && config.lessons.length > 0 ? config.lessons : defaultLessons;

  const tabItems = useMemo(() => {
    const base: Array<{
      id: 'evolution' | 'services' | 'loadbalancer';
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [
      { id: 'evolution', label: 'Architecture Evolution', icon: Layers },
      { id: 'services', label: 'Cluster Workloads & Network', icon: Server },
    ];
    if (showLoadBalancer) {
      base.push({ id: 'loadbalancer', label: 'Load Balancer Demo', icon: Activity });
    }
    return base;
  }, [showLoadBalancer]);

  const eyebrow = config?.eyebrow || 'Infrastructure & Virtualization';
  const title = config?.title || 'Self-Hosted Systems & Cluster Lab';
  const subtitle =
    config?.subtitle ||
    'Progression from bare-metal Linux container hosts to structured virtualization, automated snapshot backups, and orchestrated Kubernetes clusters.';
  const consolidationTitle = config?.consolidationTitle || 'Key Infrastructure Takeaways';
  const consolidationUrl = config?.consolidationUrl || '';
  const workloadsTitle = config?.workloadsTitle || 'Active Containers & Cluster Workloads';
  const workloadsSubtitle =
    config?.workloadsSubtitle || 'Production services and orchestrated cluster workloads running across nodes.';
  const workloadsBadge = config?.workloadsBadge || 'Linux · Virtualization · Containers';
  const hardwareTitle = config?.hardwareTitle || 'Hardware & Compute Nodes';
  const hardwareSubtitle =
    config?.hardwareSubtitle || 'Primary server hardware, workstations, and compute cluster inventory.';
  const platformsTitle = config?.platformsTitle || 'FOSS Platforms & Cluster Tooling';
  const platformsSubtitle =
    config?.platformsSubtitle ||
    'Container orchestrators, hypervisors, reverse proxies, and infrastructure management tools.';

  const displayDomains =
    network?.domains && network.domains.length > 0 ? network.domains.join(' · ') : 'Self-Hosted';

  return (
    <section id="homelab" className="py-20 border-b border-white/[0.08]">
      {/* Section Header */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
          <Server className="w-3.5 h-3.5" aria-hidden="true" />
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

      {/* Interactive Signal & Telemetry Architecture Diagram */}
      <div className="mb-10">
        <ArchitectureTraceDiagram traces={config?.architectureTraces} />
      </div>

      {/* Interactive Frosted Segmented Tabs with layoutId Spring */}
      <LayoutGroup id="homelab-tabs">
        <div
          role="tablist"
          aria-label="Infrastructure architecture views"
          className="flex flex-wrap items-center gap-1 p-1 glass-panel-subtle rounded-xl w-fit mb-10"
        >
          {tabItems.map(({ id, label, icon: Icon }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(id)}
                className={`relative px-3.5 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                  selected ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="homelab-tab-active"
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

      <AnimatePresence mode="wait">
        {/* TAB 1: Infrastructure Evolution & Learnings */}
        {activeTab === 'evolution' && (
          <motion.div
            key="evolution"
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-10"
          >
            {/* Horizontal kinetic connector track on desktop */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="hidden lg:block absolute top-[28px] left-8 right-8 h-px bg-white/10 z-0"
              >
                <div className="h-full w-full bg-gradient-to-r from-cyan-400/60 via-blue-500/60 to-cyan-300/60 opacity-70" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-10">
                {stages.map((item, idx) => {
                  const StageIcon = stageIcons[idx % stageIcons.length];
                  const dimmed = hoveredStage !== null && hoveredStage !== idx;
                  const isFinalPhase = idx === stages.length - 1;

                  return (
                    <GlassCard
                      key={item.stage}
                      tilt={true}
                      spotlight={true}
                      brackets={isFinalPhase}
                      chamfer={isFinalPhase}
                      dimmed={dimmed}
                      onMouseEnter={() => setHoveredStage(idx)}
                      onMouseLeave={() => setHoveredStage(null)}
                      className="p-6"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-3">
                          <StageIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{item.stage}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-zinc-50 mb-3 tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-sm text-zinc-300/90 leading-relaxed mb-5">
                          {item.summary}
                        </p>

                        <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed list-disc pl-4 border-t border-white/[0.08] pt-4">
                          {item.learnings.map((pt, lIdx) => (
                            <li key={lIdx}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/[0.08] text-xs font-mono text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1.5 pr-2">
                        {item.stack.split(/[·/]/).map((tech, tIdx) => (
                          <React.Fragment key={`${tech}-${tIdx}`}>
                            {tIdx > 0 && (
                              <span className="text-zinc-600" aria-hidden="true">
                                /
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <BrandMark brand={tech} className="w-3.5 h-3.5 shrink-0" />
                              <span>{tech.trim()}</span>
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>

            {/* Core Infrastructure Engineering Takeaways */}
            <div className="pt-8 border-t border-white/[0.08] grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-4">
                <h3 className="font-display text-lg font-bold text-zinc-50">
                  {consolidationTitle}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {consolidationNote ||
                    'Consolidating distributed lab hardware onto unified compute nodes reduces operational complexity while preserving automated snapshots and workload isolation.'}
                </p>
                {consolidationUrl && (
                  <a
                    href={consolidationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors pt-1"
                  >
                    <TextScramble
                      text={consolidationUrl.replace(/^https?:\/\//, '')}
                      trigger="hover"
                      durationMs={320}
                    />
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>

              <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
                {lessons.map((lesson) => {
                  const LessonIcon = getLessonIcon(lesson.icon);
                  return (
                    <div
                      key={lesson.topic}
                      className="glass-panel-subtle glass-panel-hover rounded-2xl p-5 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <LessonIcon className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                        <h4 className="font-display text-sm font-semibold text-zinc-100">
                          {lesson.topic}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{lesson.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: Cluster Workloads & Networking */}
        {activeTab === 'services' && (
          <motion.div
            key="services"
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {vms.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 sm:p-8">
                <div className="pb-5 mb-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-zinc-50 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                      <span>{workloadsTitle}</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">{workloadsSubtitle}</p>
                  </div>
                  <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">
                    {workloadsBadge}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
                  {vms.map((vm, idx) => (
                    <div key={idx} className="pb-4 border-b border-white/[0.07]">
                      <h4 className="font-mono text-xs font-semibold text-zinc-100 mb-1">
                        {vm.os}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{vm.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-white/[0.08] grid md:grid-cols-2 gap-8">
              <div className="glass-panel-subtle rounded-2xl p-6">
                <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                  <Network className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Mesh &amp; Ingress Routing</span>
                </span>
                <dl className="divide-y divide-white/[0.07] text-xs mt-3">
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-zinc-400 shrink-0">Private Mesh</dt>
                    <dd className="text-zinc-100 font-mono text-right">
                      {network?.overlay || 'WireGuard private mesh'}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-zinc-400 shrink-0">Public Ingress</dt>
                    <dd className="text-zinc-100 font-mono text-right">
                      {network?.ingress || 'Zero-Trust Edge Tunnels'}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-zinc-400 shrink-0">Cluster Routing</dt>
                    <dd className="text-zinc-100 font-mono text-right">
                      {network?.loadBalancer || 'L2 Virtual IP + Reverse Proxy'}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-zinc-400 shrink-0">Domains</dt>
                    <dd className="text-cyan-400 font-mono text-right">{displayDomains}</dd>
                  </div>
                </dl>
              </div>

              {platforms.length > 0 && (
                <div className="glass-panel-subtle rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                      <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Core Infrastructure Stack</span>
                    </span>
                    <p className="text-sm text-zinc-300/90 leading-relaxed mt-3">
                      Daily tools used to manage storage snapshots, reverse proxies, container images, and internal authentication endpoints.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/[0.08] text-xs font-mono text-zinc-200 flex flex-wrap gap-y-1.5 items-center">
                    {platforms.map((p, idx) => (
                      <React.Fragment key={p.name}>
                        {idx > 0 && (
                          <span className="mx-2 text-zinc-600" aria-hidden="true">
                            /
                          </span>
                        )}
                        <span>{p.name}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: Interactive Load Balancer Demo */}
        {showLoadBalancer && activeTab === 'loadbalancer' && (
          <motion.div
            key="loadbalancer"
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <NginxLoadBalancerDemo config={config?.loadBalancerDemo} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hardware Inventory & FOSS Self-Hosted Platforms Grid */}
      {(devices.length > 0 || platforms.length > 0) && (
        <div className="mt-12 pt-10 border-t border-white/[0.08] space-y-10">
          {devices.length > 0 && (
            <div>
              <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-zinc-50 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                    <span>{hardwareTitle}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">{hardwareSubtitle}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {devices.map((node) => {
                  const vendorBrand = getNodeVendorBrand(node.hostname, node.type);
                  const cpuBrand = getCpuBrand(node.cpu);
                  const gpuBrand = getGpuBrand(node.gpu || '');
                  const hasDualVendorCpu =
                    node.cpu.toLowerCase().includes('intel') &&
                    node.cpu.toLowerCase().includes('amd');

                  return (
                    <GlassCard key={node.hostname} tilt={true} spotlight={true} className="p-6">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400">
                            <RepoImage
                              src={node.logo}
                              alt={node.hostname}
                              className="w-4 h-4 shrink-0"
                              imgClassName="w-full h-full object-contain"
                              fallback={<BrandMark brand={vendorBrand} className="w-4 h-4 shrink-0" />}
                            />
                            <span>{node.type}</span>
                          </span>
                        </div>
                        <h4 className="font-display text-lg font-bold text-zinc-50 mb-2 flex items-center gap-2">
                          <span>{node.hostname}</span>
                        </h4>
                        {node.notes && (
                          <p className="text-xs sm:text-sm text-zinc-300/90 leading-relaxed mb-5">
                            {node.notes}
                          </p>
                        )}

                        <dl className="divide-y divide-white/[0.07] text-xs font-mono">
                          <div className="py-2.5 flex justify-between items-center gap-3">
                            <dt className="text-zinc-400 inline-flex items-center gap-1.5 shrink-0">
                              <BrandMark brand={cpuBrand} className="w-4 h-4 shrink-0" />
                              {hasDualVendorCpu && (
                                <BrandMark brand="intel" className="w-4 h-4 shrink-0" />
                              )}
                              <span>CPU</span>
                            </dt>
                            <dd className="text-zinc-100 text-right">{node.cpu}</dd>
                          </div>
                          {node.gpu && (
                            <div className="py-2.5 flex justify-between items-center gap-3">
                              <dt className="text-zinc-400 inline-flex items-center gap-1.5 shrink-0">
                                <BrandMark brand={gpuBrand} className="w-4 h-4 shrink-0" />
                                <span>GPU</span>
                              </dt>
                              <dd className="text-zinc-100 text-right">{node.gpu}</dd>
                            </div>
                          )}
                          <div className="py-2.5 flex justify-between items-center gap-3">
                            <dt className="text-zinc-400 inline-flex items-center gap-1.5 shrink-0">
                              <BrandMark brand="ram" className="w-4 h-4 shrink-0" />
                              <span>Memory</span>
                            </dt>
                            <dd className="text-zinc-100 tabular-nums text-right">{node.ram}</dd>
                          </div>
                          <div className="py-2.5 flex justify-between items-center gap-3">
                            <dt className="text-zinc-400 inline-flex items-center gap-1.5 shrink-0">
                              <BrandMark brand="nvme" className="w-4 h-4 shrink-0" />
                              <span>Storage</span>
                            </dt>
                            <dd className="text-zinc-100 tabular-nums text-right">{node.storage}</dd>
                          </div>
                        </dl>
                      </div>

                      {node.url && (
                        <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                          <span className="text-zinc-400">Console</span>
                          <a
                            href={node.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                          >
                            <TextScramble
                              text={node.url.replace(/^https?:\/\//, '')}
                              trigger="hover"
                              durationMs={320}
                            />
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {platforms.length > 0 && (
            <div>
              <div className="mb-5">
                <h3 className="font-display text-lg font-bold text-zinc-50 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                  <span>{platformsTitle}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{platformsSubtitle}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {platforms.map((platform) => (
                  <div
                    key={platform.name}
                    className="glass-panel-subtle glass-panel-hover rounded-xl px-3 py-4 flex flex-col items-center justify-center gap-2.5 text-center transition-all"
                  >
                    <RepoImage
                      src={platform.logo}
                      alt={platform.name}
                      className="w-7 h-7 shrink-0"
                      imgClassName="w-full h-full object-contain"
                      fallback={<BrandMark brand={platform.name} className="w-7 h-7 shrink-0" />}
                    />
                    <span className="text-[11px] font-mono text-zinc-200 leading-tight">
                      {platform.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default Homelab;