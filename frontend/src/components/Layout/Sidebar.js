import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  DocumentTextIcon,
  PlusIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  SparklesIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  UserCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'My Documents', href: '/documents', icon: DocumentTextIcon },
    { name: 'Create Document', href: '/create', icon: PlusIcon },
    { name: 'AI RFP Builder', href: '/rfp-builder', icon: SparklesIcon },
    { name: 'Shared with Me', href: '/shared', icon: UserGroupIcon },
    { name: 'Templates', href: '/templates', icon: DocumentDuplicateIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Activity', href: '/activity', icon: EyeIcon },
    { name: 'Outlook Integration', href: '/integrations.html', icon: EnvelopeIcon, external: true },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href;
    
    return (
      <NavLink
        to={item.href}
        onClick={onClose}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-indigo-100 text-indigo-900 border-r-2 border-indigo-500'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <item.icon
          className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
            isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
          }`}
        />
        {item.name}
      </NavLink>
    );
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-indigo-600">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-white mr-2" />
            <span className="text-xl font-bold text-white">effyDOC</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            effyDOC Platform v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;