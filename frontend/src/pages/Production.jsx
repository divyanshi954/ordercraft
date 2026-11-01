import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Factory, Search, CheckCircle, Play, CheckCheck, Loader2 } from 'lucide-react';
import {
  productionOrderApi,
  salesOrderApi,
  getErrorMessage,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

export const Production = () => {
  const [productionOrders, setProductionOrders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const { hasAnyRole } = useAuth();
  const { success, error } = useToast();

  const canManage = hasAnyRole(['ADMIN', 'PRODUCTION']);

  useEffect(() => {
    loadProductionOrders();
    loadReadyOrders();
  }, [pageIndex, pageSize]);

  const loadProductionOrders = async () => {
    setLoading(true);
    try {
      const res = await productionOrderApi.getProductionOrders(
        searchQuery,
        pageIndex,
        pageSize
      );
      setProductionOrders(res.data?.content || []);
      setTotalElements(res.data?.totalElements || 0);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load production orders'));
    } finally {
      setLoading(false);
    }
  };

  const loadReadyOrders = async () => {
    try {
      const res = await salesOrderApi.getSalesOrders('', 0, 50);
      const ready = (res.data?.content || []).filter((o) => o.status === 'READY_FOR_PRODUCTION');
      setReadyOrders(ready);
    } catch (err) {
      console.error('Failed to load ready orders for production:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageIndex(0);
    loadProductionOrders();
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setPageIndex(0);
    setTimeout(() => {
      productionOrderApi.getProductionOrders('', 0, pageSize).then((res) => {
        setProductionOrders(res.data?.content || []);
        setTotalElements(res.data?.totalElements || 0);
      });
    }, 0);
  };

  const handleQuickStart = async (ro) => {
    try {
      await salesOrderApi.startProductionFromOrder(ro.id);
      success(
        `Production run launched for order ${ro.orderNumber}! Reserved materials consumed.`
      );
      loadProductionOrders();
      loadReadyOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to start production run'));
    }
  };

  const handleStartWork = async (po) => {
    try {
      await productionOrderApi.startProduction(po.id);
      success(
        `Production run ${po.productionNumber} started! Raw materials consumed from inventory.`
      );
      loadProductionOrders();
      loadReadyOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to start production work'));
    }
  };

  const handleCompleteRun = async (po) => {
    try {
      await productionOrderApi.completeProduction(po.id);
      success(
        `Production run ${po.productionNumber} completed! Order marked ready for invoicing.`
      );
      loadProductionOrders();
      loadReadyOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to complete production run'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Factory className="w-6 h-6 text-sky-600" />
          Production Execution & Shop Floor
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Schedule production runs, execute material consumption, and track manufacturing completion
        </p>
      </div>

      {/* Ready Orders Quick Action Banner */}
      {readyOrders.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-sm">
                {readyOrders.length} Sales Order(s) Ready for Production
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                All raw materials are in stock and reserved. Launch production to consume inventory and begin assembly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {readyOrders.map((ro) => (
              <div
                key={ro.id}
                className="bg-white rounded-lg p-3 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900 text-xs block">
                    {ro.orderNumber}
                  </span>
                  <span className="text-xs text-slate-600 truncate block max-w-[140px]">
                    {ro.customer?.name}
                  </span>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleQuickStart(ro)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex-shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Work</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PRD #, order #..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 bg-white"
            />
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadProductionOrders}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleResetSearch}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Loading Bar */}
        {loading && (
          <div className="h-1 w-full bg-sky-100 overflow-hidden">
            <div className="h-full bg-sky-600 animate-pulse w-full"></div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Production #</th>
                <th className="px-5 py-3">Sales Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Planned Qty</th>
                <th className="px-5 py-3">Completed Qty</th>
                <th className="px-5 py-3">Start Date</th>
                <th className="px-5 py-3">Completion Date</th>
                <th className="px-5 py-3">Status</th>
                {canManage && <th className="px-5 py-3 text-right">Floor Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productionOrders.length > 0 ? (
                productionOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900">
                      {po.productionNumber}
                    </td>
                    <td className="px-5 py-3.5 font-bold font-mono">
                      <Link
                        to={`/sales-orders/${po.salesOrder?.id}`}
                        className="text-sky-600 hover:underline"
                      >
                        {po.salesOrder?.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {po.salesOrder?.customer?.name}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {po.plannedQuantity}
                    </td>
                    <td
                      className={`px-5 py-3.5 font-bold ${
                        po.completedQuantity > 0 ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      {po.completedQuantity}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{po.startDate || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {po.completionDate || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={po.status} />
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === 'PLANNED' && (
                            <button
                              onClick={() => handleStartWork(po)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
                              title="Deduct reserved materials from stock and begin work"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Start Work</span>
                            </button>
                          )}

                          {po.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleCompleteRun(po)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                              title="Mark all finished goods assembled and order completed"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Complete Run</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td
                    colSpan={canManage ? 9 : 8}
                    className="px-5 py-10 text-center text-slate-400 text-sm"
                  >
                    No production orders found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalElements={totalElements}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};

export default Production;
