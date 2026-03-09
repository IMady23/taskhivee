import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function SimpleLeaderAuth() {
  const [email, setEmail] = useState('test@leader.com');
  const [password, setPassword] = useState('test123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, registerLeader } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting login with:', email);
      await login(email, password);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/leader/dashboard'), 1000);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting signup with:', email);
      await registerLeader('Test Leader', email, password, password);
      setSuccess('Account created! Redirecting...');
      setTimeout(() => navigate('/leader/dashboard'), 1000);
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Leader Auth (Simple)</h1>
        
        {/* Debug Info */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
          <p><strong>Test Credentials:</strong></p>
          <p>Email: test@leader.com</p>
          <p>Password: test123456</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            <strong>Success:</strong> {success}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Home</a>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p><strong>Instructions:</strong></p>
          <p>1. Try "Sign Up" first to create the test account</p>
          <p>2. Then use "Login" to sign in</p>
          <p>3. Check browser console (F12) for detailed errors</p>
        </div>
      </div>
    </div>
  );
}