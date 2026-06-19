import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Production = () => {
  const { searchQuery } = useApp();
  const [productionData, setProductionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [filterProduct, setFilterProduct] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'Shift A',
    productType: 'Binding Wire',
    productSize: '20 SWG',
    brand: '',
    packaging: '25 Kg',
    quantity: '',
    bags: '',
    remarks: '',
    status: 'Completed'
  });

  const [brands, setBrands] = useState([]);

  // Load brands list from backend
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get('/production/brands');
        setBrands(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            brand: res.data[0]
          }));
        }
      } catch (err) {
        console.error('Error fetching brands list:', err);
      }
    };
    fetchBrands();
  }, []);

  // Confirm delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Toast alerts state
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchProduction = async () => {
    try {
      setLoading(true);
      const res = await api.get('/production', {
        params: {
          page,
          limit: 10,
          productType: filterProduct,
          shift: filterShift,
          startDate,
          endDate,
          search: searchQuery
        }
      });
      setProductionData(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
      addToast('Failed to load production records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduction();
  }, [page, filterProduct, filterShift, startDate, endDate, searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      shift: 'Shift A',
      productType: 'Binding Wire',
      productSize: '20 SWG',
      brand: brands[0] || '',
      packaging: '25 Kg',
      quantity: '',
      bags: '',
      remarks: '',
      status: 'Completed'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      date: item.date.split('T')[0],
      shift: item.shift,
      productType: item.productType,
      productSize: item.productSize,
      brand: item.brand || 'Unpacked',
      packaging: item.packaging || '25 Kg',
      quantity: item.quantity,
      bags: item.bags || '',
      remarks: item.remarks || '',
      status: item.status || 'Completed'
    });
    setIsFormOpen(true);
  };

  const handleProductTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      productType: type,
      productSize: type === 'Binding Wire' ? '20 SWG' : '1.5"',
      brand: type === 'Binding Wire' ? (brands[0] || '') : '',
      packaging: type === 'Binding Wire' ? '25 Kg' : '',
      bags: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      addToast('Please enter a valid positive quantity', 'error');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/production/${editingId}`, formData);
        addToast('Production record updated successfully', 'success');
      } else {
        await api.post('/production', formData);
        addToast('Production record logged successfully', 'success');
      }
      setIsFormOpen(false);
      fetchProduction();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Error saving production log', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/production/${id}`);
      addToast('Production record deleted successfully', 'success');
      setDeleteConfirmId(null);
      fetchProduction();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete production record', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Daily Production Module</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Log and manage factory shift production outputs.</p>
        </div>
        <button onClick={handleOpenAdd} className="premium-btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Log Production Output
        </button>
      </div>

      {/* Filters card */}
      <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Product Type</label>
          <select 
            value={filterProduct} 
            onChange={(e) => { setFilterProduct(e.target.value); setPage(1); }}
            className="premium-input bg-transparent"
          >
            <option value="">All Products</option>
            <option value="Binding Wire">Binding Wire</option>
            <option value="Nails">Nails</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Shift</label>
          <select 
            value={filterShift} 
            onChange={(e) => { setFilterShift(e.target.value); setPage(1); }}
            className="premium-input bg-transparent"
          >
            <option value="">All Shifts</option>
            <option value="Shift A">Shift A</option>
            <option value="Shift B">Shift B</option>
            <option value="Shift C">Shift C</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="premium-input bg-transparent"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="premium-input bg-transparent"
          />
        </div>
      </div>

      {/* Production Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">Specifications</th>
                <th className="py-4 px-6">Quantity (MT)</th>
                <th className="py-4 px-6">Shift</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">Loading production database...</td>
                </tr>
              ) : productionData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">No production logs found matching the filter options.</td>
                </tr>
              ) : (
                productionData.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                      {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                        item.productType === 'Binding Wire' 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' 
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                      }`}>
                        {item.productType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-650 dark:text-slate-350">
                      {item.productType === 'Binding Wire' 
                        ? `${item.brand} | ${item.productSize} | ${item.packaging}`
                        : `Nail Size: ${item.productSize}${item.bags ? ` | ${item.bags} Bags` : ''}`}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-950 dark:text-white">{item.quantity} MT</td>
                    <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400">{item.shift}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                        item.status === 'Completed' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : item.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-450 rounded-lg hover:text-primary-500 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(item._id)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-450 rounded-lg hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Showing page {page} of {pages} ({total} total entries)</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Production Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editingId ? 'Edit Production Record' : 'Log Daily Shift Production'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                    <input 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                      className="premium-input bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shift</label>
                    <select 
                      value={formData.shift}
                      onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value }))}
                      required
                      className="premium-input bg-transparent"
                    >
                      <option value="Shift A">Shift A</option>
                      <option value="Shift B">Shift B</option>
                      <option value="Shift C">Shift C</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Type</label>
                    <select 
                      value={formData.productType}
                      onChange={handleProductTypeChange}
                      required
                      className="premium-input bg-transparent"
                    >
                      <option value="Binding Wire">Binding Wire</option>
                      <option value="Nails">Nails</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Size</label>
                    {formData.productType === 'Binding Wire' ? (
                      <select 
                        value={formData.productSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, productSize: e.target.value }))}
                        required
                        className="premium-input bg-transparent"
                      >
                        <option value="20 SWG">20 SWG (0.91 mm)</option>
                        <option value="18 SWG">18 SWG (1.22 mm)</option>
                        <option value="14 SWG">14 SWG (2.00 mm)</option>
                      </select>
                    ) : (
                      <select 
                        value={formData.productSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, productSize: e.target.value }))}
                        required
                        className="premium-input bg-transparent"
                      >
                        <option value='1"'>1"</option>
                        <option value='1.5"'>1.5"</option>
                        <option value='2"'>2"</option>
                        <option value='2.5"'>2.5"</option>
                        <option value='3"'>3"</option>
                        <option value='4"'>4"</option>
                      </select>
                    )}
                  </div>
                </div>

                {formData.productType === 'Binding Wire' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Brand</label>
                      <select 
                        value={formData.brand}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        required
                        className="premium-input bg-transparent"
                      >
                        {brands.map(brandName => (
                          <option key={brandName} value={brandName}>{brandName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Packaging</label>
                      <select 
                        value={formData.packaging}
                        onChange={(e) => setFormData(prev => ({ ...prev, packaging: e.target.value }))}
                        required
                        className="premium-input bg-transparent"
                      >
                        <option value="25 Kg">25 Kg</option>
                        <option value="5 Kg">5 Kg</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity (MT)</label>
                    <input 
                      type="number"
                      step="0.001"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="e.g. 1.450"
                      required
                      className="premium-input bg-transparent"
                    />
                  </div>
                  {formData.productType === 'Nails' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bags Quantity (50 Kg/Bag)</label>
                      <input 
                        type="number"
                        value={formData.bags}
                        onChange={(e) => setFormData(prev => ({ ...prev, bags: e.target.value }))}
                        placeholder="e.g. 40"
                        required
                        className="premium-input bg-transparent"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        required
                        className="premium-input bg-transparent"
                      >
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  )}
                </div>

                {formData.productType === 'Nails' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        required
                        className="premium-input bg-transparent"
                      >
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks</label>
                  <textarea 
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Log details like quality, downtime or shifts notes"
                    className="premium-input bg-transparent min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="premium-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="premium-btn-primary">
                    {editingId ? 'Save Updates' : 'Confirm Log'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-sm w-full p-6 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Delete Production Record</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete this log? Doing so will revert inventory additions and adjust raw material consumption metrics. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="premium-btn-secondary">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold">
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts List */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-4 rounded-xl flex items-center gap-3 shadow-lg border text-xs font-semibold ${
                t.type === 'error' 
                  ? 'bg-rose-50 border-rose-250 text-rose-600 dark:bg-rose-950/80 dark:border-rose-900 dark:text-rose-450' 
                  : 'bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/80 dark:border-emerald-900 dark:text-emerald-450'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Production;
