import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api';
import { 
  TrendingUp, 
  Layers, 
  ShoppingCart, 
  Truck, 
  Activity, 
  Gauge, 
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { dateRange, darkMode } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowSpinner(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(false);
    }
  }, [loading]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        });
        setData(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard analytics:', err);
        setError('Failed to load dashboard data. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange]);

  if (loading) {
    if (showSpinner) {
      return (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading manufacturing telemetry...</p>
          </div>
        </div>
      );
    }
    return null;
  }


  if (error) {
    return (
      <div className="flex h-[70vh] items-center justify-center p-4">
        <div className="glass-card max-w-md p-6 text-center">
          <Activity className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">Connection Error</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="premium-btn-primary mx-auto"
          >
            <RotateCcw className="h-4 w-4" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { kpis, charts } = data;

  const kpiCards = [
    {
      title: 'Raw Material Stock',
      value: `${kpis.rawMaterialStock.toLocaleString()} MT`,
      description: 'Wire Rod + In Process',
      icon: Activity,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400',
      border: 'border-l-4 border-l-blue-500 dark:border-l-blue-400',
      trend: { text: 'Real-time level', positive: true }
    },
    {
      title: "Today's Production",
      value: `${kpis.productionToday} MT`,
      description: `Period: ${kpis.productionMonthly.toLocaleString()} MT`,
      icon: TrendingUp,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
      border: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400',
      trend: { text: `Total: ${kpis.productionTotal.toLocaleString()} MT`, positive: true }
    },
    {
      title: 'Finished Goods Stock',
      value: `${kpis.finishedGoodsStock.toLocaleString()} MT`,
      description: 'Ready for dispatch',
      icon: Layers,
      color: 'from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400',
      border: 'border-l-4 border-l-violet-500 dark:border-l-violet-400',
      trend: { text: 'In Warehouse', positive: true }
    },
    {
      title: "Today's Dispatch",
      value: `${kpis.dispatchToday} MT`,
      description: `Period: ${kpis.dispatchMonthly.toLocaleString()} MT`,
      icon: Truck,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400',
      border: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
      trend: { text: 'Outbound logistics', positive: true }
    },
    {
      title: 'Pending Purchases',
      value: `${kpis.pendingPurchases.toLocaleString()} MT`,
      description: 'Awaiting delivery',
      icon: ShoppingCart,
      color: 'from-sky-500/10 to-cyan-500/10 text-sky-600 dark:text-sky-400',
      border: 'border-l-4 border-l-sky-500 dark:border-l-sky-450',
      trend: { text: 'Open PO quantity', positive: false }
    },
    {
      title: 'Quality & Scrap',
      value: `${kpis.scrapPercentage}%`,
      description: `${kpis.scrapGeneratedMonthly} MT Period Scrap`,
      icon: Gauge,
      color: 'from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400',
      border: 'border-l-4 border-l-rose-500 dark:border-l-rose-400',
      trend: { text: 'Efficiency target < 2%', positive: kpis.scrapPercentage < 2 }
    }
  ];

  // Pie Chart Colors
  const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-500" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manufacturing Live Deck</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time status tracking for Demo Wire & Nails Manufacturing Plant.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -4 }}
            className={`glass-card p-5 relative overflow-hidden flex flex-col justify-between ${kpi.border}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">{kpi.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{kpi.description}</span>
              <span className={`font-medium flex items-center gap-0.5 ${kpi.trend.positive ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-400'}`}>
                {kpi.trend.text}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Trend Line Chart */}
        <div className="glass-card p-5 lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Production Output Trend</h4>
              <p className="text-xs text-slate-400">Daily finished goods volume (MT)</p>
            </div>
          </div>
          <div className="h-80">
            {charts.productionTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No production logs available for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <LineChart data={charts.productionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Line type="monotone" dataKey="quantity" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Product Distribution Pie Chart */}
        <div className="glass-card p-5 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Product Distribution</h4>
              <p className="text-xs text-slate-400">Distribution of output during period</p>
            </div>
          </div>
          <div className="h-80 flex flex-col justify-between">
            <div className="h-60 relative">
              {charts.productDistribution.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No data.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={charts.productDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {charts.productDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '12px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Legend breakdown */}
            <div className="flex items-center justify-center gap-4 text-xs">
              {charts.productDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-650 dark:text-slate-350">{entry.name} ({entry.value} MT)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Raw Material Consumption vs Production Bar Chart */}
        <div className="glass-card p-5 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Rod Consumption vs Finished Output</h4>
              <p className="text-xs text-slate-400">Material converted daily (MT)</p>
            </div>
          </div>
          <div className="h-80">
            {charts.rawMaterialConsumption.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No records.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <BarChart data={charts.rawMaterialConsumption} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Bar dataKey="consumption" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Rod Processed" />
                  <Bar dataKey="production" fill="#10b981" radius={[4, 4, 0, 0]} name="Finished Goods" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dispatch Trend Area Chart */}
        <div className="glass-card p-5 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Outbound Dispatch Trends</h4>
              <p className="text-xs text-slate-400">Daily dispatches to buyers (MT)</p>
            </div>
          </div>
          <div className="h-80">
            {charts.dispatchTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No dispatches logged in this range.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <AreaChart data={charts.dispatchTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDispatch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
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
                  <Area type="monotone" dataKey="quantity" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorDispatch)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Inventory Trend Line Chart */}
        <div className="glass-card p-5 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Rod Inventory Track</h4>
              <p className="text-xs text-slate-400">Wire Rod Stock levels (MT)</p>
            </div>
          </div>
          <div className="h-80">
            {charts.inventoryTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <LineChart data={charts.inventoryTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Line type="monotone" dataKey="wireRod" stroke="#8b5cf6" name="Wire Rod" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="wireRodInProcess" stroke="#10b981" name="In Process" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
