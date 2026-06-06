import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';

interface AuthFormsProps {
  onLogin: (user: { name: string; email: string }) => void;
}

type AuthView = 'login' | 'register' | 'forgot-password';

export const AuthForms: React.FC<AuthFormsProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    
    // Mock API call
    setTimeout(() => {
      const savedUserString = localStorage.getItem(`user_${email}`);
      if (savedUserString) {
        const savedUser = JSON.parse(savedUserString);
        if (savedUser.password === password) {
          onLogin({ name: savedUser.name, email: savedUser.email });
        } else {
          setError("AUTH_ERR: INVALID_CREDENTIALS");
        }
      } else if (email === 'admin@system.io' && password === 'admin') {
        onLogin({ name: 'Admin User', email: 'admin@system.io' });
      } else {
        setError("AUTH_ERR: USER_NOT_FOUND");
      }
      setLoading(false);
    }, 1200);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();

    // Mock API call
    setTimeout(() => {
      if (localStorage.getItem(`user_${email}`)) {
        setError("AUTH_ERR: EMAIL_ALREADY_EXISTS");
      } else {
        const newUser = { name, email, password };
        localStorage.setItem(`user_${email}`, JSON.stringify(newUser));
        setSuccess("REGISTRATION_COMPLETE: PROCEED_TO_LOGIN");
        setView('login');
      }
      setLoading(false);
    }, 1500);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();

    // Mock API call
    setTimeout(() => {
      setSuccess("RECOVERY_STREAM: RESET_LINK_DISPATCHED");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base p-6 relative overflow-hidden">
      {/* Background elements to match the main app aesthetics */}
      <div className="soft-glow top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/50"></div>
      <div className="soft-glow bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-50/30"></div>
      <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="studio-surface p-10 relative bg-white/80 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-accent flex items-center justify-center text-white shadow-lg mb-6">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 leading-none">Post-Earthquake Structural Damage Detection System</h1>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] mt-3">Identity Management System</span>
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="technical-label">Email Access ID</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="email" 
                        required
                        placeholder="network@system.io"
                        className="w-full h-12 bg-white border border-zinc-100 rounded-xl pl-12 pr-4 text-sm font-medium focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all selection:bg-brand-accent/20 outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="technical-label">Encrypted Key</label>
                      <button 
                        type="button" 
                        onClick={() => { setView('forgot-password'); resetMessages(); }}
                        className="text-[10px] font-bold text-zinc-400 uppercase hover:text-brand-accent transition-colors"
                      >
                        Recovery Node?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        className="w-full h-12 bg-white border border-zinc-100 rounded-xl pl-12 pr-4 text-sm font-medium focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all selection:bg-brand-accent/20 outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-primary h-12 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access System <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    New Operator? {' '}
                    <button 
                      onClick={() => { setView('register'); resetMessages(); }}
                      className="text-brand-accent hover:opacity-70 transition-opacity"
                    >
                      Initialize Account
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {view === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <label className="technical-label">Operator Primary ID</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="text" 
                        required
                        placeholder="John_Doe_01"
                        className="w-full h-12 bg-white border border-zinc-100 rounded-xl pl-12 pr-4 text-sm font-medium focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all selection:bg-brand-accent/20 outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="technical-label">Email Access ID</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="email" 
                        required
                        placeholder="network@system.io"
                        className="w-full h-12 bg-white border border-zinc-100 rounded-xl pl-12 pr-4 text-sm font-medium focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all selection:bg-brand-accent/20 outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="technical-label">Encrypted Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        className="w-full h-12 bg-white border border-zinc-100 rounded-xl pl-12 pr-4 text-sm font-medium focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all selection:bg-brand-accent/20 outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-primary h-12 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <div className="mt-8 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <button 
                    onClick={() => { setView('login'); resetMessages(); }}
                    className="flex items-center gap-2 mx-auto hover:text-brand-accent transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" /> Return to Login
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'forgot-password' && (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="mb-6">
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    Enter your email to receive a recovery package for your encrypted key.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="technical-label">Email Access ID</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="email" 
                        required
                        placeholder="network@system.io"
                        className="w-full h-12 bg-white border border-zinc-100 rounded-xl pl-12 pr-4 text-sm font-medium focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all selection:bg-brand-accent/20 outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-primary h-12 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Dispatch Recovery <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <div className="mt-8 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <button 
                    onClick={() => { setView('login'); resetMessages(); }}
                    className="flex items-center gap-2 mx-auto hover:text-brand-accent transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" /> Return to Login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-10 text-[9px] font-bold text-zinc-300 uppercase tracking-[0.4em]">
          Analysis_System_v4.2 // Identity_Matrix
        </p>
      </div>
    </div>
  );
};
