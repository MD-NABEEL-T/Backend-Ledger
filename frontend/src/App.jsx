// Main App entry defining routes and protected layout in black & white theme
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import HowItWorks from './pages/HowItWorks';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<HowItWorks />} />
            <Route path="/how-it-works" element={<Navigate to="/" replace />} />

            {/* Auth Page */}
            <Route path="/login" element={<Auth />} />

            {/* Protected Core Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfer"
              element={
                <ProtectedRoute>
                  <Transfer />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
