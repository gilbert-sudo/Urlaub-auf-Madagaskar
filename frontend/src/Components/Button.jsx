import React from 'react';
import { motion } from 'framer-motion';

export function Button({ children, variant = 'primary', onClick, className = '' }) {
  const baseStyle = 'font-bold px-4 py-2 rounded-2xl transition-all duration-300 flex items-center gap-2';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-secondary shadow-lg shadow-brand-primary/30',
    secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 dark:bg-neutral-800 dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-700',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
