import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Wrench, 
  Layers, 
  ShoppingCart, 
  Truck, 
  FileSpreadsheet, 
  TrendingUp, 
  Settings as SettingsIcon, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Factory
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { 
    darkMode, 
    toggleDarkMode, 
    dateRange, 
    setDateRange, 
    searchQuery, 
    setSearchQuery 
  } = useApp();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Production', href: '/production', icon: Wrench },
    { name: 'Inventory', href: '/inventory', icon: Layers },
    { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
    { name: 'Dispatches', href: '/dispatches', icon: Truck },
    { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const handleDateChange = (type, value) => {
    setDateRange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 fixed lg:inset-y-0 z-20 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-primary-600 text-white rounded-xl">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider leading-none">Demo</h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Manufacturing</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/15 translate-x-1' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
            SM
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Shailesh Mishra</p>
            <p className="text-[10px] text-slate-400 truncate">shailesh@demo.in</p>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col flex-1 w-full">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
          {/* Left section */}
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-full max-w-xs sm:max-w-md hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Global search tables..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Global Date Range Filter */}
            <div className="hidden md:flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-350 focus:outline-none text-[11px]"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-350 focus:outline-none text-[11px]"
              />
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary-500 rounded-xl transition-all"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications icon */}
            <div className="relative">
              <button className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary-500 rounded-xl transition-all">
                <Bell className="h-4 w-4" />
              </button>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            {/* User profile avatar */}
            <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex lg:hidden items-center justify-center font-bold text-sm">
              SM
            </div>
          </div>
        </header>

        {/* Global search & date range for small/medium screens */}
        <div className="p-4 md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 space-y-3">
          {/* Mobile Search (Hidden above sm) */}
          <div className="relative sm:hidden">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Global search tables..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-xs"
            />
          </div>

          {/* Mobile Date Range (Hidden above md) */}
          <div className="flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl w-full">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-350 focus:outline-none text-[11px] w-full"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-350 focus:outline-none text-[11px] w-full"
            />
          </div>
        </div>

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 z-50 flex flex-col border-r border-slate-100 dark:border-slate-800 lg:hidden"
            >
              <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-600 text-white rounded-xl">
                    <Factory className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider leading-none">Demo</h1>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Manufacturing</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/15 translate-x-1' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                  SM
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Shailesh Mishra</p>
                  <p className="text-[10px] text-slate-400 truncate">shailesh@demo.in</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
