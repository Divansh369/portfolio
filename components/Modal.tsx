import React, { useEffect } from 'react';
// FIX: Import Variants type from framer-motion to correctly type animation variants.
import { motion, Variants } from 'framer-motion';

interface Project {
  name: string;
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
  visible: { opacity: 1, transition: { duration: 0.3 } },
  hidden: { opacity: 0, transition: { duration: 0.3 } },
};

const modal: Variants = {
  hidden: {
    scale: 0.9,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: 'easeOut',
    },
  },
};

const Modal: React.FC<ModalProps> = ({ project, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      variants={backdrop}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="bg-[var(--color-card)] rounded-lg shadow-2xl p-8 max-w-2xl w-full border border-[var(--color-border)] relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
        variants={modal}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
          aria-label="Close project details"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-3xl font-bold text-[var(--color-accent-400)] mb-4">{project.name}</h2>
        
        <div className="text-[var(--color-text-muted)] space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          <p className="text-lg">{project.description}</p>
          
          {project.details && (
            <div>
              <h3 className="font-semibold text-[var(--color-text-base)] text-lg mb-2">My Contribution</h3>
              <ul className="list-disc list-inside space-y-2">
                {project.details.split('|').map((point, index) => (
                    <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {project.stack && (
            <div>
              <h3 className="font-semibold text-[var(--color-text-base)] text-lg mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.stack.split('|').map(tech => (
                  <span key={tech} className="bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">{tech}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {project.url && project.url !== '#' && (
          <div className="mt-6">
            <a 
              href={project.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-700)] text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Visit Website
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Modal;