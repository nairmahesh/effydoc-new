import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RFPBuilder from './pages/RFPBuilder';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Placeholder components for other routes
const Documents = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
    <p className="mt-2 text-gray-600">Document management interface coming soon...</p>
  </div>
);

const CreateDocument = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900">Create Document</h1>
    <p className="mt-2 text-gray-600">Document editor interface coming soon...</p>
  </div>
);

const Analytics = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
    <p className="mt-2 text-gray-600">Analytics dashboard coming soon...</p>
  </div>
);

const Settings = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
    <p className="mt-2 text-gray-600">Settings interface coming soon...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="documents" element={<Documents />} />
              <Route path="create" element={<CreateDocument />} />
              <Route path="rfp-builder" element={<RFPBuilder />} />
              <Route path="shared" element={<Documents />} />
              <Route path="templates" element={<Documents />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="activity" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
