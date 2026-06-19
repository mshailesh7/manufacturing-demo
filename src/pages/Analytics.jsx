import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api';
import { 
  TrendingUp, 
  ShoppingCart, 
  RotateCcw,
  Sparkles,
  Award,
  Zap,
  Trash2,
  Calendar,
  Factory
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { motion } from 'framer-motion';

const Analytics = () => {
  const { dateRange, darkMode } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  if (loading || !data) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { kpis, charts } = data;

  // Let's compute some custom growth rates or KPI percentages
  const prodEfficiency = kpis.productionMonthly > 0 
    ? ((kpis.productionMonthly / (kpis.productionMonthly + kpis.scrapGeneratedMonthly)) * 100).toFixed(1) 
    : 100;

  // Supplier fill rates data
  const supplierData = charts.supplierPerformance.map(sup => {
    const fillRate = sup.totalPurchased > 0 
      ? Math.round((sup.totalReceived / sup.totalPurchased) * 100)
      : 100;
    return {
      name: sup._id,
      fillRate,
      purchased: parseFloat(sup.totalPurchased.toFixed(3)),
      received: parseFloat(sup.totalReceived.toFixed(3))
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Management Intelligence Hub</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Deep-dive performance telemetry and key operational insights.</p>
      </div>

      {/* Analytics KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Production Yield</span>
            <h4 className="text-lg font-bold text-slate-950 dark:text-white mt-0.5">{prodEfficiency}%</h4>
            <p className="text-[9px] text-slate-450 dark:text-slate-400">Net output from raw rod</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-l-rose-500 dark:border-l-rose-400">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Waste Generated</span>
            <h4 className="text-lg font-bold text-slate-950 dark:text-white mt-0.5">{kpis.scrapGeneratedMonthly.toFixed(3)} MT</h4>
            <p className="text-[9px] text-slate-450 dark:text-slate-400">Scrap generated in range</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-l-violet-500 dark:border-l-violet-400">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-xl">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Supplier Performance</span>
            <h4 className="text-lg font-bold text-slate-950 dark:text-white mt-0.5">
              {supplierData[0] ? `${supplierData[0].fillRate}%` : 'N/A'}
            </h4>
            <p className="text-[9px] text-slate-450 dark:text-slate-400">Lead supplier fill rate</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-l-amber-500 dark:border-l-amber-400">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Inventory Turnover</span>
            <h4 className="text-lg font-bold text-slate-950 dark:text-white mt-0.5">
              {(kpis.dispatchMonthly / (kpis.finishedGoodsStock || 1)).toFixed(2)}x
            </h4>
            <p className="text-[9px] text-slate-450 dark:text-slate-400">Dispatches vs Warehouse Stock</p>
          </div>
        </div>
      </div>

      {/* Advanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Production vs Dispatches Area chart */}
        <div className="glass-card p-5 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Outbound Flow Balance</h4>
              <p className="text-xs text-slate-400">Monthly Production Output vs Dispatch Logistics (MT)</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <AreaChart data={charts.productionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="quantity" stroke="#8b5cf6" strokeWidth={2} name="Production Output" fillOpacity={1} fill="url(#colorProd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supplier Delivery Fill Rates */}
        <div className="glass-card p-5 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Supplier Fulfillment Rates</h4>
              <p className="text-xs text-slate-400">Percentage of purchased materials received successfully</p>
            </div>
          </div>
          <div className="h-80">
            {supplierData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-405 text-slate-400">No supplier purchases logged.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <BarChart data={supplierData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#f1f5f9"} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '12px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="purchased" fill="#8b5cf6" name="Purchased (MT)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="received" fill="#10b981" name="Received (MT)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
