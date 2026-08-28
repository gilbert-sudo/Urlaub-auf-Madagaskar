import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-transparent relative text-slate-900 dark:text-slate-200 transition-colors duration-500">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent dark:from-brand-primary/10 pointer-events-none" />
      
      <Sidebar />
      <div className="flex-1 pl-64 flex flex-col relative z-10">
        <Header />
        <main className="flex-1 p-8 xl:px-12 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
