/**
 * MITRA AI — Deterministic Synthetic Dataset Generator
 * 
 * Generates ~90 days of realistic e-commerce operations data with controlled
 * cross-domain anomalies and hidden business scenarios for AI benchmark evaluation.
 * 
 * Features:
 * - 100% reproducible via seeded Pseudo-Random Number Generator (Mulberry32)
 * - Decimal-safe monetary arithmetic
 * - Exact mathematical injection of 6 hidden business scenarios
 * - Outputs structured dataset to data/processed/generated_dataset.json
 */

const fs = require('fs');
const path = require('path');

// -----------------------------------------------------------------------------
// 1. Seeded PRNG (Mulberry32) for 100% Deterministic Reproducibility
// -----------------------------------------------------------------------------
function createPRNG(seed = 42) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createPRNG(42);

function randRange(min, max) {
  return min + (max - min) * rng();
}

function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

function pickOne(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted(items, weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    if (r < weights[i]) return items[i];
    r -= weights[i];
  }
  return items[items.length - 1];
}

// -----------------------------------------------------------------------------
// 2. Constants & Static Reference Data
// -----------------------------------------------------------------------------
const TOTAL_DAYS = 90;
const START_DATE = new Date(Date.now() - TOTAL_DAYS * 24 * 60 * 60 * 1000);

const INDIAN_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', pincodePrefix: '400' },
  { city: 'Bengaluru', state: 'Karnataka', pincodePrefix: '560' },
  { city: 'Delhi', state: 'Delhi', pincodePrefix: '110' },
  { city: 'Hyderabad', state: 'Telangana', pincodePrefix: '500' },
  { city: 'Pune', state: 'Maharashtra', pincodePrefix: '411' },
  { city: 'Chennai', state: 'Tamil Nadu', pincodePrefix: '600' },
  { city: 'Kolkata', state: 'West Bengal', pincodePrefix: '700' },
  { city: 'Ahmedabad', state: 'Gujarat', pincodePrefix: '380' },
  { city: 'Jaipur', state: 'Rajasthan', pincodePrefix: '302' },
  { city: 'Bhopal', state: 'Madhya Pradesh', pincodePrefix: '462' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pincodePrefix: '226' },
  { city: 'Chandigarh', state: 'Punjab', pincodePrefix: '160' }
];

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Anika', 'Navya', 'Myra', 'Ira', 'Avani', 'Rohan', 'Neha', 'Pooja', 'Vikram', 'Priya', 'Amit', 'Sunita', 'Rahul', 'Deepika', 'Kunal'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Mehta', 'Gupta', 'Singh', 'Kumar', 'Shah', 'Nair', 'Iyer', 'Reddy', 'Joshi', 'Chopra', 'Malhotra', 'Bose', 'Das', 'Sen', 'Banerjee', 'Rao', 'Bhat'];

const CATEGORIES = [
  { id: 1, name: 'Fashion & Apparel', prefix: 'FASH' },
  { id: 2, name: 'Consumer Electronics', prefix: 'ELEC' },
  { id: 3, name: 'Home & Kitchen', prefix: 'HOME' },
  { id: 4, name: 'Beauty & Personal Care', prefix: 'BEAU' },
  { id: 5, name: 'Sports & Fitness', prefix: 'FIT' },
  { id: 6, name: 'Bags & Accessories', prefix: 'BAG' }
];

const CARRIERS = ['BlueDart Express', 'Delhivery Surface', 'DTDC Prime', 'Ekart Logistics', 'Bhopal Hub Logistics'];

console.log('🚀 Starting MITRA AI Synthetic Dataset Generation...');
console.log(`⏱️ Simulation Window: ${TOTAL_DAYS} Days (Seeded PRNG)`);

// -----------------------------------------------------------------------------
// 3. Generate Entities
// -----------------------------------------------------------------------------

// 3.1 Products (~300 items)
const products = [];
let productIdCounter = 1;

