// Frontend Mock API Service utilizing sessionStorage
// Replaces Axios connection to eliminate backend server requirements for live demos.

const delay = (ms = 80) => new Promise(resolve => setTimeout(resolve, ms));

// Dynamic Client-side Database Seeder (generates relative operational data starting 4 days ago)
const seedSessionStorage = () => {
  if (sessionStorage.getItem('seeded_v3_empty') === 'true') {
    return; // Already initialized to empty
  }

  // Clear previous stale data if present to ensure starting from absolute zero
  sessionStorage.removeItem('production_collection');
  sessionStorage.removeItem('purchases_collection');
  sessionStorage.removeItem('dispatches_collection');
  sessionStorage.removeItem('scrap_collection');
  sessionStorage.removeItem('raw_materials_collection');
  sessionStorage.removeItem('store_collection');
  sessionStorage.removeItem('inventory_collection');

  // Initialize empty database tables
  sessionStorage.setItem('production_collection', JSON.stringify([]));
  sessionStorage.setItem('purchases_collection', JSON.stringify([]));
  sessionStorage.setItem('dispatches_collection', JSON.stringify([]));
  sessionStorage.setItem('scrap_collection', JSON.stringify([]));
  sessionStorage.setItem('raw_materials_collection', JSON.stringify([]));
  sessionStorage.setItem('store_collection', JSON.stringify([]));
  sessionStorage.setItem('inventory_collection', JSON.stringify([]));

  sessionStorage.setItem('seeded_v3_empty', 'true');
};

// Auto seed on load
seedSessionStorage();

