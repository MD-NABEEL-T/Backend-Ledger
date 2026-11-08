// Authentication page supporting Login and Register with a toggle switch
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password };

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
      const message = err.response?.data?.message || 'Something went wrong. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-white/20 p-8 bg-black">
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
                className="w-full bg-black border border-white/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white"
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
              className="w-full bg-black border border-white/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white"
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
              className="w-full bg-black border border-white/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

