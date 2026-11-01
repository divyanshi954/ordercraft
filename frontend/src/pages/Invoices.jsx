import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Search,
  CreditCard,
  Printer,
  XCircle,
  X,
  Cpu,
  Loader2,
} from 'lucide-react';
import { invoiceApi, paymentApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

export const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // View Invoice Dialog
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Payment Dialog State
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    transactionReference: '',
    notes: '',
  });
  const [submittingPay, setSubmittingPay] = useState(false);

  const { hasAnyRole } = useAuth();
  const { success, error } = useToast();

  const canRecordPayment = hasAnyRole(['ADMIN', 'ACCOUNTS']);

  useEffect(() => {
    loadInvoices();
  }, [pageIndex, pageSize]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.getInvoices(searchQuery, pageIndex, pageSize);
      setInvoices(res.data?.content || []);
      setTotalElements(res.data?.totalElements || 0);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load invoices'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageIndex(0);
    loadInvoices();
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setPageIndex(0);
    setTimeout(() => {
      invoiceApi.getInvoices('', 0, pageSize).then((res) => {
        setInvoices(res.data?.content || []);
        setTotalElements(res.data?.totalElements || 0);
      });
    }, 0);
  };

  const handleCancelInvoice = async (inv) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel invoice ${inv.invoiceNumber}? The order will revert to COMPLETED status so it can be re-invoiced.`
      )
    ) {
      return;
    }
    try {
      await invoiceApi.cancelInvoice(inv.id);
      success(`Invoice ${inv.invoiceNumber} cancelled successfully`);
      loadInvoices();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to cancel invoice'));
    }
  };

  const openViewDialog = (inv) => {
    setSelectedInvoice(inv);
    setIsViewDialogOpen(true);
  };

  const openPayDialog = (inv) => {
    const remaining = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
    setPayingInvoice(inv);
    setPaymentForm({
      amount: remaining,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: '',
      notes: '',
    });
    setIsPayDialogOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const remaining = Math.max(
      0,
      payingInvoice.totalAmount - (payingInvoice.paidAmount || 0)
    );
    const amountNum = parseFloat(paymentForm.amount);

    if (amountNum <= 0) {
      error('Payment amount must be greater than 0');
      return;
    }
    if (amountNum > remaining) {
      error(`Payment amount cannot exceed balance (₹${remaining.toFixed(2)})`);
      return;
    }

    setSubmittingPay(true);
    try {
      const payload = {
        invoiceId: payingInvoice.id,
        amount: amountNum,
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference,
        notes: paymentForm.notes,
      };

      await paymentApi.recordPayment(payload);
      success('Payment recorded successfully!');
      setIsPayDialogOpen(false);
      loadInvoices();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to record payment'));
    } finally {
      setSubmittingPay(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Receipt className="w-6 h-6 text-sky-600" />
          Tax Invoices & Billing
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Commercial invoices with automated 18% GST calculation and settlement tracking
        </p>
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
              placeholder="Search by invoice #, order #, customer..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 bg-white"
            />
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadInvoices}
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
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Sales Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">GST (18%)</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length > 0 ? (
                invoices.map((inv) => {
                  const balance = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5 font-bold font-mono">
                        <Link
                          to={`/sales-orders/${inv.salesOrder?.id}`}
                          className="text-sky-600 hover:underline"
                        >
                          {inv.salesOrder?.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {inv.salesOrder?.customer?.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{inv.invoiceDate}</td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {formatCurrency(inv.subtotal)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {formatCurrency(inv.taxAmount)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-emerald-600">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td
                        className={`px-4 py-3.5 font-bold ${
                          balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(balance)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canRecordPayment &&
                            inv.status !== 'PAID' &&
                            inv.status !== 'CANCELLED' && (
                              <button
                                onClick={() => openPayDialog(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
                                title="Record payment installment"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay</span>
                              </button>
                            )}

                          <button
                            onClick={() => openViewDialog(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="View / Print Tax Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {canRecordPayment &&
                            (inv.status === 'ISSUED' || inv.status === 'OVERDUE') &&
                            (!inv.paidAmount || Number(inv.paidAmount) === 0) && (
                              <button
                                onClick={() => handleCancelInvoice(inv)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Cancel Invoice (reverts order to COMPLETED)"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : !loading ? (
                <tr>
                  <td colSpan="11" className="px-5 py-10 text-center text-slate-400 text-sm">
                    No invoices generated yet
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayDialogOpen}
        onClose={() => setIsPayDialogOpen(false)}
        title="Record Customer Payment"
        maxWidth="max-w-md"
      >
        {payingInvoice && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {/* Balance Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(payingInvoice.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Already Paid:</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(payingInvoice.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5 text-sm">
                <span>Remaining Balance:</span>
                <span className="text-sky-700">
                  {formatCurrency(
                    Math.max(0, payingInvoice.totalAmount - (payingInvoice.paidAmount || 0))
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={Math.max(0, payingInvoice.totalAmount - (payingInvoice.paidAmount || 0))}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Ref #
                </label>
                <input
                  type="text"
                  value={paymentForm.transactionReference}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      transactionReference: e.target.value,
                    })
                  }
                  placeholder="e.g. TXN-UPI-992812"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Notes
              </label>
              <input
                type="text"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="e.g. Installment 1 / Full settlement"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPayDialogOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPay}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {submittingPay && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Record Payment</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Printable Tax Invoice Modal */}
      <Modal
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        title="Tax Invoice"
        maxWidth="max-w-3xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex justify-end print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>

            {/* Printable Document Sheet */}
            <div className="bg-white p-6 sm:p-8 border border-slate-200 rounded-xl space-y-6 text-slate-800">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-sky-600 font-bold text-lg mb-1">
                    <Cpu className="w-6 h-6" />
                    <span>OrderCraft Manufacturing</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Plot 45, Industrial Automation Park, MIDC<br />
                    Pune, Maharashtra 411019, India<br />
                    GSTIN: 27AABCO1928K1Z3
                  </p>
                </div>

                <div className="sm:text-right">
                  <h2 className="text-2xl font-extrabold text-sky-700 tracking-tight">
                    TAX INVOICE
                  </h2>
                  <div className="text-xs text-slate-600 space-y-0.5 mt-2">
                    <div>
                      <strong>Invoice #:</strong>{' '}
                      <span className="font-mono">{selectedInvoice.invoiceNumber}</span>
                    </div>
                    <div>
                      <strong>Date:</strong> {selectedInvoice.invoiceDate}
                    </div>
                    <div>
                      <strong>Due Date:</strong> {selectedInvoice.dueDate}
                    </div>
                    <div>
                      <strong>Sales Order:</strong>{' '}
                      <span className="font-mono">
                        {selectedInvoice.salesOrder?.orderNumber}
                      </span>
                    </div>
                    <div className="pt-1">
                      <StatusBadge status={selectedInvoice.status} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-900 uppercase tracking-wider block mb-1">
                  Billed To:
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {selectedInvoice.salesOrder?.customer?.name}
                </div>
                <div>{selectedInvoice.salesOrder?.customer?.companyName}</div>
                <div>{selectedInvoice.salesOrder?.customer?.address}</div>
                <div>
                  <strong>GSTIN:</strong>{' '}
                  {selectedInvoice.salesOrder?.customer?.gstNumber || 'N/A'}
                </div>
                <div>
                  <strong>Email:</strong> {selectedInvoice.salesOrder?.customer?.email} |{' '}
                  <strong>Phone:</strong> {selectedInvoice.salesOrder?.customer?.phone}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Item & Description</th>
                      <th className="px-4 py-2.5 text-right">Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-900 block">
                            {it.product?.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {it.product?.productCode}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">{it.quantity}</td>
                        <td className="px-4 py-2.5 text-right">
                          {formatCurrency(it.unitPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
                <div className="text-xs text-slate-500 space-y-1 max-w-sm">
                  <strong className="text-slate-700 block">Terms & Notes:</strong>
                  <p>
                    {selectedInvoice.notes ||
                      'Payment is due within 30 days of issuance. Goods manufactured to specification.'}
                  </p>
                </div>

                <div className="w-full sm:w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST ({selectedInvoice.taxRate}%):</span>
                    <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-b border-slate-800 py-2">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold text-sm pt-1">
                    <span>Balance Due:</span>
                    <span>
                      {formatCurrency(
                        Math.max(
                          0,
                          selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0)
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
