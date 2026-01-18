const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/', getProducts); // Public
router.post('/', authMiddleware, adminMiddleware, createProduct); // Admin Only
router.put('/:id', authMiddleware, adminMiddleware, updateProduct); // Admin Only
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct); // Admin Only

module.exports = router;