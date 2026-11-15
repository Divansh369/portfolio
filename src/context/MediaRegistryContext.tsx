import React, { createContext, useContext, useMemo } from 'react';
import { toAssetPath } from '../constants';

interface MediaRegistryContextValue {
  resolveIconOverride: (brand: string, normalizedKey?: string) => string | undefined;
}

const MediaRegistryContext = createContext<MediaRegistryContextValue>({
  resolveIconOverride: () => undefined,
});

const looksLikeAssetUrl = (value: string): boolean => {
  const s = value.trim();
  return (
    /^https?:\/\//i.test(s) ||
    s.startsWith('data:') ||
    s.startsWith('/') ||
    s.startsWith('./') ||
    /\.(svg|png|jpe?g|webp|gif|ico)(\?.*)?$/i.test(s)
  );
};

interface MediaRegistryProviderProps {
  iconOverrides?: Record<string, string>;
  children: React.ReactNode;
}

export const MediaRegistryProvider: React.FC<MediaRegistryProviderProps> = ({
  iconOverrides,
  children,
}) => {
  const value = useMemo<MediaRegistryContextValue>(() => {
    const baseUrl = import.meta.env.BASE_URL || './';
    const normalizedMap = new Map<string, string>();

    if (iconOverrides && typeof iconOverrides === 'object') {
      Object.entries(iconOverrides).forEach(([rawKey, rawPath]) => {
        if (!rawKey || !rawPath) return;
        const resolved = toAssetPath(String(rawPath).trim(), baseUrl) || String(rawPath).trim();
        normalizedMap.set(rawKey.toLowerCase().trim(), resolved);
      });
    }

    const resolveIconOverride = (brand: string, normalizedKey?: string): string | undefined => {
      if (!brand) return undefined;
      const cleanBrand = String(brand).trim();
      if (looksLikeAssetUrl(cleanBrand)) {
        return toAssetPath(cleanBrand, baseUrl) || cleanBrand;
      }

      const lower = cleanBrand.toLowerCase();
      if (normalizedMap.has(lower)) return normalizedMap.get(lower);

      if (normalizedKey && normalizedMap.has(normalizedKey.toLowerCase())) {
        return normalizedMap.get(normalizedKey.toLowerCase());
      }

      const stripped = lower.replace(/[^a-z0-9]+/g, '');
      if (normalizedMap.has(stripped)) return normalizedMap.get(stripped);

      return undefined;
    };

    return { resolveIconOverride };
  }, [iconOverrides]);

  return (
    <MediaRegistryContext.Provider value={value}>
      {children}
    </MediaRegistryContext.Provider>
  );
};

export const useMediaRegistry = () => useContext(MediaRegistryContext);
