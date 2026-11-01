import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Plus,
  Eye,
  Check,
  SearchCheck,
  Play,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  salesOrderApi,
  customerApi,
  productApi,
  getErrorMessage,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

export const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
  });
  const [submitting, setSubmitting] = useState(false);

  const { hasAnyRole } = useAuth();
  const { success, error } = useToast();

  const canCreate = hasAnyRole(['ADMIN', 'SALES']);

  useEffect(() => {
    loadOrders();
    loadDialogDropdowns();
  }, [pageIndex, pageSize]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await salesOrderApi.getSalesOrders(searchQuery, pageIndex, pageSize);
      setOrders(res.data?.content || []);
      setTotalElements(res.data?.totalElements || 0);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load sales orders'));
    } finally {
      setLoading(false);
    }
  };

  const loadDialogDropdowns = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        customerApi.getAllCustomers(),
        productApi.getAllProducts(),
      ]);
      setCustomers(cRes.data || []);
      setProducts(pRes.data || []);
    } catch (err) {
      console.error('Failed to load customers or products:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageIndex(0);
    loadOrders();
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setPageIndex(0);
    setTimeout(() => {
      salesOrderApi.getSalesOrders('', 0, pageSize).then((res) => {
        setOrders(res.data?.content || []);
        setTotalElements(res.data?.totalElements || 0);
      });
    }, 0);
  };

  const openCreateDialog = () => {
    const firstCust = customers[0]?.id || '';
    const firstProd = products[0];
    setFormData({
      customerId: firstCust,
      notes: '',
      items: [
        {
          productId: firstProd?.id || '',
          quantity: 1,
          unitPrice: firstProd?.unitPrice || 0,
        },
      ],
    });
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    const firstProd = products[0];
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: firstProd?.id || '',
          quantity: 1,
          unitPrice: firstProd?.unitPrice || 0,
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p.id === Number(prodId));
    const updated = [...formData.items];
    updated[index] = {
      ...updated[index],
      productId: Number(prodId),
      unitPrice: prod?.unitPrice || 0,
    };
    setFormData({ ...formData, items: updated });
  };

  const handleItemFieldChange = (index, field, val) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, items: updated });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0;
      const p = parseFloat(it.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || formData.items.length === 0) {
      error('Please select a customer and at least one item');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: Number(formData.customerId),
        notes: formData.notes,
        items: formData.items.map((it) => ({
          productId: Number(it.productId),
          quantity: parseInt(it.quantity, 10),
          unitPrice: parseFloat(it.unitPrice),
        })),
      };

      const res = await salesOrderApi.createSalesOrder(payload);
      success(`Sales Order ${res.data.orderNumber} created successfully!`);
      setIsDialogOpen(false);
      loadOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to create sales order'));
    } finally {
      setSubmitting(false);
    }
  };

  // Workflow Quick Actions
  const handleConfirm = async (order) => {
    try {
      const res = await salesOrderApi.confirmSalesOrder(order.id);
      success(`Order ${res.data.orderNumber} confirmed. Status: ${res.data.status}`);
      loadOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to confirm order'));
    }
  };

  const handleCheckMaterials = async (order) => {
    try {
      const res = await salesOrderApi.checkMaterials(order.id);
      if (res.data.hasAnyShortage) {
        error(res.data.message);
      } else {
        success(res.data.message);
      }
      loadOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to check materials'));
    }
  };

  const handleStartProduction = async (order) => {
    try {
      await salesOrderApi.startProductionFromOrder(order.id);
      success(`Production started for order ${order.orderNumber}! Materials consumed.`);
      loadOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to start production'));
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-sky-600" />
            Sales Orders
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Customer orders, automated BOM material availability checks, and production readiness
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-sky-600/20 transition-colors w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sales Order</span>
          </button>
        )}
      </div>

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
              placeholder="Search by order #, customer..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 bg-white"
            />
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadOrders}
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
                <th className="px-5 py-3">Order #</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length > 0 ? (
                orders.map((order) => (
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
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{order.orderDate}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'DRAFT' && (
                          <button
                            onClick={() => handleConfirm(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                            title="Confirm Order and Run BOM Shortage Check"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>
                        )}

                        {(order.status === 'CONFIRMED' || order.status === 'SHORTAGE') && (
                          <button
                            onClick={() => handleCheckMaterials(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                            title="Check raw material stock against BOM"
                          >
                            <SearchCheck className="w-3.5 h-3.5" />
                            <span>Check Materials</span>
                          </button>
                        )}

                        {order.status === 'READY_FOR_PRODUCTION' && (
                          <button
                            onClick={() => handleStartProduction(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
                            title="Start shop floor manufacturing and consume inventory"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Production</span>
                          </button>
                        )}

                        <Link
                          to={`/sales-orders/${order.id}`}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="View Order Details & BOM Shortage Analysis"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-400 text-sm">
                    No sales orders found
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

      {/* Create Sales Order Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Create New Sales Order"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Customer <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.companyName || c.email || 'Retail Customer'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Delivery Instructions
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Urgent shipment required for corporate office inaugurations"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>

          {/* Line items */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Order Line Items
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.unitPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemFieldChange(index, 'unitPrice', e.target.value)}
                      placeholder="Price"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={formData.items.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Estimated Total */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-600">Estimated Total:</span>
              <span className="text-lg font-bold text-sky-700">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Order</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesOrders;
