-- =============================================================================
-- MITRA AI — Base Configuration & Reference Seed Data
-- =============================================================================

USE `mitra_ai`;

-- 1. Default Merchant
INSERT INTO `merchants` (`id`, `name`, `business_category`, `email`, `currency`, `timezone`, `max_auto_refund_limit`, `max_auto_reorder_limit`, `max_auto_price_adjust_pct`, `is_active`)
VALUES 
(1, 'Apex Retail India Pvt Ltd', 'Fashion & Lifestyle Retail', 'operator@apexretail.in', 'INR', 'Asia/Kolkata', 2500.00, 30000.00, 10.00, TRUE)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Core Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `parent_id`, `description`) VALUES
(1, 'Fashion & Apparel', 'fashion-apparel', NULL, 'Men and women clothing, footwear and accessories'),
(2, 'Consumer Electronics', 'consumer-electronics', NULL, 'Smartphones, audio, smart wearables, and chargers'),
(3, 'Home & Kitchen', 'home-kitchen', NULL, 'Cookware, furnishings, decor, and storage'),
(4, 'Beauty & Personal Care', 'beauty-personal-care', NULL, 'Skincare, haircare, fragrances, and grooming'),
(5, 'Sports & Fitness', 'sports-fitness', NULL, 'Gym gear, yoga mats, running shoes, and supplements'),
(6, 'Bags & Accessories', 'bags-accessories', NULL, 'Backpacks, wallets, watches, and travel luggage')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Reference Suppliers (Across Indian industrial hubs)
INSERT INTO `suppliers` (`id`, `merchant_id`, `name`, `contact_person`, `email`, `phone`, `city`, `state`, `lead_time_days`, `reliability_score`, `payment_terms`, `is_active`) VALUES
(1, 1, 'Vardhman Textiles Hub', 'Sunil Mehta', 'smehta@vardhmanhub.com', '+91 98140 11223', 'Ludhiana', 'Punjab', 6, 0.96, 'Net 30', TRUE),
(2, 1, 'Shenzhen Prime Electronics Dist.', 'Kavita Rao', 'kavita@shenzhenprime.in', '+91 98200 44556', 'Bengaluru', 'Karnataka', 8, 0.92, 'Net 15', TRUE),
(3, 1, 'Surat Fabric Mills Corp', 'Rajesh Patel', 'rpatel@suratfabric.in', '+91 98251 77889', 'Surat', 'Gujarat', 5, 0.98, 'Net 30', TRUE),
(4, 1, 'Jaipur Handicrafts & Living', 'Ananya Sharma', 'ananya@jaipurdecor.co.in', '+91 94140 33445', 'Jaipur', 'Rajasthan', 7, 0.90, 'Net 30', TRUE),
(5, 1, 'Godrej Industrial Packagers', 'Alok Verma', 'alok.v@godrejpack.in', '+91 97110 99887', 'Mumbai', 'Maharashtra', 4, 0.97, 'Net 45', TRUE),
(6, 1, 'Noida Tech Components', 'Pooja Nair', 'pooja@noidatech.in', '+91 98990 66778', 'Noida', 'Uttar Pradesh', 5, 0.88, 'Net 15', TRUE),
(7, 1, 'Himalayan Organic Botanicals', 'Deepak Joshi', 'deepak@himalayanherb.in', '+91 94120 55667', 'Dehradun', 'Uttarakhand', 9, 0.94, 'Net 30', TRUE),
(8, 1, 'Coimbatore Precision Gear', 'Karthik Raja', 'karthik@cbegear.in', '+91 98422 11990', 'Coimbatore', 'Tamil Nadu', 7, 0.95, 'Net 30', TRUE),
(9, 1, 'Bhopal Logistics & Material Works', 'Virendra Chouhan', 'virendra@bhopalwork.in', '+91 94250 88112', 'Bhopal', 'Madhya Pradesh', 10, 0.76, 'Net 15', TRUE),
(10, 1, 'Delhi Express Accessories', 'Harpreet Singh', 'harpreet@delhixpress.in', '+91 98110 22334', 'New Delhi', 'Delhi', 3, 0.93, 'Net 30', TRUE)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
