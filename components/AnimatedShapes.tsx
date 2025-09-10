import React from 'react';
// FIX: Import Variants type from framer-motion and apply it to shapeVariants to resolve type errors.
import { motion, Variants } from 'framer-motion';

const shapeVariants: Variants = {
  float: (custom: number) => ({
    y: [0, custom * 5, 0],
    x: [0, custom * 3, 0],
    rotate: [0, custom * 10, 0],
    transition: {
      duration: 10 + custom * 5,
      repeat: Infinity,
      repeatType: 'mirror',
      ease: 'easeInOut',
    },
  }),
};

const AnimatedShapes: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <motion.div
        className="absolute w-16 h-16 bg-pink-500 rounded-full opacity-10"
        style={{ top: '10%', left: '20%' }}
        variants={shapeVariants}
        animate="float"
        custom={1.2}
      />
      <motion.div
        className="absolute w-24 h-24 bg-purple-500 rounded-xl opacity-10"
        style={{ top: '60%', left: '10%' }}
        variants={shapeVariants}
        animate="float"
        custom={-1.5}
      />
      <motion.div
        className="absolute w-12 h-12 border-4 border-cyan-400 opacity-20"
        style={{ top: '20%', left: '80%' }}
        variants={shapeVariants}
        animate="float"
        custom={1.8}
      />
      <motion.div
        className="absolute w-20 h-20 bg-yellow-400 rounded-full opacity-10"
        style={{ top: '75%', left: '70%' }}
        variants={shapeVariants}
        animate="float"
        custom={-1.1}
      />
    </div>
  );
};

export default AnimatedShapes;