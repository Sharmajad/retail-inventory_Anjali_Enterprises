const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { getISTTodayRange, getISTMonthRange } = require('../utils/dateUtils');

const getDashboardSummary = async (req, res) => {
  try {
    const { outlet } = req.query;
    const { startOfDay, endOfDay } = getISTTodayRange();

    const filter = {
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };

    if (outlet && outlet !== 'All') {
      filter.outlet = outlet;
    }

    const todaySales = await Sale.find(filter);

    let todayRevenue = 0;
    let todayCost = 0;
    let todayItemsSold = 0;
    let todayCashRevenue = 0;
    let todayCashCount = 0;
    let todayOnlineRevenue = 0;
    let todayOnlineCount = 0;
    let todayUpiRevenue = 0;
    let todayCardRevenue = 0;

    // Per outlet tracking for owner
    const outletStats = {
      'Outlet 1': { revenue: 0, cost: 0, invoices: 0, itemsSold: 0, cash: 0, online: 0 },
      'Outlet 2': { revenue: 0, cost: 0, invoices: 0, itemsSold: 0, cash: 0, online: 0 }
    };

    todaySales.forEach(sale => {
      const saleOutlet = sale.outlet || 'Outlet 1';
      todayRevenue += sale.grandTotal;

      if (outletStats[saleOutlet]) {
        outletStats[saleOutlet].revenue += sale.grandTotal;
        outletStats[saleOutlet].invoices += 1;
      }

      if (sale.paymentMethod === 'cash') {
        todayCashRevenue += sale.grandTotal;
        todayCashCount += 1;
        if (outletStats[saleOutlet]) outletStats[saleOutlet].cash += sale.grandTotal;
      } else {
        todayOnlineRevenue += sale.grandTotal;
        todayOnlineCount += 1;
        if (sale.paymentMethod === 'upi') todayUpiRevenue += sale.grandTotal;
        if (sale.paymentMethod === 'card') todayCardRevenue += sale.grandTotal;
        if (outletStats[saleOutlet]) outletStats[saleOutlet].online += sale.grandTotal;
      }

      sale.items.forEach(item => {
        const qty = item.quantity || 0;
        const itemCost = (item.costPrice || 0) * qty;
        todayItemsSold += qty;
        todayCost += itemCost;
        if (outletStats[saleOutlet]) {
          outletStats[saleOutlet].itemsSold += qty;
          outletStats[saleOutlet].cost += itemCost;
        }
      });
    });

    // Compute net profits for outlets
    Object.keys(outletStats).forEach(key => {
      outletStats[key].profit = outletStats[key].revenue - outletStats[key].cost;
    });

    const totalActiveProducts = await Product.countDocuments({ isActive: true });
    const lowStockCount = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$lowStockThreshold'] }
    });

    const summary = {
      todayInvoicesCount: todaySales.length,
      todayItemsSold,
      totalActiveProducts,
      lowStockCount,
      todayCashRevenue,
      todayCashCount,
      todayOnlineRevenue,
      todayOnlineCount,
      todayUpiRevenue,
      todayCardRevenue,
      outletBreakdown: outletStats
    };

    if (req.user.role === 'owner') {
      summary.todayRevenue = todayRevenue;
      summary.todayCost = todayCost;
      summary.todayNetProfit = todayRevenue - todayCost;
    }

    res.status(200).json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMonthlyStatistics = async (req, res) => {
  try {
    const { month, outlet } = req.query;
    
    // Determine start and end of requested month (default to current month in IST)
    let targetYear, targetMonth;
    if (month && month.includes('-')) {
      const parts = month.split('-');
      targetYear = parseInt(parts[0]);
      targetMonth = parseInt(parts[1]) - 1; // 0-indexed
    } else {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth();
    }

    const { startOfMonth, endOfMonth } = getISTMonthRange(targetYear, targetMonth);

    const query = {
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    };

    if (outlet && outlet !== 'All') {
      query.outlet = outlet;
    }

    const sales = await Sale.find(query).sort('-createdAt');
    const allActiveProducts = await Product.find({ isActive: true }).populate('category', 'name');

    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalItemsSold = 0;
    let cashRevenue = 0;
    let cashInvoices = 0;
    let onlineRevenue = 0;
    let onlineInvoices = 0;
    let upiRevenue = 0;
    let cardRevenue = 0;

    const productSalesMap = {};
    const outletStats = {
      'Outlet 1': { revenue: 0, cost: 0, profit: 0, invoices: 0, itemsSold: 0, cash: 0, online: 0, topItem: null, itemSales: {} },
      'Outlet 2': { revenue: 0, cost: 0, profit: 0, invoices: 0, itemsSold: 0, cash: 0, online: 0, topItem: null, itemSales: {} }
    };

    // Initialize all active products in map with 0 sales
    allActiveProducts.forEach(p => {
      productSalesMap[p._id.toString()] = {
        productId: p._id,
        name: p.name,
        brand: p.brand || '',
        category: p.category?.name || 'General',
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        currentStock: p.currentStock,
        quantitySold: 0,
        revenueGenerated: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0
      };
    });

    sales.forEach(sale => {
      const saleOutlet = sale.outlet || 'Outlet 1';
      totalRevenue += sale.grandTotal;
      totalDiscount += (sale.discountAmount || 0);
      totalTax += (sale.taxAmount || 0);

      if (outletStats[saleOutlet]) {
        outletStats[saleOutlet].revenue += sale.grandTotal;
        outletStats[saleOutlet].invoices += 1;
      }

      if (sale.paymentMethod === 'cash') {
        cashRevenue += sale.grandTotal;
        cashInvoices += 1;
        if (outletStats[saleOutlet]) outletStats[saleOutlet].cash += sale.grandTotal;
      } else {
        onlineRevenue += sale.grandTotal;
        onlineInvoices += 1;
        if (sale.paymentMethod === 'upi') upiRevenue += sale.grandTotal;
        if (sale.paymentMethod === 'card') cardRevenue += sale.grandTotal;
        if (outletStats[saleOutlet]) outletStats[saleOutlet].online += sale.grandTotal;
      }

      sale.items.forEach(item => {
        const qty = item.quantity || 0;
        const subtotal = item.subtotal || (item.unitPrice * qty);
        const cost = (item.costPrice || 0) * qty;
        const profit = subtotal - cost;

        totalItemsSold += qty;
        totalCost += cost;

        if (outletStats[saleOutlet]) {
          outletStats[saleOutlet].itemsSold += qty;
          outletStats[saleOutlet].cost += cost;
          if (!outletStats[saleOutlet].itemSales[item.productName]) {
            outletStats[saleOutlet].itemSales[item.productName] = 0;
          }
          outletStats[saleOutlet].itemSales[item.productName] += qty;
        }

        const prodId = item.product ? item.product.toString() : item.productName;
        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = {
            productId: item.product,
            name: item.productName,
            brand: '',
            category: 'General',
            sellingPrice: item.unitPrice,
            costPrice: item.costPrice,
            currentStock: 0,
            quantitySold: 0,
            revenueGenerated: 0,
            totalCost: 0,
            totalProfit: 0,
            profitMargin: 0
          };
        }

        productSalesMap[prodId].quantitySold += qty;
        productSalesMap[prodId].revenueGenerated += subtotal;
        productSalesMap[prodId].totalCost += cost;
        productSalesMap[prodId].totalProfit += profit;
      });
    });

    // Calculate profit margins
    const allProductsArray = Object.values(productSalesMap).map(p => {
      p.profitMargin = p.revenueGenerated > 0 ? ((p.totalProfit / p.revenueGenerated) * 100) : 0;
      return p;
    });

    // 1. Most Selling Items (by quantity sold > 0)
    const mostSellingItems = [...allProductsArray]
      .filter(p => p.quantitySold > 0)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // 2. Least Selling Items (slow moving or 0 sales)
    const leastSellingItems = [...allProductsArray]
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 10);

    // 3. Highest Profit Items (by total profit generated)
    const highestProfitItems = [...allProductsArray]
      .filter(p => p.totalProfit > 0)
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10);

    // 4. Least Profit Items (items with sales but lowest profit contribution or margin)
    const leastProfitItems = [...allProductsArray]
      .filter(p => p.quantitySold > 0)
      .sort((a, b) => a.totalProfit - b.totalProfit)
      .slice(0, 10);

    // Calculate outlet top items & profits
    Object.keys(outletStats).forEach(key => {
      outletStats[key].profit = outletStats[key].revenue - outletStats[key].cost;
      const sortedItems = Object.entries(outletStats[key].itemSales).sort((a, b) => b[1] - a[1]);
      outletStats[key].topItem = sortedItems.length > 0 ? { name: sortedItems[0][0], quantity: sortedItems[0][1] } : null;
      delete outletStats[key].itemSales; // Clean up response
    });

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
    const averageOrderValue = sales.length > 0 ? (totalRevenue / sales.length) : 0;

    res.status(200).json({
      success: true,
      month: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`,
      monthName: new Date(targetYear, targetMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
      outlet: outlet || 'All',
      metrics: {
        totalInvoices: sales.length,
        totalItemsSold,
        totalRevenue,
        totalCost,
        netProfit,
        profitMargin,
        averageOrderValue,
        totalDiscount,
        totalTax,
        paymentBreakdown: {
          cashRevenue,
          cashInvoices,
          onlineRevenue,
          onlineInvoices,
          upiRevenue,
          cardRevenue
        }
      },
      mostSellingItems,
      leastSellingItems,
      highestProfitItems,
      leastProfitItems,
      outletComparison: outletStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, outlet } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (outlet && outlet !== 'All') {
      query.outlet = outlet;
    }

    const sales = await Sale.find(query).sort('-createdAt');

    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let cashRevenue = 0;
    let onlineRevenue = 0;
    const productStats = {};

    sales.forEach(sale => {
      totalRevenue += sale.grandTotal;
      totalDiscount += sale.discountAmount || 0;
      totalTax += sale.taxAmount || 0;

      if (sale.paymentMethod === 'cash') {
        cashRevenue += sale.grandTotal;
      } else {
        onlineRevenue += sale.grandTotal;
      }

      sale.items.forEach(item => {
        const itemCost = (item.costPrice || 0) * item.quantity;
        totalCost += itemCost;

        const prodId = item.product ? item.product.toString() : item.productName;
        if (!productStats[prodId]) {
          productStats[prodId] = {
            productName: item.productName,
            quantitySold: 0,
            revenueGenerated: 0,
            profitGenerated: 0
          };
        }
        productStats[prodId].quantitySold += item.quantity;
        productStats[prodId].revenueGenerated += item.subtotal;
        productStats[prodId].profitGenerated += (item.subtotal - itemCost);
      });
    });

    const topSellingProducts = Object.values(productStats)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    const netProfit = totalRevenue - totalCost;

    res.status(200).json({
      success: true,
      analytics: {
        totalInvoices: sales.length,
        totalRevenue,
        totalCost,
        netProfit,
        totalDiscount,
        totalTax,
        cashRevenue,
        onlineRevenue,
        topSellingProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInventoryValuation = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate('category', 'name');

    let totalStockUnits = 0;
    let totalValueAtCost = 0;
    let totalValueAtSellingPrice = 0;

    const categoryBreakdown = {};

    products.forEach(p => {
      const stock = p.currentStock || 0;
      const costVal = stock * p.costPrice;
      const sellVal = stock * p.sellingPrice;

      totalStockUnits += stock;
      totalValueAtCost += costVal;
      totalValueAtSellingPrice += sellVal;

      const catName = p.category ? p.category.name : 'Uncategorized';
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = {
          categoryName: catName,
          itemCount: 0,
          totalStock: 0,
          valueAtCost: 0,
          valueAtSelling: 0
        };
      }
      categoryBreakdown[catName].itemCount += 1;
      categoryBreakdown[catName].totalStock += stock;
      categoryBreakdown[catName].valueAtCost += costVal;
      categoryBreakdown[catName].valueAtSelling += sellVal;
    });

    const totalPotentialProfit = totalValueAtSellingPrice - totalValueAtCost;

    res.status(200).json({
      success: true,
      valuation: {
        totalProductsCount: products.length,
        totalStockUnits,
        totalValueAtCost,
        totalValueAtSellingPrice,
        totalPotentialProfit,
        categoryBreakdown: Object.values(categoryBreakdown)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardSummary,
  getMonthlyStatistics,
  getSalesAnalytics,
  getInventoryValuation
};
