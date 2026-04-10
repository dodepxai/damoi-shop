const express = require('express');
const router = express.Router();
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

// Create a new voucher (Admin Only - assuming auth middleware is handled elsewhere or simplified here)
router.post('/', async (req, res) => {
    const voucher = new Voucher({
        code: req.body.code,
        discountAmount: req.body.discountAmount,
        minOrderValue: req.body.minOrderValue,
        description: req.body.description,
        expiryDate: req.body.expiryDate
    });

    try {
        const newVoucher = await voucher.save();
        res.status(201).json(newVoucher);
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
