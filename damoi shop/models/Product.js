const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: true
    },
    oldPrice: {
        type: Number,
        default: null
    },
    images: [{
        type: String // Chứa các đường dẫn ảnh
    }],
    colors: [{
        type: String // Ví dụ: 'Trắng', 'Đen', '#ffffff'
    }],
    sizes: [{
        type: String // Ví dụ: 'S', 'M', 'L'
    }],
    stockCount: {
        type: Number,
        required: true,
        default: 100
    },
    category: {
        type: String,
        default: 'Uncategorized' // Ví dụ: 'Nam', 'Nữ', 'Bé Gái'
    },
    subCategory: {
        type: String,
        default: '' // Ví dụ: 'Áo phông', 'Áo polo', etc.
    },
    isNewProduct: {
        type: Boolean,
        default: false
    },
    isSale: {
        type: Boolean,
        default: false
    },
    reviews: [reviewSchema],
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    numReviews: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
