import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { 
  Home, 
  Map, 
  Building, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Car, 
  Plus, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
  { path: '/calendar', icon: <CalendarIcon size={20} />, label: 'Master Schedule' },
  { path: '/trips', icon: <Map size={20} />, label: 'Trips & Itineraries' },
  { path: '/hotels', icon: <Building size={20} />, label: 'Hotels' },
  { path: '/clients', icon: <Users size={20} />, label: 'Clients' },
  { path: '/drivers', icon: <Car size={20} />, label: 'Drivers' },
  { path: '/documents', icon: <FileText size={20} />, label: 'Documents' },
];

export function Sidebar({ isOpen, setIsOpen, isCollapsed = false, onToggleCollapse }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col z-50 transition-all duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      } ${
        isCollapsed 
          ? 'w-72 lg:w-20 p-3 sm:p-3.5 items-center' 
          : 'w-72 lg:w-64 2xl:w-72 p-5 2xl:p-6'
      }`}
    >
      
      {/* Brand Logo & Collapse Toggle */}
      <div className={`flex items-center mb-6 sm:mb-8 w-full ${isCollapsed ? 'justify-center flex-col gap-3' : 'justify-between px-1'}`}>
        <div 
          className="cursor-pointer flex items-center gap-3 min-w-0" 
          onClick={() => navigate('/')}
          title="Urlaub auf Madagaskar"
        >
          {isCollapsed ? (
            <img 
              src="/favicon.png" 
              alt="Urlaub auf Madagaskar" 
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-sm hover:scale-105 transition-transform shrink-0" 
            />
          ) : (
            <img 
              src="/assets/logo.png" 
              alt="Urlaub auf Madagaskar" 
              className="h-10 2xl:h-12 w-auto max-w-[170px] 2xl:max-w-[200px] object-contain drop-shadow-xs" 
            />
          )}
        </div>

        {/* Laptop/Desktop Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-brand-primary transition-all shadow-xs border border-slate-200/60 dark:border-slate-700/60 ${
              isCollapsed ? 'mt-1' : ''
            }`}
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar for more workspace'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-6 sm:gap-7 w-full">
        {/* Main Navigation */}
        <nav className="w-full">
          {!isCollapsed && (
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-3 px-3">
              Navigation
            </p>
          )}
          <ul className="flex flex-col gap-1 w-full">
            {menuItems.map(item => (
              <li key={item.path} className="w-full">
                <NavLink 
                  to={item.path} 
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <div className={`relative flex items-center rounded-2xl transition-all duration-200 group overflow-hidden ${
                      isCollapsed 
                        ? 'justify-center p-3' 
                        : 'gap-3.5 px-3.5 py-2.5 2xl:py-3'
                    } ${
                      isActive 
                        ? 'text-slate-900 dark:text-white font-bold bg-brand-primary/10 dark:bg-brand-primary/20' 
                        : 'text-gray-400 dark:text-slate-300 font-semibold hover:text-slate-700 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}>
                      
                      {/* Active vertical pill indicator */}
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-[#c42107] to-[#811303] rounded-r-full transition-all duration-200 ${
                        isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'
                      }`} />
                      
                      {/* Icon container */}
                      <div className={`relative flex items-center justify-center transition-transform duration-200 shrink-0 ${
                        isActive ? 'text-brand-primary scale-105' : 'group-hover:scale-110'
                      }`}>
                        {item.icon}
                      </div>
                      
                      {/* Label */}
                      {!isCollapsed && (
                        <span className="relative z-10 text-[13px] 2xl:text-[14px] tracking-wide truncate">
                          {item.label}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* General Settings / Action Area */}
        <div className="w-full">
          {!isCollapsed && (
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-3 px-3">
              Settings
            </p>
          )}
          <ul className="flex flex-col gap-1 w-full">
            <li 
              title={isCollapsed ? 'Settings' : undefined}
              className={`flex items-center rounded-2xl font-semibold text-gray-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-200 group ${
                isCollapsed ? 'justify-center p-3' : 'gap-3.5 px-3.5 py-2.5 2xl:py-3'
              }`}
            >
              <div className="transition-transform duration-200 group-hover:rotate-90 shrink-0">
                <Settings size={20} />
              </div>
              {!isCollapsed && <span className="text-[13px] 2xl:text-[14px] tracking-wide truncate">Settings</span>}
            </li>
            <li 
              onClick={handleLogout}
              title={isCollapsed ? 'Sign Out' : undefined}
              className={`flex items-center rounded-2xl font-semibold text-gray-400 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-all duration-200 group ${
                isCollapsed ? 'justify-center p-3' : 'gap-3.5 px-3.5 py-2.5 2xl:py-3'
              }`}
            >
              <div className="transition-transform duration-200 group-hover:-translate-x-1 shrink-0">
                <LogOut size={20} />
              </div>
              {!isCollapsed && <span className="text-[13px] 2xl:text-[14px] tracking-wide truncate">Sign Out</span>}
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Quick Action Widget */}
      {isCollapsed ? (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 w-full flex justify-center shrink-0">
          <button
            onClick={() => navigate('/trips/new')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-[#811303] to-[#c42107] hover:from-[#c42107] hover:to-[#811303] text-white flex items-center justify-center shadow-lg shadow-brand-primary/30 hover:scale-105 active:scale-95 transition-all"
            title="Craft New Expedition"
          >
            <Plus size={20} />
          </button>
        </div>
      ) : (
        <div className="mt-4 relative overflow-hidden rounded-3xl bg-slate-900 text-white p-4 2xl:p-5 shadow-xl shrink-0 w-full">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-primary via-slate-900 to-slate-900 pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-brand-primary rounded-full blur-3xl opacity-30 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-0.5">
              <Map size={16} className="text-white" />
            </div>
            <h3 className="font-bold text-xs 2xl:text-sm">Quick Action</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">Craft a bespoke itinerary easily.</p>
            <button 
              onClick={() => navigate('/trips/new')}
              className="w-full py-2 bg-gradient-to-r from-[#811303] to-[#c42107] hover:from-[#c42107] hover:to-[#811303] text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-brand-primary/30 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Plus size={14} /> New Trip
            </button>
          </div>
        </div>
      )}

    </aside>
  );
}

