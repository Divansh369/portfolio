import React, { useEffect } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { ArrowUpRight, Code2, Layers, X } from 'lucide-react';
import NginxLoadBalancerDemo from './NginxLoadBalancerDemo';
import FloodButton from './motion/FloodButton';
import CornerBrackets from './motion/CornerBrackets';

interface Project {
  name: string;
  category?: string;
  badge?: string;
  description: string;
  url?: string;
  details?: string;
  stack?: string;
}

interface ModalProps {
  project: Project;
  onClose: () => void;
}

const backdrop: Variants = {
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  hidden: { opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } },
};

export const Modal: React.FC<ModalProps> = ({ project, onClose }) => {
  const prefersReduced = useReducedMotion();

  const modalVariants: Variants = {
    hidden: prefersReduced
      ? { opacity: 0 }
      : {
          y: 22,
          scale: 0.94,
          opacity: 0,
          transformPerspective: 1200,
          rotateX: 7,
          transition: { duration: 0.16, ease: 'easeIn' },
        },
    visible: prefersReduced
      ? { opacity: 1, transition: { duration: 0.16 } }
      : {
          y: 0,
          scale: 1,
          opacity: 1,
          transformPerspective: 1200,
          rotateX: 0,
          transition: { type: 'spring', stiffness: 290, damping: 25 },
        },
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const isGithub = project.url && project.url.includes('github.com');
  const isPlayStore = project.url && project.url.includes('play.google.com');
  const hasExternalUrl = project.url && project.url !== '#';

  return (
    <motion.div
      className="fixed inset-0 bg-[#02040a]/75 z-[90] flex justify-center items-center p-4 backdrop-blur-md"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      variants={backdrop}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="glass-panel rounded-2xl p-6 sm:p-8 max-w-2xl w-full relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        variants={modalVariants}
      >
        <CornerBrackets />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 min-w-[40px] min-h-[40px] rounded-xl glass-panel-subtle transition-colors cursor-pointer flex items-center justify-center z-20"
          aria-label="Close project details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-xs font-mono text-cyan-400/90 mb-2 pr-12">
          {project.category || 'Project Architecture'}
          {project.badge ? ` · ${project.badge}` : ''}
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-50 mb-4 tracking-tight pr-10">
          {project.name}
        </h2>

        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
            {project.description}
          </p>

          {project.details && (
            <div className="pt-4 border-t border-white/[0.08]">
              <h3 className="font-mono text-xs font-semibold text-zinc-300 mb-3 inline-flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>Implementation &amp; Scope</span>
              </h3>
              <ul className="space-y-2.5 text-sm text-zinc-300 leading-relaxed list-disc pl-5">
                {project.details.split('|').map((point, index) => (
                  <li key={index}>{point.trim()}</li>
                ))}
              </ul>
            </div>
          )}

          {project.stack && (
            <div className="pt-4 border-t border-white/[0.08]">
              <h3 className="font-mono text-xs font-semibold text-zinc-400 mb-2 inline-flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>Technologies Used</span>
              </h3>
              <div className="text-xs font-mono text-zinc-200 flex flex-wrap gap-y-1 items-center">
                {project.stack.split('|').map((tech, idx) => (
                  <React.Fragment key={tech}>
                    {idx > 0 && (
                      <span className="mx-1.5 text-zinc-600" aria-hidden="true">
                        /
                      </span>
                    )}
                    <span>{tech}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {(project.name.toLowerCase().includes('load balancer') ||
            project.name.toLowerCase().includes('nginx')) && (
            <div className="pt-4 border-t border-white/[0.08]">
              <NginxLoadBalancerDemo />
            </div>
          )}
        </div>

        {hasExternalUrl && (
          <div className="mt-6 pt-5 border-t border-white/[0.08] flex justify-end">
            <FloodButton
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="text-xs py-2.5 px-4 min-h-[40px]"
            >
              <span>
                {isPlayStore ? 'Open on Google Play' : isGithub ? 'View on GitHub' : 'Open Link'}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </FloodButton>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Modal;