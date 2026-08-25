/**
 * MITRA AI — Central Tool Registry
 * 
 * Defines strictly bounded, schema-validated tools for the AI Agent.
 * ZERO direct database access; all tools invoke existing domain services and intelligence modules.
 */

const intelligence = require('../../intelligence');
const salesMetrics = require('../../intelligence/metrics/salesMetrics');
const paymentMetrics = require('../../intelligence/metrics/paymentMetrics');
const inventoryMetrics = require('../../intelligence/metrics/inventoryMetrics');
const refundMetrics = require('../../intelligence/metrics/refundMetrics');
const customerMetrics = require('../../intelligence/metrics/customerMetrics');
const deliveryMetrics = require('../../intelligence/metrics/deliveryMetrics');
const orderService = require('../../services/orderService');
const paymentService = require('../../services/paymentService');
const productService = require('../../services/productService');
const customerService = require('../../services/customerService');

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerAllTools();
  }

  registerTool(toolDefinition) {
    this.tools.set(toolDefinition.name, toolDefinition);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  getAllDefinitions() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }));
  }

  async executeTool(name, args = {}, context = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' is not registered in ToolRegistry`);
    }

    try {
      const result = await tool.execute(args, context);
      return {
        success: true,
        tool: name,
        data: result
      };
    } catch (err) {
      console.error(`Tool execution failed for '${name}':`, err);
      return {
        success: false,
        tool: name,
        error: err.message || 'Tool execution encountered an internal error'
      };
    }
  }

  registerAllTools() {
    // 1. getBusinessHealth
    this.registerTool({
      name: 'getBusinessHealth',
      description: 'Returns the overall 0-100 Business Health Score, component subscores, and top positive/negative drag factors across all 5 operational domains.',
      inputSchema: {
        type: 'object',
        properties: {
          range: { type: 'string', enum: ['today', '7d', '30d', '90d', 'all'], description: 'Date range window' }
        }
      },
      execute: async () => {
        return await intelligence.getBusinessHealth();
      }
    });

    // 2. getSalesAnalytics
    this.registerTool({
      name: 'getSalesAnalytics',
      description: 'Returns gross revenue, order volume, average order value (AOV), period-over-period growth rates, and daily sales trends.',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date in YYYY-MM-DD' },
          to: { type: 'string', description: 'End date in YYYY-MM-DD' }
        }
      },
      execute: async (args) => {
        const from = args.from || '2000-01-01 00:00:00';
        const to = args.to || '2099-12-31 23:59:59';
        return await salesMetrics.calculateSalesMetrics(from, to);
      }
    });

    // 3. getPaymentHealth
    this.registerTool({
      name: 'getPaymentHealth',
      description: 'Returns payment transaction health, overall failure rates, error code distributions (e.g. BANK_TIMEOUT), and confirmed dropped checkout revenue.',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date in YYYY-MM-DD' },
          to: { type: 'string', description: 'End date in YYYY-MM-DD' }
        }
      },
      execute: async (args) => {
        const from = args.from || '2000-01-01 00:00:00';
        const to = args.to || '2099-12-31 23:59:59';
        return await paymentMetrics.calculatePaymentMetrics(from, to);
      }
    });

    // 4. getInventoryRisk
    this.registerTool({
      name: 'getInventoryRisk',
      description: 'Returns inventory stockout shortfall gap analysis, daily sales velocities, days of stock remaining, and projected unfulfilled revenue loss.',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      execute: async () => {
        const products = await inventoryMetrics.getProductVelocityMatrix();
        const critical = products.filter(p => p.availableStock <= 0 || p.daysOfStockRemaining <= p.supplierLeadTimeDays);
        return {
          totalProductsEvaluated: products.length,
          criticalStockoutCount: critical.length,
          criticalProducts: critical.slice(0, 10)
        };
      }
    });

    // 5. getRefundAnalytics
    this.registerTool({
      name: 'getRefundAnalytics',
      description: 'Returns return claim rates, breakdown by return reason (e.g. DELIVERY_DELAY, DAMAGED_PRODUCT), and product/city refund rate anomalies.',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date in YYYY-MM-DD' },
          to: { type: 'string', description: 'End date in YYYY-MM-DD' }
        }
      },
      execute: async (args) => {
        const from = args.from || '2000-01-01 00:00:00';
        const to = args.to || '2099-12-31 23:59:59';
        const [summary, productSpikes, citySpikes] = await Promise.all([
          refundMetrics.calculateRefundMetrics(from, to),
          refundMetrics.getProductRefundRates(from, to),
          refundMetrics.getCityRefundRates(from, to)
        ]);
        return {
          summary,
          topProductSpikes: productSpikes.slice(0, 5),
          topCitySpikes: citySpikes.slice(0, 5)
        };
      }
    });

    // 6. getCustomerRisk
    this.registerTool({
      name: 'getCustomerRisk',
      description: 'Returns behavioral customer churn risk cohorts, specifically identifying high-value VIP buyers with repeated checkout payment failures and dormancy.',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      execute: async () => {
        const cohorts = await customerMetrics.getBehavioralRiskCohorts();
        const vipCohort = cohorts.filter(c => c.recentPaymentFailures >= 2 && c.segment === 'LOYAL');
        return {
          totalAtRiskCustomers: cohorts.length,
          vipFrictionCohortCount: vipCohort.length,
          totalLtvAtRisk: vipCohort.reduce((s, c) => s + c.totalSpend, 0),
          sampleVipCohort: vipCohort.slice(0, 10)
        };
      }
    });

    // 7. getDeliveryAnalytics
    this.registerTool({
      name: 'getDeliveryAnalytics',
      description: 'Returns carrier logistics performance, SLA delivery delay rates, and regional hub bottlenecks (e.g. Bhopal delivery delays).',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date in YYYY-MM-DD' },
          to: { type: 'string', description: 'End date in YYYY-MM-DD' }
        }
      },
      execute: async (args) => {
        const from = args.from || '2000-01-01 00:00:00';
        const to = args.to || '2099-12-31 23:59:59';
        const hubs = await deliveryMetrics.getCityDeliveryPerformance(from, to);
        return {
          totalHubs: hubs.length,
          delayedHubs: hubs.filter(h => h.delayedRatePct >= 10.0)
        };
      }
    });

    // 8. getBusinessInsights
    this.registerTool({
      name: 'getBusinessInsights',
      description: 'Returns the list of active structured business insights diagnosed by the deterministic intelligence engine with severity and root-cause candidates.',
      inputSchema: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], description: 'Filter by severity' },
          category: { type: 'string', description: 'Filter by category (e.g. PAYMENTS, INVENTORY, REFUNDS, LOGISTICS, CUSTOMERS)' }
        }
      },
      execute: async (args) => {
        return await intelligence.getInsights(undefined, undefined, args);
      }
    });

    // 9. getInsightDetails
    this.registerTool({
      name: 'getInsightDetails',
      description: 'Retrieves the complete evidence graph, 4-factor root cause score breakdown, and financial exposure for a specific insight ID.',
      inputSchema: {
        type: 'object',
        properties: {
          insightId: { type: 'string', description: 'The unique ID or fingerprint of the insight' }
        },
        required: ['insightId']
      },
      execute: async (args) => {
        const insight = await intelligence.getInsightById(args.insightId);
        if (!insight) {
          throw new Error(`Insight '${args.insightId}' not found`);
        }
        return insight;
      }
    });

    // 10. getProductIntelligence
    this.registerTool({
      name: 'getProductIntelligence',
      description: 'Returns 360 intelligence for a specific SKU or product ID (velocity, days of stock left, return rate, defect ratio, and lead-time gap).',
      inputSchema: {
        type: 'object',
        properties: {
          productId: { type: 'number', description: 'The numeric product ID' },
          sku: { type: 'string', description: 'The product SKU string' }
        }
      },
      execute: async (args) => {
        const products = await inventoryMetrics.getProductVelocityMatrix();
        const product = products.find(p => p.productId === Number(args.productId) || p.sku === args.sku);
        if (!product) throw new Error(`Product not found with specified ID or SKU`);
        return product;
      }
    });

    // 11. getRegionalIntelligence
    this.registerTool({
      name: 'getRegionalIntelligence',
      description: 'Returns localized delivery delays, refund rate surges, and order volumes for a specific city hub.',
      inputSchema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'The target city name (e.g. Bhopal, Mumbai)' }
        },
        required: ['city']
      },
      execute: async (args) => {
        const hubs = await deliveryMetrics.getCityDeliveryPerformance('2000-01-01', '2099-12-31');
        const match = hubs.find(h => h.city?.toLowerCase() === args.city.toLowerCase());
        if (!match) throw new Error(`Regional telemetry for city '${args.city}' not found`);
        return match;
      }
    });

    // 12. searchOrders
    this.registerTool({
      name: 'searchOrders',
      description: 'Safely searches recent orders by status, city, or customer with strict pagination (max 20 records).',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Order status (e.g. DELIVERED, CANCELLED, SHIPPED)' },
          city: { type: 'string', description: 'Shipping city' },
          limit: { type: 'number', description: 'Maximum results (max 20)' }
        }
      },
      execute: async (args) => {
        const limit = Math.min(20, args.limit || 10);
        return await orderService.getOrders({ ...args, limit, page: 1 });
      }
    });

    // 13. searchPayments
    this.registerTool({
      name: 'searchPayments',
      description: 'Safely searches payment transactions with status or failure reason filters (max 20 records).',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['SUCCESS', 'FAILED', 'PENDING'] },
          failureReason: { type: 'string' },
          limit: { type: 'number' }
        }
      },
      execute: async (args) => {
        const limit = Math.min(20, args.limit || 10);
        return await paymentService.getPayments({ ...args, limit, page: 1 });
      }
    });

    // 14. searchProducts
    this.registerTool({
      name: 'searchProducts',
      description: 'Safely searches the product catalog by keyword or category (max 20 records).',
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term for name or SKU' },
          limit: { type: 'number' }
        }
      },
      execute: async (args) => {
        const limit = Math.min(20, args.limit || 10);
        return await productService.getProducts({ ...args, limit, page: 1 });
      }
    });

    // 15. searchCustomers
    this.registerTool({
      name: 'searchCustomers',
      description: 'Safely searches customer master records by segment or search query (max 20 records).',
      inputSchema: {
        type: 'object',
        properties: {
          segment: { type: 'string', enum: ['LOYAL', 'REGULAR', 'OCCASIONAL'] },
          search: { type: 'string' },
          limit: { type: 'number' }
        }
      },
      execute: async (args) => {
        const limit = Math.min(20, args.limit || 10);
        return await customerService.getCustomers({ ...args, limit, page: 1 });
      }
    });

    // 16. simulateRestockScenario (Zero DB mutation What-If Simulation)
    this.registerTool({
      name: 'simulateRestockScenario',
      description: 'Performs a deterministic counterfactual simulation of restocking a product without modifying any database records.',
      inputSchema: {
        type: 'object',
        properties: {
          productId: { type: 'number', description: 'Product ID' },
          reorderQuantity: { type: 'number', description: 'Simulated units to restock' },
          freightType: { type: 'string', enum: ['STANDARD', 'EXPRESS'], description: 'Transit SLA' }
        },
        required: ['productId', 'reorderQuantity']
      },
      execute: async (args) => {
        const simulationTools = require('./simulationTools');
        return await simulationTools.simulateRestockScenario(args);
      }
    });

    // 17. createRestockProposal (Safe Action Proposal)
    this.registerTool({
      name: 'createRestockProposal',
      description: 'Creates an official restock action proposal held behind the merchant human approval gate. Does NOT place real purchase orders.',
      inputSchema: {
        type: 'object',
        properties: {
          productId: { type: 'number', description: 'Product ID' },
          sku: { type: 'string', description: 'Product SKU' },
          recommendedQuantity: { type: 'number', description: 'Recommended replenishment quantity' },
          reason: { type: 'string', description: 'Detailed justification citing demand and lead time' }
        },
        required: ['productId', 'recommendedQuantity', 'reason']
      },
      execute: async (args, context) => {
        const actions = require('../../actions');
        return await actions.proposeAction({
          type: 'CREATE_RESTOCK_RECOMMENDATION',
          merchantId: context.merchantId || 1,
          reason: args.reason,
          parameters: {
            productId: args.productId,
            sku: args.sku || `SKU-${args.productId}`,
            recommendedQuantity: args.recommendedQuantity,
            supplierName: args.supplierName || 'Preferred Supplier Hub',
            unitCost: args.unitCost || 450
          },
          expectedImpact: {
            revenueProtectedInr: (args.recommendedQuantity || 250) * 1200 * 0.8,
            financialOutlayInr: (args.recommendedQuantity || 250) * (args.unitCost || 450)
          },
          createdBy: 'MITRA_AI_AGENT'
        }, context);
      }
    });

    // 18. createReportProposal
    this.registerTool({
      name: 'createReportProposal',
      description: 'Creates a proposal or generates an executive business health report.',
      inputSchema: {
        type: 'object',
        properties: {
          reportType: { type: 'string', default: 'EXECUTIVE_HEALTH_SUMMARY' },
          reason: { type: 'string' }
        }
      },
      execute: async (args, context) => {
        const actions = require('../../actions');
        return await actions.proposeAction({
          type: 'CREATE_BUSINESS_REPORT',
          merchantId: context.merchantId || 1,
          reason: args.reason || 'Requested executive business health summary',
          parameters: { reportType: args.reportType || 'EXECUTIVE_HEALTH_SUMMARY' },
          createdBy: 'MITRA_AI_AGENT'
        }, context);
      }
    });

    // 19. createNotificationDraft
    this.registerTool({
      name: 'createNotificationDraft',
      description: 'Creates a draft alert message without sending external communications. Requires human merchant approval to dispatch.',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string', enum: ['EMAIL', 'WHATSAPP', 'SMS'] },
          targetAudience: { type: 'string' },
          messageBody: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['channel', 'targetAudience', 'messageBody']
      },
      execute: async (args, context) => {
        const actions = require('../../actions');
        return await actions.proposeAction({
          type: 'CREATE_NOTIFICATION_DRAFT',
          merchantId: context.merchantId || 1,
          reason: args.reason || 'Draft notification generated based on telemetry friction',
          parameters: {
            channel: args.channel,
            targetAudience: args.targetAudience,
            messageBody: args.messageBody
          },
          createdBy: 'MITRA_AI_AGENT'
        }, context);
      }
    });

    // 20. markInsightReviewed
    this.registerTool({
      name: 'markInsightReviewed',
      description: 'Marks an intelligence anomaly as reviewed by the operator.',
      inputSchema: {
        type: 'object',
        properties: {
          insightId: { type: 'string' },
          notes: { type: 'string' }
        },
        required: ['insightId']
      },
      execute: async (args, context) => {
        const actions = require('../../actions');
        return await actions.proposeAction({
          type: 'MARK_INSIGHT_REVIEWED',
          merchantId: context.merchantId || 1,
          reason: args.notes || 'Acknowledged by operator',
          parameters: { insightId: args.insightId, notes: args.notes },
          createdBy: 'MITRA_AI_AGENT'
        }, context);
      }
    });
  }
}

module.exports = new ToolRegistry();
