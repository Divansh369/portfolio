import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Briefcase,
  Code2,
  FileText,
  FolderGit2,
  GraduationCap,
  Mail,
  Menu,
  Server,
  X,
} from 'lucide-react';
import FloodButton from './motion/FloodButton';
import ScrollProgressRail from './motion/ScrollProgressRail';
import { PWAInstallButton } from './common/PWAInstallButton';

interface NavbarProps {
  brandName?: string;
  homelabLabel?: string;
  showHomelab?: boolean;
  onOpenCvModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  brandName = 'Portfolio',
  homelabLabel = 'Infrastructure',
  showHomelab = true,
  onOpenCvModal,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const prefersReduced = useReducedMotion();

  const navLinks = useMemo(() => {
    const items = [
      { name: 'Projects', href: '#projects', id: 'projects', icon: FolderGit2 },
      ...(showHomelab
        ? [{ name: homelabLabel, href: '#homelab', id: 'homelab', icon: Server }]
        : []),
      { name: 'Experience', href: '#experience', id: 'experience', icon: Briefcase },
      { name: 'Skills', href: '#skills', id: 'skills', icon: Code2 },
      { name: 'Education', href: '#education', id: 'education', icon: GraduationCap },
    ];
    return items;
  }, [homelabLabel, showHomelab]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track visible section in viewport for smooth layoutId active nav indicator
  useEffect(() => {
    const ids = navLinks.map((l) => l.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-28% 0px -58% 0px', threshold: 0.01 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navLinks]);

  // Mobile sheet body scroll lock + Escape key + auto close above md
  useEffect(() => {
    if (!mobileOpen) return;

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [mobileOpen]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <ScrollProgressRail />

      <header
        className={`fixed top-0 left-0 right-0 z-50 pt-safe transition-all duration-300 print-hide ${
          scrolled
            ? 'glass-nav'
            : 'bg-[#040711]/35 backdrop-blur-md border-b border-white/[0.06]'
        }`}
      >
        <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-5 lg:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMobileOpen(false);
              setActiveId('');
              window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
            }}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-zinc-50 hover:text-cyan-300 transition-colors whitespace-nowrap truncate max-w-[155px] sm:max-w-none shrink-0"
          >
            {brandName}
          </a>

          {/* Zone 2: Clean Single-Line Navigation Links with layoutId indicator */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-3.5 lg:gap-6 text-xs lg:text-sm font-medium text-zinc-400"
          >
            {navLinks.map((link) => {
              const isActive = activeId === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={`relative py-2 px-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-indicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute left-0 right-0 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action + PWA Install + Mobile Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton compact={true} />

            {onOpenCvModal && (
              <FloodButton
                onClick={onOpenCvModal}
                variant="primary"
                className="px-3 sm:px-4 py-2 min-h-[40px] text-xs"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Resume / CV</span>
              </FloodButton>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 text-zinc-300 hover:text-white rounded-xl glass-panel-subtle transition-colors cursor-pointer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Viewport Mobile Frosted Sheet (mounted outside header to avoid transform pinning bugs) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] md:hidden bg-[#040711]/94 backdrop-blur-2xl flex flex-col justify-between gap-6 p-6 pt-safe pb-safe overflow-y-auto print-hide"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            <div className="flex items-center justify-between">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
                }}
                className="font-display text-lg font-bold tracking-tight text-zinc-50"
              >
                {brandName}
              </a>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl glass-panel-subtle text-zinc-200 hover:text-white cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-3 my-auto">
              {[...navLinks, { name: 'Contact', href: '#contact', id: 'contact', icon: Mail }].map(
                (link, idx) => {
                  const Icon = link.icon;
                  return (
                    <motion.a
                      key={link.id}
                      href={link.href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 24,
                        delay: prefersReduced ? 0 : 0.05 + idx * 0.045,
                      }}
                      className="flex items-center gap-3.5 min-h-[48px] px-4 py-3 rounded-xl glass-panel-subtle text-zinc-100 hover:border-cyan-400/40 font-display text-xl font-semibold transition-colors"
                    >
                      <Icon className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden="true" />
                      <span>{link.name}</span>
                    </motion.a>
                  );
                }
              )}
            </nav>

            <div className="flex flex-col gap-2.5">
              <PWAInstallButton className="w-full min-h-[44px]" />
              {onOpenCvModal && (
                <FloodButton
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenCvModal();
                  }}
                  variant="primary"
                  className="w-full py-3 min-h-[46px] text-sm"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  <span>Open ATS Resume / CV</span>
                </FloodButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;