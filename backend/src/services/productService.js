/**
 * MITRA AI — Product Service
 * Business logic for catalog, product performance rankings, and margins
 */

const productRepository = require('../repositories/productRepository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

class ProductService {
  async getProducts(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const filters = {
      limit,
      offset,
      categoryId: query.categoryId ? parseInt(query.categoryId, 10) : null,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    const [products, total] = await Promise.all([
      productRepository.findProducts(filters),
      productRepository.countProducts(filters)
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return { products, meta };
  }

  async getProductById(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      const error = new Error(`Product with ID ${productId} not found`);
      error.statusCode = 404;
      error.code = 'PRODUCT_NOT_FOUND';
      throw error;
    }
    return product;
  }

  async getProductPerformance(query = {}) {
    const limit = Math.min(parseInt(query.limit || '50', 10), 100);
    const sortBy = query.sortBy || 'revenue';
    const sortOrder = query.sortOrder || 'DESC';

    const list = await productRepository.getPerformanceList({ limit, sortBy, sortOrder });
    return {
      sortBy,
      sortOrder,
      count: list.length,
      products: list.map(p => ({
        ...p,
        cost_price: Number(p.cost_price),
        selling_price: Number(p.selling_price),
        unit_margin: Number(p.unit_margin),
        margin_pct: Number(p.margin_pct),
        total_units_sold: Number(p.total_units_sold),
        gross_revenue: Number(p.gross_revenue),
        avg_daily_demand: Number(p.avg_daily_demand),
        total_refunds: Number(p.total_refunds),
        refund_rate_pct: Number(p.refund_rate_pct),
        current_stock: Number(p.current_stock),
        available_stock: Number(p.available_stock),
        days_of_inventory_remaining: Number(p.days_of_inventory_remaining)
      }))
    };
  }
}

module.exports = new ProductService();
