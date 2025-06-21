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
          <h1 className="text-3xl font-bold text-white mb-2">effyLoyalty</h1>
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
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showManageRewards, setShowManageRewards] = useState(false);
  const [showManageTeams, setShowManageTeams] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPoints, setTaskPoints] = useState('');
  const [taskAssignees, setTaskAssignees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);

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
    setActiveTab('overview'); // Reset to overview tab when opening new profile
    fetchEmployeeProfile(employee.id);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tasks`, {
        title: taskTitle,
        description: taskDescription,
        points_reward: parseInt(taskPoints),
        assignees: taskAssignees
      });

      // Reset form and refresh data
      setTaskTitle('');
      setTaskDescription('');
      setTaskPoints('');
      setTaskAssignees([]);
      setShowCreateTask(false);
      fetchDashboardData();
      
      alert('Task created successfully!');
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
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
              <h1 className="text-2xl font-bold text-gray-900">effyLoyalty</h1>
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
                {badges.slice(0, 4).map((userBadge, index) => (
                  <div key={index} className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all">
                    <div className="text-2xl mb-2">{userBadge.badge.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-sm">{userBadge.badge.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{userBadge.badge.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(userBadge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-gray-500">No badges earned yet. Keep up the great work!</p>
              </div>
            )}
            {badges.length > 4 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all {badges.length} badges →
                </button>
              </div>
            )}
          </div>

          {/* Manager Dashboard */}
          {(user.role === 'manager' || user.role === 'company_admin') ? (
            <div className="space-y-6">
              {/* Manager Action Cards */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Quick Recognition</h3>
                      <p className="text-blue-100 text-sm mt-1">Instantly reward great work</p>
                    </div>
                    <span className="text-3xl">⚡</span>
                  </div>
                  <button
                    onClick={() => setShowGivePoints(true)}
                    className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    Give Points Now
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="text-center">
                      <span className="text-2xl block mb-2">🎯</span>
                      <h3 className="font-semibold">Task Management</h3>
                      <p className="text-purple-100 text-xs mt-1">Create challenges</p>
                      <button
                        onClick={() => setShowCreateTask(true)}
                        className="mt-3 bg-white text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
                      >
                        Create Task
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div className="text-center">
                      <span className="text-2xl block mb-2">📊</span>
                      <h3 className="font-semibold">Team Analytics</h3>
                      <p className="text-green-100 text-xs mt-1">Track performance</p>
                      <button
                        onClick={() => setShowManageRewards(true)}
                        className="mt-3 bg-white text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                      >
                        View Analytics
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Employee Recent Activity */
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {stats.recent_transactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.from_user_id === user.id ? 'Gave' : 'Received'} {transaction.amount} points
                      </p>
                      <p className="text-sm text-gray-600">{transaction.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.recent_transactions.length === 0 && (
                  <div className="text-center py-6">
                    <span className="text-2xl block mb-2">📋</span>
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team Members Section - Full Width */}
        {(user.role === 'manager' || user.role === 'company_admin') && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowManageTeams(true)}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center space-x-2"
                >
                  <span>👥</span>
                  <span>Manage Teams</span>
                </button>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>Create Task</span>
                </button>
                <button
                  onClick={() => setShowGivePoints(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <span>✨</span>
                  <span>Give Points</span>
                </button>
              </div>
            </div>
                
            {/* Enhanced Team Members Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                  </div>
                  {teamMembers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm tracking-wide">EMPLOYEE</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm tracking-wide">DEPARTMENT</th>
                            <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm tracking-wide">POINTS</th>
                            <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm tracking-wide">PERFORMANCE</th>
                            <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm tracking-wide">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map((member, index) => (
                            <tr 
                              key={member.id} 
                              className={`border-b border-gray-100 hover:bg-blue-50 transition-all duration-200 cursor-pointer ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                              }`}
                              onClick={() => handleEmployeeClick(member)}
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                                    <span className="text-white text-sm font-semibold">
                                      {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                      {member.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {getRoleDisplay(member.role)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center">
                                  {member.department ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                      {member.department}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">No department</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                    <span className="text-green-600 mr-1">💎</span>
                                    {member.point_balance}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center">
                                  {member.point_balance >= 100 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <span className="mr-1">🔥</span>
                                      Excellent
                                    </span>
                                  ) : member.point_balance >= 50 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <span className="mr-1">⭐</span>
                                      Good
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      <span className="mr-1">📈</span>
                                      Growing
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEmployee(member.id);
                                      setShowGivePoints(true);
                                    }}
                                    className="inline-flex items-center px-2 py-1 border border-blue-300 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                  >
                                    <span className="mr-1">✨</span>
                                    Reward
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEmployeeClick(member);
                                    }}
                                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                  >
                                    <span className="mr-1">👁️</span>
                                    View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">👥</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No team members</h3>
                      <p className="text-gray-500">Add team members to start giving recognition.</p>
                    </div>
                  )}
                </div>

                {/* Team Stats */}
                {teamMembers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <span className="text-blue-600 text-lg">👥</span>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">{teamMembers.length}</div>
                          <div className="text-sm text-gray-500">Team Members</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <span className="text-green-600 text-lg">💎</span>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {teamMembers.reduce((sum, member) => sum + member.point_balance, 0)}
                          </div>
                          <div className="text-sm text-gray-500">Total Points</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                          <span className="text-purple-600 text-lg">⭐</span>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {Math.round(teamMembers.reduce((sum, member) => sum + member.point_balance, 0) / teamMembers.length) || 0}
                          </div>
                          <div className="text-sm text-gray-500">Avg Points</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg mr-3">
                          <span className="text-orange-600 text-lg">🏆</span>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {teamMembers.filter(m => m.point_balance >= 100).length}
                          </div>
                          <div className="text-sm text-gray-500">Top Performers</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Give Points Modal */}
        {showGivePoints && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Give Points</h2>
                <button
                  type="button"
                  onClick={() => setShowGivePoints(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>
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

      {/* Employee 360-Degree Profile Side Panel */}
      {showEmployeeProfile && selectedEmployeeProfile && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={() => setShowEmployeeProfile(false)}
          ></div>
          
          {/* Side Panel */}
          <div className="fixed top-0 right-0 h-full w-full md:w-4/5 lg:w-3/5 xl:w-1/2 bg-white z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
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
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Statistics Cards - Always Visible */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4">
                  <div className="text-xl font-bold">{selectedEmployeeProfile.statistics.current_balance}</div>
                  <div className="text-blue-100 text-sm">Current Points</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4">
                  <div className="text-xl font-bold">{selectedEmployeeProfile.statistics.total_points_received}</div>
                  <div className="text-green-100 text-sm">Total Earned</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-4">
                  <div className="text-xl font-bold">{selectedEmployeeProfile.statistics.badges_earned}</div>
                  <div className="text-yellow-100 text-sm">Badges</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4">
                  <div className="text-xl font-bold">{selectedEmployeeProfile.statistics.recognition_count}</div>
                  <div className="text-purple-100 text-sm">Recognition</div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: '📊' },
                    { id: 'badges', label: 'Badges', icon: '🏆' },
                    { id: 'analytics', label: 'Analytics', icon: '📈' },
                    { id: 'history', label: 'History', icon: '📋' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="min-h-96">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Recent Recognition */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Recognition</h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {selectedEmployeeProfile.recent_recognition.slice(0, 5).map((recognition, index) => (
                          <div key={index} className="bg-white border-l-4 border-blue-500 rounded-r-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  +{recognition.amount} points
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{recognition.reason}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-gray-500">
                                    From {recognition.from_user_name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDateTime(recognition.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedEmployeeProfile.recent_recognition.length === 0 && (
                          <p className="text-gray-500 text-center py-8">No recognition yet</p>
                        )}
                      </div>
                    </div>

                    {/* Latest Badges */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Latest Badges</h3>
                      <div className="space-y-3">
                        {selectedEmployeeProfile.badges.slice(0, 3).map((userBadge, index) => (
                          <div key={index} className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl">{userBadge.badge.icon}</div>
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
                )}

                {/* Badges Tab */}
                {activeTab === 'badges' && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">All Badges Earned</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedEmployeeProfile.badges.map((userBadge, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm">
                          <div className="text-2xl">{userBadge.badge.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{userBadge.badge.name}</h4>
                            <p className="text-sm text-gray-600">{userBadge.badge.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Earned {formatDate(userBadge.earned_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {userBadge.badge.badge_type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                      {selectedEmployeeProfile.badges.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No badges earned yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    {/* Recognition Analytics */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Recognition Analytics</h3>
                      <div className="space-y-4">
                        {/* By Reason */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Top Recognition Reasons</h4>
                          <div className="space-y-2">
                            {Object.entries(selectedEmployeeProfile.statistics.recognition_reasons)
                              .sort(([,a], [,b]) => b.total_points - a.total_points)
                              .slice(0, 5)
                              .map(([reason, data]) => (
                              <div key={reason} className="flex justify-between items-center p-3 bg-white rounded-lg">
                                <span className="text-sm text-gray-700 truncate flex-1 mr-2">{reason}</span>
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
                          <h4 className="font-semibold text-gray-700 mb-2">Points by Month</h4>
                          <div className="space-y-2">
                            {Object.entries(selectedEmployeeProfile.statistics.points_by_month)
                              .sort(([a], [b]) => b.localeCompare(a))
                              .slice(0, 6)
                              .map(([month, points]) => (
                              <div key={month} className="flex justify-between items-center p-3 bg-white rounded-lg">
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
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Complete Recognition History</h3>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
                      <div className="max-h-96 overflow-y-auto">
                        {selectedEmployeeProfile.point_transactions.length > 0 ? (
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm tracking-wide">DATE</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm tracking-wide">FROM</th>
                                <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm tracking-wide">POINTS</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm tracking-wide">REASON</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedEmployeeProfile.point_transactions.map((transaction, index) => (
                                <tr 
                                  key={index} 
                                  className={`border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                  }`}
                                >
                                  <td className="py-4 px-6">
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {formatDate(transaction.created_at)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white text-xs font-semibold">
                                          {transaction.from_user_name.charAt(0)}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {transaction.from_user_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {getRoleDisplay(transaction.from_user_role)}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                      <span className="text-green-600 mr-1">+</span>
                                      {transaction.amount}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="max-w-xs">
                                      <p className="text-sm text-gray-900 leading-relaxed" title={transaction.reason}>
                                        {transaction.reason}
                                      </p>
                                      <div className="mt-1">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                                          {transaction.transaction_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-2xl">📋</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No recognition history</h3>
                            <p className="text-gray-500">This employee hasn't received any recognition yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Summary Stats */}
                    {selectedEmployeeProfile.point_transactions.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {selectedEmployeeProfile.point_transactions.length}
                            </div>
                            <div className="text-sm text-gray-500">Total Records</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {Math.round(selectedEmployeeProfile.statistics.total_points_received / selectedEmployeeProfile.point_transactions.length) || 0}
                            </div>
                            <div className="text-sm text-gray-500">Avg Points</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {Math.max(...selectedEmployeeProfile.point_transactions.map(t => t.amount)) || 0}
                            </div>
                            <div className="text-sm text-gray-500">Highest Award</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-6">
              {/* Task Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Reward *
                  </label>
                  <input
                    type="number"
                    value={taskPoints}
                    onChange={(e) => setTaskPoints(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Points to award"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe what needs to be done..."
                  rows="3"
                  required
                />
              </div>

              {/* Assignment Section */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assign To *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Individual Assignment */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">👤</span>
                      Individual Assignment
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <label key={member.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={taskAssignees.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTaskAssignees([...taskAssignees, member.id]);
                              } else {
                                setTaskAssignees(taskAssignees.filter(id => id !== member.id));
                              }
                            }}
                            className="mr-2 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{member.name}</span>
                          <span className="ml-auto text-xs text-gray-500">
                            {member.department || 'No dept'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Team Assignment */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">👥</span>
                      Team Assignment
                    </h4>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = teamMembers.map(m => m.id);
                          setTaskAssignees(allIds);
                        }}
                        className="w-full text-left p-2 bg-blue-50 text-blue-700 rounded border hover:bg-blue-100 transition-colors"
                      >
                        <span className="font-medium">📋 Assign to All Team Members</span>
                        <p className="text-xs text-blue-600 mt-1">Select entire team</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const deptMembers = teamMembers
                            .filter(m => m.department)
                            .reduce((groups, member) => {
                              const dept = member.department;
                              groups[dept] = groups[dept] || [];
                              groups[dept].push(member.id);
                              return groups;
                            }, {});
                          
                          // For demo, assign to Engineering department
                          const engIds = deptMembers['Engineering'] || [];
                          setTaskAssignees(engIds);
                        }}
                        className="w-full text-left p-2 bg-green-50 text-green-700 rounded border hover:bg-green-100 transition-colors"
                      >
                        <span className="font-medium">🏢 Engineering Team</span>
                        <p className="text-xs text-green-600 mt-1">Department-based assignment</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const topPerformers = teamMembers
                            .filter(m => m.point_balance >= 50)
                            .map(m => m.id);
                          setTaskAssignees(topPerformers);
                        }}
                        className="w-full text-left p-2 bg-yellow-50 text-yellow-700 rounded border hover:bg-yellow-100 transition-colors"
                      >
                        <span className="font-medium">⭐ Top Performers</span>
                        <p className="text-xs text-yellow-600 mt-1">High-achieving employees</p>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selected Assignees Display */}
                {taskAssignees.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Selected Assignees ({taskAssignees.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {taskAssignees.map(assigneeId => {
                        const member = teamMembers.find(m => m.id === assigneeId);
                        return member ? (
                          <span key={assigneeId} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {member.name}
                            <button
                              type="button"
                              onClick={() => setTaskAssignees(taskAssignees.filter(id => id !== assigneeId))}
                              className="ml-1 text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2 mt-0.5">💡</span>
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Task Assignment Tips:</p>
                    <ul className="text-xs text-purple-600 mt-1 space-y-1">
                      <li>• Individual tasks focus on specific skills</li>
                      <li>• Team assignments encourage collaboration</li>
                      <li>• Point rewards motivate completion</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTask(false);
                    setTaskAssignees([]);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskAssignees.length === 0}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task ({taskAssignees.length} assignees)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Rewards Modal */}
      {showManageRewards && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Manage Rewards & Recognition</h2>
              <button
                onClick={() => setShowManageRewards(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Recognition Programs */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">🎯 Recognition Programs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900">Employee of the Month</h4>
                    <p className="text-sm text-blue-700 mt-1">Special recognition program</p>
                    <button className="mt-2 text-blue-600 text-sm hover:underline">Configure →</button>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-900">Team Achievement</h4>
                    <p className="text-sm text-green-700 mt-1">Group milestone rewards</p>
                    <button className="mt-2 text-green-600 text-sm hover:underline">Configure →</button>
                  </div>
                </div>
              </div>

              {/* Milestone Rewards */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">🏆 Milestone Rewards</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">100 Points Milestone</span>
                      <p className="text-sm text-gray-600">Special badge + bonus recognition</p>
                    </div>
                    <span className="text-green-600 font-semibold">Active</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">500 Points Milestone</span>
                      <p className="text-sm text-gray-600">Elite status + premium rewards</p>
                    </div>
                    <span className="text-green-600 font-semibold">Active</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">⚡ Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                    <span className="block font-medium">Bulk Recognition</span>
                    <span className="text-sm">Reward entire team</span>
                  </button>
                  <button className="p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">
                    <span className="block font-medium">Custom Badge</span>
                    <span className="text-sm">Create special badge</span>
                  </button>
                  <button className="p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                    <span className="block font-medium">Performance Review</span>
                    <span className="text-sm">Schedule review cycle</span>
                  </button>
                  <button className="p-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                    <span className="block font-medium">Team Challenge</span>
                    <span className="text-sm">Create group goal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
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