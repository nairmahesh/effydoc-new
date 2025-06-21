import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { documentsAPI } from '../utils/api';
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    documentsThisMonth: 0,
    totalViews: 0,
    collaborators: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await documentsAPI.list();
      const docs = response.data;
      setDocuments(docs.slice(0, 5)); // Show only recent 5

      // Calculate stats
      const now = new Date();
      const thisMonth = docs.filter(doc => {
        const docDate = new Date(doc.created_at);
        return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
      });

      setStats({
        totalDocuments: docs.length,
        documentsThisMonth: thisMonth.length,
        totalViews: Math.floor(Math.random() * 1000), // Mock data
        collaborators: Math.floor(Math.random() * 50), // Mock data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, href, icon: Icon, color }) => (
    <Link
      to={href}
      className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div>
        <span className={`rounded-lg inline-flex p-3 ${color} ring-4 ring-white`}>
          <Icon className="h-6 w-6 text-white" />
        </span>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening with your documents today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={stats.totalDocuments}
          icon={DocumentTextIcon}
          color="text-blue-600"
        />
        <StatCard
          title="This Month"
          value={stats.documentsThisMonth}
          icon={ClockIcon}
          color="text-green-600"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={EyeIcon}
          color="text-purple-600"
        />
        <StatCard
          title="Collaborators"
          value={stats.collaborators}
          icon={UsersIcon}
          color="text-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            title="Create Document"
            description="Start a new document with our rich editor"
            href="/create"
            icon={PlusIcon}
            color="bg-indigo-500"
          />
          <QuickAction
            title="AI RFP Builder"
            description="Generate professional RFPs with AI assistance"
            href="/rfp-builder"
            icon={SparklesIcon}
            color="bg-purple-500"
          />
          <QuickAction
            title="View Analytics"
            description="Track document performance and engagement"
            href="/analytics"
            icon={ChartBarIcon}
            color="bg-green-500"
          />
        </div>
      </div>

      {/* Recent Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Documents</h2>
          <Link
            to="/documents"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <li key={doc.id}>
                  <Link
                    to={`/documents/${doc.id}`}
                    className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {doc.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {doc.type} • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doc.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          doc.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          doc.status === 'viewed' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No documents yet. Create your first document to get started!</p>
                <Link
                  to="/create"
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Document
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;