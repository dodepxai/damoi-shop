require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối Cơ sở dữ liệu MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/damoi_shop_db');
        console.log(`✅ MongoDB đã được kết nối thành công: ${conn.connection.host}`);
        
        // Khởi tạo tài khoản Admin mặc định nếu chưa có
        const User = require('./models/User');
        const otplib = require('otplib');
        const adminEmail = 'dotech204@gmail.com';
        let adminUser = await User.findOne({ email: adminEmail });
        
        if (!adminUser) {
            await User.deleteMany({ role: 'admin' }); // Xóa hết admin bản nháp cũ
            const secret = otplib.authenticator.generateSecret();
            
            adminUser = await User.create({
                fullName: 'Quản Trị Hệ Thống',
                email: adminEmail,
                phone: '0000000000', // Dummy phone vì model bắt buộc
                password: 'Dobeo24@!',
                role: 'admin',
                twoFactorSecret: secret
            });
            const issuer = encodeURIComponent('DAMOI SHOP');
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=otpauth://totp/${issuer}:${adminEmail}?secret=${secret}&issuer=${issuer}`;

            console.log('\n================ SSO DASHBOARD SETUP ================');
            console.log('✅ Đã tạo tài khoản Admin SSO gốc!');
            console.log(`🔒 Email: ${adminEmail} | Pass: Dobeo24@!`);
            console.log(`🔑 MÃ BÍ MẬT Google Authenticator: ${secret}`);
            console.log('📸 BẤM VÀO LINK NÀY ĐỂ HIỆN MÃ QR:');
            console.log(qrUrl);
            console.log('=====================================================\n');
        } else if (!adminUser.twoFactorSecret) {
            const secret = otplib.authenticator.generateSecret();
            adminUser.twoFactorSecret = secret;
            adminUser.password = 'Dobeo24@!';
            await adminUser.save();
            
            const issuer = encodeURIComponent('DAMOI SHOP');
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=otpauth://totp/${issuer}:${adminEmail}?secret=${secret}&issuer=${issuer}`;
            
            console.log(`\n================ BỔ SUNG SSO ADMIN ================`);
            console.log(`🔑 Đã khôi phục mã khóa 2FA cho Admin: ${secret}`);
            console.log('📸 BẤM VÀO LINK NÀY ĐỂ HIỆN MÃ QR:');
            console.log(qrUrl);
            console.log('===================================================\n');
        }
    } catch (error) {
        console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
        console.log('⚠️ Lưu ý: Nếu bạn chưa cài MongoDB trên máy, web vẫn có thể hiển thị giao diện tĩnh bình thường.');
    }
};

connectDB();

// Middleware
app.use(cors());
// Tăng giới hạn dung lượng tải lên (Upload Image) từ 100KB mặc định lên 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files (HTML, CSS, JS ảnh của frontend)
// Thay vì chạy file HTML bằng Live Server, từ nay Server Node.js sẽ đảm nhận việc load file HTML lên
app.use(express.static(path.join(__dirname)));

// Basic API route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server Node.js đang hoạt động ngon lành!' });
});

// Import và sử dụng các Routes API
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

// Route Upload ảnh: nhận base64, lưu sản phẩm vào thư mục theo SKU
const fs = require('fs');
app.post('/api/upload', (req, res) => {
    try {
        const { imageData, fileName, sku } = req.body;
        if (!imageData || !fileName || !sku) {
            return res.status(400).json({ message: 'Thiếu dữ liệu ảnh, tên file hoặc mã SKU' });
        }

        const matches = imageData.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ message: 'Dữ liệu ảnh không hợp lệ' });
        }
        const base64Data = matches[2];

        // Chuẩn hóa tên thư mục SKU (ví dụ: ASM-01 -> asm_01)
        const folderName = sku.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
        const productDir = path.join(__dirname, 'images', 'products', folderName);
        
        if (!fs.existsSync(productDir)) {
            fs.mkdirSync(productDir, { recursive: true });
        }

        // Tạo tên file an toàn + timestamp để tránh lỗi cache trình duyệt khi ghi đè
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueName = Date.now() + '_' + safeName;
        const filePath = path.join(productDir, uniqueName);

        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        // Trả về đường dẫn chuẩn để lưu vào database
        const relativePath = `images/products/${folderName}/${uniqueName}`;
        res.json({ imageUrl: relativePath });
    } catch (error) {
        console.error('Lỗi upload ảnh:', error);
        res.status(500).json({ message: 'Lỗi khi lưu ảnh', error: error.message });
    }
});

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

const voucherRoutes = require('./routes/vouchers');
app.use('/api/vouchers', voucherRoutes);

// API thống kê Dashboard Admin
app.get('/api/stats', async (req, res) => {
    try {
        const Product = require('./models/Product');
        const Order = require('./models/Order');

        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: { $in: ['Chờ xử lý', 'Pending'] } });

        const revenueResult = await Order.aggregate([
            { $match: { status: { $nin: ['Đã hủy', 'Cancelled'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Thống kê đơn hàng 7 ngày gần nhất
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const dailyOrders = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
                revenue: { $sum: '$totalPrice' }
            }},
            { $sort: { _id: 1 } }
        ]);

        res.json({ totalProducts, totalOrders, pendingOrders, totalRevenue, dailyOrders });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
    }
});

// Route trang chủ mặc định sẽ trả về file index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`Truy cập frontend tại: http://localhost:${PORT}`);
    console.log(`Kiểm tra API tại: http://localhost:${PORT}/api/test`);

    // Tự động mở trình duyệt (ưu tiên Chrome trên Windows)
    const { exec } = require('child_process');
    const url = `http://localhost:${PORT}`;
    
    if (process.platform === 'win32') {
        // Thử mở bằng chrome trước, nếu lỗi (chưa cài Chrome) thì mở trình duyệt mặc định
        exec(`start chrome ${url}`, (err) => {
            if (err) exec(`start ${url}`);
        });
    } else {
        const command = process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${command} ${url}`);
    }
});
