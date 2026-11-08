// Navigation bar providing conditional links based on auth state (Home/Login vs Dashboard/Transfer/Logout)
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      navigate('/login');
    }
  };

  return (
    <header className="border-b border-white/20 bg-black sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to={token ? "/dashboard" : "/"}
          className="text-xl font-bold tracking-tight text-white flex items-center gap-2"
        >
          <span className="w-4 h-4 bg-white inline-block"></span>
          LEDGER
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {token ? (
            <>
              <Link
                to="/dashboard"
                className="text-white/70 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/transfer"
                className="text-white/70 hover:text-white transition-colors"
              >
                Transfer
              </Link>
              <button
                onClick={handleLogout}
                className="border border-white px-3 py-1 text-xs uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-white/70 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                to="/login"
                className="border border-white px-3 py-1 text-xs uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors"
              >
                Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
