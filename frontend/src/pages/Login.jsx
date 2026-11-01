import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ShoppingCart,
  Wrench,
  ShoppingBag,
  Landmark,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      error('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      success('Signed in successfully');
      navigate('/dashboard');
    } catch (err) {
      error(getErrorMessage(err, 'Login failed: Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    try {
      await login(u, p);
      success(`Signed in as ${u}`);
      navigate('/dashboard');
    } catch (err) {
      error(getErrorMessage(err, 'Login failed: Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-700/50 p-8 sm:p-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-sky-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-600/30">
            <Cpu className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">OrderCraft</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing Order-to-Cash Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 placeholder-slate-400 transition-colors"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 placeholder-slate-400 transition-colors"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Accounts Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Demo Login Accounts
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('admin', 'admin123')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 rounded-lg transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('sales', 'sales123')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-sky-500" />
              <span>Sales</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('production', 'prod123')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 rounded-lg transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              <span>Production</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('purchase', 'purchase123')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 rounded-lg transition-colors col-span-1"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
              <span>Purchase</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('accounts', 'accounts123')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 rounded-lg transition-colors col-span-2"
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-500" />
              <span>Accounts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