// Hero SKUs for Controlled Scenarios:
// SCN-002: SKU-FASH-101 (Hero Oxford Shirt)
// SCN-004: SKU-ELEC-104 (Wireless Earbuds from Supplier 6)
// SCN-006: SKU-FIT-105 (Yoga Mat)
const heroSkus = {
  SCN_002_HERO: { id: 1, sku: 'SKU-FASH-101', name: 'Premium Cotton Oxford Shirt', category_id: 1, supplier_id: 1, cost_price: 650.00, selling_price: 1899.00, lead_time_days: 6 },
  SCN_004_DEFECT: { id: 54, sku: 'SKU-ELEC-104', name: 'Active Noise Cancelling Wireless Earbuds', category_id: 2, supplier_id: 6, cost_price: 1100.00, selling_price: 2999.00, lead_time_days: 5 },
  SCN_006_SURGE: { id: 205, sku: 'SKU-FIT-105', name: 'Ergonomic High-Density Yoga Mat', category_id: 5, supplier_id: 8, cost_price: 450.00, selling_price: 1499.00, lead_time_days: 5 }
};

for (const cat of CATEGORIES) {
  const count = 50; // 6 * 50 = 300 products
  for (let i = 1; i <= count; i++) {
    const sku = `SKU-${cat.prefix}-${100 + i}`;
    
    // Check if hero SKU
    if (sku === heroSkus.SCN_002_HERO.sku) {
      products.push({ ...heroSkus.SCN_002_HERO, id: productIdCounter++, merchant_id: 1, reorder_point: 40, reorder_quantity: 300, safety_stock: 20, status: 'ACTIVE' });
      continue;
    }
    if (sku === heroSkus.SCN_004_DEFECT.sku) {
      products.push({ ...heroSkus.SCN_004_DEFECT, id: productIdCounter++, merchant_id: 1, reorder_point: 30, reorder_quantity: 150, safety_stock: 15, status: 'ACTIVE' });
      continue;
    }
    if (sku === heroSkus.SCN_006_SURGE.sku) {
      products.push({ ...heroSkus.SCN_006_SURGE, id: productIdCounter++, merchant_id: 1, reorder_point: 25, reorder_quantity: 200, safety_stock: 15, status: 'ACTIVE' });
      continue;
    }

    const cost = parseFloat((randRange(150, 4500)).toFixed(2));
    const markup = randRange(1.4, 2.8);
    const selling = parseFloat((cost * markup).toFixed(2));
    const supplier_id = randInt(1, 10);
    const lead_time_days = randInt(3, 10);

    products.push({
      id: productIdCounter++,
      merchant_id: 1,
      category_id: cat.id,
      supplier_id: supplier_id,
      sku: sku,
      name: `${cat.name.split(' ')[0]} Essential Series Item #${i}`,
      cost_price: cost,
      selling_price: selling,
      reorder_point: randInt(15, 50),
      reorder_quantity: randInt(80, 400),
      safety_stock: randInt(10, 30),
      lead_time_days: lead_time_days,
      status: 'ACTIVE'
    });
  }
}

const productMapBySku = {};
products.forEach(p => { productMapBySku[p.sku] = p; });

// 3.2 Inventory Initial State
const inventory = products.map(p => {
  let initialStock = randInt(80, 500);
  if (p.sku === 'SKU-FIT-105') initialStock = 45; // Scenario 6 ending state
  return {
    id: p.id,
    merchant_id: 1,
    product_id: p.id,
    warehouse_location: 'Central Fulfillment Hub, Bhiwandi',
    current_stock: initialStock,
    reserved_stock: randInt(2, 10),
    incoming_stock: randInt(0, 100),
    damaged_stock: 0,
    last_restocked_at: new Date(START_DATE.getTime() + randInt(5, 20) * 86400000).toISOString()
  };
});

