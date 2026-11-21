import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  Moon,
  Printer,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import FloodButton from './motion/FloodButton';
import { Project } from '../types';
import { analyzeAtsReadiness, DocumentMode } from '../utils/atsAnalyzer';

interface CvModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData?: any;
}

const getDocumentFileName = (profile: any, mode: DocumentMode): string => {
  if (mode === 'resume') {
    if (profile?.resumeFileName && typeof profile.resumeFileName === 'string') {
      return profile.resumeFileName.endsWith('.pdf')
        ? profile.resumeFileName
        : `${profile.resumeFileName}.pdf`;
    }
    const cleanName = String(profile?.name || '')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return cleanName ? `${cleanName}_Resume.pdf` : 'Candidate_Resume.pdf';
  }

  if (profile?.cvFileName && typeof profile.cvFileName === 'string') {
    return profile.cvFileName.endsWith('.pdf') ? profile.cvFileName : `${profile.cvFileName}.pdf`;
  }
  const cleanName = String(profile?.name || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleanName ? `${cleanName}_CV.pdf` : 'Candidate_CV.pdf';
};

export const CvModal: React.FC<CvModalProps> = ({ isOpen, onClose, portfolioData }) => {
  const prefersReduced = useReducedMotion();
  const [docMode, setDocMode] = useState<DocumentMode>('resume');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewTheme, setViewTheme] = useState<'paper' | 'dark'>('paper');
  const [showAuditPanel, setShowAuditPanel] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const profile = portfolioData?.profile || {};
  const cvConfig = portfolioData?.cv || {};
  const allExperiences: any[] = portfolioData?.experience || [];
  const allEducation: any[] = portfolioData?.education || [];
  const skillCategories = portfolioData?.skills?.categories || [];
  const spokenLanguages = portfolioData?.skills?.languages || ['English (Fluent)'];
  const interests = portfolioData?.skills?.interests || [];
  const certificates = portfolioData?.certificates || [];
  const evolution = portfolioData?.homelab?.evolution || [];
  const domains: string[] = Array.isArray(profile.domains) ? profile.domains : [];
  const primaryDomain = domains[0] || '';

  const isResume = docMode === 'resume';

  const experiences = useMemo(() => {
    const maxExp = isResume
      ? typeof cvConfig.maxExperiencesInResume === 'number'
        ? cvConfig.maxExperiencesInResume
        : 5
      : allExperiences.length;
    return allExperiences.slice(0, maxExp);
  }, [allExperiences, cvConfig.maxExperiencesInResume, isResume]);

  const education = useMemo(() => {
    return isResume ? allEducation.slice(0, 1) : allEducation;
  }, [allEducation, isResume]);

  const projects: Project[] = useMemo(() => {
    const rawList: Project[] = portfolioData?.realWorldProjects || [];
    const maxCount = isResume
      ? typeof cvConfig.maxProjectsInResume === 'number'
        ? cvConfig.maxProjectsInResume
        : 3
      : typeof cvConfig.maxProjectsInCv === 'number'
      ? cvConfig.maxProjectsInCv
      : 4;

    return rawList
      .filter((p) => p.status !== 'hidden' && p.status !== 'archived' && p.status !== 'unmaintained')
      .map((p, idx) => ({ p, idx }))
      .sort((a, b) => {
        const aFeat = a.p.featured ? 0 : 1;
        const bFeat = b.p.featured ? 0 : 1;
        if (aFeat !== bFeat) return aFeat - bFeat;
        const aPrio = typeof a.p.priority === 'number' ? a.p.priority : a.idx + 100;
        const bPrio = typeof b.p.priority === 'number' ? b.p.priority : b.idx + 100;
        if (aPrio !== bPrio) return aPrio - bPrio;
        return a.idx - b.idx;
      })
      .map((item) => item.p)
      .slice(0, maxCount);
  }, [portfolioData, cvConfig.maxProjectsInCv, cvConfig.maxProjectsInResume, isResume]);

  const summaryText = useMemo(() => {
    if (isResume) {
      return profile.resumeSummary || profile.summary || '';
    }
    if (profile.summary && typeof profile.summary === 'string') return profile.summary;
    if (Array.isArray(portfolioData?.about) && portfolioData.about.length > 0) {
      return portfolioData.about.join(' ');
    }
    return '';
  }, [isResume, profile.resumeSummary, profile.summary, portfolioData?.about]);

  const auditReport = useMemo(
    () => analyzeAtsReadiness(portfolioData, docMode),
    [portfolioData, docMode]
  );

  const activeFileName = getDocumentFileName(profile, docMode);
  const apiEndpoint = isResume ? '/api/resume.pdf' : '/api/cv.pdf';
  const linkedinUrl = profile.linkedinUrl || '';
  const linkedinLabel = linkedinUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const githubUrl = profile.githubUrl || '';
  const githubLabel = githubUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  const baseUrl = import.meta.env.BASE_URL || '/';
  const staticPdfUrl = `${baseUrl.replace(/\/$/, '')}/${activeFileName}`;

  const includeHomelab = isResume
    ? cvConfig.includeHomelabInResume === true && evolution.length > 0
    : cvConfig.includeHomelabInCv !== false && evolution.length > 0;
  const includeCerts = isResume
    ? cvConfig.includeCertsInResume !== false && certificates.length > 0
    : certificates.length > 0;
  const includeInterests = isResume
    ? cvConfig.includeInterestsInResume === true && interests.length > 0
    : interests.length > 0;

  const homelabCvTitle =
    cvConfig.homelabCvTitle || 'Self-Hosted Infrastructure & Virtualization';
  const homelabCvLink: string =
    cvConfig.homelabCvLink ||
    (profile.primaryConsoleUrl ? String(profile.primaryConsoleUrl).replace(/^https?:\/\//, '') : '');
  const homelabCvHref =
    profile.primaryConsoleUrl || (homelabCvLink ? `https://${homelabCvLink}` : '');
  const homelabCvBullets: string[] =
    Array.isArray(cvConfig.homelabCvBullets) && cvConfig.homelabCvBullets.length > 0
      ? cvConfig.homelabCvBullets
      : evolution.map((st: any) => `${st.stage}: ${st.summary}`);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      let res = await fetch(apiEndpoint).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(staticPdfUrl);
      }
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = objectUrl;
      link.download = activeFileName;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
      }, 500);
    } catch (err) {
      console.warn('Blob download failed, using direct static fallback:', err);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = staticPdfUrl;
      link.download = activeFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 500);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    const targetUrl = window.location.hostname.includes('github.io')
      ? staticPdfUrl
      : `${apiEndpoint}?view=inline`;
    window.open(targetUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPdfLink = () => {
    const isGithub = window.location.hostname.includes('github.io');
    const fullUrl = isGithub
      ? new URL(staticPdfUrl, window.location.origin).href
      : `${window.location.origin}${apiEndpoint}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isPaper = viewTheme === 'paper';
  const totalIssues =
    auditReport.repeatedWords.length +
    auditReport.unquantifiedBullets.length +
    auditReport.contactChecks.filter((c) => !c.present).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#02040a]/85 z-[100] flex justify-center items-center p-2 sm:p-4 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="glass-panel rounded-2xl max-w-5xl w-full relative flex flex-col max-h-[94dvh] overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.94, y: 20, transformPerspective: 1200, rotateX: 6 }
            }
            animate={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0, transformPerspective: 1200, rotateX: 0 }
            }
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 14, transformPerspective: 1200, rotateX: -3 }
            }
            transition={
              prefersReduced
                ? { duration: 0.16 }
                : { type: 'spring', stiffness: 280, damping: 25 }
            }
          >
            {/* Top Control Bar */}
            <div className="flex flex-col gap-3 p-4 sm:px-6 bg-[#060914]/80 border-b border-white/[0.08] print-hide">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-mono text-cyan-400 mb-0.5">
                    <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      ATS Linear Single-Column PDF ·{' '}
                      {isResume ? '1-Page Executive Resume' : 'Full Curriculum Vitae'}
                    </span>
                  </div>
                  <h2 className="font-display text-base sm:text-xl font-bold text-zinc-50 leading-snug">
                    {isResume ? 'Resume (1-Page ATS)' : 'Curriculum Vitae (Comprehensive)'} —{' '}
                    {profile.name || 'Developer'}
                  </h2>
                </div>

                {/* Pinned Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white p-2 min-w-[44px] min-h-[44px] rounded-xl glass-panel-subtle transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  aria-label="Close document preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Resume vs CV Mode Switcher */}
                <LayoutGroup id="doc-mode-toggle">
                  <div
                    role="tablist"
                    aria-label="Switch between 1-page Resume and comprehensive CV"
                    className="flex items-center p-0.5 rounded-xl glass-panel-subtle text-xs font-mono"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isResume}
                      onClick={() => setDocMode('resume')}
                      className={`relative px-3 py-1.5 min-h-[38px] rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        isResume ? 'text-white font-medium' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {isResume && (
                        <motion.span
                          layoutId="doc-mode-pill"
                          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600/90"
                        />
                      )}
                      <span className="relative z-10">Resume (1-Page)</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!isResume}
                      onClick={() => setDocMode('cv')}
                      className={`relative px-3 py-1.5 min-h-[38px] rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        !isResume ? 'text-white font-medium' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {!isResume && (
                        <motion.span
                          layoutId="doc-mode-pill"
                          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600/90"
                        />
                      )}
                      <span className="relative z-10">Full CV</span>
                    </button>
                  </div>
                </LayoutGroup>

                {/* Theme Toggle */}
                <LayoutGroup id="cv-theme-toggle">
                  <div className="flex items-center p-0.5 rounded-xl glass-panel-subtle text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setViewTheme('paper')}
                      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[38px] rounded-lg transition-colors cursor-pointer ${
                        isPaper ? 'text-white font-medium' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                      title="White ATS paper preview"
                    >
                      {isPaper && (
                        <motion.span
                          layoutId="cv-theme-pill"
                          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600/90"
                        />
                      )}
                      <Sun className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
                      <span className="relative z-10">Paper</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewTheme('dark')}
                      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[38px] rounded-lg transition-colors cursor-pointer ${
                        !isPaper ? 'text-white font-medium' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                      title="Dark preview"
                    >
                      {!isPaper && (
                        <motion.span
                          layoutId="cv-theme-pill"
                          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600/90"
                        />
                      )}
                      <Moon className="w-3.5 h-3.5 relative z-10" aria-hidden="true" />
                      <span className="relative z-10">Dark</span>
                    </button>
                  </div>
                </LayoutGroup>

                {/* Download PDF */}
                <FloodButton
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  variant="primary"
                  className="px-3.5 py-2 font-mono text-xs min-h-[40px]"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isDownloading
                      ? 'Generating...'
                      : isResume
                      ? 'Download Resume'
                      : 'Download CV'}
                  </span>
                </FloodButton>

                {/* Open PDF in Tab */}
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl glass-panel-subtle hover:border-cyan-400/40 text-zinc-200 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap"
                  title="Open PDF in new tab"
                >
                  <span className="hidden sm:inline">Open PDF</span>
                  <span className="sm:hidden">PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl glass-panel-subtle hover:border-cyan-400/40 text-zinc-200 font-mono text-xs transition-colors cursor-pointer"
                  title="Print document"
                >
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyPdfLink}
                  className="inline-flex items-center gap-1 px-3 py-2 min-h-[40px] rounded-xl glass-panel-subtle hover:border-cyan-400/40 text-zinc-300 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : null}
                  <span className={copiedLink ? 'text-cyan-300' : ''}>
                    {copiedLink ? 'Copied' : 'Copy Link'}
                  </span>
                </button>
              </div>

              {/* Compact ATS Health Check Toggle Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs font-mono">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-300">
                  <span className="inline-flex items-center gap-1.5 text-cyan-300">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>ATS Parse Checks:</span>
                  </span>
                  <span className="tabular-nums">
                    {auditReport.quantifiedBullets}/{auditReport.totalBullets} bullets quantified
                  </span>
                  <span className="text-zinc-600" aria-hidden="true">·</span>
                  <span>
                    {auditReport.repeatedWords.length === 0
                      ? '0 repeated action verbs'
                      : `${auditReport.repeatedWords.length} repeated verb warning(s)`}
                  </span>
                  <span className="text-zinc-600" aria-hidden="true">·</span>
                  <span>
                    {auditReport.contactChecks.every((c) => c.present)
                      ? 'All contact links verified (incl. LinkedIn)'
                      : 'Missing optional contact channel'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAuditPanel((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-panel-subtle border border-white/10 hover:border-cyan-400/40 text-cyan-300 transition-colors cursor-pointer"
                >
                  <span>
                    {showAuditPanel
                      ? 'Hide ATS Audit'
                      : totalIssues > 0
                      ? `Inspect ATS Audit (${totalIssues} notes)`
                      : 'Inspect ATS Audit'}
                  </span>
                  {showAuditPanel ? (
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Expandable ATS Audit Panel */}
            <AnimatePresence>
              {showAuditPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-white/[0.08] bg-[#040813] print-hide"
                >
                  <div className="p-4 sm:px-6 grid md:grid-cols-3 gap-4 text-xs">
                    {/* Column 1: Essential Sections & Contacts */}
                    <div className="glass-panel-subtle rounded-xl p-3.5 space-y-2">
                      <div className="font-mono font-semibold text-zinc-100">
                        Contact &amp; Structure Check
                      </div>
                      <div className="space-y-1">
                        {auditReport.contactChecks.map((check) => (
                          <div
                            key={check.label}
                            className="flex items-center justify-between gap-2 text-[11px]"
                          >
                            <span className="text-zinc-400">{check.label}</span>
                            <span
                              className={`inline-flex items-center gap-1 font-mono ${
                                check.present ? 'text-emerald-400' : 'text-amber-300'
                              }`}
                            >
                              {check.present ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                  <span>Linked</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                                  <span>Missing</span>
                                </>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                      {isResume && (
                        <div className="pt-2 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400 tabular-nums">
                          Word budget: {auditReport.wordCount} words ·{' '}
                          <span
                            className={
                              auditReport.estimatedSinglePageFit
                                ? 'text-emerald-400'
                                : 'text-amber-300'
                            }
                          >
                            {auditReport.estimatedSinglePageFit
                              ? 'Fits 1-page Letter'
                              : 'Review density for 1-page fit'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Verb Repetition Check */}
                    <div className="glass-panel-subtle rounded-xl p-3.5 space-y-2">
                      <div className="font-mono font-semibold text-zinc-100">
                        Action Verb Repetition Check
                      </div>
                      {auditReport.repeatedWords.length === 0 ? (
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>No over-repeated action verbs detected (3+ uses).</span>
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                          {auditReport.repeatedWords.map((rw) => (
                            <div
                              key={rw.word}
                              className="text-[11px] text-amber-200/90 border-b border-white/[0.06] pb-1"
                            >
                              <span className="font-mono font-semibold text-amber-300">
                                "{rw.word}" ×{rw.count}
                              </span>{' '}
                              <span className="text-zinc-400">
                                → try: {rw.suggestions.slice(0, 3).join(', ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column 3: Quantified Impact Prompts */}
                    <div className="glass-panel-subtle rounded-xl p-3.5 space-y-2">
                      <div className="font-mono font-semibold text-zinc-100">
                        Quantifiable Impact Review
                      </div>
                      {auditReport.unquantifiedBullets.length === 0 ? (
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Every bullet includes measurable scale or metrics.</span>
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                          {auditReport.unquantifiedBullets.map((item, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] border-b border-white/[0.06] pb-1"
                            >
                              <div className="font-mono text-amber-300 truncate">
                                Add metric: {item.title}
                              </div>
                              <div className="text-zinc-400 line-clamp-1">{item.bullet}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Document Viewport */}
            <div
              className={`flex-1 overflow-y-auto p-2.5 sm:p-8 flex justify-center ${
                isPaper ? 'bg-[#090d18]' : 'bg-[#040711]'
              }`}
            >
              <div
                id="ats-resume-document"
                className={`w-full max-w-3xl rounded-sm p-4 sm:p-10 font-sans text-xs leading-normal space-y-3.5 print:p-0 print:shadow-none print:max-w-full ${
                  isPaper
                    ? 'bg-white shadow-2xl border border-gray-200'
                    : 'bg-[#0d1322] border border-white/10 shadow-2xl'
                }`}
                style={{
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  color: isPaper ? '#0f172a' : '#f4f4f5',
                }}
              >
                {/* HEADER WITH EXPLICIT LINKEDIN / GITHUB / PORTFOLIO ROWS */}
                <div
                  className="text-center pb-3"
                  style={{
                    borderBottom: isPaper
                      ? '1px solid #cbd5e1'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <h1
                    className="text-xl sm:text-2xl font-bold tracking-tight uppercase"
                    style={{ color: isPaper ? '#020617' : '#ffffff' }}
                  >
                    {profile.name || 'Developer'}
                  </h1>
                  <p
                    className="text-[11px] sm:text-xs font-semibold mt-0.5 tracking-wide uppercase"
                    style={{ color: isPaper ? '#1e3a8a' : '#38bdf8' }}
                  >
                    {profile.resumeHeadline || profile.title || 'Software Engineer'}
                  </p>

                  <div
                    className="text-[10px] sm:text-[11px] mt-1.5 flex flex-wrap justify-center gap-x-2 gap-y-0.5"
                    style={{ color: isPaper ? '#475569' : '#a1a1aa' }}
                  >
                    {profile.location && <span>{profile.location}</span>}
                    {profile.email && (
                      <>
                        {profile.location && <span>|</span>}
                        <a
                          href={`mailto:${profile.email}`}
                          style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                          className="hover:underline"
                        >
                          {profile.email}
                        </a>
                      </>
                    )}
                    {profile.phone && (
                      <>
                        <span>|</span>
                        <span>{profile.phone}</span>
                      </>
                    )}
                  </div>

                  <div
                    className="text-[10px] sm:text-[11px] mt-0.5 flex flex-wrap justify-center gap-x-2 gap-y-0.5"
                    style={{ color: isPaper ? '#475569' : '#a1a1aa' }}
                  >
                    {linkedinUrl && (
                      <span>
                        LinkedIn:{' '}
                        <a
                          href={linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                          className="hover:underline"
                        >
                          {linkedinLabel}
                        </a>
                      </span>
                    )}
                    {githubUrl && (
                      <>
                        {linkedinUrl && <span>|</span>}
                        <span>
                          GitHub:{' '}
                          <a
                            href={githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                            className="hover:underline"
                          >
                            {githubLabel}
                          </a>
                        </span>
                      </>
                    )}
                    {primaryDomain && (
                      <>
                        {(linkedinUrl || githubUrl) && <span>|</span>}
                        <span>
                          Portfolio:{' '}
                          <a
                            href={
                              primaryDomain.startsWith('http')
                                ? primaryDomain
                                : `https://${primaryDomain}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                            className="hover:underline"
                          >
                            {primaryDomain}
                          </a>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* SUMMARY */}
                {summaryText && (
                  <div>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5"
                      style={{
                        color: isPaper ? '#1e3a8a' : '#38bdf8',
                        borderBottom: isPaper
                          ? '1px solid #cbd5e1'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      Summary
                    </h2>
                    <p
                      className="text-[10.5px] leading-relaxed"
                      style={{ color: isPaper ? '#1e293b' : '#d4d4d8' }}
                    >
                      {summaryText}
                    </p>
                  </div>
                )}

                {/* SKILLS */}
                {skillCategories.length > 0 && (
                  <div>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5"
                      style={{
                        color: isPaper ? '#1e3a8a' : '#38bdf8',
                        borderBottom: isPaper
                          ? '1px solid #cbd5e1'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      Skills
                    </h2>
                    <div className="space-y-1 text-[10.5px] leading-relaxed">
                      {skillCategories.map((cat: any) => (
                        <div key={cat.name}>
                          <span
                            className="font-bold"
                            style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                          >
                            {cat.name}:{' '}
                          </span>
                          <span style={{ color: isPaper ? '#334155' : '#a1a1aa' }}>
                            {(cat.items || []).join(', ')}
                          </span>
                        </div>
                      ))}
                      {!isResume && spokenLanguages.length > 0 && (
                        <div>
                          <span
                            className="font-bold"
                            style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                          >
                            Spoken Languages:{' '}
                          </span>
                          <span style={{ color: isPaper ? '#334155' : '#a1a1aa' }}>
                            {spokenLanguages.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* EXPERIENCE */}
                {experiences.length > 0 && (
                  <div>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-2"
                      style={{
                        color: isPaper ? '#1e3a8a' : '#38bdf8',
                        borderBottom: isPaper
                          ? '1px solid #cbd5e1'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      Experience
                    </h2>

                    <div className={isResume ? 'space-y-2.5' : 'space-y-3.5'}>
                      {experiences.map((exp: any, index: number) => {
                        const bullets: string[] = Array.isArray(exp.bulletPoints)
                          ? isResume
                            ? exp.bulletPoints.slice(0, 2)
                            : exp.bulletPoints
                          : [];
                        const tools = Array.isArray(exp.skills)
                          ? isResume
                            ? exp.skills.slice(0, 6)
                            : exp.skills
                          : [];

                        return (
                          <div key={index} className="space-y-1">
                            <div>
                              <div className="font-bold text-[11px]" style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}>
                                {exp.role}
                                {exp.milestone && (
                                  <span
                                    className="text-[10px] font-semibold ml-1.5"
                                    style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                                  >
                                    ({exp.milestone.replace('★ ', '')})
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-[10px]"
                                style={{ color: isPaper ? '#475569' : '#a1a1aa' }}
                              >
                                <span style={{ color: isPaper ? '#334155' : '#d4d4d8' }} className="font-medium">
                                  {exp.company}
                                </span>
                                {exp.location ? ` · ${exp.location}` : ''}
                                {exp.duration ? ` | ${exp.duration}` : ''}
                              </div>
                            </div>

                            <ul className="list-disc pl-5 space-y-0.5 text-[10.5px] leading-relaxed w-full">
                              {bullets.map((point: string, pIdx: number) => (
                                <li
                                  key={pIdx}
                                  className="w-full break-words"
                                  style={{ color: isPaper ? '#1e293b' : '#d4d4d8' }}
                                >
                                  {point}
                                </li>
                              ))}
                            </ul>

                            {tools.length > 0 && (
                              <div
                                className="text-[9.5px] italic pl-5"
                                style={{ color: isPaper ? '#64748b' : '#a1a1aa' }}
                              >
                                Tools: {tools.join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PROJECTS & INFRASTRUCTURE */}
                {(projects.length > 0 || includeHomelab) && (
                  <div>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-2"
                      style={{
                        color: isPaper ? '#1e3a8a' : '#38bdf8',
                        borderBottom: isPaper
                          ? '1px solid #cbd5e1'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {isResume
                        ? 'Key Projects'
                        : cvConfig.projectsSectionTitle || 'Selected Projects & Infrastructure'}
                    </h2>

                    <div className={isResume ? 'space-y-2.5' : 'space-y-3'}>
                      {projects.map((proj: any, idx: number) => {
                        const rawPoints = proj.details
                          ? String(proj.details)
                              .split('|')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : [proj.description];
                        const shownPoints = isResume ? rawPoints.slice(0, 2) : rawPoints;
                        const stackItems = proj.stack
                          ? String(proj.stack)
                              .split('|')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : [];
                        const shownStack = isResume ? stackItems.slice(0, 5) : stackItems;

                        return (
                          <div key={idx} className="space-y-1">
                            <div>
                              <div
                                className="font-bold text-[11px]"
                                style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                              >
                                {proj.name}
                                {proj.badge && (
                                  <span
                                    className="text-[10px] font-semibold ml-1.5"
                                    style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                                  >
                                    ({proj.badge})
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-[10px]"
                                style={{ color: isPaper ? '#475569' : '#a1a1aa' }}
                              >
                                <span>{proj.category || 'Engineering Project'}</span>
                                {proj.url && proj.url !== '#' && (
                                  <>
                                    <span> | </span>
                                    <a
                                      href={proj.url}
                                      target="_blank"
                      rel="noreferrer"
                                      className="hover:underline"
                                      style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                                    >
                                      {proj.url.replace(/^https?:\/\//, '')}
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>

                            <ul className="list-disc pl-5 space-y-0.5 text-[10.5px] leading-relaxed w-full">
                              {shownPoints.map((pt: string, pIdx: number) => (
                                <li
                                  key={pIdx}
                                  className="w-full break-words"
                                  style={{ color: isPaper ? '#1e293b' : '#d4d4d8' }}
                                >
                                  {pt}
                                </li>
                              ))}
                            </ul>

                            {shownStack.length > 0 && (
                              <div
                                className="text-[9.5px] italic pl-5"
                                style={{ color: isPaper ? '#64748b' : '#a1a1aa' }}
                              >
                                Stack: {shownStack.join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {includeHomelab && (
                        <div className="space-y-1">
                          <div>
                            <div
                              className="font-bold text-[11px]"
                              style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                            >
                              {homelabCvTitle}
                            </div>
                            <div
                              className="text-[10px]"
                              style={{ color: isPaper ? '#475569' : '#a1a1aa' }}
                            >
                              <span>Self-Hosted Virtualization</span>
                              {homelabCvLink && (
                                <>
                                  <span> | </span>
                                  <a
                                    href={homelabCvHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline"
                                    style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                                  >
                                    {homelabCvLink}
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                          <ul
                            className="list-disc pl-5 space-y-0.5 text-[10.5px] leading-relaxed"
                            style={{ color: isPaper ? '#1e293b' : '#d4d4d8' }}
                          >
                            {(isResume ? homelabCvBullets.slice(0, 2) : homelabCvBullets).map(
                              (bullet: string, bIdx: number) => (
                                <li key={bIdx}>{bullet}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* EDUCATION */}
                {education.length > 0 && (
                  <div>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5"
                      style={{
                        color: isPaper ? '#1e3a8a' : '#38bdf8',
                        borderBottom: isPaper
                          ? '1px solid #cbd5e1'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      Education
                    </h2>
                    <div className="space-y-1.5">
                      {education.map((edu: any, idx: number) => (
                        <div key={idx} className="text-[10.5px]">
                          <div
                            className="font-bold"
                            style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                          >
                            {edu.degree}
                          </div>
                          <div
                            className="text-[10px]"
                            style={{ color: isPaper ? '#475569' : '#a1a1aa' }}
                          >
                            <span style={{ color: isPaper ? '#334155' : '#d4d4d8' }}>
                              {edu.institution}
                            </span>
                            {edu.gpa ? ` · ${edu.gpa}` : ''}
                            {edu.duration ? ` | ${edu.duration}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CERTIFICATIONS & INTERESTS */}
                {(includeCerts || includeInterests) && (
                  <div>
                    <h2
                      className="text-xs font-bold uppercase tracking-wider pb-0.5 mb-1.5"
                      style={{
                        color: isPaper ? '#1e3a8a' : '#38bdf8',
                        borderBottom: isPaper
                          ? '1px solid #cbd5e1'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {includeInterests ? 'Certifications & Interests' : 'Certifications'}
                    </h2>
                    <div className="space-y-1 text-[10px] leading-relaxed">
                      {includeCerts && (
                        <div>
                          <span
                            className="font-bold"
                            style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                          >
                            Certifications:{' '}
                          </span>
                          <span style={{ color: isPaper ? '#334155' : '#a1a1aa' }}>
                            {certificates.map((c: any) => `${c.name} (${c.date})`).join(' • ')}
                          </span>
                        </div>
                      )}
                      {includeInterests && (
                        <div>
                          <span
                            className="font-bold"
                            style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                          >
                            Interests:{' '}
                          </span>
                          <span style={{ color: isPaper ? '#334155' : '#a1a1aa' }}>
                            {interests.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Bar */}
            <div className="px-4 sm:px-6 py-2.5 bg-[#060914]/80 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-zinc-400 print-hide">
              <div className="flex items-center gap-3">
                <span>Endpoint: {apiEndpoint}</span>
                <span className="hidden sm:inline" aria-hidden="true">·</span>
                <span className="hidden sm:inline text-zinc-500">{activeFileName}</span>
                <span className="hidden sm:inline" aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="hidden sm:inline text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                >
                  Download .pdf
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-300 hover:text-white font-medium cursor-pointer"
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

export default CvModal;
