import React from 'react';
import { motion } from 'framer-motion';

export function Button({ children, type = 'button', variant = 'primary', onClick, className = '', disabled = false }) {
  const baseStyle = 'font-semibold px-5 py-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 focus-visible:ring-brand-primary',
    secondary: 'glass-panel text-slate-700 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 focus-visible:ring-slate-400',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 focus-visible:ring-rose-500',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus-visible:ring-slate-400',
  };

  return (
    <motion.button 
      type={type}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