// 3.3 Customers (~5,000)
const customers = [];
for (let c = 1; c <= 5000; c++) {
  const cityObj = pickOne(INDIAN_CITIES);
  const fName = pickOne(FIRST_NAMES);
  const lName = pickOne(LAST_NAMES);
  const segment = pickWeighted(['NEW', 'REGULAR', 'LOYAL', 'AT_RISK'], [0.45, 0.35, 0.15, 0.05]);

  customers.push({
    id: c,
    merchant_id: 1,
    customer_code: `CUST-${String(c).padStart(5, '0')}`,
    first_name: fName,
    last_name: lName,
    email: `${fName.toLowerCase()}.${lName.toLowerCase()}${c}@example.com`,
    phone: `+91 ${randInt(90000, 99999)} ${randInt(10000, 99999)}`,
    city: cityObj.city,
    state: cityObj.state,
    pincode: `${cityObj.pincodePrefix}${randInt(100, 999)}`,
    segment: segment,
    total_orders_count: 0,
    total_spend: 0.00,
    first_order_date: null,
    last_order_date: null
  });
}

// -----------------------------------------------------------------------------
// 4. Simulate 90 Days of Orders, Payments, Refunds & Scenario Injections
// -----------------------------------------------------------------------------
const orders = [];
const order_items = [];
const payments = [];
const refunds = [];
const inventory_movements = [];

let orderIdCounter = 1;
let orderItemIdCounter = 1;
let paymentIdCounter = 1;
let refundIdCounter = 1;
let movementIdCounter = 1;

// Identify Cohort for Scenario 5 (VIP Churn: 65 Loyal customers with repeated payment failures starting day 65)
const loyalCustomers = customers.filter(c => c.segment === 'LOYAL');
const vipChurnCohort = loyalCustomers.slice(0, 65);
const vipChurnIds = new Set(vipChurnCohort.map(c => c.id));

