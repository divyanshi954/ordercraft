import React, { useState, useEffect } from 'react';
import { Store, Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { supplierApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

export const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const { hasAnyRole, hasRole } = useAuth();
  const { success, error } = useToast();

  const canManage = hasAnyRole(['ADMIN', 'PURCHASE']);
  const isAdmin = hasRole('ADMIN');

  useEffect(() => {
    loadSuppliers();
  }, [pageIndex, pageSize]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getSuppliers(searchQuery, pageIndex, pageSize);
      setSuppliers(res.data?.content || []);
      setTotalElements(res.data?.totalElements || 0);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load suppliers'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageIndex(0);
    loadSuppliers();
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setPageIndex(0);
    setTimeout(() => {
      supplierApi.getSuppliers('', 0, pageSize).then((res) => {
        setSuppliers(res.data?.content || []);
        setTotalElements(res.data?.totalElements || 0);
      });
    }, 0);
  };

  const openAddDialog = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (s) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name || '',
      companyName: s.companyName || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
    });
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Supplier / Contact Name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSupplier?.id) {
        await supplierApi.updateSupplier(editingSupplier.id, formData);
        success('Supplier updated successfully');
      } else {
        await supplierApi.createSupplier(formData);
        success('Supplier added successfully');
      }
      setIsDialogOpen(false);
      loadSuppliers();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to save supplier'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${s.name}"?`)) return;

    try {
      await supplierApi.deleteSupplier(s.id);
      success('Supplier deleted successfully');
      loadSuppliers();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to delete supplier'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Store className="w-6 h-6 text-sky-600" />
            Supplier Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Vendors and procurement sources for raw material supply
          </p>
        </div>
        {canManage && (
          <button
            onClick={openAddDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-sky-600/20 transition-colors w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
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
              placeholder="Search by name, company, email..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 bg-white"
            />
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadSuppliers}
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
                <th className="px-5 py-3">Supplier Name</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Address</th>
                {canManage && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length > 0 ? (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{s.name}</td>
                    <td className="px-5 py-3.5 text-slate-700">{s.companyName || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.email || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{s.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs max-w-xs truncate">
                      {s.address || '—'}
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditDialog(s)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Supplier"
                            >
                              <Trash2 className="w-4 h-4" />
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
                    colSpan={canManage ? 6 : 5}
                    className="px-5 py-10 text-center text-slate-400 text-sm"
                  >
                    No suppliers found
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

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supplier / Contact Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Precision Steel Co"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Precision Steel & Alloys Ltd"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sales@precisionsteel.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98220 00000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Facility & Depot Address
            </label>
            <textarea
              rows="3"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter supplier depot and contact address"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
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
              <span>Save Supplier</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Suppliers;
