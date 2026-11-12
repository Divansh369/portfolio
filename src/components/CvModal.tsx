import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'framer-motion';
import {
  Check,
  Download,
  ExternalLink,
  FileText,
  Moon,
  Printer,
  Sun,
  X,
} from 'lucide-react';
import FloodButton from './motion/FloodButton';

interface CvModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData?: any;
}

export const CvModal: React.FC<CvModalProps> = ({ isOpen, onClose, portfolioData }) => {
  const prefersReduced = useReducedMotion();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewTheme, setViewTheme] = useState<'paper' | 'dark'>('paper');

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const profile = portfolioData?.profile || {};
  const experiences = portfolioData?.experience || [];
  const projects = portfolioData?.realWorldProjects || [];
  const education = portfolioData?.education || [];
  const skillCategories = portfolioData?.skills?.categories || [];
  const spokenLanguages = portfolioData?.skills?.languages || ['English (Fluent)', 'Hindi (Fluent)'];
  const interests = portfolioData?.skills?.interests || [];
  const certificates = portfolioData?.certificates || [];
  const evolution = portfolioData?.homelab?.evolution || [];

  const linkedinUrl = profile.linkedinUrl || 'https://www.linkedin.com/in/divansh-prasad-893b05230/';
  const linkedinLabel = linkedinUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const githubUrl = profile.githubUrl || 'https://github.com/Divansh369';
  const githubLabel = githubUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  const baseUrl = import.meta.env.BASE_URL || '/';
  const staticPdfUrl = `${baseUrl.replace(/\/$/, '')}/Divansh_Prasad_CV.pdf`;

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      // Try express backend endpoint first; fall back to pre-built static PDF on GitHub Pages
      let res = await fetch('/api/cv.pdf').catch(() => null);
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
      link.download = 'Divansh_Prasad_CV.pdf';
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
      link.download = 'Divansh_Prasad_CV.pdf';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 500);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    // Check if on static domain or express backend
    const targetUrl = window.location.hostname.includes('github.io') ? staticPdfUrl : '/api/cv.pdf?view=inline';
    window.open(targetUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPdfLink = () => {
    const isGithub = window.location.hostname.includes('github.io');
    const fullUrl = isGithub
      ? new URL(staticPdfUrl, window.location.origin).href
      : `${window.location.origin}/api/cv.pdf`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isPaper = viewTheme === 'paper';

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
            className="glass-panel rounded-2xl max-w-4xl w-full relative flex flex-col max-h-[92vh] overflow-hidden my-auto"
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
            {/* Top Frosted Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 bg-[#060914]/75 border-b border-white/[0.08] print-hide">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-0.5">
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ATS-Compliant Document · Synced from portfolio.json</span>
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-50">
                  Curriculum Vitae — {profile.name || 'Divansh Prasad'}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Theme Toggle with layoutId */}
                <LayoutGroup id="cv-theme-toggle">
                  <div className="flex items-center p-0.5 rounded-xl glass-panel-subtle text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setViewTheme('paper')}
                      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
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
                      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
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
                  className="px-3.5 py-2 font-mono text-xs min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
                </FloodButton>

                {/* Preview Raw PDF */}
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel-subtle hover:border-cyan-400/40 text-zinc-200 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap"
                  title="Open PDF in new tab"
                >
                  <span>Open PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel-subtle hover:border-cyan-400/40 text-zinc-200 font-mono text-xs transition-colors cursor-pointer"
                  title="Print resume"
                >
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {/* Copy Direct Link */}
                <button
                  type="button"
                  onClick={handleCopyPdfLink}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl glass-panel-subtle hover:border-cyan-400/40 text-zinc-300 font-mono text-xs transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : null}
                  <span className={copiedLink ? 'text-cyan-300' : ''}>
                    {copiedLink ? 'Copied' : 'Copy Link'}
                  </span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white p-2 min-w-[36px] min-h-[36px] rounded-xl glass-panel-subtle transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="Close CV preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Viewport */}
            <div
              className={`flex-1 overflow-y-auto p-3 sm:p-8 flex justify-center ${
                isPaper ? 'bg-[#090d18]' : 'bg-[#040711]'
              }`}
            >
              <div
                id="ats-resume-document"
                className={`w-full max-w-3xl rounded-sm p-6 sm:p-10 font-sans text-xs leading-normal space-y-4 print:p-0 print:shadow-none print:max-w-full ${
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
                {/* HEADER */}
                <div
                  className="text-center pb-3"
                  style={{
                    borderBottom: isPaper ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <h1
                    className="text-xl sm:text-2xl font-bold tracking-tight uppercase"
                    style={{ color: isPaper ? '#020617' : '#ffffff' }}
                  >
                    {profile.name || 'Divansh Prasad'}
                  </h1>
                  <p
                    className="text-[11px] sm:text-xs font-semibold mt-0.5 tracking-wide uppercase"
                    style={{ color: isPaper ? '#1e3a8a' : '#38bdf8' }}
                  >
                    Software Engineer · Data Pipelines &amp; Backend Infrastructure
                  </p>
                  <div
                    className="text-[10px] sm:text-[11px] mt-1.5 flex flex-wrap justify-center gap-x-2 gap-y-1"
                    style={{ color: isPaper ? '#475569' : '#a1a1aa' }}
                  >
                    <span>{profile.location || 'Bengaluru, India'}</span>
                    <span>•</span>
                    <a
                      href={`mailto:${profile.email || 'divanshthebest@gmail.com'}`}
                      style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                      className="hover:underline"
                    >
                      {profile.email || 'divanshthebest@gmail.com'}
                    </a>
                    {profile.phone && (
                      <>
                        <span>•</span>
                        <span>{profile.phone}</span>
                      </>
                    )}
                    <span>•</span>
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                      className="hover:underline"
                    >
                      {githubLabel}
                    </a>
                    <span>•</span>
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                      className="hover:underline"
                    >
                      {linkedinLabel}
                    </a>
                    <span>•</span>
                    <a
                      href="https://diivvansh.com"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                      className="hover:underline"
                    >
                      diivvansh.com
                    </a>
                  </div>
                </div>

                {/* SUMMARY */}
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
                    Software Engineer at Daimler Truck Innovation Center India (DTICI) working on Databricks ETL pipelines for ~70,000 connected trucks, internal FastAPI and React web apps, and automated Over-The-Air (OTA) data collection scripts validated on test rigs. Lead volunteer developer for Udayan Care NGO, shipping the bilingual FiT-UC mobile app on Google Play Store backed by self-hosted Proxmox LXC containers. Experienced advancing from bare-metal Debian, Kali, and Alpine Linux with Docker Compose to a 3-node Proxmox VE HA cluster with Proxmox Backup Server (PBS) and K3s routing.
                  </p>
                </div>

                {/* TECHNICAL SKILLS */}
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
                    Technical Skills
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
                    {spokenLanguages.length > 0 && (
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

                {/* EXPERIENCE */}
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

                  <div className="space-y-3.5">
                    {experiences.map((exp: any, index: number) => (
                      <div key={index} className="space-y-1">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="min-w-0">
                              <span
                                className="font-bold text-[11px]"
                                style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                              >
                                {exp.role}
                              </span>
                              {exp.milestone && (
                                <span
                                  className="text-[10px] font-semibold ml-1.5"
                                  style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                                >
                                  ({exp.milestone.replace('★ ', '')})
                                </span>
                              )}
                            </div>
                            <span
                              className="text-[10px] italic whitespace-nowrap shrink-0 text-right tabular-nums"
                              style={{ color: isPaper ? '#64748b' : '#a1a1aa' }}
                            >
                              {exp.duration}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between gap-2 text-[10px]">
                            <span
                              className="font-medium"
                              style={{ color: isPaper ? '#334155' : '#d4d4d8' }}
                            >
                              {exp.company}
                            </span>
                            <span
                              className="italic whitespace-nowrap shrink-0 text-right"
                              style={{ color: isPaper ? '#64748b' : '#a1a1aa' }}
                            >
                              {exp.location}
                            </span>
                          </div>
                        </div>

                        <ul className="list-disc pl-5 space-y-1 text-[10.5px] leading-relaxed w-full">
                          {(exp.bulletPoints || []).map((point: string, pIdx: number) => (
                            <li
                              key={pIdx}
                              className="w-full break-words"
                              style={{ color: isPaper ? '#1e293b' : '#d4d4d8' }}
                            >
                              {point}
                            </li>
                          ))}
                        </ul>

                        {exp.skills && exp.skills.length > 0 && (
                          <div
                            className="text-[9.5px] italic pl-5 pt-0.5"
                            style={{ color: isPaper ? '#64748b' : '#a1a1aa' }}
                          >
                            Tools: {exp.skills.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SELECTED PROJECTS & VIRTUALIZATION */}
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
                    Selected Projects &amp; Virtualization
                  </h2>

                  <div className="space-y-3">
                    {projects.slice(0, 4).map((proj: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="min-w-0">
                            <span
                              className="font-bold text-[11px]"
                              style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                            >
                              {proj.name}
                            </span>
                            {proj.badge && (
                              <span
                                className="text-[10px] font-semibold ml-1.5"
                                style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                              >
                                ({proj.badge})
                              </span>
                            )}
                          </div>
                          {proj.url && proj.url !== '#' && (
                            <a
                              href={proj.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] hover:underline whitespace-nowrap shrink-0 text-right"
                              style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                            >
                              {proj.url.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>

                        <ul className="list-disc pl-5 space-y-1 text-[10.5px] leading-relaxed w-full">
                          {proj.details ? (
                            proj.details.split('|').map((pt: string, pIdx: number) => (
                              <li
                                key={pIdx}
                                className="w-full break-words"
                                style={{ color: isPaper ? '#1e293b' : '#d4d4d8' }}
                              >
                                {pt.trim()}
                              </li>
                            ))
                          ) : (
                            <li
                              className="w-full break-words"
                              style={{ color: isPaper ? '#1e293b' : '#d4d4d8' }}
                            >
                              {proj.description}
                            </li>
                          )}
                        </ul>

                        {proj.stack && (
                          <div
                            className="text-[9.5px] italic pl-5 pt-0.5"
                            style={{ color: isPaper ? '#64748b' : '#a1a1aa' }}
                          >
                            Stack: {proj.stack.split('|').join(', ')}
                          </div>
                        )}
                      </div>
                    ))}

                    {evolution.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className="font-bold text-[11px]"
                            style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                          >
                            Self-Hosted Infrastructure Evolution (Linux Bare-Metal → Proxmox VE HA → K3s)
                          </span>
                          <a
                            href="https://pve.diivvansh.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] hover:underline whitespace-nowrap shrink-0"
                            style={{ color: isPaper ? '#1d4ed8' : '#38bdf8' }}
                          >
                            pve.diivvansh.com
                          </a>
                        </div>
                        <ul
                          className="list-disc pl-5 space-y-1 text-[10.5px] leading-relaxed"
                          style={{ color: isPaper ? '#1e293b' : '#d4d4d8' }}
                        >
                          <li>
                            Started bare-metal on Debian, Kali, and Alpine Linux across spare laptops managed with Docker and Docker Compose.
                          </li>
                          <li>
                            Upgraded into a 3-node High-Availability (HA) Proxmox VE cluster with Corosync quorum plus a 4th laptop dedicated to Proxmox Backup Server (PBS) incremental snapshots.
                          </li>
                          <li>
                            Consolidated onto a primary Proxmox VE 8 server running production Udayan Care LXCs and a nested 6-node K3s cluster behind Tailscale and Cloudflare Tunnels.
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* EDUCATION */}
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
                  <div className="space-y-2">
                    {education.map((edu: any, idx: number) => (
                      <div key={idx} className="space-y-0.5 text-[10.5px]">
                        <div className="flex justify-between items-baseline gap-2">
                          <span
                            className="font-bold min-w-0"
                            style={{ color: isPaper ? '#0f172a' : '#f4f4f5' }}
                          >
                            {edu.degree}
                          </span>
                          <span
                            className="text-[10px] italic whitespace-nowrap shrink-0 text-right tabular-nums"
                            style={{ color: isPaper ? '#64748b' : '#a1a1aa' }}
                          >
                            {edu.duration}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2 text-[10px]">
                          <span style={{ color: isPaper ? '#334155' : '#d4d4d8' }}>
                            {edu.institution}
                          </span>
                          {edu.gpa && (
                            <span
                              className="italic whitespace-nowrap shrink-0 text-right tabular-nums"
                              style={{ color: isPaper ? '#64748b' : '#a1a1aa' }}
                            >
                              {edu.gpa}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CERTIFICATIONS & INTERESTS */}
                {(certificates.length > 0 || interests.length > 0) && (
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
                      Certifications &amp; Interests
                    </h2>
                    <div className="space-y-1 text-[10px] leading-relaxed">
                      {certificates.length > 0 && (
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
                      {interests.length > 0 && (
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
            <div className="px-4 sm:px-6 py-2.5 bg-[#060914]/75 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-zinc-400 print-hide">
              <div className="flex items-center gap-3">
                <span>Endpoint: /api/cv.pdf</span>
                <span className="hidden sm:inline" aria-hidden="true">
                  ·
                </span>
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
