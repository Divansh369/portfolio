import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Boxes,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Flower2,
  Grid,
  MoonStar,
  Orbit,
  Play,
  Pause,
  Server,
  Smartphone,
  Sun,
  Sunrise,
  Sunset,
  Workflow,
} from 'lucide-react';
import CornerBrackets from '../motion/CornerBrackets';
import SplitText from '../motion/SplitText';
import TextScramble from '../motion/TextScramble';
import {
  CameraPreset,
  CelestialPhaseId,
  CelestialPhaseInfo,
  MorphSceneController,
} from './MorphSceneController';
import { MorphStateId } from './morphGeometries';
import { SectionsConfig, Systems3DModeConfig } from '../../types';

interface MorphModeSpec extends Systems3DModeConfig {
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_MODE_CONFIGS: Systems3DModeConfig[] = [
  {
    id: 'core',
    shortLabel: 'Platform Core',
    title: 'Compute Core Architecture (Structured Bud)',
    domain: 'Infrastructure · Core Node',
    caption:
      'Consolidated server host with virtual bridge networking, automated snapshots, and isolated workloads represented in an upright structured bud.',
    stack: 'Linux / Containers / Virtualization / Backups',
  },
  {
    id: 'stream',
    shortLabel: 'Data Stream',
    title: 'Telemetry Stream Topology (Flowing Bloom)',
    domain: 'Streaming ETL · Data Pipelines',
    caption:
      'Continuous distributed stream ribbons weaving through unfolding petals to feed live internal applications.',
    stack: 'Apache Spark / Streaming ETL / FastAPI',
  },
  {
    id: 'cluster',
    shortLabel: 'Cluster Mesh',
    title: 'Distributed Cluster Manifold (Hexagonal Blossom)',
    domain: 'Orchestration · Multi-Node Quorum',
    caption:
      'Hexagonal 6-symmetry bloom separating control-plane nodes and worker pods behind L2 VIP & ingress routing.',
    stack: 'Kubernetes / Load Balancer / Ingress / CoreDNS',
  },
  {
    id: 'mesh',
    shortLabel: 'App Blossom',
    title: 'Client & API Harmonic Network (Full Open Bloom)',
    domain: 'Production Web & Mobile Apps',
    caption:
      'Radiant full open blossom with luminous stamen core, connecting users to self-hosted REST APIs and real-time notifications.',
    stack: 'Mobile / Web Client / REST APIs / Real-Time',
  },
];

const MODE_ICONS: Record<MorphStateId, React.ComponentType<{ className?: string }>> = {
  core: Server,
  stream: Workflow,
  cluster: Boxes,
  mesh: Smartphone,
};

const CAMERA_OPTIONS: Array<{ id: CameraPreset; label: string }> = [
  { id: 'top', label: 'Top' },
  { id: 'iso', label: 'Iso' },
  { id: 'front', label: 'Horizon' },
];

const PHASE_ICONS: Record<CelestialPhaseId, React.ComponentType<{ className?: string }>> = {
  evening: Sunset,
  night: MoonStar,
  morning: Sunrise,
  afternoon: Sun,
};

const PHASE_ACCENTS: Record<CelestialPhaseId, string> = {
  evening: 'text-amber-300',
  night: 'text-sky-200',
  morning: 'text-amber-200',
  afternoon: 'text-yellow-300',
};

interface SpatialMorphViewportProps {
  config?: SectionsConfig['systems3d'];
}

export const SpatialMorphViewport: React.FC<SpatialMorphViewportProps> = ({ config }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MorphSceneController | null>(null);

  const prefersReduced = useReducedMotion();
  const [activeState, setActiveState] = useState<MorphStateId>('core');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoCycle, setAutoCycle] = useState<boolean>(!prefersReduced);
  const [explodedFactor, setExplodedFactor] = useState<number>(0.06);
  const [celestialPhase, setCelestialPhase] = useState<CelestialPhaseInfo>({
    id: 'evening',
    label: 'Evening',
    windowLabel: 'Dusk -> Night',
  });
  const [activeCamera, setActiveCamera] = useState<CameraPreset>('top');
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [webglFailed, setWebglFailed] = useState<boolean>(false);

  const modeSpecs = useMemo<MorphModeSpec[]>(() => {
    const source = config?.modes && config.modes.length > 0 ? config.modes : DEFAULT_MODE_CONFIGS;
    return source.map((m) => ({
      ...m,
      icon: MODE_ICONS[m.id] || Server,
    }));
  }, [config]);

  const activeSpec =
    modeSpecs.find((s) => s.id === activeState) || modeSpecs[0];

  const eyebrow = config?.eyebrow || '3D Blooming Lotus · Systems Architecture';
  const title = config?.title || 'Interactive 3D Blooming Lotus Architecture';
  const subtitle =
    config?.subtitle ||
    'Procedural 3D blooming pink lotus floating on a reflective water pond across an Evening -> Night -> Morning -> Afternoon celestial sky & Sun/Moon horizon transition.';

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
          onBloomChange: (nextBloom) => setExplodedFactor(nextBloom),
          onPhaseChange: (nextPhase) => setCelestialPhase(nextPhase),
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

