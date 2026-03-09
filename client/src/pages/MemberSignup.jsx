import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function MemberSignup() {
  const navigate = useNavigate();
  // We don't use registerMember from AuthContext because we need strict backend validation first
  // const { registerMember } = useContext(AuthContext); 

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    teamCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Call Backend API directly for atomic registration with strict validation
      const { API_BASE_URL } = await import("../config");

      const response = await fetch(`${API_BASE_URL}/auth/register-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.fullName, // Backend expects 'name' or 'fullName'
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          teamCode: form.teamCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Success - Redirect to OTP verification or Login
      // Since backend sends OTP, we should probably redirect to a verification page
      // For now, redirecting to Login as per standard flow, or we could handle OTP input here.
      // The backend response says "Check your email for OTP verification."

      // Navigate to login with a success message state
      navigate('/member/login', {
        state: {
          message: 'Registration successful! Please check your email for the OTP to verify your account.'
        }
      });

    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-[hsl(var(--card))] rounded-xl shadow-lg border border-[hsl(var(--border))] p-8">
        <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))] text-center">Member Sign Up</h2>
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-2 mb-6">
          Join your team with the code provided by your leader.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] rounded-md">
            <p className="text-[hsl(var(--destructive))] text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Full Name</label>
            <input
              name="fullName"
              type="text"
              placeholder="Must match invitation exactly"
              value={form.fullName}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Must match invitation exactly"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
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
              minLength={6}
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
              minLength={6}
              className="mt-1 w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Team Code</label>
            <input
              name="teamCode"
              type="text"
              placeholder="Enter 6-character code"
              value={form.teamCode}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all font-mono tracking-wider placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Verifying & Creating Account...' : 'Join Team'}
          </button>
        </form>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
          Already have an account?{' '}
          <Link to="/member/login" className="text-[hsl(var(--primary))] hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
