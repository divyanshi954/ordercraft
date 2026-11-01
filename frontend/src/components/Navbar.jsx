import React from 'react';
import { UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-500">
          Order-To-Cash Workflow System
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-900 leading-tight">
              {user?.fullName || user?.username}
            </span>
            <span className="text-xs text-slate-500">{user?.email}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
