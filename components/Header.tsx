import React from 'react';
import { motion, Variants } from 'framer-motion';

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
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      // FIX: Replaced the invalid cubic-bezier array with a valid string.
      ease: "easeOut",
    },
  },
};

const Header: React.FC<HeaderProps> = ({ name, title, socials, avatarUrl }) => {
  return (
    <motion.header
      className="py-20 text-center relative z-10"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.img
        src={avatarUrl}
        alt={name}
        className="rounded-full w-40 h-40 md:w-48 md:h-48 object-cover mx-auto border-4 border-border shadow-lg animate-pulse-glow-hero"
        variants={itemVariants}
      />
      <motion.h1
        className="text-5xl md:text-6xl font-extrabold mt-6 mb-2 text-text-base leading-tight"
        variants={itemVariants}
      >
        {name}
      </motion.h1>
      <motion.p
        className="text-xl md:text-2xl text-accent-400 font-semibold mb-8"
        variants={itemVariants}
      >
        {title}
      </motion.p>
      <motion.div className="flex justify-center space-x-6 mb-8" variants={itemVariants}>
        {socials.map((social) => (
          <motion.a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-accent-400 transition-transform duration-300"
            aria-label={social.name}
            whileHover={{ scale: 1.2, y: -4 }}
          >
            <img src={social.logos} alt={social.name} className="w-8 h-8" />
          </motion.a>
        ))}
      </motion.div>
    </motion.header>
  );
};

export default Header;