const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Tạo đơn hàng mới (Checkout)
router.post('/', async (req, res) => {
    try {
        const { orderItems, shippingAddress, itemsPrice, shippingPrice, totalPrice } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'Không có sản phẩm nào trong đơn hàng' });
        } else {
            // Chuyển 'id' từ LocalStorage thành 'product' theo đúng format Mongoose
            const formattedItems = orderItems.map(item => ({
                product: item.id,
                name: item.name,
                qty: item.qty,
                image: item.image,
                price: item.price,
                color: item.color,
                size: item.size
            }));

            const order = new Order({
                orderItems: formattedItems,
                shippingAddress,
                shippingPrice,
                totalPrice
            });

            const createdOrder = await order.save();
            res.status(201).json(createdOrder);
        }
    } catch (error) {
        console.error("Lỗi tạo đơn hàng: ", error);
        res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng', error: error.message });
    }
});

// Tra cứu đơn hàng theo Số Điện Thoại
router.get('/myorders/:phone', async (req, res) => {
    try {
        const orders = await Order.find({ 'shippingAddress.phone': req.params.phone }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tra cứu', error: error.message });
    }
});

// Admin lấy danh sách tất cả đơn hàng
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn', error: error.message });
    }
});

// Cập nhật trạng thái đơn (Dành cho Admin)
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        );
        if (!updatedOrder) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật', error: error.message });
    }
});

// Tra cứu đơn hàng theo User ID (Dành cho Admin xem lịch sử khách)
router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tra cứu', error: error.message });
    }
});

// Admin xoá đơn hàng
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json({ message: 'Đã xóa đơn hàng thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa', error: error.message });
    }
});

module.exports = router;
