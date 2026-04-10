const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// 1. Lấy lịch sử hội thoại của 1 User (Dành cho cả Khách và Admin)
router.get('/:userId', async (req, res) => {
    try {
        const messages = await Message.find({ userId: req.params.userId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy tin nhắn', error: error.message });
    }
});

// 2. Gửi tin nhắn mới
router.post('/', async (req, res) => {
    try {
        const { sender, senderName, content, isAdmin, userId } = req.body;
        
        // 1. Lưu tin nhắn người dùng gửi
        const msg = await Message.create({
            sender,
            senderName,
            content,
            isAdmin,
            userId
        });

        // 2. Tự động trả lời nếu là tin nhắn đầu tiên của Hội thoại này (Dành cho Khách)
        if (!isAdmin) {
            const count = await Message.countDocuments({ userId });
            if (count === 1) {
                // Đợi một chút để tạo hiệu ứng đang gõ (nếu muốn, ở đây tạo ngay cho đơn giản)
                await Message.create({
                    sender: null,
                    senderName: 'Hệ thống',
                    content: 'Xin chào quý khách, nhân viên tư vấn sẽ trả lời quý khách ngay!',
                    isAdmin: true,
                    userId: userId
                });
            }
        }

        res.status(201).json(msg);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi gửi tin nhắn', error: error.message });
    }
});

// 3. Admin: Lấy danh sách các cuộc hội thoại đang có (Unique userId)
router.get('/admin/list', async (req, res) => {
    try {
        // Gom nhóm tin nhắn theo userId và lấy tin nhắn mới nhất của mỗi nhóm
        const conversations = await Message.aggregate([
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: "$userId",
                latestMsg: { $first: "$content" },
                latestTime: { $first: "$createdAt" },
                userName: { $first: "$senderName" },
                isPriority: { $first: "$isPriority" },
                unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ["$isAdmin", false] }, { $eq: ["$isRead", false] }] }, 1, 0] } }
            }},
            { $sort: { isPriority: -1, latestTime: -1 } }
        ]);
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi fetch danh sách chat', error: error.message });
    }
});

// 4. Đánh dấu tất cả tin nhắn của 1 User là đã đọc
router.patch('/read/:userId', async (req, res) => {
    try {
        await Message.updateMany(
            { userId: req.params.userId, isAdmin: false, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// 5. Đánh dấu/Bỏ đánh dấu Quan trọng (Priority)
router.patch('/priority/:userId', async (req, res) => {
    try {
        const { isPriority } = req.body;
        await Message.updateMany(
            { userId: req.params.userId },
            { isPriority }
        );
        res.json({ message: 'Đã cập nhật trạng thái ưu tiên' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// 6. Xóa toàn bộ cuộc hội thoại của 1 User
router.delete('/conversation/:userId', async (req, res) => {
    try {
        await Message.deleteMany({ userId: req.params.userId });
        res.json({ message: 'Đã xóa cuộc hội thoại' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa chat', error: error.message });
    }
});

// 7. Khách hàng: Lấy số lượng tin nhắn chưa đọc từ Admin
router.get('/customer/unread/:userId', async (req, res) => {
    try {
        const count = await Message.countDocuments({
            userId: req.params.userId,
            isAdmin: true,
            isRead: false
        });
        res.json({ unreadCount: count });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// 8. Khách hàng: Đánh dấu tin nhắn từ Admin là đã đọc
router.patch('/customer/read/:userId', async (req, res) => {
    try {
        await Message.updateMany(
            { userId: req.params.userId, isAdmin: true, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

module.exports = router;
