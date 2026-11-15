# Modular Developer Portfolio & Automated ATS Resume / CV Engine

A clone-and-customize developer portfolio, animated project progress gallery, and dual ATS-compliant PDF document generator built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **Framer Motion**, and **Three.js WebGL**, backed by a **single-source-of-truth data layer** (`public/data/portfolio.json`, with CSV fallbacks in `public/data/*.csv`).

Anyone can clone this repository, edit JSON or CSV files in `public/data/`, swap local or external image URLs, and deploy without modifying React or server code.

---

## Key Capabilities

- **100% Data-Driven UI & Zero Hardcoded Personal Details**:
  - Zero personal identity, company names, domains, or project descriptions live inside `src/`, `server/`, or `scripts/`.
  - All copy, experience timelines, skill tiles, homelab clusters, and academics load dynamically from `public/data/portfolio.json` (with CSV fallback via `public/data/*.csv`).
  - Browser `<title>` and meta description sync automatically from `profile.name` and `hero.lead`.
- **Universal Modular Media & Icon Resolution (`media.icons` & `icon_overrides.csv`)**:
  - Override any technology, hardware, social, company, or school icon globally using either local assets (`/images/...`) or remote CDN URLs (`https://...`) via `portfolio.json -> media.icons` or `public/data/icon_overrides.csv`.
  - Automatic graceful fallback to built-in crisp geometric SVG brand marks when no custom image is supplied.
- **Split 1-Page ATS Resume vs. Comprehensive CV + Live ATS Health Audit**:
  - **1-Page Executive Resume (`GET /api/resume.pdf`)**: Linear left-to-right PDF stream (`pdfkit`) with explicit clickable `LinkedIn:`, `GitHub:`, and `Portfolio:` links, configurable entry limits (`maxExperiencesInResume`, `maxProjectsInResume`), and unified single-string bullets for high ATS parse accuracy.
  - **Full Curriculum Vitae (`GET /api/cv.pdf`)**: Complete career ledger, homelab architecture evolution, all active projects, academics, certifications, and interests.
  - **Built-In ATS Health Check Drawer**: Flags repeated action verbs, checks essential sections and contact links, highlights unquantified bullets for optional review, and verifies 1-page resume density in real time.
- **Animated Project & Career Progress Gallery (`progressGallery` / `progress_gallery.csv`)**:
  - Link multi-stage chronological milestones (`date`, `phase`, `title`, `ideaNote`, `outcome`, `mediaUrl`) to any project or experience role using its `itemId`.
  - Opens a keyboard-navigable (`←`/`→`/`ESC`), animated timeline gallery from project cards, project detail modals, and work experience entries.
  - Renders stylized Blueprint Wireframe placeholder cards (showing phase metadata and suggested asset path `/images/gallery/<itemId>/01.webp`) until real photos or diagram URLs are added.
- **Project Lifecycle, Priority & Visibility Controls**:
  - `status`: `'live' | 'active' | 'wip' | 'archived' | 'unmaintained' | 'hidden'`
  - `priority`, `featured`, `cardStyle` (`'banner' | 'compact'`), and `filterGroup` control ordering, spotlight sizing, and dynamic filter tabs cleanly from JSON/CSV.
- **Interactive 3D Blooming Lotus Architecture Viewport (Three.js WebGL)**:
  - Morphs across 4 configurable geometric presets (`core`, `stream`, `cluster`, `mesh`) driven by `sections.systems3d`.

---

## Project Structure

```
├── public/
│   ├── data/
│   │   ├── portfolio.json          # Primary config: edit this to customize site, gallery & PDFs
│   │   ├── portfolio.example.json  # Clean starter template with placeholder examples
│   │   ├── progress_gallery.csv    # CSV mirror/fallback for project & work ideation milestones
│   │   ├── icon_overrides.csv      # CSV mirror/fallback for custom icon paths / CDN URLs
│   │   └── *.csv                   # Fallback CSV tables (experience, projects, skills, etc.)
│   ├── images/                     # Local profile, project, logo, and gallery assets
│   └── favicon.svg
├── scripts/
│   └── generate-cv.ts              # Builds both static Resume and CV PDFs into public/
├── server/
│   └── cvPdfGenerator.ts           # Modular PDFKit ATS linear layout engine ('resume' & 'cv')
├── server.ts                       # Express server serving Vite + /api/portfolio + /api/resume.pdf + /api/cv.pdf
└── src/
    ├── components/                 # Modular UI sections, 3D scene, ProgressGalleryModal & CvModal
    ├── context/MediaRegistryContext.tsx # Global icon override lookup across local & HTTPS URLs
    ├── utils/atsAnalyzer.ts        # Live ATS verb-repetition & quantification checker
    ├── utils/itemId.ts             # Deterministic slugification matching CSV/JSON milestones
    ├── constants.ts                # SWR loader reading portfolio.json with CSV fallback
    └── types.ts                    # Full TypeScript schema
```

---

## Quick Start

### 1. Clone & Customize Data

```bash
git clone <your-repo-url>
cd portfolio
npm install
```

To start fresh with the starter template:

```bash
cp public/data/portfolio.example.json public/data/portfolio.json
```

Update `public/data/portfolio.json` with your details, optionally add screenshots into `public/images/gallery/<itemId>/01.webp` (or HTTPS URLs), and regenerate your static Resume + CV PDFs:

```bash
npm run generate-cv
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Express + Vite on port `3000` with live `/api/resume.pdf` and `/api/cv.pdf`. |
| `npm run generate-cv` | Compiles static `<Name>_Resume.pdf` and `<Name>_CV.pdf` into `public/`. |
| `npm run build` | Builds the static production site into `dist/`. |
| `npm run lint` | Runs TypeScript checks (`tsc --noEmit`). |
| `npm run clean` | Removes `dist/`. |

---

## License

MIT
