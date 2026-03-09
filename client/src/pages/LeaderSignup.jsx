import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function LeaderSignup() {
  const navigate = useNavigate();
  const { registerLeader } = useContext(AuthContext);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerLeader(
        form.fullName.trim(),
        form.email.trim(),
        form.password,
        form.confirmPassword,
        form.organization.trim()
      );
      navigate('/leader-dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-[hsl(var(--card))] rounded-xl shadow-lg border border-[hsl(var(--border))] p-8">
        <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))] text-center">Leader Sign Up</h2>
        {error && (
          <p className="mt-3 text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] rounded-md px-3 py-2">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Full Name</label>
            <input
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Organization / Team Name</label>
            <input
              name="organization"
              type="text"
              value={form.organization}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
          Already have an account?{' '}
          <Link to="/leader/login" className="text-[hsl(var(--primary))] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
