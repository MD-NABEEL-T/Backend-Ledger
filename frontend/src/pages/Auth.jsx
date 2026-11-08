// Authentication page supporting Login and Register with demo pre-fill buttons and Render wake-up handling
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Ping backend on load to initiate wake-up if sleeping on Render free tier
  useEffect(() => {
    api.get('/').catch(() => {});
  }, []);

  // Monitor long-running requests to inform the user about Render's cold start
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setIsWakingUp(true);
      }, 3500);
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e, customEmail = null, customPass = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setLoading(true);

    const submitEmail = customEmail || email;
    const submitPass = customPass || password;

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: submitEmail, password: submitPass }
        : { name, email: submitEmail, password: submitPass };

      const response = await api.post(endpoint, payload);
      const token = response.data?.token;

      if (token) {
        localStorage.setItem('token', token);
        if (response.data?.user?.name) {
          localStorage.setItem('userName', response.data.user.name);
        }
        navigate('/dashboard');
      } else {
        setError('Token was not returned by server.');
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Unable to connect or invalid credentials. If the server was asleep, please retry in a moment.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to fill demo credentials
  const fillCredentials = (demoEmail, demoPassword) => {
    setIsLogin(true);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  // Helper to instant-login with demo account
  const quickLogin = (demoEmail, demoPassword) => {
    setIsLogin(true);
    setEmail(demoEmail);
    setPassword(demoPassword);
    handleSubmit(null, demoEmail, demoPassword);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Prototype Guide & One-Click Demo Logins */}
        <div className="border border-white/20 p-6 bg-black text-xs font-mono space-y-6">
          <div className="border-b border-white/20 pb-3">
            <span className="text-[10px] text-white/50 uppercase tracking-widest block">
              Interactive Prototype
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mt-1">
              Test Accounts & Guide
            </h2>
          </div>

          <div className="space-y-3">
            <p className="text-white/70 leading-relaxed font-sans text-xs">
              This prototype demonstrates a <strong>double-entry bank ledger</strong>. Every transfer writes matching immutable DEBIT & CREDIT entries.
            </p>

            <div className="border border-white/30 p-3 bg-white/[0.03] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">System Admin Account</span>
                <span className="text-[9px] border border-white px-1.5 py-0.5">Admin</span>
              </div>
              <div className="text-[11px] text-white/60">
                Email: <span className="text-white">test@example.com</span><br />
                Password: <span className="text-white">test123</span>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('test@example.com', 'test123')}
                  className="px-2 py-1 border border-white/40 text-[10px] uppercase hover:bg-white hover:text-black transition-colors"
                >
                  Fill Form
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('test@example.com', 'test123')}
                  disabled={loading}
                  className="px-2 py-1 border border-white bg-white text-black text-[10px] uppercase font-bold hover:bg-white/90 disabled:opacity-50"
                >
                  ⚡ Quick Sign In
                </button>
              </div>
            </div>

            <div className="border border-white/20 p-3 bg-white/[0.01] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Demo User (Alice)</span>
                <span className="text-[9px] border border-white/40 text-white/60 px-1.5 py-0.5">User</span>
              </div>
              <div className="text-[11px] text-white/60">
                Email: <span className="text-white">user@example.com</span><br />
                Password: <span className="text-white">test123</span>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('user@example.com', 'test123')}
                  className="px-2 py-1 border border-white/40 text-[10px] uppercase hover:bg-white hover:text-black transition-colors"
                >
                  Fill Form
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('user@example.com', 'test123')}
                  disabled={loading}
                  className="px-2 py-1 border border-white bg-white text-black text-[10px] uppercase font-bold hover:bg-white/90 disabled:opacity-50"
                >
                  ⚡ Quick Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Render Cold Start Notice */}
          <div className="border-t border-white/10 pt-4 text-[11px] text-white/50 leading-relaxed font-sans">
            <strong className="text-white/80 font-mono text-[10px] block uppercase mb-1">
              ℹ Why the first request may take ~30 seconds:
            </strong>
            The backend is hosted on Render’s free tier, which goes into sleep mode after 15 minutes of inactivity. The first request wakes the container up. Once awake, all requests respond instantly.
          </div>
        </div>

        {/* Right Column: Auth Form */}
        <div className="border border-white/20 p-8 bg-black">
          {/* Header and Toggle */}
          <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-6">
            <h1 className="text-xl font-bold tracking-wider uppercase">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h1>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs uppercase tracking-wider text-white/60 hover:text-white underline underline-offset-4"
            >
              {isLogin ? 'Switch to Register' : 'Switch to Login'}
            </button>
          </div>

          {/* Render Sleep Notification */}
          {isWakingUp && (
            <div className="mb-4 border border-dashed border-white p-3 text-xs bg-black text-white font-mono animate-pulse">
              ⏳ Backend is waking up from sleep mode (~30s). Please wait...
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 border border-white p-3 text-xs bg-white text-black font-medium">
              {error}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/80 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-black border border-white/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/80 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-black border border-white/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/80 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-white/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Connecting to Server...' : isLogin ? 'Sign In' : 'Register Account'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
