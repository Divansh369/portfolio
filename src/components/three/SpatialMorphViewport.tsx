import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Box,
  Boxes,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Grid,
  Orbit,
  Play,
  Pause,
  Server,
  Smartphone,
  Truck,
} from 'lucide-react';
import CornerBrackets from '../motion/CornerBrackets';
import SplitText from '../motion/SplitText';
import TextScramble from '../motion/TextScramble';
import {
  CameraPreset,
  MorphSceneController,
} from './MorphSceneController';
import { MorphStateId } from './morphGeometries';

interface MorphModeSpec {
  id: MorphStateId;
  shortLabel: string;
  title: string;
  domain: string;
  caption: string;
  stack: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MORPH_SPECS: MorphModeSpec[] = [
  {
    id: 'proxmox',
    shortLabel: 'Proxmox Core',
    title: 'Proxmox VE 8 Hypervisor Core',
    domain: 'Infrastructure · pve.diivvansh.com',
    caption:
      'Consolidated Proxmox VE 8 host with Linux bridge networking, PBS snapshots, and isolated LXC workloads.',
    stack: 'Proxmox VE 8 / Debian & Alpine LXCs / PBS Backups',
    icon: Server,
  },
  {
    id: 'databricks',
    shortLabel: 'Fleet Torus',
    title: 'Databricks Fleet Stream Topology',
    domain: 'Big Data ETL · ~70,000 Trucks',
    caption:
      'Continuous Apache Spark and Delta Lake telemetry streams feeding FastAPI + React internal apps.',
    stack: 'Databricks / Apache Spark / Delta Lake / FastAPI',
    icon: Truck,
  },
  {
    id: 'k3s',
    shortLabel: 'K3s Quorum',
    title: '6-Node K3s HA Cluster Manifold',
    domain: 'Kubernetes · 3 Masters + 3 Workers',
    caption:
      'Hexagonal cluster symmetry separating control-plane masters and NGINX worker pods behind MetalLB & Traefik.',
    stack: 'K3s (3+3) / MetalLB VIP / Traefik Ingress / CoreDNS',
    icon: Boxes,
  },
  {
    id: 'fituc',
    shortLabel: 'FiT-UC Field',
    title: 'FiT-UC Mobile Harmonic Network',
    domain: 'Production NGO · Google Play Live',
    caption:
      'Bilingual Flutter app connecting Care Leavers with self-hosted NocoDB APIs, Node auth, and Gotify alerts.',
    stack: 'Flutter / Dart / NocoDB LXC / Node Auth / Gotify',
    icon: Smartphone,
  },
];

const CAMERA_OPTIONS: Array<{ id: CameraPreset; label: string }> = [
  { id: 'iso', label: 'Iso' },
  { id: 'front', label: 'Front' },
  { id: 'top', label: 'Top' },
];

export const SpatialMorphViewport: React.FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MorphSceneController | null>(null);

  const prefersReduced = useReducedMotion();
  const [activeState, setActiveState] = useState<MorphStateId>('proxmox');
  const [wireframe, setWireframe] = useState<boolean>(true);
  const [autoCycle, setAutoCycle] = useState<boolean>(!prefersReduced);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [webglFailed, setWebglFailed] = useState<boolean>(false);

  const activeSpec =
    MORPH_SPECS.find((s) => s.id === activeState) || MORPH_SPECS[0];

  // Mount Three.js controller once inside dedicated empty container ref
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    let ctrl: MorphSceneController | null = null;
    try {
      ctrl = new MorphSceneController(
        mountEl,
        {
          onStateChange: (nextState) => setActiveState(nextState),
          onWebglError: () => setWebglFailed(true),
        },
        Boolean(prefersReduced)
      );
      controllerRef.current = ctrl;
    } catch {
      setWebglFailed(true);
    }

