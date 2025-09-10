import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../types';

interface ThemeSwitcherProps {
  themes: Theme[];
  currentTheme: Theme | null;
  setTheme: (theme: Theme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ themes, currentTheme, setTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current theme button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-[var(--color-secondary)] p-2 rounded-full shadow-lg border border-[var(--color-secondary)]"
      >
        {currentTheme && (
          <>
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: currentTheme.primaryColor }}
            />
            <span className="text-xs font-medium text-[var(--color-text)] pr-2">
              {currentTheme.name}
            </span>
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-48 bg-[var(--color-secondary)] rounded-md shadow-lg z-10">
          {themes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => {
                setTheme(theme);
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary)]"
            >
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: theme.primaryColor }}
              />
              {theme.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
