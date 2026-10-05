import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageLeads from './pages/admin/ManageLeads';
import SyncSheet from './pages/admin/SyncSheet';
import CallingAgentDashboard from './pages/calling/CallingAgentDashboard';
import DemoAgentDashboard from './pages/demo/DemoAgentDashboard';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to role-specific dashboard
    switch (user?.role) {
      case 'admin': return <Navigate to="/admin/dashboard" replace />;
      case 'calling_agent': return <Navigate to="/calling/dashboard" replace />;
      case 'demo_agent': return <Navigate to="/demo/dashboard" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  return children;
};

// Layout wrapper with responsive sidebar & top header
const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="main-wrapper">
        <Header onToggleSidebar={() => setMobileOpen(!mobileOpen)} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

// Home redirect based on role
const HomeRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'admin': return <Navigate to="/admin/dashboard" replace />;
    case 'calling_agent': return <Navigate to="/calling/dashboard" replace />;
    case 'demo_agent': return <Navigate to="/demo/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

// Login route - redirect if already authenticated
const LoginRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    switch (user?.role) {
      case 'admin': return <Navigate to="/admin/dashboard" replace />;
      case 'calling_agent': return <Navigate to="/calling/dashboard" replace />;
      case 'demo_agent': return <Navigate to="/demo/dashboard" replace />;
      default: break;
    }
  }

  return <LoginPage />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginRoute />} />

            {/* Home redirect */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><AdminDashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><ManageUsers /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/leads" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><ManageLeads /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/sync" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><SyncSheet /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Calling Agent Routes */}
            <Route path="/calling/dashboard" element={
              <ProtectedRoute allowedRoles={['calling_agent']}>
                <AppLayout><CallingAgentDashboard /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Demo Agent Routes */}
            <Route path="/demo/dashboard" element={
              <ProtectedRoute allowedRoles={['demo_agent']}>
                <AppLayout><DemoAgentDashboard /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
