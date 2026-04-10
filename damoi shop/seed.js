require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']); // Fix lỗi DNS của Warp
const mongoose = require('mongoose');
const Product = require('./models/Product');

const seedProducts = [
    {
        name: "Áo Thun Basic Trắng Cổ Tròn",
        sku: "ATB-001",
        description: "Áo thun cotton 100% thoáng mát, thấm hút mồ hôi tốt. Dễ dàng mix-match với nhiều trang phục.",
        price: 250000,
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"],
        colors: ["Trắng"],
        sizes: ["S", "M", "L", "XL"],
        stockCount: 50,
        isNewProduct: true,
        isSale: false
    },
    {
        name: "Quần Jeans Xanh Straight Fit",
        sku: "QJ-002",
        description: "Quần Jeans form suông vừa vặn, chất liệu denim bền bì, co giãn nhẹ.",
        price: 490000,
        oldPrice: 650000,
        images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"],
        colors: ["Xanh nhạt"],
        sizes: ["29", "30", "31", "32"],
        stockCount: 30,
        isNewProduct: false,
        isSale: true
    },
    {
        name: "Quần Short Denim Xanh Đậm",
        sku: "QS-003",
        description: "Quần short năng động cho ngày hè rực rỡ.",
        price: 320000,
        oldPrice: 400000,
        images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"],
        colors: ["Xanh đậm"],
        sizes: ["29", "30", "31", "32"],
        stockCount: 40,
        isNewProduct: false,
        isSale: true
    },
    {
        name: "Áo Polo Xanh Navy Thanh Lịch",
        sku: "AP-004",
        description: "Áo Polo phong cách lịch lãm, phù hợp đi làm và đi chơi.",
        price: 350000,
        images: ["https://images.unsplash.com/photo-1588099768531-a72d4a198538?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"],
        colors: ["Xanh Navy"],
        sizes: ["M", "L", "XL"],
        stockCount: 100,
        isNewProduct: false,
        isSale: false
    },
    {
        name: "Áo Hoodie Xám Khói Thể Thao",
        sku: "AH-005",
        description: "Áo Hoodie nỉ bông ấm áp, form rộng rãi thoải mái.",
        price: 420000,
        images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"],
        colors: ["Xám"],
        sizes: ["M", "L", "XL", "XXL"],
        stockCount: 20,
        isNewProduct: true,
        isSale: false
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Đã kết nối MongoDB để chờ thêm dữ liệu...");

        // Xoá dữ liệu cũ nếu có
        await Product.deleteMany({});
        console.log("Đã xóa các sản phẩm cũ (nếu có).");

        // Thêm dữ liệu mới
        await Product.insertMany(seedProducts);
        console.log("✅ Đã thêm 5 sản phẩm mẫu vào CSDL thành công!");

        process.exit();
    } catch (error) {
        console.error("❌ Lỗi khi thêm dữ liệu:", error);
        process.exit(1);
    }
};

seedDB();
