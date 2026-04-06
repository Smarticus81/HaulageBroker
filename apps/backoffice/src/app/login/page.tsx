'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { setToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate login
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email && password) {
        setToken('demo-jwt-token');
        router.push('/');
      } else {
        setError('Please enter both email and password.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-100">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-200 rounded-full opacity-40 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-50 rounded-full opacity-20 blur-2xl" />

        {/* Subtle truck/logistics pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <pattern id="trucks" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect x="20" y="50" width="40" height="25" rx="3" fill="currentColor" />
            <rect x="60" y="55" width="20" height="20" rx="2" fill="currentColor" />
            <circle cx="30" cy="78" r="6" fill="currentColor" />
            <circle cx="50" cy="78" r="6" fill="currentColor" />
            <circle cx="70" cy="78" r="6" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#trucks)" />
        </svg>
      </div>

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Sign in to CarrierBackOffice</h1>
            <p className="text-sm text-slate-500 mt-1">Trucking paperwork, billing, and compliance</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Secure access to your back office dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
