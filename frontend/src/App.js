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
import DocumentUpload from './pages/DocumentUpload';
import DocumentEditor from './pages/DocumentEditor';
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
  
  const createNewDocument = async (type) => {
    try {
      // Create a new document with proper structure
      const documentData = {
        title: type === 'proposal' ? 'New Proposal' : type === 'contract' ? 'New Contract' : 'New Document',
        type: type,
        organization: 'Default Organization', // This will be replaced with actual user org
        sections: [
          {
            id: '1',
            title: 'Introduction',
            content: 'Start writing your content here...',
            order: 1,
            multimedia_elements: [],
            interactive_elements: []
          }
        ],
        collaborators: [],
        tags: [type, 'effydoc'],
        metadata: {
          created_with: 'effyDOC Platform',
          document_type: type
        }
      };

      const response = await documentsAPI.create(documentData);
      navigate(`/documents/${response.data.id}/edit`);
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document. Please try again.');
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Document</h1>
          <p className="mt-2 text-gray-600">Choose how you want to create your trackable, interactive document</p>
        </div>
      </div>

      {/* Document Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Business Proposal */}
        <div 
          onClick={() => createNewDocument('proposal')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-indigo-300 group"
        >
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
              <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Business Proposal</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create professional proposals with rich media, CTAs, and tracking
            </p>
            <div className="text-left space-y-1 text-xs text-gray-600">
              <div className="flex items-center">
                <VideoCameraIcon className="h-3 w-3 mr-1 text-blue-500" />
                <span>Video embeddings</span>
              </div>
              <div className="flex items-center">
                <FingerPrintIcon className="h-3 w-3 mr-1 text-red-500" />
                <span>E-signature fields</span>
              </div>
              <div className="flex items-center">
                <EyeIcon className="h-3 w-3 mr-1 text-purple-500" />
                <span>View tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract/Agreement */}
        <div 
          onClick={() => createNewDocument('contract')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-green-300 group"
        >
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <FingerPrintIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Contract/Agreement</h3>
            <p className="text-sm text-gray-500 mb-4">
              Legal documents with signature collection and compliance tracking
            </p>
            <div className="text-left space-y-1 text-xs text-gray-600">
              <div className="flex items-center">
                <FingerPrintIcon className="h-3 w-3 mr-1 text-red-500" />
                <span>Multiple signatures</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1 text-orange-500" />
                <span>Time tracking</span>
              </div>
              <div className="flex items-center">
                <EyeIcon className="h-3 w-3 mr-1 text-purple-500" />
                <span>Compliance analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Powered RFP */}
        <div 
          onClick={() => navigate('/rfp-builder')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-300 group"
        >
          <div className="text-center">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <SparklesIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI-Powered RFP</h3>
            <p className="text-sm text-gray-500 mb-4">
              Let AI generate professional RFPs based on your requirements
            </p>
            <div className="text-left space-y-1 text-xs text-gray-600">
              <div className="flex items-center">
                <SparklesIcon className="h-3 w-3 mr-1 text-purple-500" />
                <span>AI content generation</span>
              </div>
              <div className="flex items-center">
                <DocumentTextIcon className="h-3 w-3 mr-1 text-blue-500" />
                <span>Structured sections</span>
              </div>
              <div className="flex items-center">
                <EyeIcon className="h-3 w-3 mr-1 text-purple-500" />
                <span>Performance tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Option */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Upload Existing Document</h3>
              <p className="mt-1 text-sm text-gray-500">
                Transform your PDF, DOCX, or TXT files into interactive, trackable documents
              </p>
            </div>
            <button 
              onClick={() => navigate('/documents/upload')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* effyDOC Platform Features */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 effyDOC Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start space-x-3">
              <VideoCameraIcon className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Rich Media</h4>
                <p className="text-sm text-gray-500">Drag & drop videos, audio, images</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CursorArrowRippleIcon className="h-6 w-6 text-indigo-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Interactive CTAs</h4>
                <p className="text-sm text-gray-500">Clickable buttons & forms</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <EyeIcon className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Advanced Tracking</h4>
                <p className="text-sm text-gray-500">View time, engagement analytics</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <FingerPrintIcon className="h-6 w-6 text-red-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">E-Signatures</h4>
                <p className="text-sm text-gray-500">Digital signature collection</p>
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
              <Route path="documents/upload" element={<DocumentUpload />} />
              <Route path="documents/:documentId/edit" element={<DocumentEditor />} />
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
