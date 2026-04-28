    // ================== GIỎ HÀNG (CART) ==================
    // window.cart already initialized at top level


    // Đưa hàm ra Global scope (window.xxx) để các trang khác gọi được
    window.updateCartCount = () => {
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            const totalItems = window.cart.reduce((sum, item) => sum + item.qty, 0);
            cartCountElement.innerText = totalItems;
        }
    };

    // Gọi đếm số lượng khi vừa load xong mọi trang
    window.updateCartCount();
    
    // Đảm bảo cập nhật lại khi Header (chứa số lượng) đã tải xong qua AJAX
    document.addEventListener('componentsLoaded', () => {
        window.updateCartCount();
    });

    // Tách riêng hàm attach sự kiện Add To Cart cho HomePage
    window.bindAddToCartEvents = () => {
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        const cartCountElement = document.querySelector('.cart-count');

        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                const productId = btn.getAttribute('data-id');
                const productName = btn.getAttribute('data-name');
                const productPrice = Number(btn.getAttribute('data-price'));
                const productImage = btn.getAttribute('data-image');

                if (productId && productName) {
                    const cartItem = {
                        id: productId,
                        name: productName,
                        price: productPrice,
                        image: productImage,
                        size: 'M', // Size mặc định từ trang chủ
                        color: 'Mặc định',
                        qty: 1,
                        selected: false
                    };

                    const existingItemIndex = window.cart.findIndex(
                        item => item.id === productId && item.size === cartItem.size && item.color === cartItem.color
                    );

                    if (existingItemIndex !== -1) {
                        window.cart[existingItemIndex].qty += 1;
                    } else {
                        window.cart.push(cartItem);
                    }

                    localStorage.setItem('damoi_cart', JSON.stringify(window.cart));
                    window.updateCartCount();
                    
                    // Hiện thông báo Toast
                    window.showToast(`Đã thêm vào giỏ hàng`);
                }

                // Hiệu ứng nút khi bấm (Nổi bật hơn)
                const originalContent = btn.innerHTML;
                btn.classList.add('added');
                btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                
                if (cartCountElement) {
                    cartCountElement.classList.add('bump');
                    setTimeout(() => cartCountElement.classList.remove('bump'), 300);
                }

                setTimeout(() => {
                    btn.classList.remove('added');
                    btn.innerHTML = originalContent;
                }, 2000);
            });
        });
    };

    window.renderWishlistPage = async () => {
        const grid = document.getElementById('wishlist-grid');
        if (!grid) return;

        let wishlist = JSON.parse(localStorage.getItem('damoi_wishlist')) || [];
        
        if (wishlist.length === 0) {
            grid.innerHTML = `<div class="wishlist-empty" id="wishlist-empty-state" style="grid-column: 1 / -1;">
                <i class="fa-regular fa-heart"></i>
                <h2>Danh sách yêu thích đang trống</h2>
                <p>Hãy dạo quanh cửa hàng và chọn những sản phẩm bạn yêu thích nhé!</p>
                <a href="/index.html" class="auth-btn" style="padding: 12px 40px; text-decoration: none;">Tiếp tục mua sắm</a>
            </div>`;
            return;
        }

        try {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; padding: 50px;">Đang tải danh sách yêu thích...</p>';
            
            const response = await fetch('/api/products');
            const allProducts = await response.json();
            
            const wishlistProducts = allProducts.filter(p => wishlist.includes(p._id));
            
            if (wishlistProducts.length === 0) {
                 grid.innerHTML = `<div class="wishlist-empty" id="wishlist-empty-state" style="grid-column: 1 / -1;">
                    <i class="fa-regular fa-heart"></i>
                    <h2>Danh sách yêu thích đang trống</h2>
                    <p>Sản phẩm yêu thích của bạn không còn tồn tại hoặc đã bị xóa!</p>
                    <a href="/index.html" class="auth-btn" style="padding: 12px 40px; text-decoration: none;">Tiếp tục mua sắm</a>
                </div>`;
                 return;
            }

            grid.innerHTML = wishlistProducts.map(product => {
                const priceFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);
                const oldPriceHtml = product.oldPrice ? `<span class="old-price">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.oldPrice)}</span>` : '';

                let badgeHtml = '';
                if (product.isSale && product.oldPrice) {
                    const discount = Math.round((product.oldPrice - product.price) / product.oldPrice * 100);
                    badgeHtml = `<span class="badge sale-badge">-${discount}%</span>`;
                } else if (product.isNewProduct) {
                    badgeHtml = `<span class="badge new-badge">Hàng mới</span>`;
                }

                const imgSrc = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400';
                
                let colorThumbHtml = '';
                if (product.images && product.images.length > 0) {
                    const tempColors = product.images.slice(0, 2);
                    if (tempColors.length === 1) tempColors.push(tempColors[0]);
                    
                    colorThumbHtml = '<div class="product-colors">';
                    tempColors.forEach((img, idx) => {
                        colorThumbHtml += `<div class="color-thumb ${idx === 0 ? 'active' : ''}" onclick="document.getElementById('img-w-${product._id}').src='${img}'; Array.from(this.parentNode.children).forEach(c => c.classList.remove('active')); this.classList.add('active'); event.preventDefault(); event.stopPropagation();"><img src="${img}" alt="Color"></div>`;
                    });
                    colorThumbHtml += '</div>';
                }

                const freeshipHtml = `<div class="freeship-badge">Freeship</div>`;

                return `
                    <div class="product-card">
                        <div class="product-image">
                            <a href="/pages/product-detail.html?id=${product._id}">
                                <img id="img-w-${product._id}" src="${imgSrc}" alt="${product.name}">
                            </a>
                            ${badgeHtml}
                            <button class="grid-wishlist-btn active" 
                                onclick="window.toggleWishlist(event, '${product._id}'); window.renderWishlistPage();" 
                                title="Bỏ yêu thích">
                                <i class="fa-solid fa-heart"></i>
                            </button>
                        </div>
                        <div class="product-info">
                            ${colorThumbHtml}
                            <a href="/pages/product-detail.html?id=${product._id}"><h3 class="product-name">${product.name}</h3></a>
                            <div class="product-prices">
                                <div class="price-left">
                                    <span class="price">${priceFmt}</span>
                                    ${oldPriceHtml}
                                    ${freeshipHtml}
                                </div>
                                <button class="cart-icon-btn add-to-cart-btn"
                                    data-id="${product._id}"
                                    data-name="${product.name}"
                                    data-price="${product.price}"
                                    data-image="${imgSrc}"
                                    title="Thêm vào giỏ hàng">
                                    <div class="cart-btn-content">
                                        <i class="fa-solid fa-bag-shopping"></i>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            if (typeof window.bindAddToCartEvents === 'function') {
                window.bindAddToCartEvents();
            }
        } catch (error) {
            console.error("Lỗi khi tải wishlist:", error);
            grid.innerHTML = '<p style="text-align:center; width: 100%; color: red;">Lỗi tải dữ liệu. Vui lòng thử lại sau.</p>';
        }
    };
