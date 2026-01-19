const pool = require('../config/db');

// Get all products with pagination
const getProducts = async (req, res) => {
    const { page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT * FROM products ORDER BY id DESC LIMIT $1 OFFSET $2';
        let countQuery = 'SELECT COUNT(*) FROM products';
        const params = [limit, offset];

        const data = await pool.query(query, params);
        const countResult = await pool.query(countQuery);

        res.json({
            products: data.rows,
            totalPages: Math.ceil(countResult.rows[0].count / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createProduct = async (req, res) => {
    const { name, category, material, gem_type, color, carat, cut, stock, price } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO products (name, category, material, gem_type, color, carat, cut, stock, price) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [name, category, material, gem_type, color, carat, cut, stock, price]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, category, material, gem_type, color, carat, cut, stock, price } = req.body;

    try {
        const result = await pool.query(
            `UPDATE products SET name=$1, category=$2, material=$3, gem_type=$4, color=$5, carat=$6, cut=$7, stock=$8, price=$9 WHERE id=$10 RETURNING *`,
            [name, category, material, gem_type, color, carat, cut, stock, price, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };