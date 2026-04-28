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
    gender: {
        type: String,
        enum: ['Nam', 'Nữ', 'Khác', '-'],
        default: '-'
    },
    dob: {
        type: String, // String for simplicity in this project (YYYY-MM-DD)
        default: '-'
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer' // Phân quyền người dùng và chủ shop
    },
    twoFactorSecret: {
        type: String // Key Google Authenticator
    },
    points: {
        type: Number,
        default: 100 // Tặng 100 điểm khi đăng ký xong
    },
    vouchers: {
        type: [String], // Danh sách các mã code đã sở hữu/đổi
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
