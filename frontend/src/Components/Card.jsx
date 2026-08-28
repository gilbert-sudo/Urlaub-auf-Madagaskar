import React from 'react';

export function Card({ children, className = '', noPadding = false }) {
  return (
    <div className={`glass-panel rounded-3xl ${noPadding ? '' : 'p-6 sm:p-8'} relative overflow-hidden group transition-all duration-300 hover:shadow-lg dark:hover:shadow-brand-primary/5 ${className}`}>
      {/* Subtle top glare effect */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      {children}
    </div>
  );
}
