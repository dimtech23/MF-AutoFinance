import React from 'react';
import { motion } from 'framer-motion';

const CustomLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999
      }}
    >
      <motion.img
        src="https://i.ibb.co/ycHJRYVS/gear-and-wrench-for-workshop-garage-logo-design-inspiration-vector.jpg"
        alt="Loading..."
        style={{ width: '80px', height: '80px' }}
        initial={{ scale: 0.5, rotate: 0 }}
        animate={{ 
          scale: [0.5, 1, 1, 0.5, 0.5],
          rotate: [0, 0, 270, 270, 0],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.2, 0.5, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 1
        }}
      />
    </motion.div>
  );
};

export default CustomLoader;