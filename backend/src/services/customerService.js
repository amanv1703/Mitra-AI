/**
 * MITRA AI — Customer Service
 * Business logic for customer cohorts, lifetime value, and deterministic churn risk
 */

const customerRepository = require('../repositories/customerRepository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

class CustomerService {
  async getCustomers(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const filters = {
      limit,
      offset,
      segment: query.segment,
      city: query.city,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    const [customers, total] = await Promise.all([
      customerRepository.findCustomers(filters),
      customerRepository.countCustomers(filters)
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return { customers, meta };
  }

  async getCustomerById(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      const error = new Error(`Customer with ID ${customerId} not found`);
      error.statusCode = 404;
      error.code = 'CUSTOMER_NOT_FOUND';
      throw error;
    }
    return customer;
  }

  async getAtRiskCustomers() {
    const atRiskList = await customerRepository.getAtRiskCustomers();
    
    // Group by segment and compute total MRR/spend at risk
    let totalSpendAtRisk = 0;
    let vipCount = 0;

    atRiskList.forEach(c => {
      totalSpendAtRisk += c.totalSpend;
      if (c.segment === 'LOYAL') vipCount++;
    });

    return {
      totalAtRiskCount: atRiskList.length,
      vipCohortCount: vipCount,
      totalSpendAtRisk: Number(totalSpendAtRisk.toFixed(2)),
      criteriaExplanation: 'Identifies historically active customers with >= 25 days inactivity combined with >= 2 recent checkout payment failures or >= 45 days dormant.',
      customers: atRiskList
    };
  }
}

module.exports = new CustomerService();
