import React from 'react';
// FIX: Import Variants type from framer-motion to correctly type animation variants.
import { motion, Variants } from 'framer-motion';
import AnimatedShapes from './AnimatedShapes';

interface Social {
  name: string;
  url: string;
  logos: string;
}

interface HeaderProps {
  name: string;
  title: string;
  socials: Social[];
  avatarUrl: string;
}

const headerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const Header: React.FC<HeaderProps> = ({ name, title, socials, avatarUrl }) => {
  return (
    <motion.header
      className="py-12 text-center relative z-10 overflow-hidden"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.img
        src={avatarUrl}
        alt={name}
        className="rounded-full w-40 h-40 md:w-48 md:h-48 object-cover mx-auto border-4 border-[var(--color-border)] shadow-lg hero-avatar-glow"
        variants={itemVariants}
      />
      <motion.h1
        className="text-5xl md:text-6xl font-extrabold mt-6 mb-2 text-[var(--color-text)] leading-tight"
        variants={itemVariants}
      >
        {name}
      </motion.h1>
      <motion.p
        className="text-xl md:text-2xl text-[var(--color-primary)] font-semibold mb-8"
        variants={itemVariants}
      >
        {title}
      </motion.p>
      <motion.div className="flex justify-center space-x-6 mb-8" variants={itemVariants}>
        {socials.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors duration-300"
            aria-label={social.name}
          >
            <img src={social.logos} alt={social.name} className="w-8 h-8" />
          </a>
        ))}
      </motion.div>
      <AnimatedShapes />
    </motion.header>
  );
};

export default Header;