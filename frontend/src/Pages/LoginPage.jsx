import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/slices/authSlice';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(login({ email, password }));
    if (login.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  return (
    <div className="h-screen fixed inset-0 w-full flex bg-white font-sans text-gray-900 overflow-hidden m-0 p-0 z-50">
      {/* Left side - Image & Branding */}
      <div className="relative hidden lg:flex lg:w-3/5 xl:w-2/3 h-full items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <img 
            src="/login-bg.jpg" 
            alt="Madagascar Landscape" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/80 via-black/20 to-transparent mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 w-full max-w-2xl mt-auto pb-16 text-white transform transition-all duration-700 translate-y-0 opacity-100">
          <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-md text-sm font-semibold tracking-widest uppercase mb-6 border border-white/30">
            Admin Portal
          </span>
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-['Rock_Salt',_cursive] tracking-normal mb-4 leading-normal font-normal text-white/80 mix-blend-overlay drop-shadow-sm py-4">
            Urlaub auf <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300/90 to-brand-100/90">Madagaskar</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-xl leading-relaxed mt-4">
            Manage your exclusive trips, clients, and documents seamlessly. Access the command center for unforgettable travel experiences.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-2/5 xl:w-1/3 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 relative bg-white dark:bg-surface-dark h-full shrink-0 shadow-[-10px_0_40px_rgba(0,0,0,0.1)] dark:shadow-[-10px_0_40px_rgba(0,0,0,0.5)] z-20 transition-colors duration-500 lg:rounded-l-[3rem]">
        
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-2">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Please sign in to your account to continue</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 p-4 rounded-r-2xl text-sm flex items-center shadow-sm animate-pulse">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}
            
            <div className="space-y-6 mt-4">
              <div className="relative border-2 border-slate-200 dark:border-slate-700 rounded-full focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all duration-300 bg-white dark:bg-slate-800">
                <label htmlFor="email" className="absolute -top-2.5 left-6 inline-block bg-white dark:bg-slate-800 px-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider transition-colors duration-300 focus-within:text-brand-primary rounded-full">
                  Email Address
                </label>
                <div className="flex items-center w-full h-full rounded-full overflow-hidden">
                  <div className="pl-5 pr-1 text-slate-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="block w-full border-0 py-3.5 pl-2 pr-4 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-0 sm:text-sm font-semibold bg-transparent outline-none rounded-full"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
              </div>

              <div className="relative border-2 border-slate-200 dark:border-slate-700 rounded-full focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all duration-300 bg-white dark:bg-slate-800">
                <label htmlFor="password" className="absolute -top-2.5 left-6 inline-block bg-white dark:bg-slate-800 px-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider transition-colors duration-300 focus-within:text-brand-primary rounded-full">
                  Password
                </label>
                <div className="flex items-center w-full h-full rounded-full overflow-hidden relative">
                  <div className="pl-5 pr-1 text-slate-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full border-0 py-3.5 pl-2 pr-12 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-0 sm:text-sm font-semibold bg-transparent outline-none rounded-full"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-brand-primary focus:outline-none transition-colors rounded-full p-1"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-3.582M15 15l3.29 3.29M18.36 18.36A10.04 10.04 0 0123.543 12c-1.274-4.057-5.064-7-9.542-7-1.396 0-2.73.28-3.957.794M21 21l-18-18" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                  <a href="#" className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 transition-colors">
                    Forgot Password?
                  </a>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-full text-sm font-bold text-white bg-slate-900 dark:bg-brand-primary hover:bg-black dark:hover:bg-brand-primary/90 focus:outline-none focus:ring-4 focus:ring-slate-900/30 dark:focus:ring-brand-primary/30 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden shadow-lg shadow-slate-900/20"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />
                <span className="relative z-10 flex items-center">
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Sign In'}
                  {!loading && (
                    <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
            
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-xs text-gray-400 font-medium">
              &copy; {new Date().getFullYear()} Klaus GmbH. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
