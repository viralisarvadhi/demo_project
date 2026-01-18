const pool = require('../config/db');

const placeOrder = async (req, res) => {
    // Input validation
    const { items, total_amount } = req.body;
    const userId = req.user?.id;

    console.log('=== ORDER PLACEMENT DEBUG ===');
    console.log('User ID:', userId);
    console.log('Items:', JSON.stringify(items));
    console.log('Total Amount:', total_amount);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid items: Must provide at least one item' });
    }

    if (!total_amount || typeof total_amount !== 'number' || total_amount <= 0) {
        return res.status(400).json({ error: 'Invalid total_amount: Must be a positive number' });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // Insert Order
        const orderRes = await client.query(
            'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING id',
            [userId, total_amount]
        );
        const orderId = orderRes.rows[0].id;
        console.log('Order created with ID:', orderId);

        // Insert Order Items
        for (const item of items) {
            console.log('Processing item:', item);

            if (!item.productId || !item.qty || !item.price) {
                throw new Error(`Invalid item: missing productId, qty, or price. Received: ${JSON.stringify(item)}`);
            }

            const insertRes = await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4) RETURNING *',
                [orderId, item.productId, item.qty, item.price]
            );
            console.log('Order item inserted:', insertRes.rows[0]);
        }

        await client.query('COMMIT');
        console.log('Order committed successfully');
        res.status(201).json({ message: 'Order placed successfully', orderId });
    } catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('Rollback error:', rollbackErr.message);
            }
        }
        console.error('Order placement error:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

module.exports = { placeOrder };