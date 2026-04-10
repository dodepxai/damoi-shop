const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        sparse: true // Cho phép Null nếu tài khoản cũ chưa có SĐT
    },
    address: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer' // Phân quyền người dùng và chủ shop
    },
    twoFactorSecret: {
        type: String // Key Google Authenticator
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
