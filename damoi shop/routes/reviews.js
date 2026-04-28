const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

console.log('✅ [SERVER] Hệ thống Đánh giá (MongoDB) đã được kích hoạt thành công!');

// @route   GET /api/reviews/:productId
// @desc    Lấy tất cả đánh giá của một sản phẩm
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/reviews
// @desc    Lấy TẤT CẢ đánh giá (Dành cho Admin)
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/reviews
// @desc    Đăng hoặc cập nhật đánh giá
router.post('/', async (req, res) => {
    const { productId, userId, userName, userCode, rating, comment, media } = req.body;

    try {
        // Kiểm tra xem user đã đánh giá sản phẩm này chưa
        let review = await Review.findOne({ productId, userId });

        if (review) {
            // Cập nhật nếu đã tồn tại
            review.rating = rating;
            review.comment = comment;
            review.media = media;
            await review.save();
            return res.json({ message: 'Đã cập nhật đánh giá!', review });
        }

        // Tạo mới nếu chưa có
        review = new Review({
            productId,
            userId,
            userName,
            userCode,
            rating,
            comment,
            media
        });

        await review.save();
        res.status(201).json({ message: 'Đăng đánh giá thành công!', review });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Xóa đánh giá (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

        await review.deleteOne();
        res.json({ message: 'Đã xóa đánh giá thành công!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
