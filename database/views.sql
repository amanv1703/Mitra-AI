-- =============================================================================
-- MITRA AI — Analytical Views for Cross-Domain Anomaly Detection & AI Tools
-- Database: MySQL 8.0+
-- Purpose: High-performance aggregated telemetry for AI agents and dashboards
-- =============================================================================

USE `mitra_ai`;

-- -----------------------------------------------------------------------------
-- 1. Daily Sales & Revenue Performance View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_daily_sales_performance` AS
SELECT 
    o.merchant_id,
    DATE(o.order_date) AS `sales_date`,
    COUNT(o.id) AS `total_orders`,
    SUM(CASE WHEN o.status != 'CANCELLED' THEN 1 ELSE 0 END) AS `successful_orders`,
    SUM(CASE WHEN o.status = 'CANCELLED' THEN 1 ELSE 0 END) AS `cancelled_orders`,
    COALESCE(SUM(CASE WHEN o.status != 'CANCELLED' THEN o.total_amount ELSE 0 END), 0) AS `gross_revenue`,
    COALESCE(AVG(CASE WHEN o.status != 'CANCELLED' THEN o.total_amount ELSE NULL END), 0) AS `average_order_value`,
    COALESCE(SUM(o.discount_amount), 0) AS `total_discounts`
FROM `orders` o
GROUP BY o.merchant_id, DATE(o.order_date);

-- -----------------------------------------------------------------------------
-- 2. Daily Payment Gateway Health & Failure Analysis View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_payment_failure_rates_daily` AS
SELECT 
    p.merchant_id,
    DATE(p.initiated_at) AS `payment_date`,
    COUNT(p.id) AS `total_attempts`,
    SUM(CASE WHEN p.status = 'SUCCESS' THEN 1 ELSE 0 END) AS `success_count`,
    SUM(CASE WHEN p.status = 'FAILED' THEN 1 ELSE 0 END) AS `failed_count`,
    ROUND((SUM(CASE WHEN p.status = 'FAILED' THEN 1 ELSE 0 END) / COUNT(p.id)) * 100, 2) AS `failure_rate_pct`,
    SUM(CASE WHEN p.failure_reason = 'BANK_TIMEOUT' THEN 1 ELSE 0 END) AS `bank_timeout_count`,
    SUM(CASE WHEN p.failure_reason = 'INSUFFICIENT_FUNDS' THEN 1 ELSE 0 END) AS `insufficient_funds_count`,
    SUM(CASE WHEN p.failure_reason = 'NETWORK_ERROR' THEN 1 ELSE 0 END) AS `network_error_count`,
    SUM(CASE WHEN p.failure_reason = 'CARD_DECLINED' THEN 1 ELSE 0 END) AS `card_declined_count`,
    COALESCE(SUM(CASE WHEN p.status = 'FAILED' THEN p.amount ELSE 0 END), 0) AS `lost_payment_volume`
FROM `payments` p
GROUP BY p.merchant_id, DATE(p.initiated_at);

-- -----------------------------------------------------------------------------
-- 3. Product Inventory Velocity & Stockout Risk View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_product_stockout_risk` AS
WITH recent_sales AS (
    SELECT 
        oi.product_id,
        COALESCE(SUM(oi.quantity), 0) AS `units_sold_last_14_days`,
        ROUND(COALESCE(SUM(oi.quantity), 0) / 14.0, 2) AS `avg_daily_velocity`
    FROM `order_items` oi
    JOIN `orders` o ON oi.order_id = o.id
    WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      AND o.status != 'CANCELLED'
    GROUP BY oi.product_id
)
SELECT 
    p.id AS `product_id`,
    p.merchant_id,
    p.sku,
    p.name AS `product_name`,
    c.name AS `category_name`,
    s.name AS `supplier_name`,
    s.lead_time_days AS `supplier_lead_time_days`,
    i.current_stock,
    i.reserved_stock,
    i.incoming_stock,
    (i.current_stock - i.reserved_stock) AS `available_stock`,
    p.reorder_point,
    p.reorder_quantity,
    COALESCE(rs.avg_daily_velocity, 0) AS `avg_daily_velocity`,
    CASE 
        WHEN COALESCE(rs.avg_daily_velocity, 0) = 0 THEN 999.0
        ELSE ROUND((i.current_stock - i.reserved_stock) / rs.avg_daily_velocity, 1)
    END AS `days_of_inventory_remaining`,
    CASE 
        WHEN (i.current_stock - i.reserved_stock) <= 0 THEN 'OUT_OF_STOCK'
        WHEN (i.current_stock - i.reserved_stock) / NULLIF(rs.avg_daily_velocity, 0) <= s.lead_time_days THEN 'CRITICAL_STOCKOUT_RISK'
        WHEN (i.current_stock - i.reserved_stock) <= p.reorder_point THEN 'REORDER_REQUIRED'
        ELSE 'HEALTHY'
    END AS `stock_risk_status`
FROM `products` p
JOIN `categories` c ON p.category_id = c.id
JOIN `suppliers` s ON p.supplier_id = s.id
JOIN `inventory` i ON p.id = i.product_id
LEFT JOIN recent_sales rs ON p.id = rs.product_id
WHERE p.status = 'ACTIVE';

-- -----------------------------------------------------------------------------
-- 4. Regional Delivery Performance & Delays View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_regional_delivery_delays` AS
SELECT 
    o.merchant_id,
    o.shipping_city,
    o.shipping_state,
    COUNT(o.id) AS `total_shipped_orders`,
    SUM(CASE WHEN o.delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) AS `delivered_count`,
    SUM(CASE WHEN o.delivery_status = 'DELAYED' THEN 1 ELSE 0 END) AS `delayed_count`,
    SUM(CASE WHEN o.delivery_status = 'FAILED' THEN 1 ELSE 0 END) AS `failed_delivery_count`,
    ROUND((SUM(CASE WHEN o.delivery_status = 'DELAYED' THEN 1 ELSE 0 END) / COUNT(o.id)) * 100, 2) AS `delayed_rate_pct`,
    AVG(DATEDIFF(COALESCE(o.actual_delivery_date, CURDATE()), o.promised_delivery_date)) AS `avg_days_past_promised`
