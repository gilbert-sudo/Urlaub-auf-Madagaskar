import React, { useRef, useState, useEffect } from 'react';
import { Bell, Moon, Sun, ChevronDown, LogOut, Settings, Image as ImageIcon, Search, Mail } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 px-8 xl:px-12 py-6 flex justify-between items-center transition-colors duration-500">
      
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-full w-full max-w-md shadow-sm border border-gray-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search task" 
            className="bg-transparent border-none outline-none flex-1 text-sm text-slate-700 dark:text-slate-200 placeholder:text-gray-400"
          />
          <div className="flex items-center justify-center px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-[10px] font-bold text-gray-400 dark:text-slate-500">
            ⌘F
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme} 
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-brand-primary bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors"
        >
          {theme === 'light' ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-brand-primary bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors relative"
        >
          <Mail size={18} strokeWidth={2.5} />
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-brand-primary bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors relative"
        >
          <Bell size={18} strokeWidth={2.5} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
        </motion.button>
        
        <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold overflow-hidden relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-brand-primary transition-colors">{displayName}</p>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">{user?.email || 'tmichael20@mail.com'}</p>
            </div>
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50 origin-top-right"
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold shrink-0 overflow-hidden">
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
                
                <div className="my-2 border-t border-gray-100 dark:border-slate-700"></div>
                
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
