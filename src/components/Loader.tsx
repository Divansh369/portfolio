import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#040711] text-zinc-400">
      <div className="glass-panel rounded-2xl px-6 py-5 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" aria-hidden="true" />
        <p className="text-xs font-mono text-zinc-300">Loading portfolio...</p>
      </div>
    </div>
  );
};

export default Loader;
