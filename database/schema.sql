-- =============================================================================
-- MITRA AI — Production-Grade Relational Database Schema
-- Database: MySQL 8.0+
-- Standard: Normalized (3NF), Strict Decimal Precision, Foreign Keys, Comprehensive Indexing
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `mitra_ai` 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `mitra_ai`;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if recreating
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `ai_actions`;
DROP TABLE IF EXISTS `ai_insights`;
DROP TABLE IF EXISTS `refunds`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `inventory_movements`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `merchants`;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. MERCHANTS (Multi-tenant ready core entity)
-- -----------------------------------------------------------------------------
CREATE TABLE `merchants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `business_category` VARCHAR(100) NOT NULL DEFAULT 'Retail & E-commerce',
  `email` VARCHAR(190) NOT NULL UNIQUE,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  `max_auto_refund_limit` DECIMAL(12,2) NOT NULL DEFAULT 2000.00,
  `max_auto_reorder_limit` DECIMAL(12,2) NOT NULL DEFAULT 25000.00,
  `max_auto_price_adjust_pct` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. CATEGORIES
-- -----------------------------------------------------------------------------
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `parent_id` INT UNSIGNED NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. SUPPLIERS
-- -----------------------------------------------------------------------------
CREATE TABLE `suppliers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `name` VARCHAR(150) NOT NULL,
  `contact_person` VARCHAR(100) NULL,
  `email` VARCHAR(190) NULL,
  `phone` VARCHAR(30) NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `lead_time_days` INT UNSIGNED NOT NULL DEFAULT 7,
  `reliability_score` DECIMAL(3,2) NOT NULL DEFAULT 0.95 COMMENT 'Score between 0.00 and 1.00',
  `payment_terms` VARCHAR(100) DEFAULT 'Net 30',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_suppliers_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  INDEX `idx_suppliers_city` (`city`),
  INDEX `idx_suppliers_reliability` (`reliability_score`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. PRODUCTS
-- -----------------------------------------------------------------------------
CREATE TABLE `products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `category_id` INT UNSIGNED NOT NULL,
  `supplier_id` INT UNSIGNED NOT NULL,
  `sku` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `cost_price` DECIMAL(12,2) NOT NULL,
  `selling_price` DECIMAL(12,2) NOT NULL,
  `reorder_point` INT UNSIGNED NOT NULL DEFAULT 20,
  `reorder_quantity` INT UNSIGNED NOT NULL DEFAULT 100,
  `safety_stock` INT UNSIGNED NOT NULL DEFAULT 10,
  `lead_time_days` INT UNSIGNED NOT NULL DEFAULT 7,
  `status` ENUM('ACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_products_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT,
  INDEX `idx_products_sku` (`sku`),
  INDEX `idx_products_status` (`status`),
  INDEX `idx_products_category_supplier` (`category_id`, `supplier_id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. INVENTORY (Real-time stock state per location/SKU)
-- -----------------------------------------------------------------------------
CREATE TABLE `inventory` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `product_id` INT UNSIGNED NOT NULL UNIQUE,
  `warehouse_location` VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
  `current_stock` INT NOT NULL DEFAULT 0,
  `reserved_stock` INT NOT NULL DEFAULT 0 COMMENT 'Units allocated to pending orders',
  `incoming_stock` INT NOT NULL DEFAULT 0 COMMENT 'Units ordered from supplier in-transit',
  `damaged_stock` INT NOT NULL DEFAULT 0,
  `last_restocked_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inventory_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  INDEX `idx_inventory_stock_levels` (`current_stock`, `reserved_stock`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. INVENTORY_MOVEMENTS (Immutable audit ledger of stock changes)
-- -----------------------------------------------------------------------------
CREATE TABLE `inventory_movements` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `product_id` INT UNSIGNED NOT NULL,
  `movement_type` ENUM('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'RESTOCK') NOT NULL,
  `quantity` INT NOT NULL COMMENT 'Positive for additions, negative for reductions',
  `balance_after` INT NOT NULL,
  `reference_type` VARCHAR(50) NOT NULL COMMENT 'ORDER, PURCHASE_ORDER, REFUND, AUDIT_CORRECTION',
  `reference_id` VARCHAR(100) NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_movements_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movements_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  INDEX `idx_movements_product_date` (`product_id`, `created_at`),
  INDEX `idx_movements_ref` (`reference_type`, `reference_id`),
  INDEX `idx_movements_type` (`movement_type`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. CUSTOMERS
-- -----------------------------------------------------------------------------
CREATE TABLE `customers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `customer_code` VARCHAR(64) NOT NULL UNIQUE,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(190) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `pincode` VARCHAR(20) NOT NULL,
  `segment` ENUM('NEW', 'REGULAR', 'LOYAL', 'AT_RISK') NOT NULL DEFAULT 'NEW',
  `total_orders_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_spend` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `first_order_date` TIMESTAMP NULL,
  `last_order_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_customers_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  INDEX `idx_customers_segment` (`segment`),
  INDEX `idx_customers_city_state` (`city`, `state`),
  INDEX `idx_customers_last_order` (`last_order_date`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 8. ORDERS
-- -----------------------------------------------------------------------------
CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `customer_id` INT UNSIGNED NOT NULL,
  `order_number` VARCHAR(64) NOT NULL UNIQUE,
  `order_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `shipping_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `shipping_city` VARCHAR(100) NOT NULL,
  `shipping_state` VARCHAR(100) NOT NULL,
  `shipping_pincode` VARCHAR(20) NOT NULL,
  `carrier_name` VARCHAR(100) NULL DEFAULT 'Express Logistics',
  `tracking_number` VARCHAR(100) NULL,
  `delivery_status` ENUM('PENDING', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `promised_delivery_date` DATE NULL,
  `actual_delivery_date` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  INDEX `idx_orders_date` (`order_date`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_delivery_status` (`delivery_status`),
  INDEX `idx_orders_city_delivery` (`shipping_city`, `delivery_status`),
  INDEX `idx_orders_customer_date` (`customer_id`, `order_date`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 9. ORDER_ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `unit_cost` DECIMAL(12,2) NOT NULL,
  `total_price` DECIMAL(12,2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX `idx_order_items_product_order` (`product_id`, `order_id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 10. PAYMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE `payments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED NOT NULL,
  `gateway` VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
  `gateway_order_id` VARCHAR(100) NULL,
  `gateway_payment_id` VARCHAR(100) NULL UNIQUE,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
  `status` ENUM('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
  `failure_reason` ENUM(
    'NONE',
    'BANK_TIMEOUT',
    'INSUFFICIENT_FUNDS',
    'NETWORK_ERROR',
    'CARD_DECLINED',
    'GATEWAY_ERROR',
    'UNKNOWN'
  ) NOT NULL DEFAULT 'NONE',
  `error_code` VARCHAR(50) NULL,
  `error_description` TEXT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'UPI' COMMENT 'UPI, CARD, NETBANKING, WALLET',
  `retry_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `initiated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  CONSTRAINT `fk_payments_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  INDEX `idx_payments_status_date` (`status`, `initiated_at`),
  INDEX `idx_payments_failure_reason` (`failure_reason`, `initiated_at`),
  INDEX `idx_payments_order` (`order_id`),
  INDEX `idx_payments_customer` (`customer_id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 11. REFUNDS
-- -----------------------------------------------------------------------------
CREATE TABLE `refunds` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `payment_id` BIGINT UNSIGNED NOT NULL,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `gateway_refund_id` VARCHAR(100) NULL UNIQUE,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
  `reason_code` ENUM(
    'DELIVERY_DELAY',
    'DAMAGED_PRODUCT',
    'WRONG_ITEM',
    'CUSTOMER_CANCELLATION',
    'POOR_QUALITY',
    'OTHER'
  ) NOT NULL,
  `reason_description` TEXT NULL,
  `status` ENUM('PENDING', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'PROCESSED',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL,
  CONSTRAINT `fk_refunds_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_refunds_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_refunds_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  INDEX `idx_refunds_order_payment` (`order_id`, `payment_id`),
  INDEX `idx_refunds_reason_date` (`reason_code`, `created_at`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 12. AI_INSIGHTS (Autonomous discovery & root-cause explanations)
-- -----------------------------------------------------------------------------
CREATE TABLE `ai_insights` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `insight_uuid` VARCHAR(64) NOT NULL UNIQUE,
  `scenario_code` VARCHAR(64) NULL COMMENT 'Maps to benchmark scenario code e.g. SCN-001 if benchmarked',
  `domain` ENUM('SALES', 'PAYMENTS', 'INVENTORY', 'DELIVERY', 'REFUNDS', 'CUSTOMERS', 'SUPPLIERS', 'CROSS_DOMAIN') NOT NULL,
  `severity` ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT NOT NULL,
  `root_cause_hypothesis` TEXT NOT NULL,
  `cross_domain_chain` JSON NOT NULL COMMENT 'Graph nodes linking telemetry across domains',
  `evidence_payload` JSON NOT NULL COMMENT 'SQL query results, baseline vs anomalous metrics, deltas',
  `estimated_financial_impact` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `confidence_score` DECIMAL(4,3) NOT NULL DEFAULT 0.850 COMMENT '0.000 to 1.000',
  `status` ENUM('DETECTED', 'ACKNOWLEDGED', 'ACTION_PROPOSED', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'DETECTED',
  `detected_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  CONSTRAINT `fk_insights_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  INDEX `idx_insights_domain_severity` (`domain`, `severity`),
  INDEX `idx_insights_status_date` (`status`, `detected_at`),
  INDEX `idx_insights_scenario` (`scenario_code`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 13. AI_ACTIONS (Bounded policy actions & approval workflows)
-- -----------------------------------------------------------------------------
CREATE TABLE `ai_actions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `action_uuid` VARCHAR(64) NOT NULL UNIQUE,
  `insight_id` BIGINT UNSIGNED NULL,
  `action_type` ENUM(
    'INVENTORY_REORDER',
    'PRICE_ADJUSTMENT',
    'CUSTOMER_RECOVERY_CAMPAIGN',
    'SWITCH_PAYMENT_ROUTING',
    'NOTIFY_CARRIER_ISSUE',
    'RESTOCK_SUPPLIER_ALERT',
    'ISSUE_REFUND_CREDIT',
    'FLAG_DEFECTIVE_BATCH'
  ) NOT NULL,
  `risk_level` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
  `parameters` JSON NOT NULL COMMENT 'Action payload, e.g. product_id, reorder_qty, discount_pct',
  `expected_outcome` TEXT NOT NULL,
  `status` ENUM(
    'PROPOSED',
    'POLICY_VALIDATED',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'EXECUTING',
    'EXECUTED',
    'FAILED',
    'VERIFIED'
  ) NOT NULL DEFAULT 'PROPOSED',
  `requires_human_approval` BOOLEAN NOT NULL DEFAULT TRUE,
  `approved_by_user` VARCHAR(100) NULL,
  `approved_at` TIMESTAMP NULL,
  `rejection_reason` VARCHAR(255) NULL,
  `execution_result` JSON NULL,
  `verification_notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `executed_at` TIMESTAMP NULL,
  CONSTRAINT `fk_actions_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_actions_insight` FOREIGN KEY (`insight_id`) REFERENCES `ai_insights` (`id`) ON DELETE SET NULL,
  INDEX `idx_actions_status_risk` (`status`, `risk_level`),
  INDEX `idx_actions_type` (`action_type`),
  INDEX `idx_actions_created` (`created_at`)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 14. AUDIT_LOGS (Immutable system, AI, and human traceability log)
-- -----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT UNSIGNED NOT NULL DEFAULT 1,
  `actor_type` ENUM('SYSTEM', 'AI_AGENT', 'MERCHANT_USER', 'API_INTEGRATION') NOT NULL,
  `actor_identifier` VARCHAR(120) NOT NULL COMMENT 'User email, AI agent model ID, or service name',
  `action_name` VARCHAR(100) NOT NULL,
  `entity_name` VARCHAR(60) NOT NULL COMMENT 'orders, inventory, ai_actions, products, etc.',
  `entity_id` VARCHAR(100) NOT NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `notes` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  INDEX `idx_audit_entity` (`entity_name`, `entity_id`),
  INDEX `idx_audit_actor` (`actor_type`, `actor_identifier`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB;