  const handleExplodedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setExplodedFactor(val);
    controllerRef.current?.setExploded(val);
  };

  const handleSelectCamera = (preset: CameraPreset) => {
    setActiveCamera(preset);
    controllerRef.current?.setCameraPreset(preset);
  };

  const ActiveIcon = activeSpec.icon;
  const PhaseIcon = PHASE_ICONS[celestialPhase.id] || Sunset;
  const phaseAccent = PHASE_ACCENTS[celestialPhase.id] || 'text-amber-300';

  return (
    <section id="systems-3d" className="py-20 border-b border-white/[0.08]">
      {/* Section Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400/90 mb-2">
            <Flower2 className="w-3.5 h-3.5 text-[#39FF14]" aria-hidden="true" />
            <span>{eyebrow}</span>
          </span>
          <SplitText
            as="h2"
            text={title}
            stagger={0.04}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 block"
          />
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-400 flex items-center gap-2 whitespace-nowrap shrink-0">
          <Orbit className="w-3.5 h-3.5 text-pink-400" aria-hidden="true" />
          <span>Drag to Orbit · Switch to Horizon for Sun &amp; Moon</span>
        </div>
      </div>

      {/* Unobstructed Chamfered 3D Stage Viewport */}
      <div
        ref={stageRef}
        tabIndex={0}
        onKeyDown={handleStageKeyDown}
        className="group relative h-[440px] sm:h-[510px] lg:h-[560px] w-full rounded-2xl overflow-hidden border border-white/[0.14] bg-[#071124] shadow-[0_28px_72px_-28px_rgba(0,0,0,0.95)] focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
      >
        <CornerBrackets className="text-white/30 group-hover:text-pink-400/80 z-20" />

        {/* Dedicated Isolated WebGL Canvas Container */}
        {!webglFailed ? (
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#071124]">
            <Cpu className="w-10 h-10 text-pink-400 mb-3" aria-hidden="true" />
            <h3 className="font-display text-lg font-bold text-zinc-100 mb-1">
              {activeSpec.title}
            </h3>
            <p className="text-xs font-mono text-zinc-400 max-w-md">
              {activeSpec.caption}
            </p>
          </div>
        )}

        {/* Minimal Top-Left Readout (solid rgba backing) */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 sm:right-auto z-10 max-w-md">
          <div className="rounded-xl bg-black/85 border border-white/[0.14] px-4 py-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono mb-1">
              <span className="inline-flex items-center gap-2 text-pink-400">
                <ActiveIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <TextScramble
                  text={activeSpec.domain}
                  trigger="change"
                  durationMs={260}
                />
              </span>
              <span className={`inline-flex items-center gap-1.5 ${phaseAccent}`}>
                <PhaseIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {celestialPhase.label} · {celestialPhase.windowLabel}
                </span>
              </span>
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-zinc-50 leading-snug">
              {activeSpec.title}
            </h3>
            <p className="text-xs text-zinc-300/90 leading-relaxed mt-1 hidden sm:block">
              {activeSpec.caption}
            </p>
          </div>
        </div>

        {/* Unified Collapsible Bottom Control Dock */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center max-w-[94vw]">
          <button
            type="button"
            onClick={() => setControlsCollapsed((prev) => !prev)}
            aria-expanded={!controlsCollapsed}
            className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/90 border border-white/15 text-[11px] font-mono text-zinc-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
            className="rounded-2xl bg-black/92 border border-white/[0.18] px-2.5 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.9)] flex items-center gap-2 overflow-x-auto max-w-full"
          >
            {/* 4 Architecture States */}
            <div className="flex items-center gap-1" role="group" aria-label="Select 3D architecture state">
              {modeSpecs.map((spec) => {
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
                        ? 'bg-blue-600/90 text-white border border-cyan-300/40 shadow-sm'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-transparent'
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

            {/* Bloom / Unfold Slider */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/12 shrink-0">
              <Flower2 className="w-3.5 h-3.5 text-pink-400 shrink-0" aria-hidden="true" />
              <span className="text-[11px] font-mono text-zinc-300 whitespace-nowrap">
                Bloom <span className="text-pink-400 font-semibold">{Math.round(explodedFactor * 100)}%</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodedFactor}
                onChange={handleExplodedChange}
                aria-label="Lotus flower bloom and petal unfolding factor"
                className="w-20 sm:w-28 h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-pink-400 focus:outline-none"
              />
            </div>

            <div className="w-px h-5 bg-white/12 shrink-0" aria-hidden="true" />

            {/* Mesh Wireframe & Auto-Morph Toggles */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-pressed={wireframe}
                onClick={handleToggleWireframe}
                title="Toggle structural petal CAD wireframe overlay"
                className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  wireframe
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
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
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  {autoCycle ? (
                    <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>Auto-Bloom</span>
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
              {CAMERA_OPTIONS.map((cam) => {
                const isCamActive = activeCamera === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    aria-pressed={isCamActive}
                    onClick={() => handleSelectCamera(cam.id)}
                    className={`px-2.5 py-2 min-h-[40px] rounded-xl text-xs font-mono whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isCamActive
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-400/40'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-transparent'
                    }`}
                  >
                    {cam.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SpatialMorphViewport;
