import React, { useEffect } from 'react';
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
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  hidden: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

const modal: Variants = {
  hidden: {
    y: "-50px",
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
  visible: {
    y: "0",
    opacity: 1,
    transition: {
      duration: 0.4,
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
      className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      variants={backdrop}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        className="glass-card rounded-lg shadow-2xl p-8 max-w-2xl w-full relative"
        onClick={(e) => e.stopPropagation()}
        variants={modal}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-text-muted hover:text-text-base transition-colors"
          aria-label="Close project details"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-3xl font-bold text-accent-400 mb-4">{project.name}</h2>
        
        <div className="text-text-muted space-y-6 max-h-[60vh] overflow-y-auto pr-4">
          <p className="text-lg">{project.description}</p>
          
          {project.details && (
            <div>
              <h3 className="font-semibold text-text-base text-lg mb-2">My Contribution</h3>
              <ul className="list-disc list-inside space-y-2">
                {project.details.split('|').map((point, index) => (
                    <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {project.stack && (
            <div>
              <h3 className="font-semibold text-text-base text-lg mb-2">Tech Stack</h3>
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
              className="inline-block bg-accent-600 hover:bg-accent-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
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