import React, { useState, useEffect } from 'react';

export const resolveRepoAsset = (path?: string): string => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  const clean = path.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${clean}`;
};

interface RepoImageProps {
  src?: string;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Renders a repository image path (`./images/...`) with resilient handling for:
 * - missing paths or 404 errors (`onError`)
 * - 0-byte stub image files (`naturalWidth === 0` on `onLoad`)
 * Never shows a broken image placeholder or raw alt text frame.
 */
export const RepoImage: React.FC<RepoImageProps> = ({
  src,
  alt,
  fallback,
  className = '',
  imgClassName = 'w-full h-full object-contain',
  loading = 'lazy',
}) => {
  const resolvedSrc = resolveRepoAsset(src);
  const [failed, setFailed] = useState<boolean>(!resolvedSrc);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    setFailed(!resolvedSrc);
    setLoaded(false);
  }, [resolvedSrc]);

  if (failed || !resolvedSrc) {
    return <span className={`inline-flex items-center justify-center ${className}`}>{fallback}</span>;
  }

  return (
    <span className={`relative inline-flex items-center justify-center overflow-hidden ${className}`}>
      {!loaded && (
        <span className="inset-0 absolute flex items-center justify-center" aria-hidden="true">
          {fallback}
        </span>
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth === 0) {
            setFailed(true);
          } else {
            setLoaded(true);
          }
        }}
        onError={() => setFailed(true)}
        className={`${imgClassName} transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  );
};

export default RepoImage;
