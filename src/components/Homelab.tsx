import React, { useState } from 'react';
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
import { HomelabDevice, HomelabEvolutionStage, VM, Platform } from '../types';
import NginxLoadBalancerDemo from './NginxLoadBalancerDemo';
import GlassCard from './motion/GlassCard';
import SplitText from './motion/SplitText';
import ArchitectureTraceDiagram from './motion/ArchitectureTraceDiagram';
import TextScramble from './motion/TextScramble';

interface HomelabProps {
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
    stage: 'Phase 01 · Bare-Metal Linux & Docker Compose',
    title: 'Debian, Kali & Alpine on Repurposed Laptops',
    summary:
      'Started self-hosting on bare-metal Debian, Kali, and Alpine Linux across spare laptops, running containerized workloads directly through Docker Engine and Docker Compose.',
    learnings: [
      'Configured Linux networking, firewall rules, systemd daemons, and bind-mount volume permissions by hand.',
      'Used Alpine for minimal containers, Debian for host stability, and Kali for local network diagnostics.',
    ],
    stack: 'Debian / Kali / Alpine Linux / Docker / Docker Compose',
  },
  {
    stage: 'Phase 02 · 3-Node HA Proxmox Cluster + 4th Laptop PBS',
    title: 'Distributed Proxmox VE Quorum & Proxmox Backup Server',
    summary:
      'Discovered Proxmox VE and converted the 4 laptops into a 3-node High-Availability (HA) cluster with the 4th laptop running dedicated Proxmox Backup Server (PBS).',
    learnings: [
      'Built Corosync quorum voting, HA failover groups, and live VM migration across nodes.',
      'Managed incremental deduplicated snapshots and full restore drills using Proxmox Backup Server (PBS).',
      'Configured Linux bridges (vmbr0), thin-LVM pools, and isolated LXC vs KVM workloads.',
    ],
    stack: 'Proxmox VE / Proxmox Backup Server (PBS) / Corosync HA / LXC / KVM',
  },
  {
    stage: 'Phase 03 · Consolidated PVE 8 Host & K3s Cluster',
    title: 'Production NGO LXCs & 6-Node K3s Virtualization Lab',
    summary:
      'Consolidated the 4-laptop rack onto one dedicated 24/7 Proxmox VE 8 server for lower noise and unified memory, running production LXC services alongside a nested 6-node K3s cluster.',
    learnings: [
      'Hosts production Udayan Care NGO containers (NocoDB LXC, Node.js Auth at udayan.diivvansh.com, Gotify).',
      'Runs a 6-node K3s cluster (3 masters + 3 workers) with MetalLB VIPs and Traefik ingress over Cloudflare Tunnels and Tailscale.',
    ],
    stack: 'Proxmox VE 8 / 6-Node K3s / MetalLB / Traefik / Cloudflare Tunnels / Tailscale',
  },
];

const stageIcons = [Terminal, Layers, Server];

const proxmoxLessons = [
  {
    topic: 'Corosync HA & 3-Node Quorum',
    icon: ShieldCheck,
    detail:
      'Understanding odd-node quorum voting, avoiding split-brain states, and migrating workloads safely when one laptop node goes offline.',
  },
  {
    topic: 'Dedicated Proxmox Backup Server (PBS)',
    icon: HardDrive,
    detail:
      'Running a 4th laptop strictly for PBS taught chunk deduplication, snapshot pruning policies, and rapid restore verification.',
  },
  {
    topic: 'LXC vs KVM Trade-Offs',
    icon: Boxes,
    detail:
      'Running stateless web services and NocoDB in lightweight Linux Containers (LXCs) while keeping K3s cluster nodes in KVM virtual machines.',
  },
  {
    topic: 'Bridged Networking & Zero-Trust Ingress',
    icon: Network,
    detail:
      'Segmenting traffic on Linux bridges (vmbr0) behind WireGuard Tailscale meshes and Cloudflare Tunnels without exposing raw home ports.',
  },
];

const tabItems: Array<{
  id: 'evolution' | 'services' | 'loadbalancer';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'evolution', label: 'Proxmox Evolution', icon: Layers },
  { id: 'services', label: 'Services & Networking', icon: Server },
  { id: 'loadbalancer', label: 'K3s Load Balancer Demo', icon: Activity },
];

