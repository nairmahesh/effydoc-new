import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">EffyLoyalty</h1>
          <p className="text-white/70">Employee Recognition Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="text-red-300 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Demo: admin@company.com / password
          </p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [showGivePoints, setShowGivePoints] = useState(false);
  const [showEmployeeProfile, setShowEmployeeProfile] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState(null);
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsReason, setPointsReason] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, badgesRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/users/badges`)
      ]);

      setStats(statsRes.data);
      setBadges(badgesRes.data);

      // Fetch team members if user is a manager
      if (user.role === 'manager' || user.role === 'company_admin') {
        const teamRes = await axios.get(`${API}/users/team`);
        setTeamMembers(teamRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchEmployeeProfile = async (employeeId) => {
    try {
      const response = await axios.get(`${API}/users/${employeeId}/profile`);
      setSelectedEmployeeProfile(response.data);
      setShowEmployeeProfile(true);
    } catch (error) {
      console.error('Failed to fetch employee profile:', error);
      alert('Failed to load employee profile');
    }
  };

  const handleEmployeeClick = (employee) => {
    fetchEmployeeProfile(employee.id);
  };

  const handleGivePoints = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/points/give`, {
        to_user_id: selectedEmployee,
        amount: parseInt(pointsAmount),
        reason: pointsReason
      });

      // Reset form and refresh data
      setSelectedEmployee('');
      setPointsAmount('');
      setPointsReason('');
      setShowGivePoints(false);
      fetchDashboardData();
      
      alert('Points awarded successfully!');
    } catch (error) {
      console.error('Failed to give points:', error);
      alert('Failed to award points. Please try again.');
    }
  };

  const getRoleDisplay = (role) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">EffyLoyalty</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{getRoleDisplay(user.role)}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Points Balance</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.point_balance}</p>
              </div>
            </div>
          </div>

          {(user.role === 'manager' || user.role === 'company_admin') && (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 rounded"></div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Points to Give</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.point_cap}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Badges Earned</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.badges_count}</p>
              </div>
            </div>
          </div>

          {(user.role === 'manager' || user.role === 'company_admin') && (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <div className="w-6 h-6 bg-purple-500 rounded"></div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Team Size</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.team_size}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Badges Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Badges</h2>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {badges.map((userBadge, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl mb-2">{userBadge.badge.icon}</div>
                    <h3 className="font-semibold text-gray-900">{userBadge.badge.name}</h3>
                    <p className="text-sm text-gray-600">{userBadge.badge.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Earned {new Date(userBadge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No badges earned yet. Keep up the great work!</p>
            )}
          </div>

          {/* Team Members / Recent Transactions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            {(user.role === 'manager' || user.role === 'company_admin') ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                  <button
                    onClick={() => setShowGivePoints(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Give Points
                  </button>
                </div>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <button
                          onClick={() => handleEmployeeClick(member)}
                          className="text-left w-full hover:text-blue-600 transition-colors"
                        >
                          <h3 className="font-medium text-gray-900 hover:text-blue-600">{member.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{getRoleDisplay(member.role)}</span>
                            {member.department && (
                              <>
                                <span>•</span>
                                <span>{member.department}</span>
                              </>
                            )}
                          </div>
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{member.point_balance} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {stats.recent_transactions.map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.from_user_id === user.id ? 'Gave' : 'Received'} {transaction.amount} points
                        </p>
                        <p className="text-sm text-gray-600">{transaction.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Give Points Modal */}
      {showGivePoints && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Give Points</h2>
            <form onSubmit={handleGivePoints} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an employee...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Amount
                </label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter points amount"
                  min="1"
                  max={stats.point_cap}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Available: {stats.point_cap} points</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Why are you giving these points?"
                  rows="3"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGivePoints(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Give Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee 360-Degree Profile Modal */}
      {showEmployeeProfile && selectedEmployeeProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedEmployeeProfile.employee.name}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span>{getRoleDisplay(selectedEmployeeProfile.employee.role)}</span>
                  {selectedEmployeeProfile.employee.department && (
                    <>
                      <span>•</span>
                      <span>{selectedEmployeeProfile.employee.department}</span>
                    </>
                  )}
                  {selectedEmployeeProfile.manager && (
                    <>
                      <span>•</span>
                      <span>Reports to: {selectedEmployeeProfile.manager.name}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowEmployeeProfile(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4">
                  <div className="text-2xl font-bold">{selectedEmployeeProfile.statistics.current_balance}</div>
                  <div className="text-blue-100">Current Points</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4">
                  <div className="text-2xl font-bold">{selectedEmployeeProfile.statistics.total_points_received}</div>
                  <div className="text-green-100">Total Points Earned</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-4">
                  <div className="text-2xl font-bold">{selectedEmployeeProfile.statistics.badges_earned}</div>
                  <div className="text-yellow-100">Badges Earned</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4">
                  <div className="text-2xl font-bold">{selectedEmployeeProfile.statistics.recognition_count}</div>
                  <div className="text-purple-100">Times Recognized</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Recognition */}
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Recognition</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {selectedEmployeeProfile.recent_recognition.map((recognition, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              +{recognition.amount} points from {recognition.from_user_name}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{recognition.reason}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(recognition.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {getRoleDisplay(recognition.from_user_role)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedEmployeeProfile.recent_recognition.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No recognition yet</p>
                    )}
                  </div>
                </div>

                {/* Badges Earned */}
                <div className="bg-white border rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Badges Earned</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {selectedEmployeeProfile.badges.map((userBadge, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-3xl">{userBadge.badge.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{userBadge.badge.name}</h4>
                          <p className="text-sm text-gray-600">{userBadge.badge.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Earned {formatDate(userBadge.earned_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {selectedEmployeeProfile.badges.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No badges earned yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recognition Breakdown */}
              <div className="mt-8 bg-white border rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recognition Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* By Reason */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">By Reason</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedEmployeeProfile.statistics.recognition_reasons).map(([reason, data]) => (
                        <div key={reason} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700 truncate">{reason}</span>
                          <div className="text-right">
                            <span className="text-sm font-medium text-blue-600">{data.total_points} pts</span>
                            <span className="text-xs text-gray-500 ml-2">({data.count}x)</span>
                          </div>
                        </div>
                      ))}
                      {Object.keys(selectedEmployeeProfile.statistics.recognition_reasons).length === 0 && (
                        <p className="text-gray-500 text-center py-4">No recognition data available</p>
                      )}
                    </div>
                  </div>

                  {/* By Month */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Points by Month</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedEmployeeProfile.statistics.points_by_month)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .slice(0, 6)
                        .map(([month, points]) => (
                        <div key={month} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{month}</span>
                          <span className="text-sm font-medium text-green-600">{points} pts</span>
                        </div>
                      ))}
                      {Object.keys(selectedEmployeeProfile.statistics.points_by_month).length === 0 && (
                        <p className="text-gray-500 text-center py-4">No points data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Recognition History */}
              <div className="mt-8 bg-white border rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Recognition History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">From</th>
                        <th className="text-left py-2">Points</th>
                        <th className="text-left py-2">Reason</th>
                        <th className="text-left py-2">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployeeProfile.point_transactions.map((transaction, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2">{formatDate(transaction.created_at)}</td>
                          <td className="py-2">{transaction.from_user_name}</td>
                          <td className="py-2">
                            <span className="text-green-600 font-medium">+{transaction.amount}</span>
                          </td>
                          <td className="py-2 max-w-xs truncate">{transaction.reason}</td>
                          <td className="py-2">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {transaction.transaction_type.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {selectedEmployeeProfile.point_transactions.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-gray-500">
                            No recognition history available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
};

export default App;