import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RFPBuilder from './pages/RFPBuilder';
import Profile from './pages/Profile';
import { PlusIcon, CloudArrowUpIcon, VideoCameraIcon, FingerPrintIcon, EyeIcon } from '@heroicons/react/24/outline';
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

const CreateDocument = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Document</h1>
          <p className="mt-2 text-gray-600">Choose how you want to create your document</p>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start from Scratch */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-indigo-200">
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <PlusIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start from Scratch</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create a new document with our rich editor and interactive elements
            </p>
            <button 
              onClick={() => navigate('/rfp-builder')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Document
            </button>
          </div>
        </div>

        {/* Upload Document */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-indigo-200">
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <CloudArrowUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Document</h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload PDF, DOCX, or TXT files and make them interactive
            </p>
            <button 
              onClick={() => navigate('/documents/upload')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What you can do with documents:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <VideoCameraIcon className="h-6 w-6 text-indigo-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Add Multimedia</h4>
                <p className="text-sm text-gray-500">Embed videos, audio, and images</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <FingerPrintIcon className="h-6 w-6 text-red-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">E-signatures</h4>
                <p className="text-sm text-gray-500">Add signature fields anywhere</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <EyeIcon className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Track Engagement</h4>
                <p className="text-sm text-gray-500">See who views and engages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
              <Route path="profile" element={<Profile />} />
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
