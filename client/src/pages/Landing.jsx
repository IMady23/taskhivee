import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import QuantumBackground from '../components/QuantumBackground';

export default function Landing() {
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);

  const testFirebase = async () => {
    setTesting(true);
    setTestResult('Testing Firebase...');

    try {
      // Test Firebase configuration
      setTestResult(prev => prev + '\n✅ Firebase initialized');
      setTestResult(prev => prev + `\n✅ Project: ${auth.app.options.projectId}`);

      // Test authentication
      const testEmail = 'test@example.com';
      const testPassword = 'test123456';

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        setTestResult(prev => prev + '\n✅ User created successfully!');
      } catch (createError) {
        if (createError.code === 'auth/email-already-in-use') {
          try {
            const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
            setTestResult(prev => prev + '\n✅ Sign in successful!');
          } catch (signInError) {
            setTestResult(prev => prev + `\n❌ Error: ${signInError.code} - ${signInError.message}`);
          }
        } else {
          setTestResult(prev => prev + `\n❌ Error: ${createError.code} - ${createError.message}`);
        }
      }
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Firebase Error: ${error.message}`);
    }

    setTesting(false);
  };
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col relative overflow-hidden transition-colors duration-300">
      <QuantumBackground />
      <header className="w-full py-4 relative z-10">
        <nav className="max-w-4xl mx-auto flex justify-end gap-6 text-[hsl(var(--foreground))]">
          <Link to="/" className="hover:underline opacity-80 hover:opacity-100 transition-opacity">Home</Link>
          <Link to="/about" className="hover:underline opacity-80 hover:opacity-100 transition-opacity">About</Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-3xl rounded-xl shadow-sm p-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-[hsl(var(--foreground))]">TaskHive</h1>
            <p className="mt-2 text-[hsl(var(--muted-foreground))]">Simplifying Team Collaboration</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">Team Leader</h3>
              <p className="mt-2 text-[hsl(var(--muted-foreground))]">Manage projects and assign tasks</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link to="/leader/login" className="px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md text-[hsl(var(--foreground))] hover:shadow transition-all">Login</Link>
                <Link to="/leader/signup" className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-md hover:opacity-90 transition-all">Sign Up</Link>
              </div>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">Team Member</h3>
              <p className="mt-2 text-[hsl(var(--muted-foreground))]">Contribute and track your tasks</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link to="/member/login" className="px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md text-[hsl(var(--foreground))] hover:shadow transition-all">Login</Link>
                <Link to="/member/signup" className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-md hover:opacity-90 transition-all">Sign Up</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
