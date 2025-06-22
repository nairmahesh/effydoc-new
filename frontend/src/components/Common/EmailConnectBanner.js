import React, { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const EmailConnectBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is new (registered recently) and hasn't dismissed the banner
    const checkIfShouldShow = () => {
      if (!user) return false;
      
      // Check if banner was dismissed
      const dismissed = localStorage.getItem('effydoc-email-banner-dismissed');
      if (dismissed) return false;
      
      // Check if user registered recently (within last 7 days)
      const userCreated = new Date(user.created_at);
      const daysSinceCreation = (Date.now() - userCreated.getTime()) / (1000 * 60 * 60 * 24);
      
      // Show to users who registered within last 7 days
      return daysSinceCreation <= 7;
    };

    if (checkIfShouldShow()) {
      // Show banner after a delay
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 2000);
    }
  }, [user]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('effydoc-email-banner-dismissed', 'true');
    }, 300);
  };

  const handleConnectEmail = () => {
    // Navigate to email integration in profile
    window.location.href = '/profile?tab=email';
  };

  const handleOutlookIntegration = () => {
    // Navigate to Outlook integration page
    window.location.href = '/integrations.html';
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
      isAnimating ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="notification-banner px-4 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <EnvelopeIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="text-white font-semibold text-lg">
                  🚀 Supercharge your workflow with email integration!
                </h4>
                <p className="text-blue-100 text-sm mt-1">
                  Connect your email and access effyDOC directly from Outlook for seamless document sharing and tracking.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 ml-6">
              <button
                onClick={handleConnectEmail}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <EnvelopeIcon className="h-4 w-4" />
                <span>Connect Email</span>
              </button>
              
              <button
                onClick={handleOutlookIntegration}
                className="bg-indigo-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-900 transition-colors flex items-center space-x-2"
              >
                <ComputerDesktopIcon className="h-4 w-4" />
                <span>Get Outlook Plugin</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="text-white hover:text-gray-200 transition-colors p-1"
                aria-label="Dismiss notification"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConnectBanner;