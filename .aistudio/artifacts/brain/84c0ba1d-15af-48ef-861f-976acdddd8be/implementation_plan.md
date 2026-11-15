# Modular Media, Split Resume / CV Engine & Progress Gallery

Upgrade the portfolio and PDF engine across three cohesive tracks: universal local/external media and icon interchangeability, splitting the single-document generator into an ATS-optimized 1-page Resume and full multi-page CV backed by a live ATS health checker, and adding an animated milestone progress gallery across all projects and work experience entries.

## User Review & Critical Decisions

> [!IMPORTANT]
> All four architectural choices below reflect your confirmed preferences from Phase 1 and will govern the build once approved.

- **Progress Gallery Relational Linking**: Store all milestones in a flat top-level `progressGallery` collection (backed by both `portfolio.json` and `progress_gallery.csv`) linked to any project or experience entry via `itemId`, keeping core project and job definitions clean and scannable.
- **Resume vs. CV Split**: Provide a segmented mode toggle inside the document modal switching between **Resume (1-Page)** and **Curriculum Vitae (Full)**, paired with dedicated `/api/resume.pdf` and `/api/cv.pdf` endpoints and distinct downloaded filenames.
- **Enhancv ATS Remediation & Audit Panel**: Diversify repeated action verbs (eliminating 6x *"automated"* repetition), fix PDF linear text-stream extraction and LinkedIn link recognition (targeting ~100% ATS parse rate), annotate unquantified older bullets with clear metric prompts, and render a live **ATS Readability & Impact Check** drawer inside the modal.
- **Gallery Placeholders Before Media Upload**: Render technical blueprint wireframe cards displaying the milestone date, phase classification, idea summary, and exact drop-in asset path / `itemId` hint whenever a screenshot URL is not yet populated.

---

## 1. Overview & Core Concept

- **What It Delivers**:
  1. **Interchangeable Media & Icons**: Every photo, project thumbnail, company emblem, college crest, hardware mark, and skill/tool icon accepts either a local asset path or an external `https://` URL via centralized config overrides, with resilient vector fallbacks.
  2. **Dedicated Resume vs. CV Documents**: Visitors and recruiters can inspect, print, copy links for, and download either a concise **1-page Resume** (engineered for fast recruiter scans and high ATS score) or the full **Multi-Page CV** (including complete work history, open-source labs, homelab evolution, certifications, and interests).
  3. **Live ATS Audit Inspector**: An interactive quality panel evaluates bullet impact quantification, verb variety, essential section detection, contact metadata completeness (including explicit LinkedIn URI), and PDF size/parseability.
  4. **Project & Career Progress Gallery**: An animated darkroom timeline viewer attached to every project and work experience item, chronicling *when* each iteration happened and *what idea* drove the transition from prototype to production.
- **Target Audience**: Hiring managers, technical recruiters, ATS parsers (Workday, Greenhouse, Lever, Enhancv), and fellow engineers reviewing architectural growth across projects—plus any developer who clones the template to swap data without touching application logic.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Dual Resume / CV Workflow**:
   - Clicking **Resume / CV** opens the document preview modal.
   - A frosted segmented control switches instantly between **Resume (1-Page)** and **Curriculum Vitae (Full)** using a spring-animated active pill (`layoutId`), updating the live preview, download endpoint (`/api/resume.pdf` vs `/api/cv.pdf`), copyable URL, and filename.
   - Clicking **ATS Health Check** toggles a compact audit panel showing verb repetition counts (flagging any verb used ≥ 3 times), bullets missing quantifiable scope/metrics, verified contact channels (Email, Phone, LinkedIn, GitHub, Portfolio), and document fit status.
2. **Project & Career Progress Gallery Flow**:
   - Project cards, the Project Details modal, and Experience timeline cards show a quiet typographic trigger (`Progress Gallery · N milestones`) when linked milestones exist (with clean seeded placeholders ready to populate).
   - Clicking opens the full-screen **Animated Progress Gallery**:
     - Top bar displays the parent project/role title, current phase indicator, milestone counter (`02 / 04`), and keyboard navigation (`←` / `→`, `ESC`).
     - Center stage animates horizontally between milestones, displaying either the real high-resolution photo/video or a crisp **Blueprint Wireframe Placeholder** detailing the date, phase badge, idea note, and exact `itemId` / suggested local path or URL override.
     - Bottom scrub rail renders chronological milestone nodes so users can jump non-linearly across ideation, architecture, field testing, and production releases.
