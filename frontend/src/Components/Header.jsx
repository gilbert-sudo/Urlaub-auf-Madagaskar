import React from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../Hooks/useTheme';
import { motion } from 'framer-motion';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-8 py-4 flex justify-between items-center border-b border-gray-200/80 dark:border-neutral-800">
      <h1 className="text-2xl font-black bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
        Dashboard
      </h1>
      
      <div className="flex items-center gap-6">
        <button onClick={toggleTheme} className="text-gray-500 hover:text-brand-primary transition-colors">
          {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
        <button className="text-gray-500 hover:text-brand-primary transition-colors relative">
          <Bell size={24} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>
        <div className="w-10 h-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-bold shadow-md">
          KK
        </div>
      </div>
    </header>
  );
}
