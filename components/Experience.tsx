import React from 'react';
import { motion } from 'framer-motion';
import Section from './Section';

interface ExperienceType {
  role: string;
  company: string;
  location: string;
  duration: string;
  description: string;
  skills: string;
  logo?: string;
}

interface ExperienceProps {
  experience: ExperienceType[];
}

const Experience: React.FC<ExperienceProps> = ({ experience }) => {
  return (
    <Section title="Work Experience" emoji="💼">
      <div className="space-y-12">
        {experience.map((job, index) => (
          <motion.div
            key={index} 
            className="flex flex-col md:flex-row gap-x-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="md:w-1/3 mb-4 md:mb-0">
              {job.logo && (
                 <img
                    src={job.logo.includes('/') ? job.logo : `https://cdn.simpleicons.org/${job.logo}/FFFFFF`}
                    alt={`${job.company} logo`}
                    className="h-8 w-auto mb-3 object-contain object-left"
                    style={{ filter: job.logo.includes('/') ? '' : 'brightness(0) invert(1)' }}
                 />
              )}
              <h3 className="text-xl font-bold text-[var(--color-accent-400)]">{job.role}</h3>
              <p className="text-[var(--color-text-base)] font-medium">{job.company}</p>
              <p className="text-[var(--color-text-muted)] text-sm">{job.location}</p>
              <p className="text-[var(--color-text-dark)] text-sm mt-1">{job.duration}</p>
            </div>
            <div className="md:w-2/3">
              <div className="text-[var(--color-text-muted)] space-y-3">
                {job.description && job.description.split('|').map((desc, i) => (
                  <p key={i}>- {desc}</p>
                ))}
              </div>
              {job.skills && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills.split('|').map((skill) => (
                    <span key={skill} className="bg-gray-700 text-gray-200 text-xs font-medium px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

export default Experience;