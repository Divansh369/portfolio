import React from 'react';

interface SectionProps {
  title: string;
  emoji?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, emoji, children }) => {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8 text-[var(--color-text-base)] border-l-4 border-[var(--color-accent-500)] pl-4">
        {emoji && <span className="mr-3">{emoji}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
};

export default Section;