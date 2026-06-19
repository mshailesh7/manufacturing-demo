import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  AlertTriangle,
  Layers,
  Sparkles,
  Archive,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const Inventory = () => {
  const { searchQuery, darkMode } = useApp();
  const [rawMaterials, setRawMaterials] = useState(null);
  const [finishedStock, setFinishedStock] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    productType: 'Binding Wire',
    brand: '',
    size: '20 SWG',
    packaging: '25 Kg',
    bags: '',
    quantity: ''
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

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [rmRes, fgRes] = await Promise.all([
        api.get('/inventory/raw-materials'),
        api.get('/inventory', { params: { search: searchQuery } })
      ]);
      setRawMaterials(rmRes.data);
      setFinishedStock(fgRes.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      productType: 'Binding Wire',
      brand: brands[0] || '',
      size: '20 SWG',
      packaging: '25 Kg',
      bags: '',
      quantity: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      productType: item.productType,
      brand: item.brand || 'Unpacked',
      size: item.size,
      packaging: item.packaging || '25 Kg',
      bags: item.bags || '',
      quantity: item.quantity
    });
    setIsFormOpen(true);
  };

  const handleProductTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      productType: type,
      brand: type === 'Binding Wire' ? (brands[0] || '') : '',
      size: type === 'Binding Wire' ? '20 SWG' : '1.5"',
      packaging: type === 'Binding Wire' ? '25 Kg' : '',
      bags: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      addToast('Please enter a valid stock quantity', 'error');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/inventory/${editingId}`, formData);
        addToast('Stock level adjusted successfully', 'success');
      } else {
        await api.post('/inventory', formData);
        addToast('Stock item logged successfully', 'success');
      }
      setIsFormOpen(false);
      fetchInventoryData();
    } catch (err) {
      console.error(err);
      addToast('Failed to save stock adjustment', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/inventory/${id}`);
      addToast('Stock item removed successfully', 'success');
      setDeleteConfirmId(null);
      fetchInventoryData();
    } catch (err) {
      console.error(err);
      addToast('Failed to remove stock item', 'error');
    }
  };

  if (loading && !rawMaterials) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Filter finished goods lists
  const bindingWireItems = finishedStock.filter(item => item.productType === 'Binding Wire');
  const nailsItems = finishedStock.filter(item => item.productType === 'Nails');

  // Chart data representation of Finished Stock
  const chartData = finishedStock.map(item => ({
    name: item.productType === 'Binding Wire' ? `${item.brand} ${item.size}` : `Nails ${item.size}`,
    qty: item.quantity
  }));

  const BW_COLORS = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inventory Control Module</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track and adjust raw materials and finished goods stockpiles.</p>
        </div>
        <button onClick={handleOpenAdd} className="premium-btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Adjust Finished Stock
        </button>
      </div>

      {/* Raw Material Stock Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-4">Raw Material Stock</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wire Rod */}
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wire Rod (Hot Rolled)</span>
              <h4 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
                {rawMaterials?.wireRod.quantity.toLocaleString()} MT
              </h4>
              <p className="text-[10px] text-slate-400 mt-2">
                Last Received: {new Date(rawMaterials?.wireRod.lastUpdated).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                rawMaterials?.wireRod.status === 'Ok' 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' 
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${rawMaterials?.wireRod.status === 'Ok' ? 'bg-emerald-505 bg-emerald-500' : 'bg-amber-500'}`} />
                {rawMaterials?.wireRod.status}
              </span>
            </div>
          </div>

          {/* Wire Rod In Process */}
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wire Rod In Process (Drawing)</span>
              <h4 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
                {rawMaterials?.wireRodInProcess.quantity.toLocaleString()} MT
              </h4>
              <p className="text-[10px] text-slate-400 mt-2">
                Last Consumed: {new Date(rawMaterials?.wireRodInProcess.lastUpdated).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                rawMaterials?.wireRodInProcess.status === 'Ok' 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' 
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${rawMaterials?.wireRodInProcess.status === 'Ok' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {rawMaterials?.wireRodInProcess.status}
              </span>
            </div>
          </div>

          {/* Combined Inventory Summary Chart card */}
          <div className="glass-card p-4 flex flex-col justify-between md:row-span-1 h-36 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Finished Stock</span>
            <div className="h-20">
              <ResponsiveContainer width="100%" height={80} minWidth={0}>
                <BarChart data={chartData.slice(0, 5)}>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '10px'
                    }} 
                  />
                  <Bar dataKey="qty" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Finished Goods Inventory lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Binding Wire */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-150 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <Archive className="h-4 w-4 text-blue-500" /> Binding Wire Stock
            </h4>
            <span className="text-[10px] font-bold text-slate-400">
              {bindingWireItems.reduce((acc, curr) => acc + curr.quantity, 0).toFixed(3)} MT Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                  <th className="pb-3">Brand</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Pkg</th>
                  <th className="pb-3">Stock Qty</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {bindingWireItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">No Binding Wire stock records.</td>
                  </tr>
                ) : (
                  bindingWireItems.map((item, index) => (
                    <tr key={item._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/30">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.brand}</td>
                      <td className="py-3 text-slate-500">{item.size}</td>
                      <td className="py-3 text-slate-500">{item.packaging}</td>
                      <td className="py-3 font-bold text-slate-950 dark:text-white">{item.quantity} MT</td>
                      <td className="py-3 text-right space-x-1">
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded hover:text-primary-500"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(item._id)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 rounded hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nails */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-150 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4 text-indigo-500" /> Nails Stock
            </h4>
            <span className="text-[10px] font-bold text-slate-400">
              {nailsItems.reduce((acc, curr) => acc + curr.quantity, 0).toFixed(3)} MT Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Bags (~50kg)</th>
                  <th className="pb-3">Stock Qty</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {nailsItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">No Nails stock records.</td>
                  </tr>
                ) : (
                  nailsItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/30">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">Nails {item.size}</td>
                      <td className="py-3 text-slate-550 dark:text-slate-400">{item.bags} Bags</td>
                      <td className="py-3 font-bold text-slate-950 dark:text-white">{item.quantity} MT</td>
                      <td className="py-3 text-right space-x-1">
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded hover:text-primary-500"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(item._id)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 rounded hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Adjust Inventory Modal */}
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
                  {editingId ? 'Edit Stock Record' : 'Manually Adjust Stock Levels'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Type</label>
                  <select 
                    value={formData.productType}
                    onChange={handleProductTypeChange}
                    disabled={editingId !== null}
                    required
                    className="premium-input bg-transparent disabled:opacity-50"
                  >
                    <option value="Binding Wire">Binding Wire</option>
                    <option value="Nails">Nails</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Size</label>
                  {formData.productType === 'Binding Wire' ? (
                    <select 
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                      disabled={editingId !== null}
                      required
                      className="premium-input bg-transparent"
                    >
                      <option value="20 SWG">20 SWG (0.91 mm)</option>
                      <option value="18 SWG">18 SWG (1.22 mm)</option>
                      <option value="14 SWG">14 SWG (2.00 mm)</option>
                    </select>
                  ) : (
                    <select 
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                      disabled={editingId !== null}
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

                {formData.productType === 'Binding Wire' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Brand</label>
                      <select 
                        value={formData.brand}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        disabled={editingId !== null}
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
                        disabled={editingId !== null}
                        required
                        className="premium-input bg-transparent"
                      >
                        <option value="25 Kg">25 Kg</option>
                        <option value="5 Kg">5 Kg</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bags Quantity</label>
                    <input 
                      type="number"
                      value={formData.bags}
                      onChange={(e) => setFormData(prev => ({ ...prev, bags: e.target.value, quantity: prev.quantity || (e.target.value * 0.05).toFixed(3) }))}
                      placeholder="Number of 50kg bags"
                      className="premium-input bg-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Quantity (MT)</label>
                  <input 
                    type="number"
                    step="0.001"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="Stock quantity in Metric Tons"
                    required
                    className="premium-input bg-transparent"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="premium-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="premium-btn-primary">
                    Save Stock Settings
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
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Delete Stock Record</h4>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete this finished goods stock record? Outbound dispatch validations may fail if stock becomes negative.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="premium-btn-secondary">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
                  Delete Stock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast feedback alerts */}
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

export default Inventory;