// Inventory modification helpers
const adjustFGInventory = (productType, brand, size, packaging, quantityDiff, bagsDiff) => {
  const inventory = JSON.parse(sessionStorage.getItem('inventory_collection') || '[]');
  const keyMatch = (item) => 
    item.productType === productType &&
    item.brand === (productType === 'Binding Wire' ? brand : '') &&
    item.size === size &&
    item.packaging === (productType === 'Binding Wire' ? packaging : '');

  const idx = inventory.findIndex(keyMatch);
  if (idx !== -1) {
    inventory[idx].quantity = parseFloat((inventory[idx].quantity + quantityDiff).toFixed(3));
    inventory[idx].bags = Math.max(0, inventory[idx].bags + bagsDiff);
    inventory[idx].updatedAt = new Date().toISOString();
  } else {
    inventory.push({
      _id: `inv_${Math.random().toString(36).substr(2, 9)}`,
      productType,
      brand: productType === 'Binding Wire' ? brand : '',
      size,
      packaging: productType === 'Binding Wire' ? packaging : '',
      bags: Math.max(0, bagsDiff),
      quantity: Math.max(0, quantityDiff),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  sessionStorage.setItem('inventory_collection', JSON.stringify(inventory));
};

const adjustRawMaterials = (type, dateStr, quantityDiff, typeFieldDiff = 0, isConsumed = false) => {
  const rms = JSON.parse(sessionStorage.getItem('raw_materials_collection') || '[]');
  const targetDate = new Date(dateStr);
  const dayStart = new Date(targetDate.setHours(0,0,0,0));
  const dayEnd = new Date(targetDate.setHours(23,59,59,999));

  let log = rms.find(r => r.type === type && new Date(r.date) >= dayStart && new Date(r.date) <= dayEnd);
  
  if (log) {
    log.quantity = parseFloat((log.quantity + quantityDiff).toFixed(3));
    if (isConsumed) {
      log.consumed = parseFloat((log.consumed + typeFieldDiff).toFixed(3));
    } else {
      log.received = parseFloat((log.received + typeFieldDiff).toFixed(3));
    }
  } else {
    const priorLogs = rms.filter(r => r.type === type && new Date(r.date) < dayStart);
    priorLogs.sort((a,b) => new Date(b.date) - new Date(a.date));
    const prevQty = priorLogs[0] ? priorLogs[0].quantity : 0.0;
    
    log = {
      _id: `rm_${Math.random().toString(36).substr(2, 9)}`,
      date: dateStr,
      type,
      quantity: parseFloat((prevQty + quantityDiff).toFixed(3)),
      received: isConsumed ? 0 : typeFieldDiff,
      transferred: 0,
      consumed: isConsumed ? typeFieldDiff : 0
    };
    rms.push(log);
  }
  sessionStorage.setItem('raw_materials_collection', JSON.stringify(rms));
};

// API routes Router implementation
const apiRouter = {
  // GET requests
  get: async (url, config = {}) => {
    await delay(30);
    const params = config.params || {};

    // 1. Production Brands list
    if (url === '/production/brands') {
      const production = JSON.parse(sessionStorage.getItem('production_collection') || '[]');
      const brandsSet = new Set();
      production.forEach(p => { if (p.brand) brandsSet.add(p.brand); });
      const brands = Array.from(brandsSet);
      return { data: brands.length > 0 ? brands : ['Tata Steel Shield', 'JSW Neo', 'Amba Flex', 'Kalyan Pro'] };
    }

    // 2. Production query
    if (url === '/production') {
      let list = JSON.parse(sessionStorage.getItem('production_collection') || '[]');
      if (params.startDate) {
        list = list.filter(p => new Date(p.date) >= new Date(params.startDate));
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23,59,59,999);
        list = list.filter(p => new Date(p.date) <= end);
      }
      if (params.productType) {
        list = list.filter(p => p.productType === params.productType);
      }
      if (params.shift) {
        list = list.filter(p => p.shift === params.shift);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(p => 
          p.productSize?.toLowerCase().includes(q) || 
          p.brand?.toLowerCase().includes(q) || 
          p.remarks?.toLowerCase().includes(q)
        );
      }
      list.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
      const page = parseInt(params.page || 1);
      const limit = parseInt(params.limit || 20);
      const total = list.length;
      return { data: { data: list.slice((page - 1) * limit, page * limit), total, page, pages: Math.ceil(total / limit) } };
    }

    // 3. Purchase suppliers list
    if (url === '/purchases/suppliers') {
      return { data: ['Jindal Wire Rods', 'Electrosteel Metal Corp', 'Shyam Alloys', 'Monnet Alloys', 'Rungta Steel Division'] };
    }

    // 4. Purchases query
    if (url === '/purchases') {
      let list = JSON.parse(sessionStorage.getItem('purchases_collection') || '[]');
      if (params.startDate) {
        list = list.filter(p => new Date(p.purchaseDate) >= new Date(params.startDate));
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23,59,59,999);
        list = list.filter(p => new Date(p.purchaseDate) <= end);
      }
      if (params.supplier) {
        list = list.filter(p => p.supplier === params.supplier);
      }
      if (params.status) {
        list = list.filter(p => p.status === params.status);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(p => p.supplier?.toLowerCase().includes(q));
      }
      list.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate) || new Date(b.createdAt) - new Date(a.createdAt));
      const page = parseInt(params.page || 1);
      const limit = parseInt(params.limit || 20);
      const total = list.length;
      return { data: { data: list.slice((page - 1) * limit, page * limit), total, page, pages: Math.ceil(total / limit) } };
    }

    // 5. Raw Materials current status
    if (url === '/inventory/raw-materials') {
      const rms = JSON.parse(sessionStorage.getItem('raw_materials_collection') || '[]');
      const wireRods = rms.filter(r => r.type === 'Wire Rod').sort((a,b) => new Date(b.date) - new Date(a.date));
      const wireRodsProcess = rms.filter(r => r.type === 'Wire Rod In Process').sort((a,b) => new Date(b.date) - new Date(a.date));
      const wireRod = wireRods[0];
      const wireRodProcess = wireRodsProcess[0];

      return {
        data: {
          wireRod: {
            quantity: wireRod ? wireRod.quantity : 0,
            lastUpdated: wireRod ? wireRod.date : new Date().toISOString(),
            status: wireRod && wireRod.quantity > 10 ? 'Ok' : 'Low Stock'
          },
          wireRodInProcess: {
            quantity: wireRodProcess ? wireRodProcess.quantity : 0,
            lastUpdated: wireRodProcess ? wireRodProcess.date : new Date().toISOString(),
            status: wireRodProcess && wireRodProcess.quantity > 5 ? 'Ok' : 'Low Stock'
          }
        }
      };
    }

    // 6. Inventory Finished Goods query
    if (url === '/inventory') {
      let list = JSON.parse(sessionStorage.getItem('inventory_collection') || '[]');
      if (params.productType) {
        list = list.filter(i => i.productType === params.productType);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(i => 
          i.brand?.toLowerCase().includes(q) || 
          i.size?.toLowerCase().includes(q)
        );
      }
      list.sort((a,b) => a.productType.localeCompare(b.productType) || a.brand.localeCompare(b.brand) || a.size.localeCompare(b.size));
      return { data: list };
    }

    // 7. Dispatch query
    if (url === '/dispatch') {
      let list = JSON.parse(sessionStorage.getItem('dispatches_collection') || '[]');
      if (params.startDate) {
        list = list.filter(d => new Date(d.dispatchDate) >= new Date(params.startDate));
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23,59,59,999);
        list = list.filter(d => new Date(d.dispatchDate) <= end);
      }
      if (params.productType) {
        list = list.filter(d => d.productType === params.productType);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(d => 
          d.customerName?.toLowerCase().includes(q) || 
          d.vehicleNumber?.toLowerCase().includes(q) || 
          d.remarks?.toLowerCase().includes(q)
        );
      }
      list.sort((a, b) => new Date(b.dispatchDate) - new Date(a.dispatchDate) || new Date(b.createdAt) - new Date(a.createdAt));
      const page = parseInt(params.page || 1);
      const limit = parseInt(params.limit || 20);
      const total = list.length;
      return { data: { data: list.slice((page - 1) * limit, page * limit), total, page, pages: Math.ceil(total / limit) } };
    }

    // 8. Daily Compiled Report
    if (url === '/reports') {
      const targetDateStr = params.date || new Date().toISOString().split('T')[0];
      const targetDate = new Date(targetDateStr);
      const dayStart = new Date(targetDate.setHours(0,0,0,0));
      const dayEnd = new Date(targetDate.setHours(23,59,59,999));

      const rawMaterials = JSON.parse(sessionStorage.getItem('raw_materials_collection') || '[]');
      const purchases = JSON.parse(sessionStorage.getItem('purchases_collection') || '[]');
      const production = JSON.parse(sessionStorage.getItem('production_collection') || '[]');
      const inventory = JSON.parse(sessionStorage.getItem('inventory_collection') || '[]');
      const dispatches = JSON.parse(sessionStorage.getItem('dispatches_collection') || '[]');
      const scrap = JSON.parse(sessionStorage.getItem('scrap_collection') || '[]');
      const store = JSON.parse(sessionStorage.getItem('store_collection') || '[]');

      const rawMaterialsToday = rawMaterials.filter(r => new Date(r.date) >= dayStart && new Date(r.date) <= dayEnd);
      let wireRodQty = 0;
      let wireRodInProcessQty = 0;
      rawMaterialsToday.forEach(item => {
        if (item.type === 'Wire Rod') wireRodQty = item.quantity;
        if (item.type === 'Wire Rod In Process') wireRodInProcessQty = item.quantity;
      });

      if (rawMaterialsToday.length === 0) {
        const priorRod = rawMaterials.filter(r => r.type === 'Wire Rod' && new Date(r.date) <= dayEnd).sort((a,b) => new Date(b.date) - new Date(a.date));
        const priorProcess = rawMaterials.filter(r => r.type === 'Wire Rod In Process' && new Date(r.date) <= dayEnd).sort((a,b) => new Date(b.date) - new Date(a.date));
        wireRodQty = priorRod[0] ? priorRod[0].quantity : 0;
        wireRodInProcessQty = priorProcess[0] ? priorProcess[0].quantity : 0;
      }

      const purchasesToday = purchases.filter(p => new Date(p.purchaseDate) >= dayStart && new Date(p.purchaseDate) <= dayEnd);
      const supplierPurchasesMap = new Map();
      purchasesToday.forEach(p => {
        const existing = supplierPurchasesMap.get(p.supplier) || { _id: p.supplier, purchased: 0, received: 0, pending: 0 };
        existing.purchased += p.purchasedQuantity;
        existing.received += p.receivedQuantity;
        existing.pending += p.pendingQuantity;
        supplierPurchasesMap.set(p.supplier, existing);
      });

      const allTimeSupplierPurchasesMap = new Map();
      purchases.forEach(p => {
        const existing = allTimeSupplierPurchasesMap.get(p.supplier) || { _id: p.supplier, purchased: 0, received: 0, pending: 0 };
        existing.purchased += p.purchasedQuantity;
        existing.received += p.receivedQuantity;
        existing.pending += p.pendingQuantity;
        allTimeSupplierPurchasesMap.set(p.supplier, existing);
      });

      const productionToday = production.filter(p => new Date(p.date) >= dayStart && new Date(p.date) <= dayEnd);
      const dailyProductionSum = productionToday.reduce((acc, curr) => acc + curr.quantity, 0);
      const totalProductionSum = production.reduce((acc, curr) => acc + curr.quantity, 0);

      const bindingWireStock = inventory.filter(item => item.productType === 'Binding Wire');
      const nailsStock = inventory.filter(item => item.productType === 'Nails');

      const dispatchToday = dispatches.filter(d => new Date(d.dispatchDate) >= dayStart && new Date(d.dispatchDate) <= dayEnd);
      const dailyDispatchSum = dispatchToday.reduce((acc, curr) => acc + curr.quantity, 0);
      const totalDispatchSum = dispatches.reduce((acc, curr) => acc + curr.quantity, 0);

      const scrapToday = scrap.filter(s => new Date(s.date) >= dayStart && new Date(s.date) <= dayEnd);
      const scrapTodayQty = scrapToday.filter(item => item.type === 'Scrap').reduce((acc, curr) => acc + curr.quantity, 0);
      const millScaleTodayQty = scrapToday.filter(item => item.type === 'Mill Scale').reduce((acc, curr) => acc + curr.quantity, 0);

      let storeToday = store.find(s => new Date(s.date) >= dayStart && new Date(s.date) <= dayEnd);
      if (!storeToday) {
        const priorStore = store.filter(s => new Date(s.date) <= dayEnd).sort((a,b) => new Date(b.date) - new Date(a.date));
        storeToday = priorStore[0];
      }

      return {
        data: {
          date: dayStart.toISOString(),
          rawMaterial: {
            wireRod: wireRodQty,
            wireRodInProcess: wireRodInProcessQty,
            total: parseFloat((wireRodQty + wireRodInProcessQty).toFixed(3))
          },
          purchase: {
            today: Array.from(supplierPurchasesMap.values()),
            allTime: Array.from(allTimeSupplierPurchasesMap.values())
          },
          production: {
            todayCount: productionToday.length,
            todayQuantity: parseFloat(dailyProductionSum.toFixed(3)),
            totalQuantity: parseFloat(totalProductionSum.toFixed(3)),
            details: productionToday
          },
          inventory: {
            bindingWire: bindingWireStock,
            nails: nailsStock,
            totalFinishedStock: parseFloat(inventory.reduce((acc, curr) => acc + curr.quantity, 0).toFixed(3))
          },
          dispatch: {
            todayCount: dispatchToday.length,
            todayQuantity: parseFloat(dailyDispatchSum.toFixed(3)),
            totalQuantity: parseFloat(totalDispatchSum.toFixed(3)),
            details: dispatchToday
          },
          scrap: {
            scrapQuantity: parseFloat(scrapTodayQty.toFixed(3)),
            millScaleQuantity: parseFloat(millScaleTodayQty.toFixed(3)),
            totalScrapToday: parseFloat((scrapTodayQty + millScaleTodayQty).toFixed(3))
          },
          store: {
            opening: storeToday ? storeToday.openingValue : 0,
            purchase: storeToday ? storeToday.purchaseValue : 0,
            issue: storeToday ? storeToday.issueValue : 0,
            closing: storeToday ? storeToday.closingValue : 0
          }
        }
      };
    }

    // 9. Analytics compiled KPIs & Trends
    if (url === '/analytics') {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const startRange = params.startDate ? new Date(params.startDate) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const endRange = params.endDate ? new Date(params.endDate) : new Date(today.getTime());
      startRange.setHours(0, 0, 0, 0);
      endRange.setHours(23, 59, 59, 999);

      const trendStart = params.startDate ? new Date(params.startDate) : new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      trendStart.setHours(0, 0, 0, 0);

      const rawMaterials = JSON.parse(sessionStorage.getItem('raw_materials_collection') || '[]');
      const purchases = JSON.parse(sessionStorage.getItem('purchases_collection') || '[]');
      const production = JSON.parse(sessionStorage.getItem('production_collection') || '[]');
      const inventory = JSON.parse(sessionStorage.getItem('inventory_collection') || '[]');
      const dispatches = JSON.parse(sessionStorage.getItem('dispatches_collection') || '[]');
      const scrap = JSON.parse(sessionStorage.getItem('scrap_collection') || '[]');

      const wireRods = rawMaterials.filter(r => r.type === 'Wire Rod').sort((a,b) => new Date(b.date) - new Date(a.date));
      const wireRodsProcess = rawMaterials.filter(r => r.type === 'Wire Rod In Process').sort((a,b) => new Date(b.date) - new Date(a.date));
      const latestRod = wireRods[0];
      const latestProcess = wireRodsProcess[0];
      const rawMaterialStock = parseFloat(((latestRod ? latestRod.quantity : 0) + (latestProcess ? latestProcess.quantity : 0)).toFixed(3));

      const prodTodayList = production.filter(p => new Date(p.date) >= startOfToday && new Date(p.date) <= endOfToday);
      const prodTodayQty = prodTodayList.reduce((acc, curr) => acc + curr.quantity, 0);

      const prodRangeList = production.filter(p => new Date(p.date) >= startRange && new Date(p.date) <= endRange);
      const prodMonthQty = prodRangeList.reduce((acc, curr) => acc + curr.quantity, 0);
      const prodTotalQty = production.reduce((acc, curr) => acc + curr.quantity, 0);

      const finishedStockQty = inventory.reduce((acc, curr) => acc + curr.quantity, 0);

      const dispTodayList = dispatches.filter(d => new Date(d.dispatchDate) >= startOfToday && new Date(d.dispatchDate) <= endOfToday);
      const dispTodayQty = dispTodayList.reduce((acc, curr) => acc + curr.quantity, 0);

      const dispRangeList = dispatches.filter(d => new Date(d.dispatchDate) >= startRange && new Date(d.dispatchDate) <= endRange);
      const dispMonthQty = dispRangeList.reduce((acc, curr) => acc + curr.quantity, 0);

      const pendingPurchList = purchases.filter(p => p.status !== 'Completed');
      const pendingPurchaseQty = pendingPurchList.reduce((acc, curr) => acc + curr.pendingQuantity, 0);

      const scrapTodayList = scrap.filter(s => new Date(s.date) >= startOfToday && new Date(s.date) <= endOfToday);
      const scrapTodayQty = scrapTodayList.reduce((acc, curr) => acc + curr.quantity, 0);

      const scrapRangeList = scrap.filter(s => new Date(s.date) >= startRange && new Date(s.date) <= endRange);
      const scrapMonthQty = scrapRangeList.reduce((acc, curr) => acc + curr.quantity, 0);
      const scrapPercentage = prodMonthQty > 0 ? parseFloat(((scrapMonthQty / prodMonthQty) * 100).toFixed(2)) : 0;

      const toYYYYMMDD = (d) => new Date(d).toISOString().split('T')[0];

      const prodTrendList = production.filter(p => new Date(p.date) >= trendStart && new Date(p.date) <= endRange);
      const prodTrendMap = new Map();
      prodTrendList.forEach(p => {
        const key = toYYYYMMDD(p.date);
        prodTrendMap.set(key, (prodTrendMap.get(key) || 0) + p.quantity);
      });
      const productionTrend = Array.from(prodTrendMap.entries())
        .map(([date, quantity]) => ({ date, quantity: parseFloat(quantity.toFixed(3)) }))
        .sort((a,b) => a.date.localeCompare(b.date));

      const dispTrendList = dispatches.filter(d => new Date(d.dispatchDate) >= trendStart && new Date(d.dispatchDate) <= endRange);
      const dispTrendMap = new Map();
      dispTrendList.forEach(d => {
        const key = toYYYYMMDD(d.dispatchDate);
        dispTrendMap.set(key, (dispTrendMap.get(key) || 0) + d.quantity);
      });
      const dispatchTrend = Array.from(dispTrendMap.entries())
        .map(([date, quantity]) => ({ date, quantity: parseFloat(quantity.toFixed(3)) }))
        .sort((a,b) => a.date.localeCompare(b.date));

      const prodDistMap = new Map();
      prodRangeList.forEach(p => {
        prodDistMap.set(p.productType, (prodDistMap.get(p.productType) || 0) + p.quantity);
      });
      const productDistribution = Array.from(prodDistMap.entries())
        .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(3)) }));

      const rmLogs = rawMaterials.filter(r => r.type === 'Wire Rod In Process' && new Date(r.date) >= startRange && new Date(r.date) <= endRange);
      const consumptionMap = new Map();
      rmLogs.forEach(r => {
        const key = toYYYYMMDD(r.date);
        consumptionMap.set(key, { date: key, consumption: parseFloat(r.consumed.toFixed(3)), production: 0 });
      });
      prodRangeList.forEach(p => {
        const key = toYYYYMMDD(p.date);
        const existing = consumptionMap.get(key) || { date: key, consumption: 0, production: 0 };
        existing.production = parseFloat((existing.production + p.quantity).toFixed(3));
        consumptionMap.set(key, existing);
      });
      const rawMaterialConsumption = Array.from(consumptionMap.values()).sort((a,b) => a.date.localeCompare(b.date));

      const invTrendList = rawMaterials.filter(r => new Date(r.date) >= startRange && new Date(r.date) <= endRange);
      const invTrendMap = new Map();
      invTrendList.forEach(r => {
        const key = toYYYYMMDD(r.date);
        const existing = invTrendMap.get(key) || { date: key, wireRod: 0, wireRodInProcess: 0 };
        if (r.type === 'Wire Rod') existing.wireRod = r.quantity;
        if (r.type === 'Wire Rod In Process') existing.wireRodInProcess = r.quantity;
        invTrendMap.set(key, existing);
      });
      const inventoryTrend = Array.from(invTrendMap.values()).sort((a,b) => a.date.localeCompare(b.date));

      const supplierRangeList = purchases.filter(p => new Date(p.purchaseDate) >= startRange && new Date(p.purchaseDate) <= endRange);
      const supplierRatesMap = new Map();
      supplierRangeList.forEach(p => {
        const existing = supplierRatesMap.get(p.supplier) || { name: p.supplier, purchased: 0, received: 0 };
        existing.purchased += p.purchasedQuantity;
        existing.received += p.receivedQuantity;
        supplierRatesMap.set(p.supplier, existing);
      });
      const supplierPerformance = Array.from(supplierRatesMap.values()).map(s => ({
        _id: s.name,
        totalPurchased: parseFloat(s.purchased.toFixed(3)),
        totalReceived: parseFloat(s.received.toFixed(3))
      }));

      return {
        data: {
          kpis: {
            rawMaterialStock: parseFloat(rawMaterialStock.toFixed(3)),
            productionToday: parseFloat(prodTodayQty.toFixed(3)),
            productionMonthly: parseFloat(prodMonthQty.toFixed(3)),
            productionTotal: parseFloat(prodTotalQty.toFixed(3)),
            finishedGoodsStock: parseFloat(finishedStockQty.toFixed(3)),
            dispatchToday: parseFloat(dispTodayQty.toFixed(3)),
            dispatchMonthly: parseFloat(dispMonthQty.toFixed(3)),
            pendingPurchases: parseFloat(pendingPurchaseQty.toFixed(3)),
            scrapPercentage: parseFloat(scrapPercentage.toFixed(2)),
            scrapGeneratedMonthly: parseFloat(scrapMonthQty.toFixed(3))
          },
          charts: {
            productionTrend,
            dispatchTrend,
            productDistribution,
            rawMaterialConsumption,
            inventoryTrend,
            supplierPerformance
          }
        }
      };
    }

    throw new Error(`Endpoint GET ${url} not mocked.`);
  },

  // POST requests
  post: async (url, data = {}) => {
    await delay(50);

    // 1. Reset database setting endpoint
    if (url === '/analytics/reset') {
      sessionStorage.removeItem('production_collection');
      sessionStorage.removeItem('purchases_collection');
      sessionStorage.removeItem('dispatches_collection');
      sessionStorage.removeItem('scrap_collection');
      sessionStorage.removeItem('raw_materials_collection');
      sessionStorage.removeItem('store_collection');
      sessionStorage.removeItem('inventory_collection');
      sessionStorage.removeItem('seeded_v3_empty');
      seedSessionStorage();
      return { data: { message: 'Database reset successfully' } };
    }

    // 2. Add Production entry
    if (url === '/production') {
      const newEntry = handlePostProduction(data);
      return { data: newEntry };
    }

    // 3. Add Purchase entry
    if (url === '/purchases') {
      const newEntry = handlePostPurchase(data);
      return { data: newEntry };
    }

    // 4. Add Inventory FG adjust entry
    if (url === '/inventory') {
      const newEntry = handlePostInventory(data);
      return { data: newEntry };
    }

    // 5. Add Dispatch entry
    if (url === '/dispatch') {
      const newEntry = handlePostDispatch(data);
      return { data: newEntry };
    }

    throw new Error(`Endpoint POST ${url} not mocked.`);
  },

  // PUT requests
  put: async (url, data = {}) => {
    await delay(50);

    // 1. Production update
    if (url.startsWith('/production/')) {
      const id = url.split('/production/')[1];
      const updated = handlePutProduction(id, data);
      return { data: updated };
    }

    // 2. Purchase update
    if (url.startsWith('/purchases/')) {
      const id = url.split('/purchases/')[1];
      const updated = handlePutPurchase(id, data);
      return { data: updated };
    }

    // 3. Inventory FG update
    if (url.startsWith('/inventory/')) {
      const id = url.split('/inventory/')[1];
      const updated = handlePutInventory(id, data);
      return { data: updated };
    }

    // 4. Dispatch update
    if (url.startsWith('/dispatch/')) {
      const id = url.split('/dispatch/')[1];
      const updated = handlePutDispatch(id, data);
      return { data: updated };
    }

    throw new Error(`Endpoint PUT ${url} not mocked.`);
  },

  // DELETE requests
  delete: async (url) => {
    await delay(50);

    // 1. Production deletion
    if (url.startsWith('/production/')) {
      const id = url.split('/production/')[1];
      const res = handleDeleteProduction(id);
      return { data: res };
    }

    // 2. Purchase deletion
    if (url.startsWith('/purchases/')) {
      const id = url.split('/purchases/')[1];
      const res = handleDeletePurchase(id);
      return { data: res };
    }

    // 3. Inventory FG deletion
    if (url.startsWith('/inventory/')) {
      const id = url.split('/inventory/')[1];
      const res = handleDeleteInventory(id);
      return { data: res };
    }

    // 4. Dispatch deletion
    if (url.startsWith('/dispatch/')) {
      const id = url.split('/dispatch/')[1];
      const res = handleDeleteDispatch(id);
      return { data: res };
    }

    throw new Error(`Endpoint DELETE ${url} not mocked.`);
  }
};

