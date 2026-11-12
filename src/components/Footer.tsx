import React from 'react';
import { ArrowUp, Braces, FileText } from 'lucide-react';
import CornerBrackets from './motion/CornerBrackets';
import TextScramble from './motion/TextScramble';

interface FooterProps {
  name: string;
  onOpenDataModal?: () => void;
  onOpenCvModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ name, onOpenDataModal, onOpenCvModal }) => {
  return (
    <footer className="pb-12 pt-4 text-xs font-mono text-zinc-500 print-hide">
      {/* Cyan-hairline inset frosted architectural footer plate */}
      <div className="relative p-px rounded-2xl bg-gradient-to-r from-cyan-400/35 via-blue-500/20 to-cyan-400/35 shadow-[0_20px_50px_-20px_rgba(6,182,212,0.22)]">
        <div className="group relative rounded-[15px] bg-[#050812]/90 backdrop-blur-xl px-6 py-6 sm:px-8 sm:py-7 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent"
          />
          <CornerBrackets />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
              <span className="text-zinc-200 font-medium">
                © {new Date().getFullYear()} {name}
              </span>
              <span className="text-zinc-700" aria-hidden="true">
                ·
              </span>
              <span className="hover:text-cyan-300 transition-colors">
                <TextScramble text="diivvansh.com" trigger="hover" durationMs={320} />
              </span>
              <span className="text-zinc-700" aria-hidden="true">
                ·
              </span>
              <span className="hover:text-cyan-300 transition-colors">
                <TextScramble text="fiorejoy.com" trigger="hover" durationMs={320} />
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <a href="#projects" className="hover:text-zinc-100 transition-colors py-1">
                Projects
              </a>
              <a href="#homelab" className="hover:text-zinc-100 transition-colors py-1">
                Proxmox
              </a>
              <a href="#experience" className="hover:text-zinc-100 transition-colors py-1">
                Experience
              </a>
              {onOpenCvModal && (
                <button
                  type="button"
                  onClick={onOpenCvModal}
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer font-medium py-1"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ATS CV (PDF)</span>
                </button>
              )}
              {onOpenDataModal && (
                <button
                  type="button"
                  onClick={onOpenDataModal}
                  className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer py-1"
                >
                  <Braces className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Data Schema</span>
                </button>
              )}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1 text-zinc-400 hover:text-cyan-300 transition-colors py-1"
                aria-label="Scroll back to top"
              >
                <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Top</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;