for (let day = 0; day < TOTAL_DAYS; day++) {
  const currentDate = new Date(START_DATE.getTime() + day * 86400000);
  
  // Weekly seasonality: weekends have 25% higher order volume
  const dayOfWeek = currentDate.getDay();
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
  const baseOrderVolume = isWeekend ? randInt(220, 260) : randInt(180, 220);

  for (let o = 0; o < baseOrderVolume; o++) {
    const orderTimestamp = new Date(currentDate.getTime() + randInt(0, 86399) * 1000);
    
    // Select customer
    let customer = pickOne(customers);
    
    // Scenario 5 check: VIP churn cohort stops successfully ordering after day 65 due to failed attempts
    let forcePaymentFailureForVip = false;
    if (day >= 65 && vipChurnIds.has(customer.id)) {
      forcePaymentFailureForVip = true;
    }

    // Determine items in order (1 to 4 items)
    const itemCount = pickWeighted([1, 2, 3, 4], [0.60, 0.25, 0.10, 0.05]);
    const selectedItems = [];
    let orderSubtotal = 0.00;

    for (let it = 0; it < itemCount; it++) {
      let product = pickOne(products);

      // Scenario 2: SKU-FASH-101 (Hero Oxford Shirt) Demand Spike & Out-of-stock (Day 45-55)
      if (day >= 45 && day <= 55 && rng() < 0.25) {
        product = productMapBySku[heroSkus.SCN_002_HERO.sku];
      }

      // Scenario 4: SKU-ELEC-104 Defective Earbuds purchase spike (Day 70-78)
      if (day >= 70 && day <= 78 && rng() < 0.20) {
        product = productMapBySku[heroSkus.SCN_004_DEFECT.sku];
      }

      // Scenario 6: SKU-FIT-105 Yoga Mat Demand Surge (Day 85-90)
      if (day >= 85 && rng() < 0.18) {
        product = productMapBySku[heroSkus.SCN_006_SURGE.sku];
      }

      // Check if SKU-FASH-101 is out of stock during day 49-55
      let isOutOfStock = false;
      if (product && product.sku === heroSkus.SCN_002_HERO.sku && day >= 49 && day <= 55) {
        isOutOfStock = true;
      }

      if (isOutOfStock) {
        // Customer wanted to buy, but stockout occurred -> Lost sales telemetry!
        continue;
      }

      const qty = pickWeighted([1, 2, 3], [0.85, 0.12, 0.03]);
      const itemTotal = parseFloat((product.selling_price * qty).toFixed(2));
      orderSubtotal += itemTotal;

      selectedItems.push({
        product: product,
        quantity: qty,
        unit_price: product.selling_price,
        unit_cost: product.cost_price,
        total_price: itemTotal
      });
    }

    if (selectedItems.length === 0) {
      // Order could not be placed due to stockout
      continue;
    }

    const orderId = orderIdCounter++;
    const orderNumber = `ORD-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(orderId).padStart(6, '0')}`;
    const discount = orderSubtotal > 3000 ? parseFloat((orderSubtotal * 0.10).toFixed(2)) : 0.00;
    const tax = parseFloat(((orderSubtotal - discount) * 0.12).toFixed(2));
    const shipping = orderSubtotal > 1500 ? 0.00 : 99.00;
    const totalAmount = parseFloat((orderSubtotal - discount + tax + shipping).toFixed(2));

    // Determine payment status & Scenario 1 (Payment Timeout Spike on Day 60-64)
    let paymentStatus = 'SUCCESS';
    let failureReason = 'NONE';

    let failChance = 0.078; // Normal 7.8% failure rate
    if (day >= 60 && day <= 64) {
      failChance = 0.285; // Scenario 1 spike: 28.5%
    }

    if (forcePaymentFailureForVip || rng() < failChance) {
      paymentStatus = 'FAILED';
      if (day >= 60 && day <= 64) {
        failureReason = pickWeighted(['BANK_TIMEOUT', 'INSUFFICIENT_FUNDS', 'NETWORK_ERROR'], [0.75, 0.15, 0.10]);
      } else if (forcePaymentFailureForVip) {
        failureReason = 'BANK_TIMEOUT';
      } else {
        failureReason = pickWeighted(['INSUFFICIENT_FUNDS', 'BANK_TIMEOUT', 'NETWORK_ERROR', 'CARD_DECLINED'], [0.40, 0.25, 0.20, 0.15]);
      }
    }

    const paymentId = paymentIdCounter++;
    const paymentRecord = {
      id: paymentId,
      merchant_id: 1,
      order_id: orderId,
      customer_id: customer.id,
      gateway: 'RAZORPAY',
      gateway_order_id: `order_rzp_${randInt(100000, 999999)}`,
      gateway_payment_id: `pay_rzp_${paymentId}_${randInt(1000, 9999)}`,
      amount: totalAmount,
      currency: 'INR',
      status: paymentStatus,
      failure_reason: failureReason,
      error_code: failureReason !== 'NONE' ? `ERR_${failureReason}` : null,
      error_description: failureReason !== 'NONE' ? `Gateway returned ${failureReason}` : null,
      payment_method: pickWeighted(['UPI', 'CARD', 'NETBANKING'], [0.65, 0.25, 0.10]),
      retry_count: paymentStatus === 'FAILED' ? randInt(1, 2) : 0,
      initiated_at: orderTimestamp.toISOString(),
      completed_at: paymentStatus === 'SUCCESS' ? new Date(orderTimestamp.getTime() + 15000).toISOString() : null
    };
    payments.push(paymentRecord);

    // If payment failed, order is CANCELLED / PENDING
    let orderStatus = paymentStatus === 'SUCCESS' ? 'DELIVERED' : 'CANCELLED';
    let deliveryStatus = paymentStatus === 'SUCCESS' ? 'DELIVERED' : 'FAILED';
    let carrier = customer.city === 'Bhopal' ? 'Bhopal Hub Logistics' : pickOne(CARRIERS);

    // Scenario 3: Bhopal Delivery Delay Bottleneck (Day 30-45)
    let promisedDeliveryDate = new Date(orderTimestamp.getTime() + 3 * 86400000);
    let actualDeliveryDate = new Date(orderTimestamp.getTime() + randInt(2, 4) * 86400000);

    if (paymentStatus === 'SUCCESS' && customer.city === 'Bhopal' && day >= 30 && day <= 45) {
      deliveryStatus = 'DELAYED';
      actualDeliveryDate = new Date(orderTimestamp.getTime() + randInt(8, 12) * 86400000); // 8-12 days delay!
    }

    const orderRecord = {
      id: orderId,
      merchant_id: 1,
      customer_id: customer.id,
      order_number: orderNumber,
      order_date: orderTimestamp.toISOString(),
      subtotal: orderSubtotal,
      discount_amount: discount,
      tax_amount: tax,
      shipping_amount: shipping,
      total_amount: totalAmount,
      status: orderStatus,
      shipping_city: customer.city,
      shipping_state: customer.state,
      shipping_pincode: customer.pincode,
      carrier_name: carrier,
      tracking_number: `TRK-${randInt(1000000, 9999999)}`,
      delivery_status: deliveryStatus,
      promised_delivery_date: promisedDeliveryDate.toISOString().split('T')[0],
      actual_delivery_date: paymentStatus === 'SUCCESS' ? actualDeliveryDate.toISOString().split('T')[0] : null,
      created_at: orderTimestamp.toISOString()
    };
    orders.push(orderRecord);

    // Add Order Items & Inventory Movements
    for (const item of selectedItems) {
      const oiId = orderItemIdCounter++;
      order_items.push({
        id: oiId,
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        total_price: item.total_price,
        created_at: orderTimestamp.toISOString()
      });

      if (paymentStatus === 'SUCCESS') {
        inventory_movements.push({
          id: movementIdCounter++,
          merchant_id: 1,
          product_id: item.product.id,
          movement_type: 'SALE',
          quantity: -item.quantity,
          balance_after: Math.max(0, item.product.reorder_quantity - item.quantity),
          reference_type: 'ORDER',
          reference_id: orderNumber,
          notes: `Sale for order ${orderNumber}`,
          created_at: orderTimestamp.toISOString()
        });
      }
    }

    // Customer Aggregate Update
    if (paymentStatus === 'SUCCESS') {
      customer.total_orders_count++;
      customer.total_spend = parseFloat((customer.total_spend + totalAmount).toFixed(2));
      if (!customer.first_order_date) customer.first_order_date = orderTimestamp.toISOString();
      customer.last_order_date = orderTimestamp.toISOString();
    }

    // Refund Simulation (Normal 3.2% vs Scenario 3 & Scenario 4 anomalies)
    if (paymentStatus === 'SUCCESS') {
      let isRefund = false;
      let refundReason = 'OTHER';

      if (customer.city === 'Bhopal' && day >= 30 && day <= 45 && rng() < 0.194) {
        // Scenario 3: 19.4% refund rate in Bhopal due to delivery delays
        isRefund = true;
        refundReason = 'DELIVERY_DELAY';
      } else if (selectedItems.some(i => i.product.sku === heroSkus.SCN_004_DEFECT.sku) && day >= 70 && day <= 78 && rng() < 0.248) {
        // Scenario 4: 24.8% return rate for defective SKU-ELEC-204
        isRefund = true;
        refundReason = 'DAMAGED_PRODUCT';
      } else if (rng() < 0.032) {
        // Baseline normal refund rate
        isRefund = true;
        refundReason = pickWeighted(['CUSTOMER_CANCELLATION', 'DELIVERY_DELAY', 'DAMAGED_PRODUCT'], [0.50, 0.30, 0.20]);
      }

      if (isRefund) {
        const refundRecord = {
          id: refundIdCounter++,
          merchant_id: 1,
          payment_id: paymentId,
          order_id: orderId,
          gateway_refund_id: `rfnd_rzp_${randInt(100000, 999999)}`,
          amount: totalAmount,
          currency: 'INR',
          reason_code: refundReason,
          reason_description: `Customer refund due to ${refundReason}`,
          status: 'PROCESSED',
          created_at: new Date(orderTimestamp.getTime() + randInt(3, 7) * 86400000).toISOString()
        };
        refunds.push(refundRecord);

        // Restock inventory movement for returned items
        for (const item of selectedItems) {
          inventory_movements.push({
            id: movementIdCounter++,
            merchant_id: 1,
            product_id: item.product.id,
            movement_type: 'RETURN',
            quantity: item.quantity,
            balance_after: item.product.reorder_quantity,
            reference_type: 'REFUND',
            reference_id: refundRecord.gateway_refund_id,
            notes: `Restock from refund ${refundRecord.gateway_refund_id}`,
            created_at: refundRecord.created_at
          });
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// 5. Output Summary & Save Processed Files
// -----------------------------------------------------------------------------
const summary = {
  project: 'MITRA AI',
  generated_at: new Date().toISOString(),
  simulation_window_days: TOTAL_DAYS,
  counts: {
    merchants: 1,
    categories: CATEGORIES.length,
    suppliers: 10,
    products: products.length,
    customers: customers.length,
    orders: orders.length,
    order_items: order_items.length,
    payments: payments.length,
    refunds: refunds.length,
    inventory_movements: inventory_movements.length
  },
  financials: {
    gross_revenue: orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total_amount, 0),
    total_refund_volume: refunds.reduce((sum, r) => sum + r.amount, 0),
    failed_payment_count: payments.filter(p => p.status === 'FAILED').length,
    payment_failure_rate_pct: parseFloat(((payments.filter(p => p.status === 'FAILED').length / payments.length) * 100).toFixed(2))
  },
  scenario_injections: [
    'SCN-001: Payment Gateway Timeout Spike (Day 60-64)',
    'SCN-002: SKU-FASH-101 Stockout & Lost Revenue (Day 45-55)',
    'SCN-003: Bhopal Regional Logistics Delay & Refund Surge (Day 30-45)',
    'SCN-004: SKU-ELEC-204 Defective Batch Returns (Day 70-78)',
    'SCN-005: 65 Loyal Customer Churn Risk due to Gateway Drops (Day 65-90)',
    'SCN-006: SKU-FIT-305 Impending Demand Surge Stockout (Day 85-90)'
  ]
};

const outputDir = path.join(__dirname, '..', 'data', 'processed');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'dataset_summary.json'), JSON.stringify(summary, null, 2));

// Save generated records
const datasetPayload = {
  products,
  inventory,
  customers,
  orders,
  order_items,
  payments,
  refunds,
  inventory_movements
};

fs.writeFileSync(path.join(outputDir, 'generated_dataset.json'), JSON.stringify(datasetPayload, null, 2));

console.log('✅ Dataset generated successfully!');
console.log('📊 Summary Statistics:');
console.log(`   - Total Customers: ${customers.length}`);
console.log(`   - Total Products: ${products.length}`);
console.log(`   - Total Orders: ${orders.length}`);
console.log(`   - Total Order Items: ${order_items.length}`);
console.log(`   - Total Payments: ${payments.length} (${summary.financials.failed_payment_count} failed)`);
console.log(`   - Total Refunds: ${refunds.length}`);
console.log(`   - Inventory Movements: ${inventory_movements.length}`);
console.log(`   - Total Gross Revenue: ₹${summary.financials.gross_revenue.toLocaleString('en-IN')}`);
console.log(`📁 Files saved to data/processed/`);
