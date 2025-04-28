import React from 'react';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

const ErrorMessage = ({ errors }) => {
  const errorArray = Array.isArray(errors) 
    ? errors 
    : Object.values(errors).filter(error => error !== "");

  if (errorArray.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-red-50 border-l-4 border-red-500 p-4 mb-4"
    >
      <div className="flex items-center mb-2">
        <XCircle className="text-red-500 mr-2" size={20} />
        <h3 className="text-red-800 font-semibold">Please correct the following errors:</h3>
      </div>
      <ul className="list-disc list-inside text-red-700">
        {errorArray.map((error, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {error}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ErrorMessage;