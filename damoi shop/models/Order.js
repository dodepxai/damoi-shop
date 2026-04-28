const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Tạm thời để false cho phép khách vãng lai mua
    },
    orderItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            color: { type: String, required: true },
            size: { type: String, required: true }
        }
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true }
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    voucherCode: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Chờ xử lý', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'],
        default: 'Chờ xử lý' // Trạng thái đơn hàng
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
