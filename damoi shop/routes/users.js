const express = require('express');
const router = express.Router();
const User = require('../models/User');
const otplib = require('otplib');

// 1. Dành cho Khách: Đăng ký (Register)
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;

        // 1. Kiểm tra xem email đã có người dùng chưa (nếu có nhập)
        if (email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email này đã được sử dụng. Vui lòng chọn email khác!' });
            }
        }

        if (!phone) {
            return res.status(400).json({ message: 'Số điện thoại là bắt buộc!' });
        }

        // 2. Kiểm tra xem số điện thoại đã có người dùng chưa
        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng để đăng ký!' });
        }

        // Tạo User mới (Hiện tại KHÔNG mã hoá mật khẩu để dễ cho bạn)
        const user = await User.create({
            fullName,
            email,
            password,
            phone
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                points: user.points
            });
        } else {
            res.status(400).json({ message: 'Lỗi không xác định khi tạo tài khoản' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// 2. Dành cho Khách: Đăng nhập (Login)
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Tìm User theo phone HOẶC email
        const user = await User.findOne({
            $or: [
                { phone: identifier },
                { email: identifier }
            ]
        });

        // So sánh mật khẩu (Chưa mã hoá)
        if (user && user.password === password) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                points: user.points
            });
        } else {
            res.status(401).json({ message: 'Số điện thoại hoặc Mật khẩu không đúng!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// [SSO ADMIN] Step 1: Kiểm tra Email và Pass
router.post('/admin-login/step1', async (req, res) => {
    try {
        const { email, password } = req.body;
        const adminUser = await User.findOne({ email, role: 'admin' });

        if (adminUser && adminUser.password === password) {
            res.json({ success: true, message: 'Đúng mật khẩu, yêu cầu 2FA' });
        } else {
            res.status(401).json({ success: false, message: 'Sai Email hoặc mật khẩu!' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// [SSO ADMIN] Step 2: Xác thực Google Authenticator
router.post('/admin-login/verify2fa', async (req, res) => {
    try {
        const { email, password, token } = req.body;
        const adminUser = await User.findOne({ email, role: 'admin' });

        if (!adminUser || adminUser.password !== password) {
            return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' });
        }

        // Kiểm tra mã OTP bằng thư viện otplib
        const isValid = otplib.authenticator.check(token, adminUser.twoFactorSecret);

        if (isValid) {
            res.json({
                success: true,
                _id: adminUser._id,
                fullName: adminUser.fullName,
                email: adminUser.email,
                role: adminUser.role
            });
        } else {
            res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 3. API gửi OTP sử dụng SpeedSMS
router.post('/send-otp', async (req, res) => {
    try {
        const { phone, method, otp } = req.body;

        // Chuẩn hóa sđt
        let normalizedPhone = phone.replace(/^0/, '84');

        const message = `[DAMOI] Ma xac thuc cua ban la ${otp}. Vui long khong chia se ma nay cho bat ky ai.`;
        const speedSmsToken = '9DZolpJcB8B8iPzpmq5werGz-DYjs-6s';

        const authHeader = 'Basic ' + Buffer.from(speedSmsToken + ':x').toString('base64');

        // --- CHẾ ĐỘ GIẢ LẬP (MOCK) KHI CHƯA CÓ GIẤY PHÉP KINH DOANH ---
        // (Khi nào bạn nộp giấy tờ xong và có chữ DAMOI, chỉ cần XÓA cặp dấu /* và */ đi là chạy thật)
        
        /*
        const response = await fetch('https://api.speedsms.vn/index.php/sms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                to: [normalizedPhone],
                content: message,
                type: 4, // (OTP Brandname chuyên nghiệp, chờ duyệt từ nhà mạng)
                sender: "DAMOI" // Tên sẽ hiển thị trên đt khách hàng
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            res.json({ success: true, message: 'Đã gửi mã SMS thành công.' });
        } else {
            console.error('SpeedSMS Error:', data);
            // Trả thẳng thông báo lỗi của cục SpeedSMS về máy khách để dễ gỡ rối
            res.status(400).json({ success: false, message: `[Mã ${data.code}] ${data.message || 'Lỗi gửi tin nhắn'}`, data });
        }
        */

        // Luồng giả lập cho phép Demo Web trơn tru:
        console.log(`[MOCK SMS] Đã gửi OTP ${otp} tới sđt ${phone}`);
        res.json({ success: true, message: 'Mã OTP MÔ PHỎNG đã được tạo!' });
    } catch (error) {
        console.error('Lỗi server gửi OTP:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống', error: error.message });
    }
});

// 4. Admin lấy danh sách tất cả Khách hàng
router.get('/', async (req, res) => {
    try {
        const users = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách', error: error.message });
    }
});

// Admin xoá khách hàng
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
        res.json({ message: 'Đã xóa khách hàng thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa', error: error.message });
    }
});

// 5. Cập nhật hồ sơ Khách hàng
router.put('/:id', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
        }

        const { fullName, email, gender, dob, phone } = req.body;
        const user = await User.findById(req.params.id);

        if (user) {
            // Kiểm tra trùng SĐT nếu thay đổi
            if (phone && phone !== user.phone) {
                const phoneExists = await User.findOne({ phone, _id: { $ne: user._id } });
                if (phoneExists) {
                    return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác!' });
                }
                user.phone = phone;
            }

            // Kiểm tra trùng Email nếu thay đổi
            if (email && email !== user.email) {
                const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
                if (emailExists) {
                    return res.status(400).json({ message: 'Email này đã được sử dụng bởi tài khoản khác!' });
                }
                user.email = email;
            }

            user.fullName = fullName || user.fullName;
            user.gender = gender || user.gender;
            user.dob = dob || user.dob; // Đã bỏ giới hạn cập nhật 1 lần theo yêu cầu

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                gender: updatedUser.gender,
                dob: updatedUser.dob,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật profile', error: error.message });
    }
});

module.exports = router;
