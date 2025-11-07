import React from 'react';
import { motion } from 'framer-motion';
import Section from './Section';
import WordCloud from './WordCloud';

interface Skill {
  skill: string;
  logo?: string;
}

interface SoftSkill {
    skill: string;
}

interface SkillsProps {
  skills: Skill[];
  softSkills: SoftSkill[];
}

const Skills: React.FC<SkillsProps> = ({ skills, softSkills }) => {
  return (
    <Section title="Core Skills" emoji="🔧">
      <div>
        <h3 className="text-2xl font-semibold mb-6 text-[var(--color-text-base)]">Technical Stack</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 text-center">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] interactive-glow"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.1, y: -5 }}
            >
              {skill.logo ? (
                <img
                  src={skill.logo.includes('/') ? skill.logo : `https://cdn.simpleicons.org/${skill.logo}/FFFFFF`}
                  alt={`${skill.skill} logo`}
                  className="h-10 w-10 md:h-12 md:w-12 object-contain mb-2"
                />
              ) : (
                <div className="h-10 w-10 md:h-12 md:w-12 mb-2 flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--color-text-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
              )}
              <p className="text-xs md:text-sm font-medium text-[var(--color-text-muted)]">{skill.skill}</p>
            </motion.div>
          ))}
        </div>
      </div>
      {softSkills.length > 0 && (
        <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-8 text-[var(--color-text-base)] text-center">Methodologies & Expertise</h3>
            <WordCloud words={softSkills.map(s => s.skill)} />
        </div>
      )}
    </Section>
  );
};

export default Skills;