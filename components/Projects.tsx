import React from 'react';
import { motion } from 'framer-motion';
import Section from './Section';

interface Project {
  name: string;
  description: string;
  url?: string;
  details?: string;
  stack?: string;
  logo?: string;
}

interface ProjectsProps {
  title: string;
  emoji: string;
  projects: Project[];
  onViewDetails: (project: Project) => void;
}

const GithubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
);

const Projects: React.FC<ProjectsProps> = ({ title, emoji, projects, onViewDetails }) => {
  return (
    <Section title={title} emoji={emoji}>
      <div className="grid md:grid-cols-2 gap-8">
        {projects.map((project, index) => {
            const isGithub = project.url && project.url.includes('github.com');
            const isPreviewImage = project.logo && /\.(jpg|jpeg|png)$/i.test(project.logo);

            return (
                <motion.div
                    key={project.name + index}
                    className="group flex flex-col rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] interactive-glow project-card overflow-hidden"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.03, y: -5 }}
                >
                    {isPreviewImage && (
                        <div className="w-full h-48 overflow-hidden">
                            <img 
                                src={project.logo} 
                                alt={`${project.name} preview`} 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            />
                        </div>
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                        <div className="flex-grow">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {project.logo && !isPreviewImage && (
                                        <img src={project.logo} alt={`${project.name} logo`} className="h-7 w-7 object-contain" />
                                    )}
                                    <h3 className="text-xl font-bold text-[var(--color-accent-400)]">{project.name}</h3>
                                </div>
                                {project.url && project.url !== '#' && !isGithub && (
                                    <div className="flex items-center gap-2">
                                        <div className="live-indicator"></div>
                                        <span className="text-sm text-green-400 font-medium">Live</span>
                                    </div>
                                )}
                            </div>
                            <p className="mt-2 text-[var(--color-text-muted)]">{project.description}</p>
                        </div>
                        <div className="mt-6 flex items-center space-x-4">
                            <button
                                onClick={() => onViewDetails(project)}
                                className="project-button project-button-details"
                            >
                                View Details
                            </button>
                            {project.url && project.url !== '#' && (
                                <a
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="project-button project-button-visit"
                                >
                                    <span>{isGithub ? 'View on GitHub' : 'Visit Website'}</span>
                                    {isGithub ? <GithubIcon /> : <ExternalLinkIcon />}
                                </a>
                            )}
                        </div>
                    </div>
                </motion.div>
            )
        })}
      </div>
    </Section>
  );
};

export default Projects;