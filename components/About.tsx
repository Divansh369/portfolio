import React from 'react';
import { motion } from 'framer-motion';
import Section from './Section';

interface AboutProps {
  bio: string[];
}

const About: React.FC<AboutProps> = ({ bio }) => {
  return (
    <Section title="About Me" emoji="👨‍💻">
      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-4 text-[var(--color-text-muted)] text-lg">
          {bio.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </motion.div>
    </Section>
  );
};

export default About;