const generateScrapForProduction = (productionId, date, quantity) => {
  const scrapList = JSON.parse(sessionStorage.getItem('scrap_collection') || '[]');
  
  // Clean up any existing scrap for this production ID first
  const filtered = scrapList.filter(s => s.productionId !== productionId && s._id !== `scrap_${productionId}_main` && s._id !== `scrap_${productionId}_mill`);
  
  // Calculate scrap (e.g. 1.5% scrap, 0.5% mill scale)
  const scrapQty = parseFloat((quantity * 0.015).toFixed(3));
  const millScaleQty = parseFloat((quantity * 0.005).toFixed(3));

  if (scrapQty > 0) {
    filtered.push({
      _id: `scrap_${productionId}_main`,
      date: new Date(date).toISOString(),
      quantity: scrapQty,
      type: 'Scrap',
      remarks: `Production waste scrap from production run`,
      productionId: productionId
    });
  }

  if (millScaleQty > 0) {
    filtered.push({
      _id: `scrap_${productionId}_mill`,
      date: new Date(date).toISOString(),
      quantity: millScaleQty,
      type: 'Mill Scale',
      remarks: `Mill scale from production run`,
      productionId: productionId
    });
  }

  sessionStorage.setItem('scrap_collection', JSON.stringify(filtered));
};

