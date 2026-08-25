/**
 * MITRA AI — Dashboard Service
 * Business logic for executive dashboard KPIs and period-over-period growth
 */

const dashboardRepository = require('../repositories/dashboardRepository');
const analyticsRepository = require('../repositories/analyticsRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const { parseDateRange } = require('../utils/dateRange');

class DashboardService {
  async getDashboardSummary(query = {}) {
    const { startDate, endDate, fromSql, toSql, from, to } = parseDateRange(query);

    // 1. Current period summary
    const summary = await dashboardRepository.getSummary(fromSql, toSql);

    // 2. Previous period calculation for growth metrics
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - durationMs);
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevFromSql = prevStartDate.toISOString().split('T')[0] + ' 00:00:00';
    const prevToSql = prevEndDate.toISOString().split('T')[0] + ' 23:59:59';

    const prevAggregates = await analyticsRepository.getPeriodAggregates(prevFromSql, prevToSql);

    const salesGrowthPct = prevAggregates.grossSales > 0 
      ? Number((((summary.totalSales - prevAggregates.grossSales) / prevAggregates.grossSales) * 100).toFixed(2))
      : 0;

    const ordersGrowthPct = prevAggregates.totalOrders > 0
      ? Number((((summary.totalOrders - prevAggregates.totalOrders) / prevAggregates.totalOrders) * 100).toFixed(2))
      : 0;

    // 3. Stockout revenue loss estimation
    const stockoutRisks = await inventoryRepository.getStockoutRisks();
    let estimatedStockoutLoss = 0;
    stockoutRisks.forEach(p => {
      if (p.stock_risk_status === 'OUT_OF_STOCK' || p.stock_risk_status === 'CRITICAL_STOCKOUT_RISK') {
        const dailyRevenue = (Number(p.avg_daily_velocity) || 0) * Number(p.selling_price);
        const shortfallDays = Math.max(0, Number(p.supplier_lead_time_days) - Number(p.days_of_inventory_remaining));
        estimatedStockoutLoss += (dailyRevenue * shortfallDays);
      }
    });

    const confirmedRevenueAtRisk = summary.failedPaymentVolume;
    const estimatedRevenueAtRisk = Number(estimatedStockoutLoss.toFixed(2));
    const totalRevenueAtRisk = Number((confirmedRevenueAtRisk + estimatedRevenueAtRisk).toFixed(2));

    return {
      period: {
        from,
        to,
        previousFrom: prevStartDate.toISOString().split('T')[0],
        previousTo: prevEndDate.toISOString().split('T')[0]
      },
      overview: {
        totalSales: summary.totalSales,
        totalOrders: summary.totalOrders,
        averageOrderValue: summary.averageOrderValue,
        pendingOrders: summary.pendingOrders,
        activeCustomers: summary.activeCustomers,
        growth: {
          salesGrowthPct,
          ordersGrowthPct
        }
      },
      payments: {
        successfulPayments: summary.successfulPayments,
        failedPayments: summary.failedPayments,
        failedPaymentVolume: summary.failedPaymentVolume,
        failureRatePct: (summary.successfulPayments + summary.failedPayments) > 0
          ? Number(((summary.failedPayments / (summary.successfulPayments + summary.failedPayments)) * 100).toFixed(2))
          : 0
      },
      refunds: {
        totalRefunds: summary.totalRefunds,
        refundAmount: summary.refundAmount,
        refundRatePct: summary.totalOrders > 0
          ? Number(((summary.totalRefunds / summary.totalOrders) * 100).toFixed(2))
          : 0
      },
      inventory: {
        lowStockProductCount: summary.lowStockCount,
        outOfStockProductCount: summary.outOfStockCount
      },
      revenueAtRisk: {
        confirmed: confirmedRevenueAtRisk,
        estimated: estimatedRevenueAtRisk,
        total: totalRevenueAtRisk,
        explanation: 'Confirmed risk includes dropped checkout payment attempts. Estimated risk includes projected sales loss from stockouts during supplier lead-time gaps.'
      }
    };
  }
}

module.exports = new DashboardService();
