/**
 * MITRA AI — Business Analytics Service
 * Multi-grain sales time series, cross-domain business health telemetry, and revenue-at-risk calculations
 */

const analyticsRepository = require('../repositories/analyticsRepository');
const paymentRepository = require('../repositories/paymentRepository');
const refundRepository = require('../repositories/refundRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const customerRepository = require('../repositories/customerRepository');
const { parseDateRange } = require('../utils/dateRange');

class AnalyticsService {
  async getSalesAnalytics(query = {}) {
    const { fromSql, toSql, from, to, startDate, endDate } = parseDateRange(query);
    const groupBy = query.groupBy || 'day'; // day, week, month

    const timeSeries = await analyticsRepository.getSalesTimeSeries({
      from: fromSql,
      to: toSql,
      groupBy
    });

    // Compute period-over-period growth
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - durationMs);
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevFromSql = prevStartDate.toISOString().split('T')[0] + ' 00:00:00';
    const prevToSql = prevEndDate.toISOString().split('T')[0] + ' 23:59:59';

    const currentAggregates = await analyticsRepository.getPeriodAggregates(fromSql, toSql);
    const previousAggregates = await analyticsRepository.getPeriodAggregates(prevFromSql, prevToSql);

    const revenueGrowthPct = previousAggregates.grossSales > 0
      ? Number((((currentAggregates.grossSales - previousAggregates.grossSales) / previousAggregates.grossSales) * 100).toFixed(2))
      : 0;

    const ordersGrowthPct = previousAggregates.totalOrders > 0
      ? Number((((currentAggregates.totalOrders - previousAggregates.totalOrders) / previousAggregates.totalOrders) * 100).toFixed(2))
      : 0;

    return {
      period: { from, to, groupBy },
      summary: {
        totalRevenue: currentAggregates.grossSales,
        totalOrders: currentAggregates.totalOrders,
        averageOrderValue: currentAggregates.aov,
        growth: {
          revenueGrowthPct,
          ordersGrowthPct,
          previousPeriodRevenue: previousAggregates.grossSales,
          previousPeriodOrders: previousAggregates.totalOrders
        }
      },
      timeSeries
    };
  }

  async getRevenueAtRisk(query = {}) {
    const { fromSql, toSql, from, to } = parseDateRange(query);

    // 1. Confirmed Revenue at Risk: Dropped / Failed payment transactions in period
    const paymentSummary = await paymentRepository.getSummary(fromSql, toSql);
    const confirmedFailedPayments = paymentSummary.failedAmount;

    // 2. Estimated Revenue at Risk: Stockout losses from products with lead-time deficits
    const stockoutRisks = await inventoryRepository.getStockoutRisks();
    const stockoutBreakdown = [];
    let estimatedStockoutLoss = 0;

    stockoutRisks.forEach(p => {
      if (p.stock_risk_status === 'OUT_OF_STOCK' || p.stock_risk_status === 'CRITICAL_STOCKOUT_RISK') {
        const dailyRevenue = (Number(p.avg_daily_velocity) || 0) * Number(p.selling_price);
        const shortfallDays = Math.max(0, Number(p.supplier_lead_time_days) - Number(p.days_of_inventory_remaining));
        const estimatedLoss = dailyRevenue * shortfallDays;

        if (estimatedLoss > 0) {
          estimatedStockoutLoss += estimatedLoss;
          stockoutBreakdown.push({
            productId: p.product_id,
            sku: p.sku,
            productName: p.product_name,
            dailyVelocity: Number(p.avg_daily_velocity),
            leadTimeShortfallDays: Number(shortfallDays.toFixed(1)),
            projectedLossInLeadTime: Number(estimatedLoss.toFixed(2))
          });
        }
      }
    });

    // 3. Customer Churn MRR at Risk
    const atRiskCustomers = await customerRepository.getAtRiskCustomers();
    let vipChurnMrrRisk = 0;
    atRiskCustomers.forEach(c => {
      if (c.churnRiskLevel === 'CRITICAL_FRICTION') {
        // Average quarterly spend as estimated risk
        vipChurnMrrRisk += (c.totalSpend * 0.25);
      }
    });

    const confirmedTotal = Number(confirmedFailedPayments.toFixed(2));
    const estimatedTotal = Number((estimatedStockoutLoss + vipChurnMrrRisk).toFixed(2));
    const grandTotal = Number((confirmedTotal + estimatedTotal).toFixed(2));

    return {
      period: { from, to },
      revenueAtRisk: {
        confirmed: confirmedTotal,
        estimated: estimatedTotal,
        total: grandTotal
      },
      breakdown: {
        confirmed: {
          failedPaymentDrops: confirmedTotal,
          failedPaymentCount: paymentSummary.failed
        },
        estimated: {
          stockoutShortfallLoss: Number(estimatedStockoutLoss.toFixed(2)),
          stockoutProducts: stockoutBreakdown,
          vipChurnFrictionRisk: Number(vipChurnMrrRisk.toFixed(2)),
          vipAtRiskCount: atRiskCustomers.filter(c => c.churnRiskLevel === 'CRITICAL_FRICTION').length
        }
      },
      methodology: 'Confirmed revenue at risk represents direct financial transactions that failed at checkout without retry. Estimated revenue at risk projects lost sales from zero-stock inventory during supplier lead-time replenishment gaps plus quarterly recurring revenue of friction-churned VIP buyers.'
    };
  }

  async getBusinessHealth(query = {}) {
    const { fromSql, toSql, from, to } = parseDateRange(query);

    const [salesAgg, paymentSummary, refundSummary, inventorySummary, deliveryByCity, atRiskCustomers] = await Promise.all([
      analyticsRepository.getPeriodAggregates(fromSql, toSql),
      paymentRepository.getSummary(fromSql, toSql),
      refundRepository.getSummary(fromSql, toSql),
      inventoryRepository.getInventoryHealthSummary(),
      analyticsRepository.getDeliveryPerformanceByCity(fromSql, toSql),
      customerRepository.getAtRiskCustomers()
    ]);

    return {
      period: { from, to },
      sales: {
        totalRevenue: salesAgg.grossSales,
        totalOrders: salesAgg.totalOrders,
        averageOrderValue: salesAgg.aov
      },
      payments: {
        totalAttempts: paymentSummary.totalPayments,
        successCount: paymentSummary.successful,
        failedCount: paymentSummary.failed,
        failureRatePct: paymentSummary.failureRatePct,
        lostPaymentVolume: paymentSummary.failedAmount,
        topFailureReasons: paymentSummary.topFailureReasons
      },
      refunds: {
        refundCount: refundSummary.refundCount,
        refundAmount: refundSummary.totalRefundAmount,
        refundRatePct: refundSummary.refundRatePct,
        topReasons: refundSummary.reasons
      },
      inventory: {
        totalProducts: inventorySummary.totalProducts,
        healthyCount: inventorySummary.healthyCount,
        lowStockCount: inventorySummary.lowStockCount,
        criticalRiskCount: inventorySummary.criticalRiskCount,
        outOfStockCount: inventorySummary.outOfStockCount,
        totalStockValuation: inventorySummary.totalStockValuation
      },
      customers: {
        atRiskCount: atRiskCustomers.length,
        vipFrictionCohortCount: atRiskCustomers.filter(c => c.churnRiskLevel === 'CRITICAL_FRICTION').length
      },
      delivery: {
        citiesEvaluated: deliveryByCity.length,
        cityPerformance: deliveryByCity
      }
    };
  }
}

module.exports = new AnalyticsService();
