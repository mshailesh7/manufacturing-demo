import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  FileText,
  Calendar,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

const Reports = () => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports', {
        params: { date: reportDate }
      });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to compile reports for selected date', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportDate]);

  const exportToExcel = () => {
    if (!reportData) return;
    try {
      const rows = [
        ['DEMO WIRE & NAILS MANUFACTURING PLANT'],
        ['DAILY PERFORMANCE & METRICS SNAPSHOT REPORT'],
        ['Report Date:', new Date(reportData.date).toLocaleDateString()],
        [],
        ['1. RAW MATERIAL INVENTORY (MT)'],
        ['Material Type', 'Current Stock Level (MT)'],
        ['Wire Rod (Hot Rolled)', reportData.rawMaterial.wireRod],
        ['Wire Rod In Process (Drawing)', reportData.rawMaterial.wireRodInProcess],
        ['Total Raw Material Stock', reportData.rawMaterial.total],
        [],
        ['2. RAW MATERIAL PROCUREMENT & DELIVERY LOGS (MT)'],
        ['Supplier', 'Purchased Qty (MT)', 'Received Qty (MT)', 'Pending Qty (MT)'],
        ...reportData.purchase.today.map(p => [p._id, p.purchased, p.received, p.pending]),
        [],
        ['3. SHIFT PRODUCTION LOGS SUMMARY'],
        ['Shift Production (Today)', reportData.production.todayQuantity],
        ['All-Time Cumulative Production', reportData.production.totalQuantity],
        [],
        ['4. FINISHED GOODS INVENTORY WAREHOUSE LOG'],
        ['Binding Wire Brand', 'Wire Size', 'Packaging Size', 'Stock Level (MT)'],
        ...reportData.inventory.bindingWire.map(item => [item.brand, item.size, item.packaging, item.quantity]),
        [],
        ['Nails Size', 'Warehouse Bags Count', 'Stock Level (MT)'],
        ...reportData.inventory.nails.map(item => [`Nails ${item.size}`, item.bags, item.quantity]),
        [],
        ['5. SHIPMENT DISPATCH LEDGER SUMMARY'],
        ['Shipment Volume (Today)', reportData.dispatch.todayQuantity],
        ['All-Time Cumulative Dispatch', reportData.dispatch.totalQuantity],
        [],
        ['6. PLANT WASTE & SCRAP METRICS'],
        ['Scrap Classification', 'Quantity Generated (MT)'],
        ['Production Waste Scrap', reportData.scrap.scrapQuantity],
        ['Mill Scale Scrap', reportData.scrap.millScaleQuantity],
        ['Total Plant Scrap (Today)', reportData.scrap.totalScrapToday],
        [],
        ['7. WAREHOUSE STORE GENERAL LEDGER VALUES (INR)'],
        ['Store Opening Value', reportData.store.opening],
        ['Store Purchases Value', reportData.store.purchase],
        ['Store Issues Value', reportData.store.issue],
        ['Store Closing Balance Value', reportData.store.closing]
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Performance Report');
      XLSX.writeFile(wb, `Daily_Manufacturing_Report_${reportDate}.xlsx`);
      addToast('Excel spreadsheet exported successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Spreadsheet export failed', 'error');
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Daily Performance Reports</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Compile and export digital ledger summaries for factory runs.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button onClick={triggerPrint} className="premium-btn-secondary" disabled={!reportData}>
            <Printer className="h-4 w-4" /> Print PDF Report
          </button>
          <button onClick={exportToExcel} className="premium-btn-primary" disabled={!reportData}>
            <FileSpreadsheet className="h-4 w-4" /> Export Spreadsheet
          </button>
        </div>
      </div>

      {/* Date filter bar (Hidden on print) */}
      <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary-500" />
          <span className="text-xs font-semibold text-slate-650 dark:text-slate-350">Select Report Snapshot Date:</span>
        </div>
        <input 
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className="premium-input bg-transparent sm:max-w-[200px]"
        />
      </div>

      {/* DIGITIZED REPORT SHEET */}
      {!reportData ? (
        <div className="glass-card p-10 text-center text-slate-500 dark:text-slate-400">
          No report data is available for this date. Check connection or select a different date.
        </div>
      ) : (
        <div id="print-area" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-premium p-6 sm:p-10 rounded-2xl print:border-none print:shadow-none print:p-0 print:bg-white text-slate-900 dark:text-slate-100 print:text-black">
          {/* Report Header Branding */}
          <div className="text-center pb-8 border-b border-slate-100 dark:border-slate-800/80 mb-8">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Digital Manufacturing Log</span>
            <h1 className="text-2xl font-black text-slate-950 dark:text-white mt-1 uppercase tracking-tight">Demo Wire & Nails</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Daily Status Ledger Snapshot - Date: {new Date(reportData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* 2-Column Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* 1. Raw Material Stock */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">1. Raw Material Inventory Status</h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800/40">
                    <td className="py-2 text-slate-500">Wire Rod (Hot Rolled)</td>
                    <td className="py-2 text-right font-bold">{reportData.rawMaterial.wireRod.toFixed(3)} MT</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800/40">
                    <td className="py-2 text-slate-500">Wire Rod In Process (Drawing)</td>
                    <td className="py-2 text-right font-bold">{reportData.rawMaterial.wireRodInProcess.toFixed(3)} MT</td>
                  </tr>
                  <tr className="font-bold text-primary-600 dark:text-primary-400">
                    <td className="py-2">Total Raw Material Stock</td>
                    <td className="py-2 text-right">{reportData.rawMaterial.total.toFixed(3)} MT</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. Scrap Waste Summary */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">2. Scrap & Mill Scale Generated</h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800/40">
                    <td className="py-2 text-slate-500">Production Waste Scrap</td>
                    <td className="py-2 text-right font-bold">{reportData.scrap.scrapQuantity.toFixed(3)} MT</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800/40">
                    <td className="py-2 text-slate-500">Mill Scale Scrap</td>
                    <td className="py-2 text-right font-bold">{reportData.scrap.millScaleQuantity.toFixed(3)} MT</td>
                  </tr>
                  <tr className="font-bold text-rose-600 dark:text-rose-455">
                    <td className="py-2">Total Scrap Generation</td>
                    <td className="py-2 text-right">{reportData.scrap.totalScrapToday.toFixed(3)} MT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Raw Material Purchase Supplier breakdown */}
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">3. Raw Material Procurement Ledger</h3>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2">Supplier Partner</th>
                  <th className="py-2">Purchased (MT)</th>
                  <th className="py-2">Received (MT)</th>
                  <th className="py-2 text-right">Pending Shipment (MT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {reportData.purchase.today.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400">No active deliveries scheduled today.</td>
                  </tr>
                ) : (
                  reportData.purchase.today.map(p => (
                    <tr key={p._id}>
                      <td className="py-2 font-semibold">{p._id}</td>
                      <td className="py-2">{p.purchased.toFixed(3)} MT</td>
                      <td className="py-2 text-emerald-600 font-semibold">{p.received.toFixed(3)} MT</td>
                      <td className="py-2 text-right text-amber-600 font-semibold">{p.pending.toFixed(3)} MT</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Shift Production Logs Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">4. Production Volume Summary</h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800/40">
                    <td className="py-2 text-slate-500">Shifts Log Count (Today)</td>
                    <td className="py-2 text-right font-bold">{reportData.production.todayCount} Logs</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800/40">
                    <td className="py-2 text-slate-500">Shift Production (Today)</td>
                    <td className="py-2 text-right font-bold text-emerald-650 dark:text-emerald-450">{reportData.production.todayQuantity.toFixed(3)} MT</td>
                  </tr>
                  <tr className="font-bold border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                    <td className="py-2">All-Time Cumulative Production</td>
                    <td className="py-2 text-right">{reportData.production.totalQuantity.toFixed(3)} MT</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Dispatch Summary */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">5. Outbound Dispatch Logistics</h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800/40">
                    <td className="py-2 text-slate-500">Truck Dispatches Today</td>
                    <td className="py-2 text-right font-bold">{reportData.dispatch.todayCount} Vehicles</td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800/40">
                    <td className="py-2 text-slate-500">Logistics Volume (Today)</td>
                    <td className="py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">{reportData.dispatch.todayQuantity.toFixed(3)} MT</td>
                  </tr>
                  <tr className="font-bold border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                    <td className="py-2">All-Time Cumulative Dispatches</td>
                    <td className="py-2 text-right">{reportData.dispatch.totalQuantity.toFixed(3)} MT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Finished Stock Breakdown */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">6. Finished Goods Warehouse Stocks</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Binding Wire List */}
              <div>
                <h4 className="font-semibold text-slate-500 mb-2 uppercase text-[10px]">Binding Wire Stock</h4>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[9px] border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-1">Brand</th>
                      <th className="pb-1">Size</th>
                      <th className="pb-1 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.inventory.bindingWire.slice(0, 8).map(item => (
                      <tr key={item._id} className="border-b border-slate-100 dark:border-slate-800/30">
                        <td className="py-1.5 font-medium">{item.brand}</td>
                        <td className="py-1.5">{item.size} ({item.packaging})</td>
                        <td className="py-1.5 text-right font-semibold">{item.quantity.toFixed(3)} MT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Nails List */}
              <div>
                <h4 className="font-semibold text-slate-500 mb-2 uppercase text-[10px]">Nails Stock</h4>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[9px] border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-1">Size</th>
                      <th className="pb-1">Bags</th>
                      <th className="pb-1 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.inventory.nails.slice(0, 8).map(item => (
                      <tr key={item._id} className="border-b border-slate-100 dark:border-slate-800/30">
                        <td className="py-1.5 font-medium">Nails {item.size}</td>
                        <td className="py-1.5">{item.bags} Bags</td>
                        <td className="py-1.5 text-right font-semibold">{item.quantity.toFixed(3)} MT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 7. Store ledger values */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">7. Store Value & Ledger Status</h3>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-800/40">
                  <td className="py-2 text-slate-500">Store Opening Value balance</td>
                  <td className="py-2 text-right font-bold text-slate-800 dark:text-slate-200">₹ {reportData.store.opening.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-800/40">
                  <td className="py-2 text-slate-500">Store Purchases Value (Credit additions)</td>
                  <td className="py-2 text-right font-bold text-emerald-600">₹ {reportData.store.purchase.toLocaleString()}</td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-800/40">
                  <td className="py-2 text-slate-500">Store Issues Value (Debit releases)</td>
                  <td className="py-2 text-right font-bold text-rose-600">₹ {reportData.store.issue.toLocaleString()}</td>
                </tr>
                <tr className="font-bold border-t border-slate-200 dark:border-slate-800 text-primary-600 dark:text-primary-400">
                  <td className="py-2">Store Closing Balance value</td>
                  <td className="py-2 text-right">₹ {reportData.store.closing.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printing specific styling rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Toasts Notifications */}
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

export default Reports;
