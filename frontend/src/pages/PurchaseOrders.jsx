import React, { useState, useEffect } from 'react';
import { Truck, Search, Plus, Send, PackageCheck, XCircle, Trash2, Loader2 } from 'lucide-react';
import {
  purchaseOrderApi,
  supplierApi,
  materialApi,
  getErrorMessage,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

export const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [formData, setFormData] = useState({
    supplierId: '',
    notes: '',
    items: [{ materialId: '', quantity: 100, unitPrice: 50 }],
  });
  const [submitting, setSubmitting] = useState(false);

  const { hasAnyRole } = useAuth();
  const { success, error } = useToast();

  const canManage = hasAnyRole(['ADMIN', 'PURCHASE']);

  useEffect(() => {
    loadPurchaseOrders();
    loadDialogDropdowns();
  }, [pageIndex, pageSize]);

  const loadPurchaseOrders = async () => {
    setLoading(true);
    try {
      const res = await purchaseOrderApi.getPurchaseOrders(searchQuery, pageIndex, pageSize);
      setPurchaseOrders(res.data?.content || []);
      setTotalElements(res.data?.totalElements || 0);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load purchase orders'));
    } finally {
      setLoading(false);
    }
  };

  const loadDialogDropdowns = async () => {
    try {
      const [sRes, mRes] = await Promise.all([
        supplierApi.getAllSuppliers(),
        materialApi.getAllMaterials(),
      ]);
      setSuppliers(sRes.data || []);
      setMaterials(mRes.data || []);
    } catch (err) {
      console.error('Failed to load suppliers/materials:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageIndex(0);
    loadPurchaseOrders();
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setPageIndex(0);
    setTimeout(() => {
      purchaseOrderApi.getPurchaseOrders('', 0, pageSize).then((res) => {
        setPurchaseOrders(res.data?.content || []);
        setTotalElements(res.data?.totalElements || 0);
      });
    }, 0);
  };

  const openCreateDialog = () => {
    setFormData({
      supplierId: suppliers[0]?.id || '',
      notes: '',
      items: [
        {
          materialId: materials[0]?.id || '',
          quantity: 100,
          unitPrice: 50,
        },
      ],
    });
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          materialId: materials[0]?.id || '',
          quantity: 100,
          unitPrice: 50,
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
    if (!formData.supplierId || formData.items.length === 0) {
      error('Please select a supplier and include items');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplierId: Number(formData.supplierId),
        notes: formData.notes,
        items: formData.items.map((it) => ({
          materialId: Number(it.materialId),
          quantity: parseFloat(it.quantity),
          unitPrice: parseFloat(it.unitPrice),
        })),
      };

      const res = await purchaseOrderApi.createPurchaseOrder(payload);
      success(`Purchase Order ${res.data.purchaseOrderNumber} created`);
      setIsDialogOpen(false);
      loadPurchaseOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to create purchase order'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkOrdered = async (po) => {
    try {
      await purchaseOrderApi.markPurchaseOrderOrdered(po.id);
      success(`Purchase Order ${po.purchaseOrderNumber} marked as ORDERED`);
      loadPurchaseOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to update order status'));
    }
  };

  const handleReceiveOrder = async (po) => {
    try {
      await purchaseOrderApi.receivePurchaseOrder(po.id);
      success(
        `Goods received for ${po.purchaseOrderNumber}! Material inventory stock increased.`
      );
      loadPurchaseOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to receive goods'));
    }
  };

  const handleCancelOrder = async (po) => {
    if (!window.confirm(`Cancel purchase order ${po.purchaseOrderNumber}?`)) return;
    try {
      await purchaseOrderApi.cancelPurchaseOrder(po.id);
      success('Purchase order cancelled');
      loadPurchaseOrders();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to cancel order'));
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
            <Truck className="w-6 h-6 text-sky-600" />
            Purchase Orders (Procurement)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Order raw materials from vendors, record goods receipts, and update stock
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-sky-600/20 transition-colors w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
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
              placeholder="Search by PO #, supplier..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 bg-white"
            />
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadPurchaseOrders}
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
                <th className="px-5 py-3">PO Number</th>
                <th className="px-5 py-3">Supplier</th>
                <th className="px-5 py-3">Order Date</th>
                <th className="px-5 py-3">Materials Ordered</th>
                <th className="px-5 py-3">Total Cost</th>
                <th className="px-5 py-3">Status</th>
                {canManage && <th className="px-5 py-3 text-right">Workflow Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.length > 0 ? (
                purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900">
                      {po.purchaseOrderNumber}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {po.supplier?.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{po.orderDate}</td>
                    <td className="px-5 py-3.5 text-slate-700 text-xs max-w-xs">
                      {po.items
                        ?.map((it) => `${it.quantity} ${it.material?.unit} ${it.material?.name}`)
                        .join(', ')}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={po.status} />
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === 'DRAFT' && (
                            <button
                              onClick={() => handleMarkOrdered(po)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                              title="Mark purchase order as sent/ordered"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send</span>
                            </button>
                          )}

                          {(po.status === 'ORDERED' || po.status === 'DRAFT') && (
                            <button
                              onClick={() => handleReceiveOrder(po)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                              title="Receive goods into inventory and increase raw material stock"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Receive Goods</span>
                            </button>
                          )}

                          {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelOrder(po)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                              title="Cancel PO"
                            >
                              <XCircle className="w-4 h-4" />
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
                    colSpan={canManage ? 7 : 6}
                    className="px-5 py-10 text-center text-slate-400 text-sm"
                  >
                    No purchase orders found
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

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Create Purchase Order (Procurement)"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.companyName || s.email || 'Vendor'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Procurement Reason / Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Replenishing factory raw material stock levels"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>

          {/* Line items */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Materials to Purchase
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <select
                      value={item.materialId}
                      onChange={(e) => handleItemFieldChange(index, 'materialId', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                      required
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
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
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-600">Total Purchase Cost:</span>
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
              <span>Create Purchase Order</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseOrders;
