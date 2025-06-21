import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import {
  UserCircleIcon,
  EnvelopeIcon,
  BellIcon,
  CogIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [emailConnections, setEmailConnections] = useState([]);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    organization: user?.organization || '',
    avatar_url: user?.avatar_url || '',
  });

  // Email connection form state
  const [emailForm, setEmailForm] = useState({
    provider: 'gmail',
    email_address: '',
    display_name: '',
    is_primary: false,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    document_shared: true,
    document_viewed: true,
    comment_added: true,
    mention_in_comment: true,
  });

  // Email signature state
  const [emailSignature, setEmailSignature] = useState('');

  useEffect(() => {
    loadEmailConnections();
    loadNotificationSettings();
    loadEmailSignature();
  }, []);

  const loadEmailConnections = async () => {
    try {
      const response = await authAPI.getEmailConnections();
      setEmailConnections(response.data);
    } catch (error) {
      console.error('Error loading email connections:', error);
    }
  };

  const loadNotificationSettings = () => {
    if (user?.notification_settings) {
      setNotificationSettings(user.notification_settings);
    }
  };

  const loadEmailSignature = () => {
    if (user?.email_signature) {
      setEmailSignature(user.email_signature);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(profileForm);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailConnectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.addEmailConnection(emailForm);
      setEmailConnections([...emailConnections, response.data]);
      setEmailForm({
        provider: 'gmail',
        email_address: '',
        display_name: '',
        is_primary: false,
      });
      setShowEmailForm(false);
      toast.success('Email connection added successfully!');
    } catch (error) {
      console.error('Error adding email connection:', error);
      toast.error('Failed to add email connection');
    } finally {
      setLoading(false);
    }
  };

  const removeEmailConnection = async (connectionId) => {
    try {
      await authAPI.removeEmailConnection(connectionId);
      setEmailConnections(emailConnections.filter(conn => conn.id !== connectionId));
      toast.success('Email connection removed successfully!');
    } catch (error) {
      console.error('Error removing email connection:', error);
      toast.error('Failed to remove email connection');
    }
  };

  const setPrimaryEmailConnection = async (connectionId) => {
    try {
      await authAPI.setPrimaryEmail(connectionId);
      setEmailConnections(
        emailConnections.map(conn => ({
          ...conn,
          is_primary: conn.id === connectionId,
        }))
      );
      toast.success('Primary email updated successfully!');
    } catch (error) {
      console.error('Error setting primary email:', error);
      toast.error('Failed to update primary email');
    }
  };

  const updateNotificationSettings = async (newSettings) => {
    try {
      await authAPI.api.put('/users/me/notification-settings', newSettings);
      setNotificationSettings(newSettings);
      toast.success('Notification settings updated successfully!');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const updateEmailSignature = async () => {
    try {
      await authAPI.api.put('/users/me/email-signature', { signature: emailSignature });
      toast.success('Email signature updated successfully!');
    } catch (error) {
      console.error('Error updating email signature:', error);
      toast.error('Failed to update email signature');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'email', name: 'Email Integration', icon: EnvelopeIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon },
  ];

  const emailProviders = [
    { value: 'gmail', label: 'Gmail', color: 'bg-red-500' },
    { value: 'outlook', label: 'Outlook', color: 'bg-blue-500' },
    { value: 'yahoo', label: 'Yahoo', color: 'bg-purple-500' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-600">
            Manage your account settings, email integrations, and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon
                  className={`mr-3 h-5 w-5 ${
                    activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization</label>
                    <input
                      type="text"
                      value={profileForm.organization}
                      onChange={(e) => setProfileForm({...profileForm, organization: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
                    <input
                      type="url"
                      value={profileForm.avatar_url}
                      onChange={(e) => setProfileForm({...profileForm, avatar_url: e.target.value})}
                      placeholder="https://example.com/avatar.jpg"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm capitalize"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Email Integration Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Email Connections</h3>
                    <p className="text-sm text-gray-600">Connect your email accounts to send documents directly</p>
                  </div>
                  <button
                    onClick={() => setShowEmailForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Email
                  </button>
                </div>

                {/* Email Connections List */}
                <div className="space-y-4">
                  {emailConnections.length > 0 ? (
                    emailConnections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            emailProviders.find(p => p.value === connection.provider)?.color || 'bg-gray-500'
                          }`}></div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{connection.display_name}</span>
                              {connection.is_primary && (
                                <StarIconSolid className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{connection.email_address}</span>
                            <span className="text-xs text-gray-400 capitalize">{connection.provider}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!connection.is_primary && (
                            <button
                              onClick={() => setPrimaryEmailConnection(connection.id)}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Set as primary"
                            >
                              <StarIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeEmailConnection(connection.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove connection"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <EnvelopeIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p>No email connections yet. Add your first email account to get started.</p>
                    </div>
                  )}
                </div>

                {/* Add Email Form */}
                {showEmailForm && (
                  <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Add Email Connection</h4>
                      <button
                        onClick={() => setShowEmailForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleEmailConnectionSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Provider</label>
                          <select
                            value={emailForm.provider}
                            onChange={(e) => setEmailForm({...emailForm, provider: e.target.value})}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            {emailProviders.map(provider => (
                              <option key={provider.value} value={provider.value}>
                                {provider.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email Address</label>
                          <input
                            type="email"
                            value={emailForm.email_address}
                            onChange={(e) => setEmailForm({...emailForm, email_address: e.target.value})}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Display Name</label>
                          <input
                            type="text"
                            value={emailForm.display_name}
                            onChange={(e) => setEmailForm({...emailForm, display_name: e.target.value})}
                            placeholder="Auto-filled from email"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            id="is_primary"
                            type="checkbox"
                            checked={emailForm.is_primary}
                            onChange={(e) => setEmailForm({...emailForm, is_primary: e.target.checked})}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-900">
                            Set as primary email
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowEmailForm(false)}
                          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {loading ? 'Adding...' : 'Add Email'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Email Signature */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Signature</h3>
                <div className="space-y-4">
                  <textarea
                    value={emailSignature}
                    onChange={(e) => setEmailSignature(e.target.value)}
                    rows={6}
                    placeholder="Enter your email signature here..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={updateEmailSignature}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Update Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
              
              <div className="space-y-6">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {key === 'email_notifications' && 'Receive email notifications for important updates'}
                        {key === 'document_shared' && 'Get notified when someone shares a document with you'}
                        {key === 'document_viewed' && 'Get notified when someone views your shared documents'}
                        {key === 'comment_added' && 'Get notified when someone comments on your documents'}
                        {key === 'mention_in_comment' && 'Get notified when someone mentions you in a comment'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => {
                          const newSettings = { ...notificationSettings, [key]: e.target.checked };
                          setNotificationSettings(newSettings);
                          updateNotificationSettings(newSettings);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Account Settings</h3>
              
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Account Created:</span>
                      <span className="ml-2 text-gray-900">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Login:</span>
                      <span className="ml-2 text-gray-900">
                        {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Data & Privacy</h4>
                  <div className="space-y-2">
                    <button className="text-sm text-indigo-600 hover:text-indigo-800">
                      Download your data
                    </button>
                    <br />
                    <button className="text-sm text-indigo-600 hover:text-indigo-800">
                      Privacy settings
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-red-900 mb-4">Danger Zone</h4>
                  <button className="px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100">
                    Delete Account
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    This action cannot be undone. This will permanently delete your account and all associated data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;