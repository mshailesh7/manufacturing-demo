import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  AlertTriangle,
  Truck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dispatches = () => {
  const { searchQuery } = useApp();
  const [dispatches, setDispatches] = useState([]);
  const [kpis, setKpis] = useState({ today: 0, monthly: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [filterProduct, setFilterProduct] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    productType: 'Binding Wire',
    productSize: '20 SWG',
    brand: '',
    packaging: '25 Kg',
    quantity: '',
    vehicleNumber: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'Dispatched'
  });

  const [inventory, setInventory] = useState([]);

  // Helper to get available items for dropdowns, including the item currently being edited
  const editingItem = editingId ? dispatches.find(d => d._id === editingId) : null;

  const getAvailableItems = () => {
    const inStock = inventory.filter(item => item.quantity > 0);
    if (editingItem) {
      const exists = inStock.some(item => 
        item.productType === editingItem.productType &&
        item.size === editingItem.productSize &&
        item.brand === (editingItem.productType === 'Binding Wire' ? editingItem.brand : '') &&
        item.packaging === (editingItem.productType === 'Binding Wire' ? editingItem.packaging : '')
      );
      if (!exists) {
        return [
          ...inStock,
          {
            productType: editingItem.productType,
            size: editingItem.productSize,
            brand: editingItem.productType === 'Binding Wire' ? editingItem.brand : '',
            packaging: editingItem.productType === 'Binding Wire' ? editingItem.packaging : '',
            quantity: 0
          }
        ];
      }
    }
    return inStock;
  };

  const availableItems = getAvailableItems();
  const availableProductTypes = [...new Set(availableItems.map(item => item.productType))];
  
  const availableSizes = [...new Set(
    availableItems
      .filter(item => item.productType === formData.productType)
      .map(item => item.size)
  )];

  const availableBrands = [...new Set(
    availableItems
      .filter(item => item.productType === formData.productType && item.size === formData.productSize)
      .map(item => item.brand)
  )];

  const availablePackagings = [...new Set(
    availableItems
      .filter(item => 
        item.productType === formData.productType && 
        item.size === formData.productSize &&
        item.brand === formData.brand
      )
      .map(item => item.packaging)
  )];

  const selectedInventoryItem = inventory.find(item => 
    item.productType === formData.productType &&
    item.size === formData.productSize &&
    item.brand === (formData.productType === 'Binding Wire' ? formData.brand : '') &&
    item.packaging === (formData.productType === 'Binding Wire' ? formData.packaging : '')
  );

  const getAvailableQuantity = () => {
    let qty = selectedInventoryItem ? selectedInventoryItem.quantity : 0;
    if (editingItem && 
        editingItem.productType === formData.productType &&
        editingItem.productSize === formData.productSize &&
        editingItem.brand === (formData.productType === 'Binding Wire' ? formData.brand : '') &&
        editingItem.packaging === (formData.productType === 'Binding Wire' ? formData.packaging : '')) {
      qty += editingItem.quantity;
    }
    return qty;
  };

  const sizeLabels = {
    '20 SWG': '20 SWG (0.91 mm)',
    '18 SWG': '18 SWG (1.22 mm)',
    '14 SWG': '14 SWG (2.00 mm)'
  };

  // Reconcile cascading dropdown choices on change
  useEffect(() => {
    if (!isFormOpen) return;
    const items = getAvailableItems();
    if (items.length === 0) return;

    // 1. Reconcile Product Type
    const types = [...new Set(items.map(i => i.productType))];
    let currentType = formData.productType;
    if (!types.includes(currentType)) {
      currentType = types[0] || '';
    }

    // 2. Reconcile Product Size
    const itemsOfType = items.filter(i => i.productType === currentType);
    const sizes = [...new Set(itemsOfType.map(i => i.size))];
    let currentSize = formData.productSize;
    if (!sizes.includes(currentSize)) {
      currentSize = sizes[0] || '';
    }

    // 3. Reconcile Brand (only for Binding Wire)
    let currentBrand = formData.brand;
    let currentPackaging = formData.packaging;
    if (currentType === 'Binding Wire') {
      const itemsOfSize = itemsOfType.filter(i => i.size === currentSize);
      const brandsList = [...new Set(itemsOfSize.map(i => i.brand))];
      if (!brandsList.includes(currentBrand)) {
        currentBrand = brandsList[0] || '';
      }

      // 4. Reconcile Packaging
      const itemsOfBrand = itemsOfSize.filter(i => i.brand === currentBrand);
      const packagingsList = [...new Set(itemsOfBrand.map(i => i.packaging))];
      if (!packagingsList.includes(currentPackaging)) {
        currentPackaging = packagingsList[0] || '';
      }
    } else {
      currentBrand = '';
      currentPackaging = '';
    }

    // Check if state needs update to avoid infinite loops
    if (
      currentType !== formData.productType ||
      currentSize !== formData.productSize ||
      currentBrand !== formData.brand ||
      currentPackaging !== formData.packaging
    ) {
      setFormData(prev => ({
        ...prev,
        productType: currentType,
        productSize: currentSize,
        brand: currentBrand,
        packaging: currentPackaging
      }));
    }
  }, [isFormOpen, editingId, inventory, formData.productType, formData.productSize, formData.brand, formData.packaging]);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      
      // Fetch list
      const res = await api.get('/dispatch', {
        params: {
          page,
          limit: 10,
          productType: filterProduct,
          startDate,
          endDate,
          search: searchQuery
        }
      });
      setDispatches(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);

      // Fetch dynamic dispatches KPIs for cards from /api/analytics
      const kpiRes = await api.get('/analytics');
      setKpis({
        today: kpiRes.data.kpis.dispatchToday,
        monthly: kpiRes.data.kpis.dispatchMonthly,
        total: kpiRes.data.charts.dispatchTrend.reduce((acc, curr) => acc + curr.quantity, 0)
      });

      // Fetch inventory stock
      const invRes = await api.get('/inventory');
      setInventory(invRes.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load dispatch dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, [page, filterProduct, startDate, endDate, searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    const inStock = inventory.filter(item => item.quantity > 0);
    if (inStock.length > 0) {
      const firstItem = inStock[0];
      setFormData({
        customerName: '',
        productType: firstItem.productType,
        productSize: firstItem.size,
        brand: firstItem.productType === 'Binding Wire' ? firstItem.brand : '',
        packaging: firstItem.productType === 'Binding Wire' ? firstItem.packaging : '',
        quantity: '',
        vehicleNumber: '',
        dispatchDate: new Date().toISOString().split('T')[0],
        remarks: '',
        status: 'Dispatched'
      });
    } else {
      setFormData({
        customerName: '',
        productType: '',
        productSize: '',
        brand: '',
        packaging: '',
        quantity: '',
        vehicleNumber: '',
        dispatchDate: new Date().toISOString().split('T')[0],
        remarks: '',
        status: 'Dispatched'
      });
    }
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      customerName: item.customerName,
      productType: item.productType,
      productSize: item.productSize,
      brand: item.productType === 'Binding Wire' ? (item.brand || '') : '',
      packaging: item.productType === 'Binding Wire' ? (item.packaging || '') : '',
      quantity: item.quantity,
      vehicleNumber: item.vehicleNumber,
      dispatchDate: item.dispatchDate.split('T')[0],
      remarks: item.remarks || '',
      status: item.status
    });
    setIsFormOpen(true);
  };

  const handleProductTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      productType: type
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName) {
      addToast('Customer Name is required', 'error');
      return;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      addToast('Please enter a valid positive quantity', 'error');
      return;
    }
    if (!formData.vehicleNumber) {
      addToast('Vehicle number is required', 'error');
      return;
    }

    // Dynamic stock quantity validation
    const maxQty = getAvailableQuantity();
    if (parseFloat(formData.quantity) > maxQty) {
      addToast(`Insufficient stock. Max available: ${maxQty.toFixed(3)} MT`, 'error');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/dispatch/${editingId}`, formData);
        addToast('Dispatch order updated successfully', 'success');
      } else {
        await api.post('/dispatch', formData);
        addToast('Dispatch order logged successfully', 'success');
      }
      setIsFormOpen(false);
      fetchDispatches();
    } catch (err) {
      console.error(err);
      addToast('Error saving dispatch log', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/dispatch/${id}`);
      addToast('Dispatch record deleted successfully', 'success');
      setDeleteConfirmId(null);
      fetchDispatches();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete dispatch record', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Outbound Dispatch Module</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage invoices, vehicle loadings, and finished material shipments.</p>
        </div>
        <button onClick={handleOpenAdd} className="premium-btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Create Dispatch Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Dispatch</span>
            <h4 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {kpis.today.toFixed(3)} MT
            </h4>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Dispatch</span>
            <h4 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {kpis.monthly.toFixed(3)} MT
            </h4>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-xl">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatch (Period)</span>
            <h4 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {kpis.total.toFixed(3)} MT
            </h4>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters card */}
      <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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

      {/* Dispatches Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Customer Name</th>
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">Quantity</th>
                <th className="py-4 px-6">Vehicle Number</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading && dispatches.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">Loading dispatches ledger...</td>
                </tr>
              ) : dispatches.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">No dispatches found matching filters.</td>
                </tr>
              ) : (
                dispatches.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800 dark:text-slate-200">
                      {new Date(item.dispatchDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">{item.customerName}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-slate-300">{item.productType}</span>
                        <span className="text-[10px] text-slate-400">
                          {item.productType === 'Binding Wire' 
                            ? `${item.brand} | ${item.productSize} | ${item.packaging}`
                            : `Size: ${item.productSize}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{item.quantity} MT</td>
                    <td className="py-4 px-6 text-slate-550 dark:text-slate-400 uppercase font-mono">{item.vehicleNumber}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                        item.status === 'Dispatched' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450' 
                          : item.status === 'In Transit'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-450'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-455 rounded-lg hover:text-primary-500 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(item._id)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-455 rounded-lg hover:text-rose-500 transition-colors"
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

      {/* Dispatch Invoice Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-lg w-full p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {editingId ? 'Edit Outbound Dispatch Invoice' : 'Create Dispatch Loading Order'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dispatch Date</label>
                    <input 
                      type="date"
                      value={formData.dispatchDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dispatchDate: e.target.value }))}
                      required
                      className="premium-input bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vehicle Number</label>
                    <input 
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                      placeholder="e.g. JH 05 AG 1234"
                      required
                      className="premium-input bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Name</label>
                  <input 
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="e.g. Apex Construction"
                    required
                    className="premium-input bg-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Type</label>
                    <select 
                      value={formData.productType}
                      onChange={handleProductTypeChange}
                      required
                      disabled={availableProductTypes.length === 0}
                      className="premium-input bg-transparent disabled:opacity-50"
                    >
                      {availableProductTypes.length === 0 ? (
                        <option value="">No Stock Available</option>
                      ) : (
                        availableProductTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Size</label>
                    <select 
                      value={formData.productSize}
                      onChange={(e) => setFormData(prev => ({ ...prev, productSize: e.target.value }))}
                      required
                      disabled={availableSizes.length === 0}
                      className="premium-input bg-transparent disabled:opacity-50"
                    >
                      {availableSizes.length === 0 ? (
                        <option value="">No Stock Available</option>
                      ) : (
                        availableSizes.map(s => (
                          <option key={s} value={s}>{sizeLabels[s] || s}</option>
                        ))
                      )}
                    </select>
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
                        disabled={availableBrands.length === 0}
                        className="premium-input bg-transparent disabled:opacity-50"
                      >
                        {availableBrands.length === 0 ? (
                          <option value="">No Stock Available</option>
                        ) : (
                          availableBrands.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Packaging</label>
                      <select 
                        value={formData.packaging}
                        onChange={(e) => setFormData(prev => ({ ...prev, packaging: e.target.value }))}
                        required
                        disabled={availablePackagings.length === 0}
                        className="premium-input bg-transparent disabled:opacity-50"
                      >
                        {availablePackagings.length === 0 ? (
                          <option value="">No Stock Available</option>
                        ) : (
                          availablePackagings.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Dispatch Quantity (MT)
                      {selectedInventoryItem && (
                        <span className="text-[10px] text-emerald-500 font-semibold ml-2">
                          (Available: {getAvailableQuantity().toFixed(3)} MT)
                        </span>
                      )}
                    </label>
                    <input 
                      type="number"
                      step="0.001"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="e.g. 2.450"
                      required
                      className="premium-input bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      required
                      className="premium-input bg-transparent"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Dispatched">Dispatched</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks</label>
                  <textarea 
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="E.g. Invoice references or shipping remarks"
                    className="premium-input bg-transparent min-h-[60px]"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="premium-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="premium-btn-primary">
                    Log Dispatch
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
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Delete Dispatch Invoice</h4>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete this dispatch invoice? The material quantities will be credited back to finished goods stocks.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="premium-btn-secondary">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
                  Delete Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast alarms */}
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

export default Dispatches;
