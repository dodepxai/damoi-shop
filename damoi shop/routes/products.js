const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 1. Lấy danh sách sản phẩm (Hỗ trợ Search & Lọc Category)
router.get('/', async (req, res) => {
    try {
        const { search, category, subCategory, isNewProduct, size, color, minPrice, maxPrice } = req.query;
        let filter = {};

        // Lọc theo từ khóa tìm kiếm (Tên sản phẩm)
        if (search) {
            filter.name = { $regex: search, $options: 'i' }; // 'i' = không phân biệt hoa thường
        }

        // Lọc theo danh mục chính (Nam, Nữ, v.v)
        if (category) {
            filter.category = category;
        }

        // Lọc theo danh mục phụ (Phân loại: Áo phông, Áo polo, v.v)
        if (subCategory) {
            filter.subCategory = subCategory;
        }

        // Lọc theo Size (sizes là mảng trong DB)
        if (size) {
            filter.sizes = { $in: [size] };
        }

        // Lọc theo Màu sắc (colors là mảng trong DB)
        if (color) {
            filter.colors = { $in: [color] };
        }

        // Lọc theo Khoảng giá
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Lọc theo cờ Sản phẩm mới (dành cho Tab SẢN PHẨM MỚI)
        if (isNewProduct === 'true') {
            filter.isNewProduct = true;
        }

        // Lọc theo cờ Giảm giá (dành cho Tab FINAL SALE)
        if (req.query.isSale === 'true') {
            filter.isSale = true;
        }

        // Tìm trong DB với các điều kiện trên
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm', error: error.message });
    }
});

// 2. Lấy chi tiết 1 sản phẩm theo ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tìm sản phẩm', error: error.message });
    }
});

// 3. Thêm một sản phẩm mới (Dùng cho Admin)
router.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: 'Dữ liệu sản phẩm không hợp lệ', error: error.message });
    }
});

// 4. Sửa thông tin sản phẩm (Dùng cho Admin)
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { new: true } // Trả về document sau khi đã update thay vì bản cũ
        );
        if (!updatedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm đê sửa' });
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật sản phẩm', error: error.message });
    }
});

// 5. Xóa sản phẩm (Dùng cho Admin)
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
        res.json({ message: 'Sản phẩm đã được xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa sản phẩm', error: error.message });
    }
});

// Thêm đánh giá (Review)
router.post('/:id/reviews', async (req, res) => {
    try {
        const { rating, comment, name } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            const review = {
                name: name || 'Khách vãng lai',
                rating: Number(rating),
                comment,
            };

            product.reviews.push(review);
            product.numReviews = product.reviews.length;
            // Tính số trung bình sao
            product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Đã thêm đánh giá' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm đánh giá', error: error.message });
    }
});

module.exports = router;
