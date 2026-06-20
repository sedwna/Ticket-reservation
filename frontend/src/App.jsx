import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import EventsListPage from './pages/user/EventsListPage';
import SeatMapPage from './pages/user/SeatMapPage';
import MyReservationsPage from './pages/user/MyReservationsPage';
import DashboardPage from './pages/admin/DashboardPage';
import EventManagementPage from './pages/admin/EventManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ReportsPage from './pages/admin/ReportsPage';
import ProfilePage from './pages/auth/ProfilePage';
import LoadingSkeleton from './components/common/LoadingSkeleton';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <LoadingSkeleton fullScreen message="در حال بارگذاری..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/events" replace />;

  return children;
}

function AppRoutes() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated ? <Navigate to={isAdmin ? '/admin/dashboard' : '/events'} replace /> : <LandingPage />
      } />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/events" element={<ProtectedRoute><EventsListPage /></ProtectedRoute>} />
      <Route path="/events/:id/seats" element={<ProtectedRoute><SeatMapPage /></ProtectedRoute>} />
      <Route path="/my-reservations" element={<ProtectedRoute><MyReservationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin/events" element={<ProtectedRoute adminOnly><EventManagementPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagementPage /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />

      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="text-center animate-fade-in-up">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl font-extrabold text-slate-300">۴۰۴</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">صفحه یافت نشد</h1>
            <p className="text-slate-500 mb-8">صفحه‌ای که به دنبال آن هستید وجود ندارد</p>
            <a href="/" className="btn-primary">بازگشت به صفحه اصلی</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
