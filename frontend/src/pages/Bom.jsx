import React, { useState, useEffect } from 'react';
import { GitFork, Plus, Edit2, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { bomApi, productApi, materialApi, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export const Bom = () => {
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBom, setEditingBom] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    version: 'v1.0',
    active: true,
    items: [{ materialId: '', quantityRequired: 1 }],
  });
  const [submitting, setSubmitting] = useState(false);

  const { hasAnyRole, hasRole } = useAuth();
  const { success, error } = useToast();

  const canManage = hasAnyRole(['ADMIN', 'PRODUCTION']);
  const isAdmin = hasRole('ADMIN');

  useEffect(() => {
    loadBoms();
    loadCatalogOptions();
  }, []);

  const loadBoms = async () => {
    setLoading(true);
    try {
      const res = await bomApi.getBoms();
      setBoms(res.data || []);
    } catch (err) {
      error(getErrorMessage(err, 'Failed to load Bill of Materials'));
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogOptions = async () => {
    try {
      const [prodRes, matRes] = await Promise.all([
        productApi.getAllProducts(),
        materialApi.getAllMaterials(),
      ]);
      setProducts(prodRes.data || []);
      setMaterials(matRes.data || []);
    } catch (err) {
      console.error('Failed to load products/materials for BOM dialog:', err);
    }
  };

  const openAddDialog = () => {
    setEditingBom(null);
    setFormData({
      productId: products[0]?.id || '',
      version: 'v1.0',
      active: true,
      items: [{ materialId: materials[0]?.id || '', quantityRequired: 1 }],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (bom) => {
    setEditingBom(bom);
    setFormData({
      productId: bom.product?.id || '',
      version: bom.version || 'v1.0',
      active: bom.active !== undefined ? bom.active : true,
      items: bom.items?.map((it) => ({
        materialId: it.material?.id || '',
        quantityRequired: it.quantityRequired || 1,
      })) || [{ materialId: '', quantityRequired: 1 }],
    });
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { materialId: materials[0]?.id || '', quantityRequired: 1 },
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

  const handleItemChange = (index, field, val) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, items: updated });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || formData.items.length === 0) {
      error('Please select a product and add at least one material');
      return;
    }

    // Validate material IDs and quantities
    for (const item of formData.items) {
      if (!item.materialId || parseFloat(item.quantityRequired) <= 0) {
        error('All BOM items must have a valid material and positive quantity');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        productId: Number(formData.productId),
        version: formData.version,
        active: Boolean(formData.active),
        items: formData.items.map((it) => ({
          materialId: Number(it.materialId),
          quantityRequired: parseFloat(it.quantityRequired),
        })),
      };

      if (editingBom?.id) {
        await bomApi.updateBom(editingBom.id, payload);
        success('BOM updated successfully');
      } else {
        await bomApi.createBom(payload);
        success('BOM created successfully');
      }
      setIsDialogOpen(false);
      loadBoms();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to save BOM'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bom) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the BOM for "${bom.product?.name}"?`
      )
    )
      return;

    try {
      await bomApi.deleteBom(bom.id);
      success('BOM deleted successfully');
      loadBoms();
    } catch (err) {
      error(getErrorMessage(err, 'Failed to delete BOM'));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GitFork className="w-6 h-6 text-sky-600" />
            Bill of Materials (BOM)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Product manufacturing recipes, material requirements per unit, and versioning
          </p>
        </div>
        {canManage && (
          <button
            onClick={openAddDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-sky-600/20 transition-colors w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Create New BOM</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="w-full bg-sky-50 p-3 rounded-lg flex items-center justify-center gap-2 text-sky-700 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading Bill of Materials...</span>
        </div>
      )}

      {/* BOM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boms.length > 0 ? (
          boms.map((bom) => (
            <div
              key={bom.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {bom.product?.category || 'Standard'}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5 leading-snug">
                      {bom.product?.name}
                    </h2>
                    <span className="font-mono text-xs text-sky-600">
                      {bom.product?.productCode}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase border ${
                      bom.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {bom.active ? `ACTIVE ${bom.version}` : `INACTIVE ${bom.version}`}
                  </span>
                </div>

                {/* Materials List */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 my-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Required Materials per Unit:
                  </span>
                  <div className="space-y-1.5">
                    {bom.items && bom.items.length > 0 ? (
                      bom.items.map((it) => (
                        <div
                          key={it.id || it.material?.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-800">
                            {it.material?.name}:
                          </span>
                          <span className="font-bold text-sky-700">
                            {it.quantityRequired} {it.material?.unit}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No raw materials listed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canManage && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditDialog(bom)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit BOM</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(bom)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : !loading ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No Bill of Materials configured yet. Click "Create New BOM" to define a recipe.
          </div>
        ) : null}
      </div>

      {/* Add / Edit BOM Modal */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingBom ? 'Edit Bill of Materials' : 'Create Bill of Materials (BOM)'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Finished Product <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 bg-white"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.productCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                BOM Version <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="v1.0"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activeBomCheckbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <label htmlFor="activeBomCheckbox" className="text-sm font-medium text-slate-700">
              Set as Active BOM for this Product
            </label>
          </div>

          {/* Dynamic Materials Section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Required Raw Materials (per finished unit)
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

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <select
                      value={item.materialId}
                      onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
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

                  <div className="w-36">
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      value={item.quantityRequired}
                      onChange={(e) => handleItemChange(index, 'quantityRequired', e.target.value)}
                      placeholder="Qty"
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
              <span>Save BOM</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Bom;
