/**
 * MITRA AI — Category Routes
 * Read-only access to category catalog
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { successResponse } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const categories = await query('SELECT id, name, slug, parent_id, description, created_at FROM categories ORDER BY id ASC');
    return successResponse(res, categories, { total: categories.length });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
