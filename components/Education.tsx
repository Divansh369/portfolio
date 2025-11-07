import React from 'react';
import { motion } from 'framer-motion';
import Section from './Section';

interface EducationType {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
}

interface EducationProps {
  education: EducationType[];
}

const Education: React.FC<EducationProps> = ({ education }) => {
  return (
    <Section title="Education" emoji="🎓">
      <div className="space-y-8">
        {education.map((edu, index) => (
          <motion.div
            key={index} 
            className="p-6 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] interactive-glow"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-accent-400)]">{edu.institution}</h3>
                <p className="text-[var(--color-text-base)]">{edu.degree}</p>
              </div>
              <div className="text-right">
                <p className="text-[var(--color-text-muted)] text-sm">{edu.duration}</p>
                <p className="text-[var(--color-text-base)] font-medium">{edu.gpa}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

export default Education;