import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { Home, Map, Calendar, Users, FileText, Settings, LogOut } from 'lucide-react';

const menuItems = [
  { path: '/', icon: <Home size={22} />, label: 'Dashboard' },
  { path: '/trips', icon: <Map size={22} />, label: 'Trips & Itineraries' },
  { path: '/reservations', icon: <Calendar size={22} />, label: 'Reservations' },
  { path: '/clients', icon: <Users size={22} />, label: 'Clients' },
  { path: '/documents', icon: <FileText size={22} />, label: 'Documents' },
];

export function Sidebar() {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <aside className="w-64 fixed inset-y-0 left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-r border-gray-100/60 dark:border-slate-800 p-6 flex flex-col gap-10 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      {/* Brand Logo - Interactive */}
      <div className="flex justify-center w-full group cursor-pointer px-2">
        <div className="relative w-full">
          <div className="absolute inset-0 bg-brand-primary/10 rounded-2xl blur-lg scale-90 group-hover:scale-105 transition-transform duration-700 opacity-0 group-hover:opacity-100" />
          <img 
            src="/assets/logo.png" 
            alt="Urlaub auf Madagaskar" 
            className="relative w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1 drop-shadow-sm" 
          />
        </div>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1">
        <ul className="flex flex-col gap-2.5">
          {menuItems.map(item => (
            <li key={item.path}>
              <NavLink to={item.path}>
                {({ isActive }) => (
                  <div className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 font-extrabold group overflow-hidden ${
                    isActive 
                      ? 'bg-brand-primary/5 dark:bg-brand-primary/10 text-brand-primary shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-brand-primary/10 dark:ring-brand-primary/20' 
                      : 'text-gray-400 dark:text-slate-400 hover:bg-gray-50/80 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] ring-1 ring-transparent hover:ring-gray-100 dark:hover:ring-slate-700'
                  }`}>
                    
                    {/* Active vertical pill indicator */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-brand-primary rounded-r-full transition-all duration-500 shadow-sm ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`} />
                    
                    {/* Icon container with hover animation */}
                    <div className={`relative flex items-center justify-center transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:-rotate-6'}`}>
                      {item.icon}
                      {/* Subtle glow behind active icon */}
                      {isActive && <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-md scale-150 opacity-50" />}
                    </div>
                    
                    {/* Label with slide-in hover effect */}
                    <span className="relative z-10 text-[14px] transition-transform duration-300 group-hover:translate-x-1 tracking-wide">{item.label}</span>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Settings / Action Area */}
      <div className="mt-auto pt-6 border-t border-gray-100 dark:border-slate-800">
        <ul className="flex flex-col gap-2">
          <li className="flex items-center gap-4 px-4 py-3 rounded-2xl font-extrabold text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer transition-all duration-300 group ring-1 ring-transparent hover:ring-gray-100 dark:hover:ring-slate-700">
            <div className="transition-transform duration-500 group-hover:scale-110 group-hover:rotate-90 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-slate-300">
              <Settings size={22} />
            </div>
            <span className="text-[14px] group-hover:translate-x-1 transition-transform duration-300 tracking-wide">Settings</span>
          </li>
          <li 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl font-extrabold text-gray-400 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer transition-all duration-300 group ring-1 ring-transparent hover:ring-rose-100 dark:hover:ring-rose-500/20"
          >
            <div className="transition-transform duration-500 group-hover:scale-110 group-hover:-translate-x-1 text-gray-400 group-hover:text-rose-500 dark:group-hover:text-rose-400">
              <LogOut size={22} />
            </div>
            <span className="text-[14px] group-hover:translate-x-1 transition-transform duration-300 tracking-wide">Sign Out</span>
          </li>
        </ul>
      </div>

    </aside>
  );
}
