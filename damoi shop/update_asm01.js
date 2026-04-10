const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Product = require('./models/Product');

async function updateProduct() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/damoi_shop_db');
        console.log("✅ Đã kết nối MongoDB.");

        const sku = 'asm01';
        const newImages = [
            "images/products/asm01/1.png",
            "images/products/asm01/2.png",
            "images/products/asm01/3.png",
            "images/products/asm01/4.png",
            "images/products/asm01/5.png"
        ];

        const updatedProduct = await Product.findOneAndUpdate(
            { sku: sku },
            { images: newImages },
            { new: true }
        );

        if (updatedProduct) {
            console.log(`✅ Đã cập nhật sản phẩm: ${updatedProduct.name}`);
            console.log(`📸 Danh sách ảnh mới: ${updatedProduct.images.join(', ')}`);
        } else {
            // Nếu không tìm thấy bằng SKU, thử tạo mới (vì có thể chưa có trong DB này)
            console.log(`⚠️ Không tìm thấy sản phẩm SKU ${sku}. Đang thử tạo mới...`);
            await Product.create({
                sku: sku,
                name: "Áo sơ mi unisex in hình Demon Slayer",
                description: "Áo sơ mi dáng suông unisex cực đẹp, in hình sắc nét chủ đề Demon Slayer. Chất vải mát, bền đẹp.",
                price: 299000,
                oldPrice: 499000,
                category: "Nam",
                subCategory: "Áo sơ mi",
                images: newImages,
                colors: ["Đen"],
                sizes: ["S", "M", "L", "XL", "2XL"]
            });
            console.log(`✅ Đã tạo mới sản phẩm SKU ${sku} thành công!`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi cập nhật:", error);
        process.exit(1);
    }
}

updateProduct();
