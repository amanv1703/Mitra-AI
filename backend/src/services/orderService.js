/**
 * MITRA AI — Order Service
 * Business logic for orders, fulfillment, and carrier delivery SLAs
 */

const orderRepository = require('../repositories/orderRepository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { parseDateRange } = require('../utils/dateRange');

class OrderService {
  async getOrders(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { fromSql, toSql } = query.from || query.range ? parseDateRange(query) : { fromSql: null, toSql: null };

    const filters = {
      limit,
      offset,
      status: query.status,
      deliveryStatus: query.deliveryStatus,
      city: query.city,
      customerId: query.customerId ? parseInt(query.customerId, 10) : null,
      from: fromSql,
      to: toSql,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    const [orders, total] = await Promise.all([
      orderRepository.findOrders(filters),
      orderRepository.countOrders(filters)
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return { orders, meta };
  }

  async getOrderById(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      const error = new Error(`Order with ID ${orderId} not found`);
      error.statusCode = 404;
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }
    return order;
  }

  async getOrderSummary(query = {}) {
    const { fromSql, toSql, from, to } = parseDateRange(query);
    const summary = await orderRepository.getSummary(fromSql, toSql);

    const onTimeRatePct = summary.completedOrders > 0
      ? Number((((summary.completedOrders - summary.delayedDeliveries) / summary.completedOrders) * 100).toFixed(2))
      : 100;

    return {
      period: { from, to },
      ...summary,
      onTimeDeliveryRatePct: onTimeRatePct
    };
  }
}

module.exports = new OrderService();
