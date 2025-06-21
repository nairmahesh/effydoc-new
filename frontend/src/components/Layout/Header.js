import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="hidden sm:block ml-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
          </button>

          {/* User menu */}
          <div className="relative group">
            <button className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="hidden sm:block text-left">
                <div className="font-medium text-gray-900">{user?.full_name}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Your Profile
              </a>
              <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Settings
              </a>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;