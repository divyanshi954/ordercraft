import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  SearchCheck,
  Play,
  Receipt,
  XCircle,
  AlertTriangle,
  ShoppingCart,
  Loader2,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  salesOrderApi,
  purchaseOrderApi,
  invoiceApi,
  supplierApi,
  materialApi,
  getErrorMessage,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export const SalesOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [materialCheck, setMaterialCheck] = useState(null);
  const [loading, setLoading] = useState(true);

  // Shortage PO Dialog State
  const [isPoDialogOpen, setIsPoDialogOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [poForm, setPoForm] = useState({
    supplierId: '',
    notes: '',
    items: [],
  });
  const [submittingPo, setSubmittingPo] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    if (id) {
      loadOrderDetails();
      loadSuppliersAndMaterials();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await salesOrderApi.getSalesOrder(id);
      setOrder(res.data);
      // Attempt to load preview of material requirements
      try {
        const checkRes = await salesOrderApi.getMaterialRequirementsPreview(id);
        setMaterialCheck(checkRes.data);
      } catch (err) {
        // Might not have BOM configured yet
        console.warn('Material check preview not available yet:', err);
      }
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load sales order details'));
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliersAndMaterials = async () => {
    try {
      const [sRes, mRes] = await Promise.all([
        supplierApi.getAllSuppliers(),
        materialApi.getAllMaterials(),
      ]);
      setSuppliers(sRes.data || []);
      setAllMaterials(mRes.data || []);
    } catch (err) {
      console.error('Failed to load suppliers/materials:', err);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      const res = await salesOrderApi.confirmSalesOrder(id);
      setOrder(res.data);
      success(`Order confirmed. Status updated to ${res.data.status}`);
      loadOrderDetails();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to confirm order'));
    }
  };

  const handleCheckMaterials = async () => {
    try {
      const res = await salesOrderApi.checkMaterials(id);
      setMaterialCheck(res.data);
      if (res.data.hasAnyShortage) {
        error(res.data.message);
      } else {
        success(res.data.message);
      }
      loadOrderDetails();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to check materials'));
    }
  };

  const handleStartProduction = async () => {
    try {
      await salesOrderApi.startProductionFromOrder(id);
      success('Production started! Raw materials consumed from inventory.');
      loadOrderDetails();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to start production'));
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const res = await invoiceApi.generateInvoice({ salesOrderId: Number(id) });
      success(`Invoice ${res.data.invoiceNumber} generated!`);
      navigate('/invoices');
    } catch (err) {
      error(getErrorMessage(err, 'Failed to generate invoice'));
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this sales order?')) return;
    try {
      await salesOrderApi.cancelSalesOrder(id);
      success('Sales order cancelled');
      loadOrderDetails();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to cancel order'));
    }
  };

  const openShortagePoDialog = () => {
    const shortages =
      materialCheck?.requirements
        ?.filter((r) => r.hasShortage)
        ?.map((r) => ({
          materialId: r.materialId,
          quantity: r.shortageQuantity,
          unitPrice: 50.0,
        })) || [];

    setPoForm({
      supplierId: suppliers[0]?.id || '',
      notes: `Procurement for sales order #${order.orderNumber} shortage`,
      items: shortages,
    });
    setIsPoDialogOpen(true);
  };

  const handlePoItemChange = (index, field, val) => {
    const updated = [...poForm.items];
    updated[index] = { ...updated[index], [field]: val };
    setPoForm({ ...poForm, items: updated });
  };

  const handleAddPoItem = () => {
    setPoForm({
      ...poForm,
      items: [
        ...poForm.items,
        {
          materialId: allMaterials[0]?.id || '',
          quantity: 100,
          unitPrice: 50.0,
        },
      ],
    });
  };

  const handleRemovePoItem = (index) => {
    setPoForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== index),
    });
  };

  const calculatePoTotal = () => {
    return poForm.items.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0;
      const p = parseFloat(it.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  };

  const handleCreatePoSubmit = async (e) => {
    e.preventDefault();
    if (!poForm.supplierId || poForm.items.length === 0) {
      error('Please select a supplier and include items');
      return;
    }

    setSubmittingPo(true);
    try {
      const payload = {
        supplierId: Number(poForm.supplierId),
        salesOrderId: Number(id),
        notes: poForm.notes,
        items: poForm.items.map((it) => ({
          materialId: Number(it.materialId),
          quantity: parseFloat(it.quantity),
          unitPrice: parseFloat(it.unitPrice),
        })),
      };

      const res = await purchaseOrderApi.createPurchaseOrder(payload);
      success(`Purchase Order ${res.data.purchaseOrderNumber} created for material shortage!`);
      setIsPoDialogOpen(false);
      navigate('/purchase-orders');
    } catch (err) {
      error(getErrorMessage(err, 'Failed to create purchase order'));
    } finally {
      setSubmittingPo(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        <span className="text-sm font-medium">Loading sales order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        <p>Order not found</p>
        <Link to="/sales-orders" className="text-sky-600 hover:underline mt-2 inline-block text-sm">
          &larr; Back to Sales Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link to="/sales-orders" className="hover:text-sky-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sales Orders</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-700">{order.orderNumber}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              Order {order.orderNumber}
            </h1>
            <StatusBadge status={order.status} />
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {order.status === 'DRAFT' && (
              <button
                onClick={handleConfirmOrder}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Order</span>
              </button>
            )}

            {(order.status === 'CONFIRMED' || order.status === 'SHORTAGE') && (
              <button
                onClick={handleCheckMaterials}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
              >
                <SearchCheck className="w-4 h-4" />
                <span>Check Materials</span>
              </button>
            )}

            {order.status === 'READY_FOR_PRODUCTION' && (
              <button
                onClick={handleStartProduction}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Production</span>
              </button>
            )}

            {order.status === 'COMPLETED' && (
              <button
                onClick={handleGenerateInvoice}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                <Receipt className="w-4 h-4" />
                <span>Generate Invoice</span>
              </button>
            )}

            {!['IN_PRODUCTION', 'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'].includes(order.status) && (
              <button
                onClick={handleCancelOrder}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Cards: Customer + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
            Customer Details
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-semibold text-slate-900">{order.customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Company:</span>
              <span className="text-slate-700">{order.customer?.companyName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-700">{order.customer?.email || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="text-slate-700">{order.customer?.phone || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST Number:</span>
              <span className="font-mono text-xs text-slate-700">
                {order.customer?.gstNumber || '—'}
              </span>
            </div>
            <div className="flex justify-between items-start pt-1">
              <span className="text-slate-500">Delivery Address:</span>
              <span className="text-slate-600 text-xs text-right max-w-xs">
                {order.customer?.address || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
            Order Summary
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Order Number:</span>
              <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Order Date:</span>
              <span className="text-slate-700">{order.orderDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Workflow Status:</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
              <span className="text-slate-600 font-semibold">Total Amount:</span>
              <span className="text-xl font-bold text-sky-700">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            {order.notes && (
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Notes:</span>
                <span className="text-slate-600 text-xs italic">{order.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Ordered Finished Goods
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Product Code</th>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Unit Price</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items && order.items.length > 0 ? (
                order.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {it.product?.productCode}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{it.product?.name}</td>
                    <td className="px-5 py-3.5 text-slate-700">{it.quantity} units</td>
                    <td className="px-5 py-3.5 text-slate-700">{formatCurrency(it.unitPrice)}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 text-right">
                      {formatCurrency(it.subtotal)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-6 text-center text-slate-400 text-sm">
                    No items in this order
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOM MATERIAL REQUIREMENT & SHORTAGE DETECTION ENGINE CARD */}
      {materialCheck && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  materialCheck.hasAnyShortage
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {materialCheck.hasAnyShortage ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  BOM Material Requirement & Shortage Detection Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated material consumption from active product Bill of Materials vs live inventory
                </p>
              </div>
            </div>

            {materialCheck.hasAnyShortage && (
              <button
                onClick={openShortagePoDialog}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors w-fit"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Create Purchase Order for Shortage</span>
              </button>
            )}
          </div>

          {/* Alert Notification Box */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
              materialCheck.hasAnyShortage
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {materialCheck.hasAnyShortage ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <div>
              <strong>
                {materialCheck.hasAnyShortage
                  ? 'Material Shortage Detected'
                  : 'Materials Fully In Stock'}
                :
              </strong>{' '}
              {materialCheck.message}
            </div>
          </div>

          {/* Requirements Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">In Stock</th>
                  <th className="px-4 py-3">Reserved</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Shortage</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialCheck.requirements?.map((req) => (
                  <tr
                    key={req.materialId}
                    className={`${req.hasShortage ? 'bg-rose-50/70' : 'hover:bg-slate-50/80'} transition-colors`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {req.materialCode}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{req.materialName}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {req.requiredQuantity} {req.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.currentStock} {req.unit}
                    </td>
                    <td className="px-4 py-3 font-semibold text-orange-600">
                      {req.reservedStock} {req.unit}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">
                      {req.availableStock} {req.unit}
                    </td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        req.hasShortage ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {req.hasShortage ? `-${req.shortageQuantity} ${req.unit}` : '0 ' + req.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={req.hasShortage ? 'SHORTAGE' : 'SUFFICIENT'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for creating PO to resolve shortages */}
      <Modal
        isOpen={isPoDialogOpen}
        onClose={() => setIsPoDialogOpen(false)}
        title="Create Purchase Order for Material Shortage"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreatePoSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={poForm.supplierId}
              onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.companyName || s.email || 'Supplier'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Procurement Notes
            </label>
            <input
              type="text"
              value={poForm.notes}
              onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>

          {/* Shortage Line items */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Materials to Purchase
              </h4>
              <button
                type="button"
                onClick={handleAddPoItem}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Material</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {poForm.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <select
                      value={item.materialId}
                      onChange={(e) => handlePoItemChange(index, 'materialId', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                      required
                    >
                      {allMaterials.map((m) => (
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
                      onChange={(e) => handlePoItemChange(index, 'quantity', e.target.value)}
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
                      onChange={(e) => handlePoItemChange(index, 'unitPrice', e.target.value)}
                      placeholder="Price"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePoItem(index)}
                    disabled={poForm.items.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-600">Total Purchase Cost:</span>
              <span className="text-lg font-bold text-purple-700">
                {formatCurrency(calculatePoTotal())}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsPoDialogOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPo}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {submittingPo && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Purchase Order</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesOrderDetail;
