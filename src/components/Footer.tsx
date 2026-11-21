import React from 'react';
import { ArrowUp, Braces, FileText } from 'lucide-react';
import CornerBrackets from './motion/CornerBrackets';
import TextScramble from './motion/TextScramble';
import RepoImage from './common/RepoImage';
import BrandMark from './icons/BrandMarks';
import { PWAInstallButton } from './common/PWAInstallButton';
import { Social } from '../types';

interface FooterProps {
  name: string;
  domains?: string[];
  homelabLabel?: string;
  showHomelab?: boolean;
  socials?: Social[];
  onOpenDataModal?: () => void;
  onOpenCvModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  name,
  domains = [],
  homelabLabel = 'Infrastructure',
  showHomelab = true,
  socials = [],
  onOpenDataModal,
  onOpenCvModal,
}) => {
  return (
    <footer className="pb-10 pt-4 pb-safe text-xs font-mono text-zinc-500 print-hide">
      {/* Cyan-hairline inset frosted architectural footer plate */}
      <div className="relative p-px rounded-2xl bg-gradient-to-r from-cyan-400/35 via-blue-500/20 to-cyan-400/35 shadow-[0_20px_50px_-20px_rgba(6,182,212,0.22)]">
        <div className="group relative rounded-[15px] bg-[#050812]/90 backdrop-blur-xl px-4 py-5 sm:px-8 sm:py-7 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent"
          />
          <CornerBrackets />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-2">
              <span className="text-zinc-200 font-medium">
                © {new Date().getFullYear()} {name}
              </span>
              {domains.map((domain) => (
                <React.Fragment key={domain}>
                  <span className="text-zinc-700" aria-hidden="true">
                    ·
                  </span>
                  <span className="hover:text-cyan-300 transition-colors">
                    <TextScramble text={domain} trigger="hover" durationMs={320} />
                  </span>
                </React.Fragment>
              ))}
              {socials.length > 0 && (
                <div className="flex items-center gap-2 pl-1">
                  {socials.map((social) => {
                    const isMail = social.url.startsWith('mailto:');
                    return (
                      <a
                        key={social.name}
                        href={social.url}
                        target={isMail ? undefined : '_blank'}
                        rel={isMail ? undefined : 'noopener noreferrer'}
                        aria-label={social.name}
                        title={social.name}
                        className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg glass-panel-subtle glass-panel-hover inline-flex items-center justify-center text-zinc-300 hover:text-cyan-300 transition-colors"
                      >
                        <RepoImage
                          src={social.logos}
                          alt={social.name}
                          className="w-3.5 h-3.5 rounded-[2px]"
                          imgClassName="w-full h-full object-contain rounded-[2px]"
                          fallback={<BrandMark brand={social.name} className="w-3.5 h-3.5" />}
                        />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1.5">
              <a href="#projects" className="hover:text-zinc-100 transition-colors min-h-[40px] inline-flex items-center px-1">
                Projects
              </a>
              {showHomelab && (
                <a href="#homelab" className="hover:text-zinc-100 transition-colors min-h-[40px] inline-flex items-center px-1">
                  {homelabLabel}
                </a>
              )}
              <a href="#experience" className="hover:text-zinc-100 transition-colors min-h-[40px] inline-flex items-center px-1">
                Experience
              </a>
              {onOpenCvModal && (
                <button
                  type="button"
                  onClick={onOpenCvModal}
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer font-medium min-h-[40px] px-1"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ATS CV (PDF)</span>
                </button>
              )}
              {onOpenDataModal && (
                <button
                  type="button"
                  onClick={onOpenDataModal}
                  className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer min-h-[40px] px-1"
                >
                  <Braces className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Data Schema</span>
                </button>
              )}
              <PWAInstallButton />
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1 text-zinc-400 hover:text-cyan-300 transition-colors min-h-[40px] px-1"
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