3. **Zero-Code Icon & Media Swapping Flow**:
   - Portfolio owners drop a local file into public images or paste any `https://` CDN URL directly into the item's `logo` field, `mediaUrl`, or the global `media.icons` override dictionary (in JSON or `icon_overrides.csv`).

### Visual Identity & Theme

- **Aesthetic Direction**: Continues the deep cosmic slate canvas (`#040711`) and translucent frosted-glass surfaces (`glass-panel`), paired with clean unboxed metadata separated by typographic middots (`·`) and slashes (`/`) in keeping with editorial restraint.
- **Color Budget (60-30-10)**:
  - `60%` Dark obsidian/slate background (`#040711` / `#090d18`) or crisp ATS white paper inside Paper preview mode (`#ffffff` / `#0f172a`).
  - `30%` Structural frosted borders (`border-white/[0.08]`), hairline dividers, and blueprint grid hairlines.
  - `10%` Precision cyan/blue focal accents (`#22d3ee`, `#2563eb`) reserved for interactive CTAs, active tabs, and ATS pass/warning states (always paired with explicit text labels and icons, never color alone).
- **Typography**: `Outfit` / display headers paired with readable geometric sans body and `tabular-nums` monospace exclusively for dates, milestone indices (`01 / 04`), byte sizes, and verb frequency counts.
- **Interactive Feedback & Motion**:
  - Smooth `AnimatePresence` horizontal directional slide (`≤ 220ms`) when scrubbing gallery milestones.
  - Compositor-only transitions (`transform`, `opacity`) respecting `prefers-reduced-motion` and mobile touch targets `≥ 44px`.

---

## 3. Key Product Decisions & Trade-Offs

- **Relational `itemId` Linking (`progressGallery` + `progress_gallery.csv`) vs. Nested Arrays**:
  - *Chosen Approach*: Flat `progressGallery` list keyed by `itemId` (`project` or `experience`).
  - *Why*: Keeps project and job entries readable in JSON and cleanly editable in spreadsheet tools via CSV without brittle multi-line escaped JSON columns inside CSV cells.
  - *Trade-Off*: Requires deterministic ID resolution (`explicit id || slugify(name)`), which is handled cleanly in data normalization.

- **Single-Column Linear PDF Stream vs. Dual-Baseline Right-Aligned PDF Layout**:
  - *Chosen Approach*: Refactor PDF rendering to strictly linear, single-column text flow with explicit `https://` link annotations on contact lines and clear inline metadata formatting (`Role  ·  Company  ·  Location  ·  Duration`, or clean stacked subheader rows without floating right-hand X coordinates sharing the same Y).
  - *Why*: Eliminates the ~10% missed text extraction and LinkedIn parsing drop seen in Enhancv/ATS scanners caused by split X/Y text columns and unlinked compact pipe strings.
  - *Trade-Off*: Slightly more structured vertical rhythm, which is offset by tightened spacing and smart content selection in 1-page Resume mode.

- **Genuine Action-Verb Diversification & Honest Metric Prompts vs. Fabricated Numbers**:
  - *Chosen Approach*: Diversify repetitive verbs across JSON entries immediately, and flag unquantified bullets transparently with editable prompts in the ATS audit panel (never inventing synthetic percentages or fake revenue claims).
  - *Why*: Ensures 100% factual accuracy while guiding the author straight to every line that weakens ATS impact score.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         MODULAR DATA & ASSETS                             │
│  portfolio.json / *.csv  ──►  progressGallery (itemId + date + mediaUrl)  │
│  media.icons map         ──►  local paths (/images/...) OR https:// URLs  │
└──────────────┬─────────────────────────────────────────┬──────────────────┘
               │                                         │
               ▼                                         ▼