export const Homelab: React.FC<HomelabProps> = ({
  evolution,
  devices,
  vms,
  platforms,
  consolidationNote,
  network,
}) => {
  const [activeTab, setActiveTab] = useState<'evolution' | 'services' | 'loadbalancer'>('evolution');
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const prefersReduced = useReducedMotion();

  const stages = evolution && evolution.length > 0 ? evolution : defaultEvolution;

  return (
    <section id="homelab" className="py-20 border-b border-white/[0.08]">
      {/* Section Header */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
          <Server className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Infrastructure &amp; Virtualization</span>
        </span>
        <SplitText
          as="h2"
          text="From Bare-Metal Linux to Proxmox HA & K3s"
          stagger={0.04}
          className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 mb-3 block"
        />
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          My homelab evolved from running bare-metal Debian, Kali, and Alpine Linux with Docker Compose on spare laptops, to a 3-node Proxmox VE HA cluster backed up by a 4th PBS laptop, and finally consolidating onto one dedicated Proxmox VE 8 server.
        </p>
      </div>

      {/* Interactive Signal & Telemetry Architecture Diagram */}
      <div className="mb-10">
        <ArchitectureTraceDiagram />
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
        {/* TAB 1: Proxmox Evolution & Learnings */}
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

                      <div className="mt-5 pt-4 border-t border-white/[0.08] text-xs font-mono text-zinc-400 pr-2">
                        {item.stack}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>

            {/* Core Proxmox Engineering Takeaways */}
            <div className="pt-8 border-t border-white/[0.08] grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-4">
                <h3 className="font-display text-lg font-bold text-zinc-50">
                  What Managing Proxmox Taught Me
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {consolidationNote ||
                    'Moving from 4 separate laptops (3 PVE HA nodes + 1 PBS backup laptop) onto a single unified Proxmox VE 8 server reduced power draw and maintenance overhead while keeping automated snapshots and LXC service isolation intact.'}
                </p>
                <a
                  href="https://pve.diivvansh.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors pt-1"
                >
                  <TextScramble text="pve.diivvansh.com" trigger="hover" durationMs={320} />
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>

              <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
                {proxmoxLessons.map((lesson) => {
                  const LessonIcon = lesson.icon;
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

        {/* TAB 2: Production Services, Nodes & Networking */}
        {activeTab === 'services' && (
          <motion.div
            key="services"
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {devices.length > 0 && (
              <div className="grid md:grid-cols-2 gap-5">
                {devices.map((node) => (
                  <GlassCard key={node.hostname} tilt={true} spotlight={true} className="p-6">
                    <div>
                      <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1.5">
                        <Server className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{node.type}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-zinc-50 mb-2">
                        {node.hostname}
                      </h3>
                      {node.notes && (
                        <p className="text-sm text-zinc-300/90 leading-relaxed mb-5">
                          {node.notes}
                        </p>
                      )}

                      <dl className="divide-y divide-white/[0.07] text-xs font-mono">
                        <div className="py-2.5 flex justify-between gap-4">
                          <dt className="text-zinc-400">Compute</dt>
                          <dd className="text-zinc-100 text-right">{node.cpu}</dd>
                        </div>
                        <div className="py-2.5 flex justify-between gap-4">
                          <dt className="text-zinc-400">Memory</dt>
                          <dd className="text-zinc-100 tabular-nums text-right">{node.ram}</dd>
                        </div>
                        <div className="py-2.5 flex justify-between gap-4">
                          <dt className="text-zinc-400">Storage</dt>
                          <dd className="text-zinc-100 tabular-nums text-right">{node.storage}</dd>
                        </div>
                      </dl>
                    </div>

                    {node.url && (
                      <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-400">Management Endpoint</span>
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
                ))}
              </div>
            )}

            {vms.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 sm:p-8">
                <div className="pb-5 mb-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-zinc-50 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                      <span>Active LXC Containers &amp; K3s Cluster Workloads</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Production containers serving Udayan Care alongside the nested 6-node Kubernetes lab.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">
                    Proxmox VE 8 · 3 Masters + 3 Workers
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
                      {network?.overlay || 'Tailscale WireGuard mesh'}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-zinc-400 shrink-0">Public Ingress</dt>
                    <dd className="text-zinc-100 font-mono text-right">
                      {network?.ingress || 'Cloudflare Zero-Trust Tunnels'}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-zinc-400 shrink-0">K3s Routing</dt>
                    <dd className="text-zinc-100 font-mono text-right">
                      {network?.loadBalancer || 'MetalLB Layer-2 VIP + Traefik'}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-zinc-400 shrink-0">Domains</dt>
                    <dd className="text-cyan-400 font-mono text-right">
                      diivvansh.com · fiorejoy.com
                    </dd>
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

        {/* TAB 3: Interactive K3s NGINX Load Balancer Demo */}
        {activeTab === 'loadbalancer' && (
          <motion.div
            key="loadbalancer"
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <NginxLoadBalancerDemo />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Homelab;