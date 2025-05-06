import React from 'react';
import { motion } from 'framer-motion';

const QuickPageLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999
      }}
    >
      <motion.img
        src=""
        alt="Loading..."
        style={{ width: '40px', height: '40px' }}
        initial={{ scale: 0.5, rotate: 0 }}
        animate={{
          scale: [0.5, 1, 1, 0.5, 0.5],
          rotate: [0, 0, 270, 270, 0],
        }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          times: [0, 0.2, 0.5, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 0.5
        }}
      />
    </motion.div>
  );
};

export default QuickPageLoader;