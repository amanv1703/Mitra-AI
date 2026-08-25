/**
 * MITRA AI — Restock Recommendation Executor
 * 
 * Creates an internal restock recommendation record without placing live external supplier POs.
 */

const { pool } = require('../../config/db');

// In-memory restock recommendations ledger
const restockRecommendationsStore = new Map();

class RestockExecutor {
  /**
   * Executes creation of a draft restock recommendation
   */
  async execute({ actionId, merchantId, parameters, expectedImpact }) {
    const {
      productId,
      recommendedQuantity,
      supplierName = 'Preferred Supplier Hub',
      priority = 'STANDARD',
      unitCost = 450,
      dailyVelocity = 20.4,
      coverageDaysTarget = 7
    } = parameters;

    const recommendationId = `RESTOCK-REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const totalOutlay = Number((recommendedQuantity * unitCost).toFixed(2));
    const projectedCoverageDays = Number((recommendedQuantity / (dailyVelocity || 1)).toFixed(1));

    const record = {
      id: recommendationId,
      actionId,
      merchantId: Number(merchantId || 1),
      productId: Number(productId),
      recommendedQuantity: Number(recommendedQuantity),
      unitCost: Number(unitCost),
      estimatedTotalCost: totalOutlay,
      supplierName,
      priority,
      dailyVelocity: Number(dailyVelocity),
      projectedCoverageDays,
      status: 'DRAFT_CREATED',
      createdAt: new Date().toISOString()
    };

    // Store in memory
    restockRecommendationsStore.set(recommendationId, record);

    return {
      recommendationId,
      record,
      summary: `Restock recommendation for ${recommendedQuantity} units (Est. ₹${totalOutlay.toLocaleString('en-IN')}) successfully created and registered.`
    };
  }

  /**
   * Retrieves a restock recommendation record for verification
   */
  async getRecommendation(recommendationId) {
    return restockRecommendationsStore.get(recommendationId) || null;
  }
}

module.exports = new RestockExecutor();
