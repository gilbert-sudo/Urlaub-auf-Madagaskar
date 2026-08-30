import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-transparent relative text-slate-900 dark:text-slate-200 transition-colors duration-500">
      
      <Sidebar />
      <div className="flex-1 pl-72 flex flex-col relative z-10">
        <Header />
        <main className="flex-1 p-8 xl:px-12 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
