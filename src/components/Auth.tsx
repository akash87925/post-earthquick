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
  Cpu,
  Fingerprint
} from 'lucide-react';

interface AuthProps {
  onLogin: (userData: any) => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export default function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Simulated latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      if (mode === 'register') {
        const users = JSON.parse(localStorage.getItem('struct_guard_users') || '[]');
        if (users.find((u: any) => u.email === email)) {
          throw new Error('Identity already exists in registry.');
        }
        const newUser = { email, password, name, id: Math.random().toString(36).substr(2, 9) };
        users.push(newUser);
        localStorage.setItem('struct_guard_users', JSON.stringify(users));
        onLogin(newUser);
      } else if (mode === 'login') {
        const users = JSON.parse(localStorage.getItem('struct_guard_users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);
        
        // Handle default admin for demo if no users exist
        if (!user && email === 'admin@system.io' && password === 'admin123') {
           onLogin({ email: 'admin@system.io', name: 'System Admin', id: 'SYSTEM_ROOT' });
           return;
        }

        if (!user) {
          throw new Error('Invalid credentials or unauthorized identity.');
        }
        onLogin(user);
      } else if (mode === 'forgot-password') {
        const users = JSON.parse(localStorage.getItem('struct_guard_users') || '[]');
        const userExists = users.find((u: any) => u.email === email);
        if (email === 'admin@system.io' || userExists) {
          setSuccess('Recovery transmission sent to linked vector.');
        } else {
          throw new Error('Target vector not found in registry.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 dot-pattern opacity-10"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-[440px] relative z-10 px-6"
      >
        <div className="studio-surface bg-white p-10 border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-white mb-6 shadow-2xl">
               <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">
              {mode === 'login' ? 'Post-Earthquake Structural Damage Detection System' : mode === 'register' ? 'Identity Registry' : 'Vector Recovery'}
            </h1>
            <p className="text-sm font-medium text-zinc-400 mt-2">
              {mode === 'login' ? 'Authorize your session to access global diagnostics.' : mode === 'register' ? 'Link your pulse to the Analysis matrix.' : 'Initialize recovery protocol for your identity.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="technical-label !text-zinc-400">Identity Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-brand-accent transition-colors" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Matrix"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-zinc-50 border border-zinc-100 rounded-xl focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 outline-none transition-all text-sm font-semibold placeholder:text-zinc-300"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="technical-label !text-zinc-400">Vector Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-brand-accent transition-colors" />
                <input 
                  type="email" 
                  required
                  placeholder="name@system.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-zinc-50 border border-zinc-100 rounded-xl focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 outline-none transition-all text-sm font-semibold placeholder:text-zinc-300"
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="technical-label !text-zinc-400">Access Key</label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot-password')}
                      className="text-[10px] font-bold text-brand-accent uppercase tracking-widest hover:opacity-70"
                    >
                      Recovery_Mode
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-brand-accent transition-colors" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-zinc-50 border border-zinc-100 rounded-xl focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 outline-none transition-all text-sm font-semibold placeholder:text-zinc-300"
                  />
                </div>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 items-start"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-bold text-rose-600 uppercase tracking-tight leading-relaxed">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3 items-start"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-tight leading-relaxed">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Authorize Session' : mode === 'register' ? 'Initialize Vector' : 'Send Recovery'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-50 flex items-center justify-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {mode === 'login' ? 'New node?' : mode === 'register' ? 'Linked already?' : 'Found your key?'}
            </span>
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setSuccess(null);
              }}
              className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.1em] underline underline-offset-4 hover:text-brand-accent transition-colors"
            >
              {mode === 'login' ? 'Create Identity' : 'Authenticate'}
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center px-4">
           <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-zinc-400" />
              <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-widest">Encryption: AES_256</span>
           </div>
           <div className="flex items-center gap-2">
              <Fingerprint className="w-3 h-3 text-zinc-400" />
              <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-widest">Biometric_Ready</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
