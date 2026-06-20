import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  AlertTriangle,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Purchases = () => {
  const { searchQuery } = useApp();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [suppliers, setSuppliers] = useState([]);

  // Filters
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    supplier: '',
    purchasedQuantity: '',
    receivedQuantity: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'Pending'
  });

  // Load suppliers list from backend
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await api.get('/purchases/suppliers');
        setSuppliers(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            supplier: res.data[0]
          }));
        }
      } catch (err) {
        console.error('Error fetching suppliers list:', err);
      }
    };
    fetchSuppliers();
  }, []);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchases', {
        params: {
          page,
          limit: 10,
          supplier: filterSupplier,
          status: filterStatus,
          startDate,
          endDate,
          search: searchQuery
        }
      });
      setPurchases(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
      addToast('Failed to load purchases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, filterSupplier, filterStatus, startDate, endDate, searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      supplier: suppliers[0] || '',
      purchasedQuantity: '',
      receivedQuantity: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      supplier: item.supplier,
      purchasedQuantity: item.purchasedQuantity,
      receivedQuantity: item.receivedQuantity,
      purchaseDate: item.purchaseDate.split('T')[0],
      status: item.status
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.purchasedQuantity || parseFloat(formData.purchasedQuantity) <= 0) {
      addToast('Purchased quantity must be positive', 'error');
      return;
    }
    if (formData.receivedQuantity && parseFloat(formData.receivedQuantity) < 0) {
      addToast('Received quantity cannot be negative', 'error');
      return;
    }
    if (parseFloat(formData.receivedQuantity) > parseFloat(formData.purchasedQuantity)) {
      addToast('Received quantity cannot exceed purchased quantity', 'error');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/purchases/${editingId}`, formData);
        addToast('Purchase order updated successfully', 'success');
      } else {
        await api.post('/purchases', formData);
        addToast('Purchase order registered successfully', 'success');
      }
      setIsFormOpen(false);
      fetchPurchases();
    } catch (err) {
      console.error(err);
      addToast('Error saving purchase order', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/purchases/${id}`);
      addToast('Purchase order deleted successfully', 'success');
      setDeleteConfirmId(null);
      fetchPurchases();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete purchase order', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Purchase Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track and manage raw material purchases from suppliers.</p>
        </div>
        <button onClick={handleOpenAdd} className="premium-btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Place Purchase Order
        </button>
      </div>

      {/* Summary KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Received (Rod)</span>
          <h4 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
            {purchases.reduce((acc, curr) => acc + (curr.receivedQuantity || 0), 0).toFixed(3)} MT
          </h4>
        </div>
        <div className="glass-card p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pending Delivery</span>
          <h4 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {purchases.reduce((acc, curr) => acc + curr.pendingQuantity, 0).toFixed(3)} MT
          </h4>
        </div>
        <div className="glass-card p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Orders</span>
          <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {purchases.filter(p => p.status === 'Completed').length} Orders
          </h4>
        </div>
      </div>

      {/* Filters card */}
      <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Supplier</label>
          <select 
            value={filterSupplier} 
            onChange={(e) => { setFilterSupplier(e.target.value); setPage(1); }}
            className="premium-input bg-transparent"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="premium-input bg-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Completed">Completed</option>
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

      {/* Purchase Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Supplier</th>
                <th className="py-4 px-6">Purchased</th>
                <th className="py-4 px-6">Received</th>
                <th className="py-4 px-6">Pending</th>
                <th className="py-4 px-6">Delivery Progress</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading && purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">Loading purchase ledger...</td>
                </tr>
              ) : purchases.length === 0 ? (

                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">No purchase records found matching filters.</td>
                </tr>
              ) : (
                purchases.map((item) => {
                  const progress = item.purchasedQuantity > 0 
                    ? Math.round((item.receivedQuantity / item.purchasedQuantity) * 100) 
                    : 0;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                        {new Date(item.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{item.supplier}</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-350">{item.purchasedQuantity} MT</td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-350">{item.receivedQuantity} MT</td>
                      <td className="py-4 px-6 text-amber-600 dark:text-amber-400 font-medium">{item.pendingQuantity} MT</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                          item.status === 'Completed' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450' 
                            : item.status === 'Partially Received'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-450 rounded-lg hover:text-rose-505 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Showing page {page} of {pages} ({total} entries)</span>
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

      {/* Place Purchase Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-md w-full p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {editingId ? 'Edit Purchase Ledger Order' : 'Log Supplier Purchase Order'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supplier</label>
                  <select 
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    required
                    className="premium-input bg-transparent"
                  >
                    {suppliers.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Purchase Date</label>
                  <input 
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    required
                    className="premium-input bg-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Purchased Qty (MT)</label>
                    <input 
                      type="number"
                      step="0.001"
                      value={formData.purchasedQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchasedQuantity: e.target.value }))}
                      placeholder="e.g. 25.000"
                      required
                      className="premium-input bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Received Qty (MT)</label>
                    <input 
                      type="number"
                      step="0.001"
                      value={formData.receivedQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, receivedQuantity: e.target.value }))}
                      placeholder="e.g. 15.000"
                      className="premium-input bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="premium-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="premium-btn-primary">
                    Log Order
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
              className="glass-card max-w-sm w-full p-6 shadow-2xl text-xs"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Delete Order Entry</h4>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete this purchase order? Received quantities will be deducted from Raw Material stockpiles.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="premium-btn-secondary">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
                  Delete Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
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

export default Purchases;
