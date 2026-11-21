import React, { useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        aria-label="Install app to device"
        title="Install Portfolio App"
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl glass-panel-subtle hover:border-cyan-400/50 text-cyan-300 hover:text-cyan-200 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
          compact ? 'px-2.5 py-2 min-h-[40px]' : 'px-3.5 py-2 min-h-[40px]'
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className={compact ? 'hidden sm:inline' : ''}>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Install app on iOS"
          title="Install on iPhone or iPad"
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl glass-panel-subtle hover:border-cyan-400/50 text-cyan-300 hover:text-cyan-200 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            compact ? 'px-2.5 py-2 min-h-[40px]' : 'px-3.5 py-2 min-h-[40px]'
          } ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className={compact ? 'hidden sm:inline' : ''}>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[#02040a]/80 backdrop-blur-md p-4"
            onClick={() => setShowIOSGuide(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Install on iPhone or iPad"
          >
            <div
              className="glass-panel rounded-2xl w-full max-w-sm p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close iOS install instructions"
                className="absolute top-3.5 right-3.5 p-2 min-w-[44px] min-h-[44px] rounded-xl glass-panel-subtle text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-display text-lg font-bold text-zinc-50 pr-10">
                Install on iPhone / iPad
              </h3>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
                1. Tap the <Share className="inline w-4 h-4 text-cyan-300 mx-0.5" aria-hidden="true" />{' '}
                <strong>Share</strong> icon in Safari&apos;s toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-mono font-medium cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 pb-safe inline-flex items-center gap-2 rounded-xl glass-panel border border-amber-400/40 px-3.5 py-2 text-xs font-mono text-amber-200 shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
      <span>Offline Mode — Serving cached portfolio</span>
    </div>
  );
};
