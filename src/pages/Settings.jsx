import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api';
import { 
  Sun, 
  Moon, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Building, 
  User, 
  AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useApp();
  const [resetting, setResetting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleResetData = async () => {
    try {
      setResetting(true);
      const res = await api.post('/analytics/reset');
      addToast(res.data.message || 'Session storage reset successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Reset process failed.', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Application Control Panel</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure theme preferences and reset session telemetry.</p>
      </div>

      {/* Theme Settings Card */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Interface Theme</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Toggle between dark and light themes for the manufacturing dashboard interface.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => { if (darkMode) toggleDarkMode(); }}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border text-xs font-semibold transition-all ${
              !darkMode 
                ? 'bg-primary-50 border-primary-300 text-primary-600 dark:bg-primary-950/20' 
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <Sun className="h-4 w-4" /> Light Default
          </button>
          
          <button
            onClick={() => { if (!darkMode) toggleDarkMode(); }}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border text-xs font-semibold transition-all ${
              darkMode 
                ? 'bg-primary-600 border-primary-600 text-white shadow-md' 
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <Moon className="h-4 w-4" /> Dark Mode
          </button>
        </div>
      </div>

      {/* Database Mock reset panel */}
      <div className="glass-card p-5 border-rose-100 dark:border-rose-950/30">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-rose-500" /> Session Storage Administration
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Clear all operational records. This triggers a total drop of all current sessionStorage logs, resetting the plant ledger to absolute zero.
        </p>

        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-150 dark:border-rose-900/30 rounded-xl mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-455">Critical Action Alert</h4>
            <p className="text-[11px] text-rose-600 dark:text-rose-455 mt-1">
              Executing session storage reset will delete any manual logs you added during this session and reset all balances to zero.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetData}
          disabled={resetting}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02] disabled:pointer-events-none"
        >
          {resetting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Resetting Ledger...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" /> Reset Session Storage
            </>
          )}
        </button>
      </div>

      {/* Static Configuration specs */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4 flex items-center gap-2">
          <Building className="h-4 w-4 text-primary-500" /> Plant Specifications & Standards
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Company Name</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Demo Wire & Nails Ltd</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Plant Location</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Jamshedpur Works, JH, India</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Binding Wire Gauges</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">20 SWG, 18 SWG, 14 SWG</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nails Specifications</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">1" to 4" Lengths (50kg bags)</span>
          </div>
        </div>
      </div>

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

export default Settings;
