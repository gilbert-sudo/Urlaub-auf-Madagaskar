import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { Home, Map, Building, Users, FileText, Settings, LogOut, Car, Plus } from 'lucide-react';

const menuItems = [
  { path: '/', icon: <Home size={22} />, label: 'Dashboard' },
  { path: '/trips', icon: <Map size={22} />, label: 'Trips & Itineraries' },
  { path: '/hotels', icon: <Building size={22} />, label: 'Hotels' },
  { path: '/clients', icon: <Users size={22} />, label: 'Clients' },
  { path: '/drivers', icon: <Car size={22} />, label: 'Drivers' },
  { path: '/documents', icon: <FileText size={22} />, label: 'Documents' },
];

export function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <aside className="w-72 fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-6 flex flex-col z-40 transition-colors duration-500">
      
      {/* Brand Logo */}
      <div className="flex justify-center w-full mb-10 px-2 cursor-pointer" onClick={() => navigate('/')}>
        <img 
          src="/assets/logo.png" 
          alt="Urlaub auf Madagaskar" 
          className="w-full h-auto object-contain drop-shadow-sm" 
        />
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-8">
        {/* Main Navigation */}
        <nav>
          <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-4">Menu</p>
          <ul className="flex flex-col gap-1">
            {menuItems.map(item => (
              <li key={item.path}>
                <NavLink to={item.path}>
                  {({ isActive }) => (
                    <div className={`relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group overflow-hidden ${
                      isActive 
                        ? 'text-slate-900 dark:text-white font-bold' 
                        : 'text-gray-400 dark:text-slate-400 font-semibold hover:text-slate-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}>
                      
                      {/* Active vertical pill indicator */}
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-[#c42107] to-[#811303] rounded-r-full transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`} />
                      
                      {/* Icon container */}
                      <div className={`relative flex items-center justify-center transition-transform duration-300 ${isActive ? 'text-brand-primary' : 'group-hover:scale-110'}`}>
                        {item.icon}
                      </div>
                      
                      {/* Label */}
                      <span className="relative z-10 text-[14px] tracking-wide">{item.label}</span>
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* General Settings / Action Area */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-4">General</p>
          <ul className="flex flex-col gap-1">
            <li className="flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold text-gray-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-300 group">
              <div className="transition-transform duration-300 group-hover:rotate-90">
                <Settings size={22} />
              </div>
              <span className="text-[14px] tracking-wide">Settings</span>
            </li>
            <li 
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold text-gray-400 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-all duration-300 group"
            >
              <div className="transition-transform duration-300 group-hover:-translate-x-1">
                <LogOut size={22} />
              </div>
              <span className="text-[14px] tracking-wide">Sign Out</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Widget */}
      <div className="mt-8 relative overflow-hidden rounded-3xl bg-slate-900 text-white p-5 shadow-xl shrink-0">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-primary via-slate-900 to-slate-900 pointer-events-none" />
        
        {/* Subtle decorative waves/curves */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-primary rounded-full blur-3xl opacity-30 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-1">
            <Map size={20} className="text-white" />
          </div>
          <h3 className="font-bold text-sm">Quick Action</h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">Create a new itinerary or custom trip easily.</p>
          <button 
            onClick={() => navigate('/trips/new')}
            className="w-full py-2.5 bg-gradient-to-r from-[#811303] to-[#c42107] hover:from-[#c42107] hover:to-[#811303] text-white text-xs font-bold rounded-xl transition-all duration-300 shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> New Trip
          </button>
        </div>
      </div>

    </aside>
  );
}
