# Holographic Cyber-Physical 3D Telemetry Models & Kinetic Portfolio Experience

Elevate Divansh Prasad's developer portfolio from abstract geometric forms to distinctive **holographic cyber-physical telemetry nodes with floating stream ribbons**, paired with an **interactive exploded-view slider**, **cursor-driven 3D card tilt & magnetic hover**, and **scroll-driven kinetic timeline progress animations**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed choices in the interactive interview:
> - **3D Architecture Theme**: Holographic cyber-physical telemetry nodes featuring floating dynamic stream ribbons, glowing circuit traces, and architectural hardware frames (Server Quorum, Telemetry Flute, and Edge Pods) rather than smooth abstract white blobs.
> - **Interactive Exploded-View Slider**: Added to the bottom control dock, allowing you to drag or slide to separate outer chassis, holographic core manifolds, optic rings, and floating telemetry ribbons into layered exploded tiers.
> - **Card Motion & Depth**: High-performance CSS 3D perspective tilt (`rotateX`, `rotateY`, and pointer-following highlight glare) on hover across all project showcase cards with zero layout jitter.
> - **Scroll-Driven Kinetic Timeline**: Continuous SVG timeline progress rail running through the Proxmox evolution and Career history sections with kinetic glow that advances as you scroll.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces the abstract parametric superellipsoid with 4 custom multi-part cyber-physical holographic telemetry rigs representing Divansh's real work:
  1. **Proxmox Hypervisor Core**: Machined rack chassis with hot-swap blade carriers, glowing Corosync heartbeat ribbon, and holographic LXC container nodes.
  2. **Databricks Fleet Stream Pipeline**: High-throughput telemetry collector toroid with helical particle ribbons representing streaming OTA data from ~70,000 trucks.
  3. **K3s HA Quorum Manifold**: Hexagonal staggered cluster ring with 3 master control-plane prisms and 3 worker ingress pods linked by dynamic bezier stream ribbons.
  4. **FiT-UC Mobile Mesh**: Dual-concentric resonant harmonic rings with floating NGO notification relays and Gotify crisis signal pulses.
- **Target Audience**: Technical recruiters, engineering managers, and distributed systems leads evaluating Divansh's deep hardware/software craftsmanship.
- **Key Value**: Directly communicates systems architecture depth through interactive, physically responsive 3D WebGL without generic stock models or AI clichés.

---

## 2. User Experience & Visual Design

