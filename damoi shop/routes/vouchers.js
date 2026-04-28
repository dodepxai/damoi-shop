const express = require('express');
const router = express.Router();
console.log('--- Voucher Router Loaded ---');
const Voucher = require('../models/Voucher');

// Get all vouchers (Public/Admin)
router.get('/', async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        res.json(vouchers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new voucher (Admin Only)
router.post('/', async (req, res) => {
    const voucher = new Voucher({
        code: req.body.code,
        discountAmount: req.body.discountAmount,
        minOrderValue: req.body.minOrderValue,
        description: req.body.description,
        expiryDate: req.body.expiryDate,
        isNewbieOnly: req.body.isNewbieOnly || false,
        pointsRequired: req.body.pointsRequired || 0
    });

    try {
        const newVoucher = await voucher.save();
        res.status(201).json(newVoucher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Đổi điểm lấy Voucher
router.post('/redeem', async (req, res) => {
    const { userId, voucherId } = req.body;
    try {
        const User = require('../models/User');
        const user = await User.findById(userId);
        const voucher = await Voucher.findById(voucherId);

        if (!user || !voucher) return res.status(404).json({ message: 'Không tìm thấy thông tin' });
        
        if (voucher.pointsRequired <= 0) {
            return res.status(400).json({ message: 'Voucher này không dùng để đổi điểm' });
        }

        if (user.points < voucher.pointsRequired) {
            return res.status(400).json({ message: 'Số dư điểm của bạn không đủ!' });
        }

        if (user.vouchers.includes(voucher.code)) {
            return res.status(400).json({ message: 'Bạn đã sở hữu mã ưu đãi này rồi!' });
        }

        // Trừ điểm và thêm vào kho voucher của user
        user.points -= voucher.pointsRequired;
        user.vouchers.push(voucher.code);
        await user.save();

        res.json({ 
            message: 'Đổi điểm thành công! Mã đã được thêm vào kho của bạn.', 
            newPoints: user.points, 
            voucherCode: voucher.code 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a voucher
router.put('/:id', async (req, res) => {
    try {
        const voucher = await Voucher.findById(req.params.id);
        if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher' });

        voucher.code = req.body.code || voucher.code;
        voucher.discountAmount = req.body.discountAmount !== undefined ? req.body.discountAmount : voucher.discountAmount;
        voucher.minOrderValue = req.body.minOrderValue !== undefined ? req.body.minOrderValue : voucher.minOrderValue;
        voucher.description = req.body.description || voucher.description;
        voucher.expiryDate = req.body.expiryDate || voucher.expiryDate;
        voucher.pointsRequired = req.body.pointsRequired !== undefined ? req.body.pointsRequired : voucher.pointsRequired;
        voucher.isNewbieOnly = req.body.isNewbieOnly !== undefined ? req.body.isNewbieOnly : voucher.isNewbieOnly;

        const updatedVoucher = await voucher.save();
        res.json(updatedVoucher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a voucher
router.delete('/:id', async (req, res) => {
    try {
        await Voucher.findByIdAndDelete(req.params.id);
        res.json({ message: 'Voucher deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