    let rafResize = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafResize);
      rafResize = requestAnimationFrame(() => {
        ctrl?.resize();
      });
    });
    if (stageRef.current) ro.observe(stageRef.current);

    return () => {
      cancelAnimationFrame(rafResize);
      ro.disconnect();
      ctrl?.dispose();
      controllerRef.current = null;
    };
  }, []);

  // Sync reduced motion changes without recreating WebGL context
  useEffect(() => {
    controllerRef.current?.setReducedMotion(Boolean(prefersReduced));
    if (prefersReduced) {
      setAutoCycle(false);
      controllerRef.current?.setAutoCycle(false);
    }
  }, [prefersReduced]);

  // Press 'H' while focused within viewport to collapse/expand controls dock cleanly
  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'h' || e.key === 'H') {
      setControlsCollapsed((prev) => !prev);
    }
  };

  const handleSelectMorph = (id: MorphStateId) => {
    setActiveState(id);
    controllerRef.current?.setState(id, false);
  };

  const handleToggleWireframe = () => {
    setWireframe((prev) => {
      const next = !prev;
      controllerRef.current?.setWireframe(next);
      return next;
    });
  };

  const handleToggleAutoCycle = () => {
    setAutoCycle((prev) => {
      const next = !prev;
      controllerRef.current?.setAutoCycle(next);
      return next;
    });
  };

  const handleSelectCamera = (preset: CameraPreset) => {
    controllerRef.current?.setCameraPreset(preset);
  };

  const ActiveIcon = activeSpec.icon;

  return (
    <section id="systems-3d" className="py-20 border-b border-white/[0.08]">
      {/* Section Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
            <Box className="w-3.5 h-3.5" aria-hidden="true" />
            <span>3D Architecture Morph</span>
          </span>
          <SplitText
            as="h2"
            text="Interactive 3D Systems Form Explorer"
            stagger={0.04}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 block"
          />
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Real-time WebGL morphing between Proxmox hypervisor topology, Databricks streaming pipelines, 6-node K3s cluster geometry, and FiT-UC service flow. Drag to orbit or click any form to inspect.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-400 flex items-center gap-2 whitespace-nowrap shrink-0">
          <Orbit className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span>Drag to Orbit · Click Model to Morph</span>
        </div>
      </div>

      {/* Unobstructed Chamfered 3D Stage Viewport */}
      <div
        ref={stageRef}
        tabIndex={0}
        onKeyDown={handleStageKeyDown}
        className="group relative h-[440px] sm:h-[510px] lg:h-[550px] w-full rounded-2xl overflow-hidden border border-white/[0.14] bg-[#040711] shadow-[0_28px_72px_-28px_rgba(0,0,0,0.92)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <CornerBrackets className="text-white/30 group-hover:text-cyan-400/90 z-20" />

        {/* Dedicated Isolated WebGL Canvas Container (zero React HUD children inside) */}
        {!webglFailed ? (
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#060b18]">
            <Cpu className="w-10 h-10 text-cyan-400 mb-3" aria-hidden="true" />
            <h3 className="font-display text-lg font-bold text-zinc-100 mb-1">
              {activeSpec.title}
            </h3>
            <p className="text-xs font-mono text-zinc-400 max-w-md">
              {activeSpec.caption}
            </p>
          </div>
        )}

        {/* Minimal Top-Left Readout (solid rgba backing — zero backdrop-blur over WebGL) */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 sm:right-auto z-10 max-w-md">
          <div className="rounded-xl bg-[#050915]/88 border border-white/[0.12] px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 mb-1">
              <ActiveIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <TextScramble
                text={activeSpec.domain}
                trigger="change"
                durationMs={260}
              />
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-zinc-50 leading-snug">
              {activeSpec.title}
            </h3>
            <p className="text-xs text-zinc-300/90 leading-relaxed mt-1 hidden sm:block">
              {activeSpec.caption}
            </p>
          </div>
        </div>

        {/* Unified Collapsible Bottom Control Dock (Zero Viewport Center Occlusion, Zero backdrop-blur) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center max-w-[94vw]">
          <button
            type="button"
            onClick={() => setControlsCollapsed((prev) => !prev)}
            aria-expanded={!controlsCollapsed}
            className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#050915]/92 border border-white/15 text-[11px] font-mono text-zinc-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {controlsCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3" aria-hidden="true" />
                <span>Show Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
                <span>Hide Controls</span>
              </>
            )}
          </button>

          <motion.div
            initial={false}
            animate={
              controlsCollapsed
                ? { opacity: 0, y: 24, pointerEvents: 'none' as const }
                : { opacity: 1, y: 0, pointerEvents: 'auto' as const }
            }
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl bg-[#050915]/94 border border-white/[0.15] px-2.5 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.8)] flex items-center gap-2 overflow-x-auto max-w-full"
          >
            {/* 4 Morph Topology States */}
            <div className="flex items-center gap-1" role="group" aria-label="Select 3D morph architecture">
              {MORPH_SPECS.map((spec) => {
                const selected = activeState === spec.id;
                const Icon = spec.icon;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleSelectMorph(spec.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white border border-cyan-300/40'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        selected ? 'text-cyan-200' : 'text-cyan-400/80'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{spec.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="w-px h-5 bg-white/12 shrink-0" aria-hidden="true" />

            {/* Mesh Wireframe & Auto-Morph Toggles */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-pressed={wireframe}
                onClick={handleToggleWireframe}
                title="Toggle structural wireframe overlay"
                className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  wireframe
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <Grid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Wireframe</span>
              </button>

              {!prefersReduced && (
                <button
                  type="button"
                  aria-pressed={autoCycle}
                  onClick={handleToggleAutoCycle}
                  title="Toggle continuous shape morph cycling"
                  className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    autoCycle
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  {autoCycle ? (
                    <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>Auto-Morph</span>
                </button>
              )}
            </div>

            <div className="hidden md:block w-px h-5 bg-white/12 shrink-0" aria-hidden="true" />

            {/* Camera Angle Presets */}
            <div
              className="hidden md:flex items-center gap-1 shrink-0"
              role="group"
              aria-label="Camera angle presets"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-500 ml-1 mr-0.5 shrink-0" aria-hidden="true" />
              {CAMERA_OPTIONS.map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => handleSelectCamera(cam.id)}
                  className="px-2.5 py-2 min-h-[40px] rounded-xl text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/[0.08] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  {cam.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SpatialMorphViewport;
