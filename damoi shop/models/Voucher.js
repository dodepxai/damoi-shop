const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountAmount: {
        type: Number,
        required: true
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    expiryDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isNewbieOnly: {
        type: Boolean,
        default: false
    },
    pointsRequired: {
        type: Number,
        default: 0 // Nếu > 0 thì đây là voucher đổi bằng điểm
    }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
