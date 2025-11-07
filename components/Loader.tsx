import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  start: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  end: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const circleVariants = {
  start: {
    y: "0%",
  },
  end: {
    y: "100%",
  },
};

const transition = {
  duration: 0.5,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut",
};

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]">
      <motion.div
        className="flex justify-around w-24 h-12"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        <motion.span
          className="block w-4 h-4 bg-[var(--color-primary)] rounded-full"
          variants={circleVariants}
          transition={transition}
        />
        <motion.span
          className="block w-4 h-4 bg-[var(--color-primary)] rounded-full"
          variants={circleVariants}
          transition={transition}
        />
        <motion.span
          className="block w-4 h-4 bg-[var(--color-primary)] rounded-full"
          variants={circleVariants}
          transition={transition}
        />
      </motion.div>
    </div>
  );
};

export default Loader;
