import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('klaus_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('klaus_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-transparent relative text-slate-900 dark:text-slate-200 transition-colors duration-500">
      
      {/* Mobile/Tablet Sidebar Overlay (screen < 1024px) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isCollapsed} 
        onToggleCollapse={toggleSidebarCollapse} 
      />
      
      {/* Main Content Wrapper - dynamically adjusts padding for 13" laptops and collapsed sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? 'lg:pl-20' : 'lg:pl-64 2xl:pl-72'
      }`}>
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
        <main className="flex-1 p-4 sm:p-5 lg:p-6 2xl:px-10 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

