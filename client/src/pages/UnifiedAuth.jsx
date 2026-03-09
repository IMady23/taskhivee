import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Users,
  Crown,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getTeamById } from '../services/teamService';
import LoadingSpinner from '../components/LoadingSpinner';
import QuantumBackground from '../components/QuantumBackground'; // Import Branding Layer

/**
 * Unified Authentication Page
 * Handles both login and signup for leaders and members with role selection
 * URL param: ?mode=login or ?mode=signup
 * Enhanced with Antigravity Theme & Split Layout
 */
export default function UnifiedAuth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signup';
  const navigate = useNavigate();
  const { login, registerLeader, registerMember, isAuthenticated, user, isInitializing } = useContext(AuthContext);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '', // 'leader' or 'member'
    teamCode: '', // Required for members
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [teamValidation, setTeamValidation] = useState({ isValid: null, teamName: '', isValidating: false });

  // Leadership Transition Params
  const isTransition = searchParams.get('transition') === 'true';
  const urlTeamName = searchParams.get('teamName');
  const urlTeamCode = searchParams.get('teamCode');

  // Pre-fill role for transition
  useEffect(() => {
    if (isTransition && !formData.role) {
      setFormData(prev => ({ ...prev, role: 'leader', teamCode: urlTeamCode || '' }));
    }
  }, [isTransition, urlTeamCode]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isInitializing) {
      const userRole = user.role?.toLowerCase();
      if (userRole === 'leader') {
        navigate('/leader/dashboard', { replace: true });
      } else if (userRole === 'member') {
        navigate('/member/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, isInitializing, navigate]);

  // Show loading if still initializing
  if (isInitializing) {
    return <LoadingSpinner fullScreen message="Loading authentication..." />;
  }

  // Validate team code when member role is selected and team code is entered
  const validateTeamCode = async (code) => {
    if (!code || formData.role !== 'member') {
      setTeamValidation({ isValid: null, teamName: '', isValidating: false });
      return;
    }

    setTeamValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const team = await getTeamById(code);
      if (team) {
        setTeamValidation({ isValid: true, teamName: team.name, isValidating: false });
        // Clear team code error if validation passes
        if (errors.teamCode) {
          setErrors(prev => ({ ...prev, teamCode: '' }));
        }
      } else {
        setTeamValidation({ isValid: false, teamName: '', isValidating: false });
      }
    } catch (error) {
      setTeamValidation({ isValid: false, teamName: '', isValidating: false });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Signup-specific validations
    if (mode === 'signup') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Team code validation for members
      if (formData.role === 'member') {
        if (!formData.teamCode) {
          newErrors.teamCode = 'Team code is required for members';
        } else if (teamValidation.isValidating) {
          newErrors.teamCode = 'Please wait for team code validation';
        } else if (teamValidation.isValid === false) {
          newErrors.teamCode = 'Invalid team code';
        } else if (teamValidation.isValid === null) {
          newErrors.teamCode = 'Please wait for team code validation';
        }
      }
    }

    // Login-specific validations for members
    if (mode === 'login' && formData.role === 'member') {
      if (!formData.teamCode) {
        newErrors.teamCode = 'Team code is required for member login';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Validate team code when it changes
    if (name === 'teamCode') {
      // Debounce team code validation
      setTimeout(() => validateTeamCode(value), 500);
    }

    // Clear team code when role changes to leader
    if (name === 'role' && value === 'leader') {
      setFormData(prev => ({ ...prev, teamCode: '' }));
      setTeamValidation({ isValid: null, teamName: '', isValidating: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password, formData.teamCode, formData.role);
        setSuccessMessage('Login successful! Redirecting...');

        // Redirect based on role from the actual user data
        setTimeout(() => {
          const userRole = result.user?.role?.toLowerCase();
          if (userRole === 'leader') {
            navigate('/leader/dashboard');
          } else if (userRole === 'member') {
            navigate('/member/dashboard');
          } else {
            // Fallback
            navigate('/');
          }
        }, 1000);
      } else {
        // Signup
        if (formData.role === 'leader') {
          await registerLeader(
            formData.name,
            formData.email,
            formData.password,
            formData.confirmPassword,
            '', // organizationName
            formData.teamCode // NEW: join team instead of creating if code provided
          );
          setSuccessMessage('Leader account created! Redirecting...');
          setTimeout(() => navigate('/leader/dashboard'), 1000);
        } else {
          await registerMember(
            formData.name,
            formData.email,
            formData.password,
            formData.confirmPassword,
            formData.teamCode
          );
          setSuccessMessage('Member account created! Redirecting...');
          setTimeout(() => navigate('/member/dashboard'), 1000);
        }
      }
    } catch (error) {
      setErrors({
        submit: error.message || 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B0F14] text-white overflow-hidden">

      {/* 
        LEFT SIDE: Antigravity Particle Background 
        - Hidden on mobile, full width on desktop
      */}
      <div className="hidden md:flex w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden bg-radial-gradient">
        {/* Particle Background Container */}
        <div className="absolute inset-0 z-0">
          <QuantumBackground />
        </div>

        {/* Overlay Content */}
        <div className="relative z-10 text-center">
          <h1 className="text-6xl font-extrabold tracking-widest text-white mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            TASKHIVE
          </h1>
          <p className="text-xl text-blue-200 font-light max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
            Intelligent Multi-Module Environment for Project Management
          </p>
        </div>

        {/* Gradient Overlay for better text readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-transparent to-[#0B0F14] opacity-40 z-0 pointer-events-none"></div>
      </div>

      {/* 
        RIGHT SIDE: Form Area
        - Scrollable if needed
        - Dark Theme Styling
      */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-[#0B0F14] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header (Mobile Logo shown here if needed, keeping simple for now) */}
          <div className="text-center md:text-left mb-8">
            <Link to="/" className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Join TaskHive'}
            </h2>
            <p className="text-gray-400">
              {mode === 'login'
                ? 'Sign in to access your workspace'
                : 'Create your account to get started'}
            </p>
          </div>

          {/* Transition Invitation Banner */}
          {isTransition && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6 mb-6 shadow-lg shadow-blue-900/10"
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Co-Leadership Handover</h3>
                  <p className="text-sm text-blue-200/80 leading-relaxed">
                    You've been invited to lead <strong>{urlTeamName || 'the team'}</strong>.
                    Please {mode === 'login' ? 'sign in' : 'sign up'} to your Team Leader account and enter your team code below to accept.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Container with Glass/Dark style */}
          <div className="bg-[#151921] border border-gray-800 rounded-2xl p-8 shadow-2xl relative">

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-[#151921]/90 rounded-2xl flex items-center justify-center z-20 backdrop-blur-sm">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-200 text-sm">
                    {mode === 'login' ? 'Authenticating...' : 'Creating Account...'}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg flex gap-3 items-start"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{errors.submit}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-900/20 border border-green-800/50 rounded-lg flex gap-3 items-start"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-300 text-sm">{successMessage}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => !isTransition && handleInputChange({ target: { name: 'role', value: 'leader' } })}
                    disabled={loading || isTransition}
                    className={`p-4 border rounded-xl transition-all duration-200 flex flex-col items-center justify-center text-center group ${formData.role === 'leader'
                      ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 ring-1 ring-blue-500/30'
                      : 'bg-[#0B0F14] border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800/50'
                      } ${isTransition ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <Crown className={`w-6 h-6 mb-2 transition-colors ${formData.role === 'leader' ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <span className="text-sm font-medium">Team Leader</span>
                    {isTransition && <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter mt-1">LOCKED</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => !isTransition && handleInputChange({ target: { name: 'role', value: 'member' } })}
                    disabled={loading || isTransition}
                    className={`p-4 border rounded-xl transition-all duration-200 flex flex-col items-center justify-center text-center group ${formData.role === 'member'
                      ? 'bg-purple-600/10 border-purple-500/50 text-purple-400 ring-1 ring-purple-500/30'
                      : 'bg-[#0B0F14] border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800/50'
                      } ${isTransition ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Users className={`w-6 h-6 mb-2 transition-colors ${formData.role === 'member' ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <span className="text-sm font-medium">Team Member</span>
                  </button>
                </div>
                {errors.role && (
                  <p className="text-red-400 text-xs mt-2 pl-1">{errors.role}</p>
                )}
              </div>

              {/* Name Field (Signup only) */}
              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-[#0B0F14] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition text-white placeholder-gray-600 ${errors.name ? 'border-red-500/50' : 'border-gray-700 focus:border-blue-500'
                      }`}
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </motion.div>
              )}

              {/* Email Field */}
              <motion.div layout>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-[#0B0F14] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition text-white placeholder-gray-600 ${errors.email ? 'border-red-500/50' : 'border-gray-700 focus:border-blue-500'
                    }`}
                  placeholder="you@company.com"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </motion.div>

              {/* Team Code (Required for Members OR Co-Leaders in transition) */}
              {(formData.role === 'member' || (formData.role === 'leader' && isTransition)) && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 flex justify-between items-center">
                    <span>{formData.role === 'leader' ? 'Team Access Code' : 'Team Code'}</span>
                    {formData.role === 'leader' && <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">From Invitation</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="teamCode"
                      value={formData.teamCode}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`w-full px-4 py-3 bg-[#0B0F14] border rounded-lg focus:outline-none focus:ring-2 transition text-white placeholder-gray-600 font-mono uppercase tracking-widest ${errors.teamCode
                        ? 'border-red-500/50 focus:ring-red-500/30'
                        : teamValidation.isValid
                          ? 'border-green-500/50 focus:ring-green-500/30'
                          : formData.role === 'leader'
                            ? 'border-blue-500/50 focus:ring-blue-500/30 focus:border-blue-500'
                            : 'border-gray-700 focus:border-purple-500 focus:ring-purple-500/30'
                        }`}
                      placeholder="ENTER CODE"
                    />
                    {teamValidation.isValidating && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      </div>
                    )}
                  </div>
                  {teamValidation.isValid === true && (
                    <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Team found: {teamValidation.teamName}
                    </p>
                  )}
                  {errors.teamCode && <p className="text-red-400 text-xs mt-1">{errors.teamCode}</p>}
                  {formData.role === 'leader' && (
                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-tight">
                      Entering this code will add you as a Co-Leader to an existing team.
                    </p>
                  )}
                </motion.div>
              )}

              {/* Password */}
              <motion.div layout>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-[#0B0F14] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition text-white placeholder-gray-600 pr-10 ${errors.password ? 'border-red-500/50' : 'border-gray-700 focus:border-blue-500'
                      }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </motion.div>

              {/* Confirm Password (Signup) */}
              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`w-full px-4 py-3 bg-[#0B0F14] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition text-white placeholder-gray-600 pr-10 ${errors.confirmPassword ? 'border-red-500/50' : 'border-gray-700 focus:border-blue-500'
                        }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || teamValidation.isValidating}
                className={`w-full py-3.5 rounded-lg font-bold text-sm tracking-wide transition-all transform hover:-translate-y-0.5 mt-2 ${formData.role === 'member'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-900/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            </form>

            {/* Footer Toggle */}
            <div className="mt-8 text-center text-sm text-gray-400">
              <p>
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <Link
                  to={
                    mode === 'login'
                      ? `/auth?mode=signup${isTransition ? `&transition=true&teamName=${encodeURIComponent(urlTeamName)}&teamCode=${urlTeamCode}` : ''}`
                      : `/auth?mode=login${isTransition ? `&transition=true&teamName=${encodeURIComponent(urlTeamName)}&teamCode=${urlTeamCode}` : ''}`
                  }
                  className="ml-2 font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </Link>
              </p>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}