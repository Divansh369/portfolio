import React from 'react';
import { motion } from 'framer-motion';

interface SectionProps {
  title: string;
  emoji?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, emoji, children }) => {
  return (
    <motion.section 
      className="mb-24"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h2 className="text-3xl font-bold mb-10 text-text-base border-l-4 border-accent-500 pl-4">
        {emoji && <span className="mr-3">{emoji}</span>}
        {title}
      </h2>
      {children}
    </motion.section>
  );
};

export default Section;