const deleteScrapForProduction = (productionId) => {
  const scrapList = JSON.parse(sessionStorage.getItem('scrap_collection') || '[]');
  const filtered = scrapList.filter(s => s.productionId !== productionId && s._id !== `scrap_${productionId}_main` && s._id !== `scrap_${productionId}_mill`);
  sessionStorage.setItem('scrap_collection', JSON.stringify(filtered));
};

const handlePostProduction = (body) => {
  const production = JSON.parse(sessionStorage.getItem('production_collection') || '[]');
  const newEntry = {
    _id: `prod_${Math.random().toString(36).substr(2, 9)}`,
    date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
    shift: body.shift,
    productType: body.productType,
    productSize: body.productSize,
    brand: body.productType === 'Binding Wire' ? body.brand : '',
    packaging: body.productType === 'Binding Wire' ? body.packaging : '',
    quantity: parseFloat(body.quantity),
    bags: body.productType === 'Nails' ? parseInt(body.bags || 0) : 0,
    remarks: body.remarks || '',
    status: body.status || 'Completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  production.push(newEntry);
  sessionStorage.setItem('production_collection', JSON.stringify(production));

  if (newEntry.status === 'Completed') {
    adjustFGInventory(newEntry.productType, newEntry.brand, newEntry.productSize, newEntry.packaging, newEntry.quantity, newEntry.bags);
    adjustRawMaterials('Wire Rod', newEntry.date, -newEntry.quantity, 0, false);
    generateScrapForProduction(newEntry._id, newEntry.date, newEntry.quantity);
  } else if (newEntry.status === 'In Progress') {
    adjustRawMaterials('Wire Rod', newEntry.date, -newEntry.quantity, 0, false);
    adjustRawMaterials('Wire Rod In Process', newEntry.date, newEntry.quantity, 0, false);
  }

  return newEntry;
};

const handlePutProduction = (id, body) => {
  const production = JSON.parse(sessionStorage.getItem('production_collection') || '[]');
  const idx = production.findIndex(p => p._id === id);
  if (idx === -1) throw new Error('Production record not found');

  const old = production[idx];
  if (old.status === 'Completed') {
    adjustFGInventory(old.productType, old.brand, old.productSize, old.packaging, -old.quantity, -old.bags);
    adjustRawMaterials('Wire Rod', old.date, old.quantity, 0, false);
    deleteScrapForProduction(old._id);
  } else if (old.status === 'In Progress') {
    adjustRawMaterials('Wire Rod', old.date, old.quantity, 0, false);
    adjustRawMaterials('Wire Rod In Process', old.date, -old.quantity, 0, false);
  }

  const updated = {
    ...old,
    date: body.date ? new Date(body.date).toISOString() : old.date,
    shift: body.shift || old.shift,
    productType: body.productType || old.productType,
    productSize: body.productSize || old.productSize,
    brand: body.productType === 'Binding Wire' ? (body.brand || '') : '',
    packaging: body.productType === 'Binding Wire' ? (body.packaging || '') : '',
    quantity: body.quantity !== undefined ? parseFloat(body.quantity) : old.quantity,
    bags: body.productType === 'Nails' ? parseInt(body.bags !== undefined ? body.bags : (old.bags || 0)) : 0,
    remarks: body.remarks !== undefined ? body.remarks : old.remarks,
    status: body.status || old.status,
    updatedAt: new Date().toISOString()
  };

  production[idx] = updated;
  sessionStorage.setItem('production_collection', JSON.stringify(production));

  if (updated.status === 'Completed') {
    adjustFGInventory(updated.productType, updated.brand, updated.productSize, updated.packaging, updated.quantity, updated.bags);
    adjustRawMaterials('Wire Rod', updated.date, -updated.quantity, 0, false);
    generateScrapForProduction(updated._id, updated.date, updated.quantity);
  } else if (updated.status === 'In Progress') {
    adjustRawMaterials('Wire Rod', updated.date, -updated.quantity, 0, false);
    adjustRawMaterials('Wire Rod In Process', updated.date, updated.quantity, 0, false);
  }

  return updated;
};

const handleDeleteProduction = (id) => {
  const production = JSON.parse(sessionStorage.getItem('production_collection') || '[]');
  const idx = production.findIndex(p => p._id === id);
  if (idx === -1) throw new Error('Production record not found');

  const old = production[idx];
  if (old.status === 'Completed') {
    adjustFGInventory(old.productType, old.brand, old.productSize, old.packaging, -old.quantity, -old.bags);
    adjustRawMaterials('Wire Rod', old.date, old.quantity, 0, false);
    deleteScrapForProduction(old._id);
  } else if (old.status === 'In Progress') {
    adjustRawMaterials('Wire Rod', old.date, old.quantity, 0, false);
    adjustRawMaterials('Wire Rod In Process', old.date, -old.quantity, 0, false);
  }

  production.splice(idx, 1);
  sessionStorage.setItem('production_collection', JSON.stringify(production));

  return { message: 'Production record deleted successfully' };
};

const handlePostPurchase = (body) => {
  const purchases = JSON.parse(sessionStorage.getItem('purchases_collection') || '[]');
  const purchasedQuantity = parseFloat(body.purchasedQuantity);
  const receivedQuantity = body.receivedQuantity !== undefined ? parseFloat(body.receivedQuantity) : 0;
  
  let status = 'Pending';
  if (receivedQuantity >= purchasedQuantity) {
    status = 'Completed';
  } else if (receivedQuantity > 0) {
    status = 'Partially Received';
  }

  const newEntry = {
    _id: `pur_${Math.random().toString(36).substr(2, 9)}`,
    supplier: body.supplier,
    purchasedQuantity,
    receivedQuantity,
    pendingQuantity: parseFloat((purchasedQuantity - receivedQuantity).toFixed(3)),
    purchaseDate: body.purchaseDate ? new Date(body.purchaseDate).toISOString() : new Date().toISOString(),
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  purchases.push(newEntry);
  sessionStorage.setItem('purchases_collection', JSON.stringify(purchases));

  if (receivedQuantity > 0) {
    adjustRawMaterials('Wire Rod', newEntry.purchaseDate, receivedQuantity, receivedQuantity, false);
  }

  return newEntry;
};

const handlePutPurchase = (id, body) => {
  const purchases = JSON.parse(sessionStorage.getItem('purchases_collection') || '[]');
  const idx = purchases.findIndex(p => p._id === id);
  if (idx === -1) throw new Error('Purchase record not found');

  const old = purchases[idx];
  if (old.receivedQuantity > 0) {
    adjustRawMaterials('Wire Rod', old.purchaseDate, -old.receivedQuantity, -old.receivedQuantity, false);
  }

  const purchasedQuantity = body.purchasedQuantity !== undefined ? parseFloat(body.purchasedQuantity) : old.purchasedQuantity;
  const receivedQuantity = body.receivedQuantity !== undefined ? parseFloat(body.receivedQuantity) : old.receivedQuantity;

  let status = 'Pending';
  if (receivedQuantity >= purchasedQuantity) {
    status = 'Completed';
  } else if (receivedQuantity > 0) {
    status = 'Partially Received';
  }

  const updated = {
    ...old,
    supplier: body.supplier || old.supplier,
    purchasedQuantity,
    receivedQuantity,
    pendingQuantity: parseFloat((purchasedQuantity - receivedQuantity).toFixed(3)),
    purchaseDate: body.purchaseDate ? new Date(body.purchaseDate).toISOString() : old.purchaseDate,
    status,
    updatedAt: new Date().toISOString()
  };

  purchases[idx] = updated;
  sessionStorage.setItem('purchases_collection', JSON.stringify(purchases));

  if (updated.receivedQuantity > 0) {
    adjustRawMaterials('Wire Rod', updated.purchaseDate, updated.receivedQuantity, updated.receivedQuantity, false);
  }

  return updated;
};

const handleDeletePurchase = (id) => {
  const purchases = JSON.parse(sessionStorage.getItem('purchases_collection') || '[]');
  const idx = purchases.findIndex(p => p._id === id);
  if (idx === -1) throw new Error('Purchase record not found');

  const old = purchases[idx];
  if (old.receivedQuantity > 0) {
    adjustRawMaterials('Wire Rod', old.purchaseDate, -old.receivedQuantity, -old.receivedQuantity, false);
  }

  purchases.splice(idx, 1);
  sessionStorage.setItem('purchases_collection', JSON.stringify(purchases));

  return { message: 'Purchase record deleted successfully' };
};

const handlePostInventory = (body) => {
  const inventory = JSON.parse(sessionStorage.getItem('inventory_collection') || '[]');
  const filter = (item) => 
    item.productType === body.productType &&
    item.brand === (body.productType === 'Binding Wire' ? body.brand : '') &&
    item.size === body.size &&
    item.packaging === (body.productType === 'Binding Wire' ? body.packaging : '');

  const idx = inventory.findIndex(filter);
  let result;
  if (idx !== -1) {
    inventory[idx].quantity = parseFloat(body.quantity);
    inventory[idx].bags = body.productType === 'Nails' ? parseInt(body.bags || 0) : 0;
    inventory[idx].updatedAt = new Date().toISOString();
    result = inventory[idx];
  } else {
    result = {
      _id: `inv_${Math.random().toString(36).substr(2, 9)}`,
      productType: body.productType,
      brand: body.productType === 'Binding Wire' ? body.brand : '',
      size: body.size,
      packaging: body.productType === 'Binding Wire' ? body.packaging : '',
      bags: body.productType === 'Nails' ? parseInt(body.bags || 0) : 0,
      quantity: parseFloat(body.quantity),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inventory.push(result);
  }
  sessionStorage.setItem('inventory_collection', JSON.stringify(inventory));
  return result;
};

const handlePutInventory = (id, body) => {
  const inventory = JSON.parse(sessionStorage.getItem('inventory_collection') || '[]');
  const idx = inventory.findIndex(i => i._id === id);
  if (idx === -1) throw new Error('Inventory item not found');

  const item = inventory[idx];
  if (body.brand !== undefined) item.brand = item.productType === 'Binding Wire' ? body.brand : '';
  if (body.size !== undefined) item.size = body.size;
  if (body.packaging !== undefined) item.packaging = item.productType === 'Binding Wire' ? body.packaging : '';
  if (body.quantity !== undefined) item.quantity = parseFloat(body.quantity);
  if (body.bags !== undefined) item.bags = item.productType === 'Nails' ? parseInt(body.bags) : 0;
  
  item.updatedAt = new Date().toISOString();
  inventory[idx] = item;
  sessionStorage.setItem('inventory_collection', JSON.stringify(inventory));
  return item;
};

const handleDeleteInventory = (id) => {
  const inventory = JSON.parse(sessionStorage.getItem('inventory_collection') || '[]');
  const idx = inventory.findIndex(i => i._id === id);
  if (idx === -1) throw new Error('Inventory item not found');
  inventory.splice(idx, 1);
  sessionStorage.setItem('inventory_collection', JSON.stringify(inventory));
  return { message: 'Inventory item deleted successfully' };
};

const handlePostDispatch = (body) => {
  const dispatches = JSON.parse(sessionStorage.getItem('dispatches_collection') || '[]');
  const quantity = parseFloat(body.quantity);

  const newEntry = {
    _id: `disp_${Math.random().toString(36).substr(2, 9)}`,
    customerName: body.customerName,
    productType: body.productType,
    productSize: body.productSize,
    brand: body.productType === 'Binding Wire' ? body.brand : '',
    packaging: body.productType === 'Binding Wire' ? body.packaging : '',
    quantity,
    vehicleNumber: body.vehicleNumber,
    dispatchDate: body.dispatchDate ? new Date(body.dispatchDate).toISOString() : new Date().toISOString(),
    remarks: body.remarks || '',
    status: body.status || 'Dispatched',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dispatches.push(newEntry);
  sessionStorage.setItem('dispatches_collection', JSON.stringify(dispatches));

  const bags = newEntry.productType === 'Nails' ? Math.round((quantity * 1000) / 50) : 0;
  adjustFGInventory(newEntry.productType, newEntry.brand, newEntry.productSize, newEntry.packaging, -quantity, -bags);

  return newEntry;
};

const handlePutDispatch = (id, body) => {
  const dispatches = JSON.parse(sessionStorage.getItem('dispatches_collection') || '[]');
  const idx = dispatches.findIndex(d => d._id === id);
  if (idx === -1) throw new Error('Dispatch record not found');

  const old = dispatches[idx];
  const oldBags = old.productType === 'Nails' ? Math.round((old.quantity * 1000) / 50) : 0;
  adjustFGInventory(old.productType, old.brand, old.productSize, old.packaging, old.quantity, oldBags);

  const quantity = body.quantity !== undefined ? parseFloat(body.quantity) : old.quantity;
  const updated = {
    ...old,
    customerName: body.customerName !== undefined ? body.customerName : old.customerName,
    productType: body.productType !== undefined ? body.productType : old.productType,
    productSize: body.productSize !== undefined ? body.productSize : old.productSize,
    brand: body.productType === 'Binding Wire' ? (body.brand || '') : '',
    packaging: body.productType === 'Binding Wire' ? (body.packaging || '') : '',
    quantity,
    vehicleNumber: body.vehicleNumber !== undefined ? body.vehicleNumber : old.vehicleNumber,
    dispatchDate: body.dispatchDate ? new Date(body.dispatchDate).toISOString() : old.dispatchDate,
    remarks: body.remarks !== undefined ? body.remarks : old.remarks,
    status: body.status !== undefined ? body.status : old.status,
    updatedAt: new Date().toISOString()
  };

  dispatches[idx] = updated;
  sessionStorage.setItem('dispatches_collection', JSON.stringify(dispatches));

  const newBags = updated.productType === 'Nails' ? Math.round((quantity * 1000) / 50) : 0;
  adjustFGInventory(updated.productType, updated.brand, updated.productSize, updated.packaging, -quantity, -newBags);

  return updated;
};

const handleDeleteDispatch = (id) => {
  const dispatches = JSON.parse(sessionStorage.getItem('dispatches_collection') || '[]');
  const idx = dispatches.findIndex(d => d._id === id);
  if (idx === -1) throw new Error('Dispatch record not found');

  const old = dispatches[idx];
  const bags = old.productType === 'Nails' ? Math.round((old.quantity * 1000) / 50) : 0;
  adjustFGInventory(old.productType, old.brand, old.productSize, old.packaging, old.quantity, bags);

  dispatches.splice(idx, 1);
  sessionStorage.setItem('dispatches_collection', JSON.stringify(dispatches));

  return { message: 'Dispatch record deleted successfully' };
};

export default apiRouter;
