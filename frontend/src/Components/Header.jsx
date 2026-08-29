import React, { useRef, useState, useEffect } from 'react';
import { Bell, Moon, Sun, ChevronDown, LogOut, Settings, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '../Hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, logout } from '../store/slices/authSlice';
import { toast } from 'sonner';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    setIsDropdownOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await dispatch(updateProfile({ id: user.id, data: { avatar: reader.result } })).unwrap();
          toast.success('Profile picture updated successfully');
        } catch (err) {
          toast.error('Failed to update profile picture');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const displayName = user?.name || 'Admin User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl px-8 xl:px-12 py-5 flex justify-between items-center border-b border-gray-200/50 dark:border-slate-800/50 transition-colors duration-500">
      <div className="flex items-center gap-4">
        {/* We can leave this empty or add a global search bar here later */}
        <div className="w-64 hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100/50 dark:bg-slate-800/50 rounded-full text-sm text-gray-500 dark:text-slate-400 border border-gray-200/50 dark:border-slate-700/50">
          <span className="opacity-50">Search (⌘K)</span>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme} 
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
        >
          {theme === 'light' ? <Moon size={20} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors relative"
        >
          <Bell size={20} strokeWidth={2.5} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </motion.button>
        
        <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="text-right hidden sm:block mr-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight group-hover:text-brand-primary transition-colors">{displayName}</p>
              <p className="text-[11px] font-semibold text-slate-400">Management</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-md shadow-brand-primary/20 ring-2 ring-white dark:ring-slate-900 group-hover:scale-105 transition-transform overflow-hidden relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 py-2 z-50 origin-top-right"
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || 'admin@example.com'}</p>
                  </div>
                </div>
                
                <div className="px-2 space-y-1">
                  <button 
                    onClick={() => { setIsDropdownOpen(false); /* add profile settings logic here */ }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-colors"
                  >
                    <Settings size={16} />
                    Profile Settings
                  </button>
                  <button 
                    onClick={handleAvatarClick}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-colors"
                  >
                    <ImageIcon size={16} />
                    Update Avatar
                  </button>
                </div>
                
                <div className="my-2 border-t border-gray-100 dark:border-slate-800"></div>
                
                <div className="px-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
        </div>
      </div>
    </header>
  );
}