```
┌────────────────────────────────────────────────────────────────────────┐
│  [ Minimal State Readout: K3S QUORUM · 3 MASTERS + 3 WORKERS ]         │
│                                                                        │
│                    3D CYBER-PHYSICAL VIEWPORT                          │
│               Holographic Telemetry Core + Flow Ribbons                │
│                                                                        │
│               [ ▾ Collapse / Expand Controls (Hotkey: H) ]             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  [Proxmox] [Databricks] [K3s] [FiT-UC] │ Exploded: ──●── 45%     │  │
│  │  Wireframe: ON │ Auto-Morph: OFF │ Views: [Iso] [Front] [Top]    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Identity & Holographic 3D Pipeline
- **Material Realism**:
  - Deep obsidian & titanium powdercoat chassis (`roughness: 0.72`, `metalness: 0.35`).
  - Chamfered titanium armature rings (`metalness: 0.94`, `roughness: 0.38`).
  - Holographic cyber-physical core manifold extended via `onBeforeCompile` with procedural circuit traces, cyan/blue Fresnel rim, and traveling scan lines.
  - Floating Tube/Ribbon stream lines (`CatmullRomCurve3` with flowing UV offsets).
- **Interactive Exploded-View Slider**:
  - Sleek slider integrated into the collapsible bottom dock ($0\% \to 100\%$).
  - As the slider advances, the outer housing moves outward along the Y/radial axis, revealing the internal silicon processor core, memory channels, optical bus, and floating ribbons.
- **Cursor 3D Project Card Tilt**:
  - Reusable `TiltGlassCard` component tracking local pointer position $(x, y) \in [-1, 1]$.
  - Calculates subtle 3D rotational tilt (`rotateX`, `rotateY` up to $\pm 6^\circ$, `transformPerspective: 1000`) with dynamic glass sheen highlight glare that follows the mouse.
- **Scroll-Driven Kinetic Timeline**:
  - In `Homelab.tsx` and `Experience.tsx`, a continuous SVG spine illuminates and fills with a cyan/cobalt gradient linked to `useScroll({ target: containerRef })`.
  - Step milestones pulse softly as the viewport scrolls past them.

---

## 3. Key Product Decisions & Trade-Offs

- **Procedural Compound Assemblies vs External GLTF Models**:
  - *Decision*: Build all holographic assemblies procedurally in code using Three.js compound primitives (`ExtrudeGeometry`, `LatheGeometry`, `TubeGeometry`, `BufferGeometry`) and procedural canvas textures.
  - *Why*: Eliminates 404 network dependencies, avoids loading megabytes of unoptimized external assets, and ensures 100% reliable instantaneous load times across all deployment platforms (including GitHub Pages).
- **Slider-Driven Tier Separation (Exploded View)**:
  - *Decision*: Smoothly interpolate part positions via `THREE.MathUtils.damp` based on the slider state rather than abrupt steps.
  - *Why*: Preserves physical weight and mechanical feel while allowing users to inspect internal components at their own pace.
- **Pointer-Optimized Card Tilt**:
  - *Decision*: Implement card tilt via CSS transforms (`rotateX`, `rotateY`, `scale`) with pointer events bound to local card boundaries; disable entirely when `prefers-reduced-motion: reduce` or on touch devices.
  - *Why*: Keeps CPU usage at 0 during page scroll, avoids re-rendering React trees, and maintains smooth 60fps scrolling.

---

## 4. Technical Architecture & System Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Root (App.tsx)                          │
├────────────────────┬───────────────────────────────────────────────────┤
│ SpatialMorphView   │ Projects, Homelab, Experience                     │
│ ┌────────────────┐ │ ┌───────────────────┐  ┌────────────────────────┐ │
│ │ MorphSceneCtrl │ │ │ TiltGlassCard     │  │ KineticScrollTimeline  │ │
│ │ • Telemetry    │ │ │ • Pointer tracking│  │ • useScroll() linked   │ │
│ │   Nodes        │ │ │ • CSS 3D rotate   │  │ • SVG gradient stroke  │ │
│ │ • Flow Ribbons │ │ │ • Dynamic sheen   │  │ • Milestone markers    │ │
│ │ • Exploded Rig │ │ └───────────────────┘  └────────────────────────┘ │
│ └────────────────┘ │                                                   │
└────────────────────┴───────────────────────────────────────────────────┘
```

### Component & File Work Breakdown
1. **`src/components/three/morphGeometries.ts`**:
   - Add procedural cyber-physical telemetry parts: server rack blade chassis, helical stream ribbons (`TubeGeometry` / `CatmullRomCurve3`), hexagonal quorum bus, and concentric wave emitter rings.
2. **`src/components/three/morphMaterials.ts`**:
   - Add holographic circuit shader uniforms, dynamic stream flow offsets (`uFlowOffset`), and glowing cyber ribbon materials.
3. **`src/components/three/MorphSceneController.ts`**:
   - Implement exploded view kinematics: separate outer structural pods, inner core, optic collars, and stream ribbons based on an `explodedFactor` ($0.0 \to 1.0$).
   - Integrate continuous flowing bezier stream ribbons connecting the satellite pods to the central core.
4. **`src/components/three/SpatialMorphViewport.tsx`**:
   - Add the Exploded View slider to the unified bottom control dock.
   - Synchronize exploded factor state with the controller.
5. **`src/components/motion/TiltGlassCard.tsx` (New Component)**:
   - Create a reusable 3D tilt card wrapper with cursor tracking, spring physics, dynamic radial specular sheen, and reduced-motion fallback.
6. **`src/components/Projects.tsx`**:
   - Wrap project cards with `TiltGlassCard` for tactile depth and interactive hover.
7. **`src/components/Homelab.tsx` & `src/components/Experience.tsx`**:
   - Add scroll-linked kinetic SVG timeline tracks highlighting career progression and Proxmox infrastructure evolution.
8. **Verification**:
   - Co-execute `compile_applet` and `lint_applet` to ensure zero compilation or TypeScript errors.
   - Verify dev server build on port 3000 and ensure zero regressions across GitHub Pages static build (`npm run build`).
