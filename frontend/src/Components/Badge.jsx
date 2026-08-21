import React from 'react';

export function Badge({ children, type = 'info', className = '' }) {
  const styles = {
    info: 'bg-blue-50 text-blue-600 border border-blue-200/50',
    warning: 'bg-amber-50 text-amber-600 border border-amber-200/50',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200/50',
  };

  return (
    <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${styles[type] || styles.info} ${className}`}>
      {children}
    </span>
  );
}