FROM `orders` o
WHERE o.status IN ('SHIPPED', 'DELIVERED')
GROUP BY o.merchant_id, o.shipping_city, o.shipping_state;

-- -----------------------------------------------------------------------------
-- 5. Product Return & Refund Rate Cross-Analysis View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_product_refund_rates` AS
SELECT 
    p.id AS `product_id`,
    p.merchant_id,
    p.sku,
    p.name AS `product_name`,
    c.name AS `category_name`,
    s.id AS `supplier_id`,
    s.name AS `supplier_name`,
    COALESCE(SUM(oi.quantity), 0) AS `total_units_sold`,
    COUNT(DISTINCT r.id) AS `total_refunds_count`,
    COALESCE(SUM(r.amount), 0) AS `total_refund_amount`,
    ROUND((COUNT(DISTINCT r.id) / NULLIF(COUNT(DISTINCT oi.order_id), 0)) * 100, 2) AS `refund_rate_pct`,
    SUM(CASE WHEN r.reason_code = 'DELIVERY_DELAY' THEN 1 ELSE 0 END) AS `refunds_due_to_delivery_delay`,
    SUM(CASE WHEN r.reason_code = 'DAMAGED_PRODUCT' OR r.reason_code = 'POOR_QUALITY' THEN 1 ELSE 0 END) AS `refunds_due_to_quality`
FROM `products` p
JOIN `categories` c ON p.category_id = c.id
JOIN `suppliers` s ON p.supplier_id = s.id
LEFT JOIN `order_items` oi ON p.id = oi.product_id
LEFT JOIN `refunds` r ON oi.order_id = r.order_id
GROUP BY p.id, p.merchant_id, p.sku, p.name, c.name, s.id, s.name;

-- -----------------------------------------------------------------------------
-- 6. Customer Churn Risk & VIP Friction View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_customer_churn_risk_cohort` AS
SELECT 
    c.id AS `customer_id`,
    c.merchant_id,
    c.customer_code,
    CONCAT(c.first_name, ' ', c.last_name) AS `customer_name`,
    c.email,
    c.city,
    c.segment,
    c.total_orders_count,
    c.total_spend,
    c.last_order_date,
    DATEDIFF(CURDATE(), c.last_order_date) AS `days_since_last_order`,
    COUNT(CASE WHEN p.status = 'FAILED' AND p.initiated_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) AS `recent_payment_failures`,
    CASE 
        WHEN c.segment IN ('LOYAL', 'REGULAR') 
             AND DATEDIFF(CURDATE(), c.last_order_date) > 30 
             AND COUNT(CASE WHEN p.status = 'FAILED' AND p.initiated_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) >= 2 
        THEN 'HIGH_CHURN_RISK'
        WHEN c.segment = 'LOYAL' AND DATEDIFF(CURDATE(), c.last_order_date) > 45 
        THEN 'MODERATE_CHURN_RISK'
        ELSE 'HEALTHY'
    END AS `churn_evaluation`
FROM `customers` c
LEFT JOIN `payments` p ON c.id = p.customer_id
GROUP BY c.id, c.merchant_id, c.customer_code, c.first_name, c.last_name, c.email, c.city, c.segment, c.total_orders_count, c.total_spend, c.last_order_date;
