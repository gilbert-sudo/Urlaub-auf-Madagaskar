import React, { useRef } from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../Hooks/useTheme';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../store/slices/authSlice';
import { toast } from 'sonner';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
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
        
        <div className="flex items-center gap-3 cursor-pointer group" onClick={handleAvatarClick}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight group-hover:text-brand-primary transition-colors">{displayName}</p>
            <p className="text-[11px] font-semibold text-slate-400">Management</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold shadow-md shadow-brand-primary/20 ring-2 ring-white dark:ring-slate-900 group-hover:scale-105 transition-transform overflow-hidden relative">
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-white font-bold">Edit</span>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
        </div>
      </div>
    </header>
  );
}