┌──────────────────────────────┐        ┌───────────────────────────────────┐
│   CLIENT STATE & RESOLVERS   │        │     EXPRESS PDF ENGINE            │
│  • normalizePortfolioData()  │        │  • GET /api/resume.pdf (1-page)   │
│  • resolveMediaAsset()       │        │  • GET /api/cv.pdf (full multi)   │
│  • analyzeAtsReadiness()     │        │  • Linear single-column PDFKit    │
└──────┬───────────────┬───────┘        │  • Explicit URI annotations       │
       │               │                └────────────────┬──────────────────┘
       ▼               ▼                                 │
┌───────────────┐ ┌──────────────────────────────────────▼──────────────────┐
│ GALLERY MODAL │ │            DOCUMENT PREVIEW & ATS AUDIT MODAL           │
│ • Scrub rail  │ │  [ Resume (1-Page) | Curriculum Vitae (Full) ]          │
│ • Real media  │ │  • Paper / Dark preview   • Download / Print / Copy URL │
│ • Blueprint   │ │  • Collapsible ATS Readability & Metric Audit Panel     │
│   wireframes  │ └─────────────────────────────────────────────────────────┘
```

### Normalized Data Model

1. **Global Icon & Media Overrides (`media.icons` + `iconOverrides`)**:
   - Dictionary mapping any normalized skill, tool, company, school, social platform, or hardware key (e.g. `"nvidia"`, `"databricks"`, `"linkedin"`, `"custom-tool"`) to either a local path (`/images/logos/...`) or an external URL (`https://...`).
   - Built-in asset resolver resolves override URLs first, then item-level `logo` paths, then inline vector `BrandMark` fallbacks, guaranteeing zero broken image frames (`referrerPolicy="no-referrer"`, `naturalWidth` guard).
2. **Progress Milestone Entity (`ProgressMilestone`)**:
   - Fields: `id`, `itemId` (matches project or experience `id` / slug), `itemType` (`"project" | "experience"`), `date`, `phase` (`"Ideation" | "Architecture" | "Prototype" | "Validation" | "Production" | "Iteration"`), `title`, `ideaNote`, `outcome`, `mediaUrl` (optional local path or external link), `mediaType` (`"image" | "video" | "link"`), `order`.
3. **Resume vs. CV Config (`cv` & `resume` settings inside `portfolio.json`)**:
   - Independent file names (`resumeFileName`, `cvFileName`), summary override (`resumeSummary` concise executive pitch vs `summary` full narrative), caps (`maxExperiencesInResume`, `maxProjectsInResume`), and section toggle (`includeCertsInResume`, `includeInterestsInResume`, `includeHomelabInResume`).

### Interactive Component & State Mapping

- **Document Modal (`Resume | CV` + ATS Checker)**:
  - Segmented toggle switches `docMode` (`'resume' | 'cv'`), recalculating live HTML document preview, active PDF API URL (`/api/resume.pdf` vs `/api/cv.pdf`), filename download target, and copy-link string.
  - Collapsible **ATS Audit** panel runs pure client-side analysis over the active document dataset (`analyzeAtsReadiness(portfolioData, docMode)`) reporting:
    - Repeated action verbs (`≥ 3` occurrences, highlighting exact words to swap).
    - Bullet lines lacking numbers/quantifiable scale/scope units so the user can enrich them cleanly.
    - Essential section & contact completeness (`Email`, `Phone`, `LinkedIn`, `GitHub`, `Portfolio`, `Skills`, `Experience`, `Education`).
- **Progress Gallery Viewer (`ProgressGalleryModal`)**:
  - Opens from any Project card, Project Details modal, or Experience row carrying an active `itemId`.
  - Maintains `activeIndex` synchronized with keyboard arrows, next/previous buttons, and clickable chronological timeline nodes.
  - Automatically renders the **Blueprint Wireframe Placeholder** when `mediaUrl` is blank or fails to load, showing the exact `itemId` and target CSV/JSON field hint.
- **Server & CLI Parity**:
  - Startup server routine and CLI build script generate both static 1-page Resume PDF and comprehensive CV PDF cleanly into `public/`, while `/api/resume.pdf` and `/api/cv.pdf` dynamically stream up-to-the-second PDFs from `portfolio.json`.
