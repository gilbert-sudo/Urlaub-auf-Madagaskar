import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`glass rounded-4xl p-6 relative overflow-hidden group ${className}`}>
      {children}
    </div>
  );
}
