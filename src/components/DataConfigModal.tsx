import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import { Braces, Check, Code2, Copy, FileText, Layers, X } from 'lucide-react';
import CornerBrackets from './motion/CornerBrackets';

interface DataConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const schemaTabs: Array<{
  id: 'overview' | 'json' | 'instructions';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Schema Overview', icon: Layers },
  { id: 'json', label: 'Raw JSON', icon: Code2 },
  { id: 'instructions', label: 'How to Customize', icon: FileText },
];

export const DataConfigModal: React.FC<DataConfigModalProps> = ({ isOpen, onClose }) => {
  const prefersReduced = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'overview' | 'json' | 'instructions'>('overview');
  const [copied, setCopied] = useState<boolean>(false);
  const [jsonData, setJsonData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);

    setIsLoading(true);
    const baseUrl = import.meta.env.BASE_URL || '/';
    const jsonPath = `${baseUrl.replace(/\/$/, '')}/data/portfolio.json?v=${Date.now()}`;
    fetch(jsonPath)
      .then((res) => res.json())
      .then((data) => {
        setJsonData(JSON.stringify(data, null, 2));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load portfolio.json for viewer:', err);
        setIsLoading(false);
      });

    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="data-config-modal"
          className="fixed inset-0 bg-[#02040a]/80 z-[95] flex justify-center items-center p-4 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="glass-panel rounded-2xl p-6 sm:p-8 max-w-4xl w-full relative flex flex-col max-h-[88vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.94, y: 18, transformPerspective: 1200, rotateX: 6 }
            }
            animate={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0, transformPerspective: 1200, rotateX: 0 }
            }
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12, transformPerspective: 1200, rotateX: -3 }
            }
            transition={
              prefersReduced
                ? { duration: 0.16 }
                : { type: 'spring', stiffness: 280, damping: 25 }
            }
          >
            <CornerBrackets />

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                  <Braces className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Modular Schema · public/data/portfolio.json</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-zinc-50">
                  Portfolio &amp; Resume Data Source
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  All section copy, projects, experience bullets, infrastructure notes, academics, and the generated PDF resume read dynamically from JSON (with CSV fallback).
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-zinc-400 hover:text-white p-2 min-w-[40px] min-h-[40px] rounded-xl glass-panel-subtle transition-colors cursor-pointer flex items-center justify-center relative z-20"
                aria-label="Close data configuration modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation with layoutId */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-3">
              <LayoutGroup id="schema-modal-tabs">
                <div
                  role="tablist"
                  className="flex items-center gap-1 p-1 glass-panel-subtle rounded-xl"
                >
                  {schemaTabs.map(({ id, label, icon: Icon }) => {
                    const selected = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setActiveTab(id)}
                        className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                          selected ? 'text-white' : 'text-zinc-400 hover:text-zinc-100'
                        }`}
                      >
                        {selected && (
                          <motion.span
                            layoutId="schema-modal-active-bg"
                            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600/90 shadow-sm"
                          />
                        )}
                        <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" aria-hidden="true" />
                        <span className="relative z-10">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>

              {activeTab === 'json' && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl glass-panel-subtle hover:border-cyan-400/40 text-zinc-200 font-mono text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                      <span className="text-cyan-300">Copied JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-1 mt-2">
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl glass-panel-subtle">
                    <div className="font-mono font-semibold text-zinc-100 mb-1.5">
                      profile, hero &amp; media.icons
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-2.5">
                      Controls identity, summary/resumeSummary, links, sections, and global icon overrides via <code className="text-zinc-200">media.icons</code> or <code className="text-zinc-200">icon_overrides.csv</code> (local <code className="text-zinc-200">/images/...</code> or <code className="text-zinc-200">https://</code> URLs).
                    </p>
                    <code className="text-cyan-400 font-mono text-[11px]">
                      portfolio.json → profile · media.icons · sections
                    </code>
                  </div>

                  <div className="p-4 rounded-xl glass-panel-subtle">
                    <div className="font-mono font-semibold text-zinc-100 mb-1.5">
                      Projects, Experience &amp; progressGallery
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-2.5">
                      Set <code className="text-zinc-200">id</code>, <code className="text-zinc-200">status</code>, and <code className="text-zinc-200">priority</code> per item. Link dated milestone photos &amp; ideation notes in <code className="text-zinc-200">progressGallery</code> or <code className="text-zinc-200">progress_gallery.csv</code> via <code className="text-zinc-200">itemId</code>.
                    </p>
                    <code className="text-cyan-400 font-mono text-[11px]">
                      portfolio.json → realWorldProjects · experience · progressGallery
                    </code>
                  </div>

                  <div className="p-4 rounded-xl glass-panel-subtle">
                    <div className="font-mono font-semibold text-zinc-100 mb-1.5">
                      Skills, Academics &amp; Credentials
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-2.5">
                      Drives skill icon tiles (auto-resolved through <code className="text-zinc-200">MediaRegistry</code>), categorized stacks, degrees, and certificates with optional logos &amp; links.
                    </p>
                    <code className="text-cyan-400 font-mono text-[11px]">
                      portfolio.json → skills · education · certificates
                    </code>
                  </div>

                  <div className="p-4 rounded-xl glass-panel-subtle">
                    <div className="font-mono font-semibold text-zinc-100 mb-1.5">
                      Split 1-Page Resume vs Full CV Engine
                    </div>
                    <p className="text-zinc-400 leading-relaxed mb-2.5">
                      Generates strictly linear ATS PDFs at <code className="text-zinc-200">/api/resume.pdf</code> (1-page executive) and <code className="text-zinc-200">/api/cv.pdf</code> (full archive) with live ATS Health Checks.
                    </p>
                    <code className="text-cyan-400 font-mono text-[11px]">
                      portfolio.json → cv · /api/resume.pdf · /api/cv.pdf
                    </code>
                  </div>
                </div>
              )}

              {activeTab === 'json' && (
                <div>
                  {isLoading ? (
                    <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                      Loading portfolio.json...
                    </div>
                  ) : (
                    <pre className="p-4 rounded-xl bg-[#03060f]/90 border border-white/[0.08] text-[11px] font-mono text-zinc-200 overflow-x-auto max-h-[50vh] leading-relaxed">
                      {jsonData}
                    </pre>
                  )}
                </div>
              )}

              {activeTab === 'instructions' && (
                <div className="p-5 rounded-xl glass-panel-subtle space-y-3 text-xs text-zinc-300 leading-relaxed">
                  <h4 className="font-display font-bold text-sm text-zinc-100">
                    Customizing Your Clone &amp; Updating the CV
                  </h4>
                  <ol className="list-decimal pl-5 space-y-2 text-zinc-400">
                    <li>
                      Copy <code className="text-cyan-400 font-mono">public/data/portfolio.example.json</code> over <code className="text-cyan-400 font-mono">public/data/portfolio.json</code> (or edit CSVs in <code className="text-cyan-400 font-mono">public/data/*.csv</code>).
                    </li>
                    <li>
                      Swap any brand, tech stack, hardware, or company logo in <code className="text-cyan-400 font-mono">media.icons</code> (or <code className="text-cyan-400 font-mono">icon_overrides.csv</code>) using local paths (<code className="text-zinc-200 font-mono">/images/...</code>) or external <code className="text-zinc-200 font-mono">https://</code> CDN URLs.
                    </li>
                    <li>
                      Attach progress timeline photos &amp; ideation notes via <code className="text-cyan-400 font-mono">progressGallery</code> / <code className="text-cyan-400 font-mono">progress_gallery.csv</code> matched to each project or role <code className="text-zinc-200 font-mono">itemId</code>.
                    </li>
                    <li>
                      Run <code className="text-cyan-400 font-mono">npm run generate-cv</code> to emit both your 1-page <code className="text-zinc-200 font-mono">_Resume.pdf</code> and full <code className="text-zinc-200 font-mono">_CV.pdf</code> into <code className="text-cyan-400 font-mono">public/</code>, or serve live via <code className="text-cyan-400 font-mono">/api/resume.pdf</code> &amp; <code className="text-cyan-400 font-mono">/api/cv.pdf</code>.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Source: public/data/portfolio.json</span>
              <button
                type="button"
                onClick={onClose}
                className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DataConfigModal;
