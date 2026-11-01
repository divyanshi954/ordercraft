import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Factory,
  Receipt,
  ShoppingCart,
  AlertTriangle,
  CreditCard,
  Plus,
  Loader2,
} from 'lucide-react';
import { dashboardApi, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getDashboardSummary();
      setSummary(res.data);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load dashboard summary'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Manufacturing Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time overview of manufacturing orders, inventory, procurement, and billing
          </p>
        </div>
        <Link
          to="/sales-orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-sky-600/20 transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Order</span>
        </Link>
      </div>

      {loading && (
        <div className="w-full bg-sky-50 p-3 rounded-lg flex items-center justify-center gap-2 text-sky-700 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading live manufacturing data...</span>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Orders
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {summary?.totalSalesOrders || 0}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              {summary?.pendingOrders || 0} pending
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* In Production */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              In Production
            </span>
            <span className="text-2xl font-bold text-orange-600 mt-1 block">
              {summary?.ordersInProduction || 0}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">Active floor runs</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <Factory className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Low Stock Alerts
            </span>
            <span
              className={`text-2xl font-bold mt-1 block ${
                (summary?.lowStockCount || 0) > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {summary?.lowStockCount || 0}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">Needs reorder</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Purchase Orders
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {summary?.totalPurchaseOrders || 0}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">Procurement runs</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">
              {formatCurrency(summary?.totalRevenue)}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">Realized payments</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Receivables
            </span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {formatCurrency(summary?.pendingPayments)}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              {summary?.outstandingInvoicesCount || 0} unpaid
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two Column Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Recent Sales Orders</h3>
            <Link
              to="/sales-orders"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              View All Orders &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.recentOrders && summary.recentOrders.length > 0 ? (
                  summary.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono">
                        <Link
                          to={`/sales-orders/${order.id}`}
                          className="text-sky-600 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{order.customer?.name}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{order.orderDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-400 text-sm">
                      No sales orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Inventory Watch */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Low Stock Inventory Watch</h3>
            <Link
              to="/materials"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              View Materials &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Material</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Reorder</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.lowStockMaterials && summary.lowStockMaterials.length > 0 ? (
                  summary.lowStockMaterials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {mat.materialCode}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{mat.name}</td>
                      <td className="px-5 py-3.5 font-semibold text-rose-600">
                        {mat.currentStock} {mat.unit}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {mat.reorderLevel} {mat.unit}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status="LOW STOCK" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-emerald-600 text-sm font-medium">
                      ✓ All raw material stocks are sufficient
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
