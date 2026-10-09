import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Donations } from './pages/Donations';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Team } from './pages/Team';
import { Backup } from './pages/Backup';
import { VerifyReceipt } from './pages/VerifyReceipt';
import { FestivalManagement } from './pages/FestivalManagement';

import { ErrorBoundary } from './components/ErrorBoundary';

const RootRoute: React.FC = () => {
  const { token, loading } = useAuth();
  if (loading) return <div className="text-slate-400 text-sm p-8 bg-slate-950 min-h-screen flex items-center justify-center">Loading session...</div>;
  if (!token) return <ErrorBoundary><LandingPage /></ErrorBoundary>;
  return <Navigate to="/home" replace />;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div className="text-slate-400 text-sm p-8 bg-slate-950 min-h-screen flex items-center justify-center">Loading session...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <Layout><ErrorBoundary>{children}</ErrorBoundary></Layout>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <EventProvider>
            <BrowserRouter>
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify" element={<VerifyReceipt />} />
              
              {/* MAIN REORGANIZED COMMITTEE PORTAL */}
              <Route path="/home" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
              <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
              <Route path="/dashboard" element={<Navigate to="/home" replace />} />
              
              <Route path="/festival-management" element={<ProtectedRoute><FestivalManagement /></ProtectedRoute>} />
              
              <Route path="/donations" element={<ProtectedRoute><Donations /></ProtectedRoute>} />
              <Route path="/receipts" element={<Navigate to="/donations" replace />} />
              <Route path="/donors" element={<Navigate to="/donations?tab=donors" replace />} />
              
              <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />

              {/* ADMINISTRATION SECTION */}
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/audit" element={<Navigate to="/reports?tab=audit" replace />} />
              
              <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
              <Route path="/committee" element={<Navigate to="/team" replace />} />
              
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/templates" element={<Navigate to="/settings" replace />} />
              <Route path="/categories" element={<Navigate to="/settings" replace />} />
              
              <Route path="/backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
              
              {/* Catchall */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </EventProvider>
      </AuthProvider>
    </LanguageProvider>
  </ErrorBoundary>
  );
}
