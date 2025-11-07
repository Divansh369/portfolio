import React from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import { Theme } from '../types';

const navLinks = [
  { name: 'About', href: '#about' },
  { name: 'Projects', href: '#projects' },
  { name: 'Experience', href: '#experience' },
  { name: 'Education', href: '#education' },
  { name: 'Skills', href: '#skills' },
  { name: 'Contact', href: '#contact' },
];

interface NavbarProps {
  themes: Theme[];
  currentTheme: Theme | null;
  setTheme: (theme: Theme) => void;
}

const Navbar: React.FC<NavbarProps> = ({ themes, currentTheme, setTheme }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if (href) {
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav className="fixed top-0 z-40 w-full backdrop-blur-md bg-[var(--color-bg)]/70 border-b border-[var(--color-secondary)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="relative flex items-center justify-start sm:justify-between h-16">
          <div className="flex-1 min-w-0 pr-36 sm:pr-0">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="text-[var(--color-text)] hover:text-[var(--color-primary)] px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 sm:static sm:translate-y-0 sm:ml-4">
             <ThemeSwitcher themes={themes} currentTheme={currentTheme} setTheme={setTheme} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;