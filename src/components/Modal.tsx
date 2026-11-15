import React, { useEffect } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { ArrowUpRight, Code2, Images, Layers, X } from 'lucide-react';
import NginxLoadBalancerDemo from './NginxLoadBalancerDemo';
import FloodButton from './motion/FloodButton';
import CornerBrackets from './motion/CornerBrackets';
import RepoImage from './common/RepoImage';
import BrandMark from './icons/BrandMarks';
import { LoadBalancerDemoConfig, ProgressMilestone, Project } from '../types';
import { resolveItemId } from '../utils/itemId';

interface ModalProps {
  project: Project;
  loadBalancerDemoConfig?: LoadBalancerDemoConfig;
  progressMilestones?: ProgressMilestone[];
  onOpenGallery?: (payload: {
    itemId: string;
    title: string;
    subtitle?: string;
    milestones: ProgressMilestone[];
  }) => void;
  onClose: () => void;
}

const backdrop: Variants = {
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  hidden: { opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } },
};

const formatStatusLabel = (status?: Project['status']): string => {
  switch (status) {
    case 'live':
      return 'Live';
    case 'wip':
      return 'In Progress';
    case 'archived':
      return 'Archived';
    case 'unmaintained':
      return 'Not Maintained';
    default:
      return '';
  }
};

export const Modal: React.FC<ModalProps> = ({
  project,
  loadBalancerDemoConfig,
  progressMilestones = [],
  onOpenGallery,
  onClose,
}) => {
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
  const statusLabel = formatStatusLabel(project.status);
  const itemId = resolveItemId(project.id, project.name);
  const itemMilestones = progressMilestones.filter((m) => m.itemId === itemId);
  const showLoadBalancerWidget =
    loadBalancerDemoConfig?.enabled !== false &&
    (project.name.toLowerCase().includes('load balancer') ||
      (project.stack && project.stack.toLowerCase().includes('metallb')));

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

        <div className="flex items-center gap-3.5 mb-4 pr-10">
          {project.logo && (
            <RepoImage
              src={project.logo}
              alt={project.name}
              className="w-12 h-12 rounded-xl border border-white/15 bg-white/[0.06] shrink-0"
              imgClassName={`w-full h-full ${
                project.logo.toLowerCase().includes('.svg')
                  ? 'object-contain bg-white/95 p-1.5'
                  : 'object-cover'
              }`}
              fallback={<BrandMark brand={project.stack?.split('|')[0] || project.name} className="w-6 h-6" />}
            />
          )}
          <div className="min-w-0">
            <div className="text-xs font-mono text-cyan-400/90 mb-1 flex flex-wrap items-center gap-2">
              <span>
                {project.category || 'Project Architecture'}
                {project.badge ? ` · ${project.badge}` : ''}
              </span>
              {statusLabel && (
                <span className="text-zinc-400">· {statusLabel}</span>
              )}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight truncate">
              {project.name}
            </h2>
          </div>
        </div>

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
              <div className="text-xs font-mono text-zinc-200 flex flex-wrap gap-y-1.5 items-center">
                {project.stack.split('|').map((tech, idx) => (
                  <React.Fragment key={tech}>
                    {idx > 0 && (
                      <span className="mx-1.5 text-zinc-600" aria-hidden="true">
                        /
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <BrandMark brand={tech} className="w-3.5 h-3.5 shrink-0" />
                      <span>{tech}</span>
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {showLoadBalancerWidget && (
            <div className="pt-4 border-t border-white/[0.08]">
              <NginxLoadBalancerDemo config={loadBalancerDemoConfig} />
            </div>
          )}
        </div>

        {(hasExternalUrl || (onOpenGallery && itemMilestones.length > 0)) && (
          <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-end gap-3">
            {onOpenGallery && itemMilestones.length > 0 && (
              <FloodButton
                onClick={() =>
                  onOpenGallery({
                    itemId,
                    title: project.name,
                    subtitle: project.category,
                    milestones: itemMilestones,
                  })
                }
                variant="glass"
                className="text-xs py-2.5 px-4 min-h-[40px]"
              >
                <Images className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span className="tabular-nums">Progress Gallery ({itemMilestones.length})</span>
              </FloodButton>
            )}
            {hasExternalUrl && (
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
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Modal;