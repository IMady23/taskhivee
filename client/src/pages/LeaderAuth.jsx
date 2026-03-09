import React, { useState, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import QuantumBackground from '../components/QuantumBackground';

/**
 * Leader Authentication Page
 * Handles both login and signup for leaders
 * URL param: ?mode=login or ?mode=signup
 */
export default function LeaderAuth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const navigate = useNavigate();
  const { login, registerLeader } = useContext(AuthContext);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP state

  // Success message
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => navigate('/leader-dashboard'), 800);
      } else {
        await registerLeader(
          formData.name,
          formData.email,
          formData.password,
          formData.confirmPassword
        );
        setSuccessMessage('Account created! Redirecting...');
        setTimeout(() => navigate('/leader-dashboard'), 800);
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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <QuantumBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full absolute inset-0 bg-gradient-to-br from-blue-50/80 via-blue-100/80 to-purple-50/80 -z-1"
      />
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-600 mb-2">
            Leader {mode === 'login' ? 'Login' : 'Sign Up'}
          </h2>
          <p className="text-gray-600 text-sm">
            {mode === 'login'
              ? 'Welcome back! Log in to your account.'
              : 'Create your leader account to get started.'}
          </p>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-2 items-start"
          >
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm">{successMessage}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Signup only) */}
          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.name
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </motion.div>
          )}

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: mode === 'signup' ? 0.15 : 0.1 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.email
                ? 'border-red-300 focus:ring-red-200'
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: mode === 'signup' ? 0.2 : 0.15 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition pr-10 ${errors.password
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </motion.div>

          {/* Confirm Password Field (Signup only) */}
          {mode === 'signup' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition pr-10 ${errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition mt-6"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Toggle Mode */}
        <p className="text-center text-gray-600 text-sm">
          {mode === 'login' ? "Don't have a leader account?" : 'Already a leader?'}{' '}
          <Link
            to={mode === 'login' ? '/leader-auth?mode=signup' : '/leader-auth?mode=login'}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </Link>
        </p>

        {/* Back to Home */}
        <Link
          to="/"
          className="block text-center text-gray-500 hover:text-gray-700 text-xs mt-4"
        >
          ← Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
