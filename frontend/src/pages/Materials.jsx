import React, { useState, useEffect } from 'react';
import { Layers, Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { materialApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

export const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    materialCode: '',
    name: '',
    unit: 'kg',
    currentStock: 0,
    reorderLevel: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const { hasAnyRole, hasRole } = useAuth();
  const { success, error } = useToast();

  const canManage = hasAnyRole(['ADMIN', 'PURCHASE', 'PRODUCTION']);
  const isAdmin = hasRole('ADMIN');

  useEffect(() => {
    loadMaterials();
  }, [pageIndex, pageSize]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await materialApi.getMaterials(searchQuery, pageIndex, pageSize);
      setMaterials(res.data?.content || []);
      setTotalElements(res.data?.totalElements || 0);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load materials'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageIndex(0);
    loadMaterials();
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setPageIndex(0);
    setTimeout(() => {
      materialApi.getMaterials('', 0, pageSize).then((res) => {
        setMaterials(res.data?.content || []);
        setTotalElements(res.data?.totalElements || 0);
      });
    }, 0);
  };

  const openAddDialog = () => {
    setEditingMaterial(null);
    setFormData({
      materialCode: '',
      name: '',
      unit: 'kg',
      currentStock: 0,
      reorderLevel: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (m) => {
    setEditingMaterial(m);
    setFormData({
      materialCode: m.materialCode || '',
      name: m.name || '',
      unit: m.unit || 'kg',
      currentStock: m.currentStock ?? 0,
      reorderLevel: m.reorderLevel ?? 0,
    });
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.materialCode.trim() || !formData.name.trim()) {
      error('Material Code and Name are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        currentStock: parseFloat(formData.currentStock) || 0,
        reorderLevel: parseFloat(formData.reorderLevel) || 0,
      };

      if (editingMaterial?.id) {
        await materialApi.updateMaterial(editingMaterial.id, payload);
        success('Material updated successfully');
      } else {
        await materialApi.createMaterial(payload);
        success('Material added successfully');
      }
      setIsDialogOpen(false);
      loadMaterials();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to save raw material'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Are you sure you want to delete material "${m.name}"?`)) return;

    try {
      await materialApi.deleteMaterial(m.id);
      success('Material deleted successfully');
      loadMaterials();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to delete material'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-sky-600" />
            Raw Materials & Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time stock tracking, reserved allocation, reorder warnings, and inventory control
          </p>
        </div>
        {canManage && (
          <button
            onClick={openAddDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-sky-600/20 transition-colors w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Material</span>
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
              placeholder="Search by name, code..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 bg-white"
            />
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadMaterials}
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
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Material Name</th>
                <th className="px-5 py-3">Unit</th>
                <th className="px-5 py-3">Current Stock</th>
                <th className="px-5 py-3">Reserved</th>
                <th className="px-5 py-3">Available</th>
                <th className="px-5 py-3">Reorder Level</th>
                <th className="px-5 py-3">Status</th>
                {canManage && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.length > 0 ? (
                materials.map((m) => {
                  const available = Math.max(0, m.currentStock - m.reservedStock);
                  const isLow = m.currentStock <= m.reorderLevel;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{m.materialCode}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{m.name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{m.unit}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{m.currentStock}</td>
                      <td className="px-5 py-3.5 font-semibold text-orange-600">{m.reservedStock}</td>
                      <td className="px-5 py-3.5 font-bold text-emerald-600">{available}</td>
                      <td className="px-5 py-3.5 text-slate-600">{m.reorderLevel}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={isLow ? 'LOW STOCK' : 'IN STOCK'} />
                      </td>
                      {canManage && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditDialog(m)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                              title="Edit Material"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(m)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Material"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : !loading ? (
                <tr>
                  <td
                    colSpan={canManage ? 9 : 8}
                    className="px-5 py-10 text-center text-slate-400 text-sm"
                  >
                    No materials found
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

      {/* Add / Edit Material Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingMaterial ? 'Edit Raw Material' : 'Add New Raw Material'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Material Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.materialCode}
                onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                placeholder="e.g. MAT-STL-01"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-mono text-xs uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
                required
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="litre">Litres (litre)</option>
                <option value="metre">Metres (metre)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="sqm">Square Metres (sqm)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Material Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cold Rolled Steel Sheet"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Stock ({formData.unit})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                placeholder="1500"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reorder Threshold ({formData.unit})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                placeholder="500"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
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
              <span>Save Raw Material</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Materials;
