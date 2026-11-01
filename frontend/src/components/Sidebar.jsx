import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Truck,
  Receipt,
  CreditCard,
  Users,
  Package,
  Layers,
  Store,
  GitFork,
  LogOut,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, logout, hasAnyRole } = useAuth();

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-sky-600 text-white font-semibold shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
    }`;

  const roleBadgeColor = {
    ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    SALES: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    PRODUCTION: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PURCHASE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ACCOUNTS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }[user?.role] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800/80 select-none h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 bg-slate-950 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base text-white tracking-tight">OrderCraft</span>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Manufacturing OMS
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <NavLink to="/dashboard" className={navItemClass}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        {/* ORDER WORKFLOW */}
        <div className="pt-4 pb-1.5 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Order Workflow
        </div>

        {hasAnyRole(['ADMIN', 'SALES']) && (
          <NavLink to="/sales-orders" className={navItemClass}>
            <ShoppingCart className="w-4 h-4 flex-shrink-0" />
            <span>Sales Orders</span>
          </NavLink>
        )}

        {hasAnyRole(['ADMIN', 'PRODUCTION']) && (
          <NavLink to="/production" className={navItemClass}>
            <Factory className="w-4 h-4 flex-shrink-0" />
            <span>Production</span>
          </NavLink>
        )}

        {hasAnyRole(['ADMIN', 'PURCHASE']) && (
          <NavLink to="/purchase-orders" className={navItemClass}>
            <Truck className="w-4 h-4 flex-shrink-0" />
            <span>Purchase Orders</span>
          </NavLink>
        )}

        {/* BILLING & FINANCE */}
        <div className="pt-4 pb-1.5 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Billing & Finance
        </div>

        {hasAnyRole(['ADMIN', 'ACCOUNTS']) && (
          <NavLink to="/invoices" className={navItemClass}>
            <Receipt className="w-4 h-4 flex-shrink-0" />
            <span>Invoices</span>
          </NavLink>
        )}

        {hasAnyRole(['ADMIN', 'ACCOUNTS']) && (
          <NavLink to="/payments" className={navItemClass}>
            <CreditCard className="w-4 h-4 flex-shrink-0" />
            <span>Payments</span>
          </NavLink>
        )}

        {/* MASTER DATA */}
        <div className="pt-4 pb-1.5 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Master Data
        </div>

        {hasAnyRole(['ADMIN', 'SALES']) && (
          <NavLink to="/customers" className={navItemClass}>
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Customers</span>
          </NavLink>
        )}

        <NavLink to="/products" className={navItemClass}>
          <Package className="w-4 h-4 flex-shrink-0" />
          <span>Products</span>
        </NavLink>

        {hasAnyRole(['ADMIN', 'PRODUCTION']) && (
          <NavLink to="/bom" className={navItemClass}>
            <GitFork className="w-4 h-4 flex-shrink-0" />
            <span>Bill of Materials</span>
          </NavLink>
        )}

        {hasAnyRole(['ADMIN', 'PURCHASE', 'PRODUCTION']) && (
          <NavLink to="/materials" className={navItemClass}>
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span>Materials & Stock</span>
          </NavLink>
        )}

        {hasAnyRole(['ADMIN', 'PURCHASE']) && (
          <NavLink to="/suppliers" className={navItemClass}>
            <Store className="w-4 h-4 flex-shrink-0" />
            <span>Suppliers</span>
          </NavLink>
        )}
      </nav>

      {/* Bottom User Profile */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-slate-200 truncate">
            {user?.fullName || user?.username}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${roleBadgeColor}`}
            >
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
