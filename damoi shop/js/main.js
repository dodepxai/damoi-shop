//   GLOBAL FUNCTIONS (Assigned immediately)
// ==========================================================================

window.toggleFilter = function(headerElem) {
    const group = headerElem.closest('.filter-group');
    const content = group.querySelector('.filter-content');
    const icon = headerElem.querySelector('i');
    
    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        content.style.maxHeight = '0px';
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
    } else {
        content.style.maxHeight = '500px'; 
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
    }
};

window.openCartDrawer = function() {
    try {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (drawer && overlay) {
            window.renderDrawerCart(); // Load items before opening
            drawer.classList.add('open');
            overlay.classList.add('open');
        }
    } catch (e) {
        console.error("Cart Error:", e);
    }
};

window.closeCartDrawer = function() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer && overlay) {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    }
};

window.renderDrawerCart = function() {
    try {
        const cartItemsContainer = document.getElementById('drawer-cart-items');
        const drawerSubtotal = document.getElementById('drawer-subtotal');
        const drawerCartCount = document.getElementById('drawer-cart-count');
        const drawerSelectedCount = document.getElementById('drawer-selected-count');
        const promoRemaining = document.getElementById('promo-remaining');
        const promoCodeBtn = document.querySelector('.promo-code-btn');
        
        let appliedVoucher = null;
        try {
            const vStr = localStorage.getItem('damoi_voucher');
            if (vStr) appliedVoucher = JSON.parse(vStr);
        } catch(e) {}
        
        if (!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let selectedCount = 0;
        
        if (window.cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 50px 0; color:#999; font-size: 14px;">Giỏ hàng trống.</p>';
            if (drawerSubtotal) drawerSubtotal.innerText = '0 đ';
            if (drawerCartCount) drawerCartCount.innerText = '0';
            if (drawerSelectedCount) drawerSelectedCount.innerText = '0';
            if (promoRemaining) promoRemaining.innerText = '420.000 đ';
            
            // ẨN CÁC PHẦN THỪA KHI TRỐNG
            const selectAllSec = document.querySelector('.cart-select-all');
            const promoSec = document.querySelector('.cart-promo-text');
            const footerSec = document.querySelector('.cart-drawer-footer');
            if (selectAllSec) selectAllSec.style.display = 'none';
            if (promoSec) promoSec.style.display = 'none';
            if (footerSec) footerSec.style.display = 'none';
            
            const selectAllCheckbox = document.getElementById('select-all-cart');
            if (selectAllCheckbox) selectAllCheckbox.checked = false;
            
            return;
        }

        // HIỆN LẠI CÁC PHẦN KHI CÓ HÀNG
        const selectAllSec = document.querySelector('.cart-select-all');
        const promoSec = document.querySelector('.cart-promo-text');
        const footerSec = document.querySelector('.cart-drawer-footer');
        if (selectAllSec) selectAllSec.style.display = 'flex';
        if (promoSec) promoSec.style.display = 'block';
        if (footerSec) footerSec.style.display = 'block';

    let cartHTML = '';
    window.cart.forEach((item, index) => {
        // Automatically set selected to false if undefined, per user request to not check all items by default
        if (typeof item.selected === 'undefined') item.selected = false;

        const isChecked = item.selected ? 'checked' : '';

        if (item.selected) {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            selectedCount += 1;
        }
        
        const priceFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price);
        
        cartHTML += `
            <div class="drawer-cart-item">
                <input type="checkbox" class="cart-item-checkbox" ${isChecked} onchange="window.toggleCartItem(${index})" style="margin-top:40px;">
                <img src="${item.image}" alt="${item.name}">
                <div class="drawer-item-info">
                    <div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom: 4px;">
                        <span class="drawer-item-title">${item.name || 'Sản phẩm DAMOI'}</span>
                        <div class="drawer-item-actions">
                            <button class="drawer-edit-btn" title="Chỉnh sửa" onclick="window.openEditModal(${index})"><i class="fa-solid fa-pen"></i></button>
                            <button class="drawer-delete-btn" onclick="window.removeDrawerItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                    <span class="drawer-item-variant">Size: ${item.size || 'M'} | Màu: ${(item.color && item.color !== '---') ? item.color : 'Mặc định'}</span>
                    <div class="drawer-item-price-row">
                        <span class="drawer-item-price">${priceFmt}</span>
                        <div class="drawer-qty-controls">
                            <button class="drawer-qty-btn" onclick="window.updateDrawerQty(${index}, -1)">-</button>
                            <input type="text" class="drawer-qty-input" value="${item.qty}" readonly>
                            <button class="drawer-qty-btn" onclick="window.updateDrawerQty(${index}, 1)">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    cartItemsContainer.innerHTML = cartHTML;
    
    let finalTotal = total;
    let discountAmount = 0;

    if (appliedVoucher) {
        if (total >= appliedVoucher.minOrderValue) {
            discountAmount = appliedVoucher.discountAmount;
            finalTotal = total - discountAmount;
            if (finalTotal < 0) finalTotal = 0;
            
            if (promoCodeBtn) {
                promoCodeBtn.innerHTML = `
                    <span style="color: #2ca01c;"><i class="fa-solid fa-ticket"></i> Đã áp dụng: <strong>${appliedVoucher.code}</strong></span>
                    <span style="color:var(--red); cursor:pointer;" onclick="window.removeVoucher(event)"><i class="fa-solid fa-xmark"></i> Bỏ mã</span>
                `;
            }
        } else {
            // Unqualify
            if (promoCodeBtn) {
                promoCodeBtn.innerHTML = `
                    <span style="color: #d32f2f;"><i class="fa-solid fa-ticket"></i> Chưa đủ điều kiện (Thiếu ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appliedVoucher.minOrderValue - total)})</span>
                    <span style="color:var(--red); cursor:pointer;" onclick="window.removeVoucher(event)"><i class="fa-solid fa-xmark"></i> Bỏ mã</span>
                `;
            }
        }
    } else {
        if (promoCodeBtn) {
            promoCodeBtn.innerHTML = `
                <span><i class="fa-solid fa-ticket"></i> Mã ưu đãi</span>
                <span>Chọn hoặc nhập mã <i class="fa-solid fa-chevron-right"></i></span>
            `;
        }
    }

    if (drawerSubtotal) {
        if (discountAmount > 0) {
            drawerSubtotal.innerHTML = `
                <div style="font-size: 13px; color: var(--red); margin-bottom: 2px;">Giảm: -${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</div>
                ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)}
            `;
        } else {
            drawerSubtotal.innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);
        }
    }
    
    if (drawerCartCount) drawerCartCount.innerText = window.cart.reduce((sum, item) => sum + item.qty, 0);
    if (drawerSelectedCount) drawerSelectedCount.innerText = selectedCount;

    // Update Select All Checkbox state
    const selectAllCheckbox = document.getElementById('select-all-cart');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = selectedCount > 0 && selectedCount === window.cart.length;
    }

        if (promoRemaining) {
            const threshold = 420000;
            const promoParent = promoRemaining.parentNode;
            if (total >= threshold) {
                promoParent.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#2ca01c;"></i> Bạn đã được miễn phí vận chuyển!';
                promoParent.style.color = '#2ca01c';
                promoParent.style.background = '#f2fcf5';
            } else {
                promoParent.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#d32f2f;"></i> Mua thêm <span id="promo-remaining">' + new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(threshold - total) + '</span> để được miễn phí vận chuyển';
                promoParent.style.color = '#d32f2f';
                promoParent.style.background = '#fdf2f2';
            }
        }
    } catch (e) {
        console.error("renderDrawerCart error:", e);
    }
};

window.updateDrawerQty = function(index, change) {
    if (window.cart[index]) {
        window.cart[index].qty += change;
        if (window.cart[index].qty <= 0) {
            window.removeDrawerItem(index);
            return;
        }
        localStorage.setItem('damoi_cart', JSON.stringify(window.cart));
        window.updateCartCount();
        window.renderDrawerCart();
    }
};

window.removeDrawerItem = function(index) {
    window.cart.splice(index, 1);
    localStorage.setItem('damoi_cart', JSON.stringify(window.cart));
    window.updateCartCount();
    window.renderDrawerCart();
};

window.toggleCartItem = function(index) {
    if (window.cart[index]) {
        window.cart[index].selected = !window.cart[index].selected;
        localStorage.setItem('damoi_cart', JSON.stringify(window.cart));
        window.renderDrawerCart();
    }
};

window.toggleAllCartItems = function(checked) {
    window.cart.forEach(item => {
        item.selected = checked;
    });
    localStorage.setItem('damoi_cart', JSON.stringify(window.cart));
    window.renderDrawerCart();
};

window.injectEditModal = function() {
    if (document.getElementById('edit-modal-overlay')) return;
    const modalHTML = `
        <div class="edit-modal-overlay" id="edit-modal-overlay">
            <div class="edit-modal">
                <div class="edit-modal-header">
                    <h3>CHỈNH SỬA SẢN PHẨM</h3>
                    <button class="cart-close-btn" onclick="window.closeEditModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="edit-modal-body" id="edit-modal-content">
                    <!-- Loaded via JS -->
                </div>
                <div class="edit-modal-footer">
                    <button class="edit-cancel-btn" onclick="window.closeEditModal()">HỦY</button>
                    <button class="edit-save-btn" id="save-edit-btn">CẬP NHẬT</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.closeEditModal = function() {
    const modal = document.getElementById('edit-modal-overlay');
    if (modal) modal.classList.remove('open');
};

window.openEditModal = async function(index) {
    window.injectEditModal();
    const item = window.cart[index];
    if (!item) return;

    const modal = document.getElementById('edit-modal-overlay');
    const content = document.getElementById('edit-modal-content');
    modal.classList.add('open');
    content.innerHTML = '<p style="text-align:center;">Đang tải tùy chọn...</p>';

    try {
        const res = await fetch(`/api/products/${item.id}`);
        const product = await res.json();

        // Fallbacks if data is missing
        const availableColors = (product.colors && product.colors.length > 0) ? product.colors : ['Mặc định'];
        const availableSizes = (product.sizes && product.sizes.length > 0) ? product.sizes : ['S', 'M', 'L', 'XL', '2XL'];

        let colorsHtml = `
            <div class="edit-options-group">
                <label>Màu sắc:</label>
                <div class="edit-btn-grid" id="edit-color-btns">
                    ${availableColors.map(c => `
                        <button class="edit-opt-btn ${c === item.color ? 'active' : ''}" onclick="window.setEditOption(this, 'color')">${c}</button>
                    `).join('')}
                </div>
            </div>
        `;

        let sizesHtml = `
            <div class="edit-options-group">
                <label>Kích thước (Size):</label>
                <div class="edit-btn-grid" id="edit-size-btns">
                    ${availableSizes.map(s => `
                        <button class="edit-opt-btn ${s === item.size ? 'active' : ''}" onclick="window.setEditOption(this, 'size')">${s}</button>
                    `).join('')}
                </div>
            </div>
        `;

        content.innerHTML = `
            <div class="edit-item-preview">
                <img src="${item.image}" alt="">
                <div>
                    <div class="edit-item-name">${item.name}</div>
                    <div style="font-size: 14px; color: #d32f2f; font-weight: 700; margin-top:5px;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</div>
                </div>
            </div>
            ${colorsHtml}
            ${sizesHtml}
        `;

        document.getElementById('save-edit-btn').onclick = () => window.saveEditItem(index);

    } catch (err) {
        content.innerHTML = '<p style="color:red;">Lỗi tải dữ liệu sản phẩm.</p>';
    }
};

window.setEditOption = function(btn, type) {
    const parent = btn.parentNode;
    parent.querySelectorAll('.edit-opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
};

window.saveEditItem = function(index) {
    const item = window.cart[index];
    if (!item) return;

    const activeColor = document.querySelector('#edit-color-btns .edit-opt-btn.active');
    const activeSize = document.querySelector('#edit-size-btns .edit-opt-btn.active');

    if (activeColor) item.color = activeColor.innerText;
    if (activeSize) item.size = activeSize.innerText;

    localStorage.setItem('damoi_cart', JSON.stringify(window.cart));
    window.updateCartCount();
    window.renderDrawerCart();
    window.closeEditModal();
};

window.openVoucherModal = function() {
    const modal = document.getElementById('voucher-modal-overlay');
    if (modal) {
        modal.classList.add('open');
        window.fetchAndRenderVouchers();
    }
};

window.fetchAndRenderVouchers = async function() {
    const voucherList = document.querySelector('.voucher-list');
    if (!voucherList) return;

    voucherList.innerHTML = '<p style="text-align:center; padding: 20px; color:#999;">Đang tải mã giảm giá...</p>';

    try {
        const res = await fetch('/api/vouchers');
        const vouchers = await res.json();
        window.allVouchers = vouchers;

        if (!vouchers || vouchers.length === 0) {
            voucherList.innerHTML = '<p style="text-align:center; padding: 20px; color:#999;">Hiện không có mã giảm giá nào.</p>';
            return;
        }

        // Lấy subtotal để so sánh
        let currentSubtotal = 0;
        const _cart = JSON.parse(localStorage.getItem('damoi_cart')) || [];
        _cart.forEach(item => {
            if (item.selected) currentSubtotal += (item.price * item.qty);
        });

        const formatMoney = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

        voucherList.innerHTML = vouchers.map(v => {
            const isQualified = currentSubtotal >= v.minOrderValue;
            
            const isBestValue = v.discountAmount >= 100000;
            const tagHtml = isBestValue 
                ? '<div class="voucher-tag">Lựa chọn tốt nhất</div>' 
                : '<div class="voucher-tag orange">Ưu đãi riêng bạn</div>';
            
            const expiryStr = v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('vi-VN') : 'Không thời hạn';
            
            let isSelected = false;
            try {
                const applied = JSON.parse(localStorage.getItem('damoi_voucher'));
                if (applied && applied.code === v.code) isSelected = true;
            } catch(e) {}
            if (window.selectedVoucherCode === v.code) isSelected = true;

            if (!isQualified && isSelected) {
                // Nếu đang được chọn mà giờ bị thiếu tiền => bỏ chọn
                isSelected = false;
                if (window.selectedVoucherCode === v.code) window.selectedVoucherCode = null;
            }

            const disabledCls = isQualified ? '' : 'disabled-voucher';
            const clickAttr = isQualified ? `onclick="window.selectVoucher(this, '${v.code}')"` : '';
            const warningHtml = isQualified ? '' : `
                <div style="font-size: 13px; color: #d32f2f; margin-top: 10px; font-weight: 500;">
                    <i class="fa-solid fa-circle-exclamation"></i> Mua thêm ${formatMoney(v.minOrderValue - currentSubtotal)} để sử dụng
                </div>
            `;

            return `
                <div class="voucher-item ${isSelected ? 'selected' : ''} ${disabledCls}" ${clickAttr}>
                    ${tagHtml}
                    <div class="voucher-info">
                        <div class="voucher-title">Voucher ${v.discountAmount >= 1000 ? (v.discountAmount/1000) + 'K' : formatMoney(v.discountAmount)}</div>
                        <div class="voucher-desc">${v.description || `Giảm ${formatMoney(v.discountAmount)} cho đơn từ ${formatMoney(v.minOrderValue)}`}</div>
                        <div class="voucher-code">Mã: ${v.code}</div>
                        <div class="voucher-expiry">HSD: ${expiryStr} <span style="margin-left:auto; color:#4382ff;">Điều kiện</span></div>
                        ${warningHtml}
                    </div>
                    <div class="voucher-radio ${isQualified ? '' : 'disabled'}"></div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Lỗi tải voucher:", err);
        voucherList.innerHTML = '<p style="text-align:center; padding: 20px; color:red;">Không thể tải mã giảm giá.</p>';
    }
};

window.closeVoucherModal = function() {
    const modal = document.getElementById('voucher-modal-overlay');
    if (modal) modal.classList.remove('open');
};

window.selectVoucher = function(element, code) {
    document.querySelectorAll('.voucher-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
    selectedVoucherCode = code;
    const applyBtn = document.getElementById('final-apply-voucher');
    if (applyBtn) applyBtn.disabled = false;
    const input = document.getElementById('voucher-input');
    if (input) input.value = code;
};

window.removeVoucher = function(e) {
    if (e) e.stopPropagation();
    localStorage.removeItem('damoi_voucher');
    window.renderDrawerCart();
    if (typeof window.updateSummary === 'function') window.updateSummary();
};

window.applyVoucherLogic = function(code) {
    if (!window.allVouchers) {
        alert("Dữ liệu voucher chưa sẵn sàng. Vui lòng thử lại!");
        return;
    }
    const voucher = window.allVouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
    if (voucher) {
        localStorage.setItem('damoi_voucher', JSON.stringify({
            code: voucher.code,
            discountAmount: voucher.discountAmount,
            minOrderValue: voucher.minOrderValue
        }));
        window.closeVoucherModal();
        window.renderDrawerCart();
        if (typeof window.updateSummary === 'function') window.updateSummary();
    } else {
        alert("Mã giảm giá không hợp lệ hoặc không tồn tại!");
    }
};

// ==========================================================================
//   DOM CONTENT LOADED (Main initialization)
// ==========================================================================
// --- Gán sự kiện cho select-all-cart ---
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'select-all-cart') {
        window.toggleAllCartItems(e.target.checked);
    }
});

document.addEventListener('componentsLoaded', () => {
    // Mobile Menu Toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '90px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.backgroundColor = '#fff';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }
        });
    }

    // --- Chặn load lại trang khi bấm Menu (SPA Navigation) ---
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('.nav-item');
        if (!navLink) return;

        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
        const targetUrl = new URL(navLink.href, window.location.origin);
        const isTargetHome = targetUrl.pathname.endsWith('index.html') || targetUrl.pathname === '/' || targetUrl.pathname === '';

        if (isHomePage && isTargetHome) {
            e.preventDefault();
            window.history.pushState(null, '', navLink.href);
            if (window.loadProducts) window.loadProducts();
        }
    });

    // =============== TÀI KHOẢN & NAVBAR ===============
    let userData = null;
    try {
        const rawUser = sessionStorage.getItem('damoi_user') || localStorage.getItem('damoi_user');
        if (rawUser) {
            userData = JSON.parse(rawUser);
            if (userData.role === 'admin' && localStorage.getItem('damoi_user')) {
                localStorage.removeItem('damoi_user');
                sessionStorage.setItem('damoi_user', rawUser);
            }
        }
    } catch(e) {
        console.warn("Lỗi đọc user", e);
    }

    // ID định danh Chat
    let chatUserId = localStorage.getItem('damoi_chat_userId');
    if (!chatUserId) {
        chatUserId = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('damoi_chat_userId', chatUserId);
    }
    if (userData) {
        chatUserId = userData._id;
    }
    window.chatUserId = chatUserId;
    window.userData = userData;

    const updateNavbarForUser = () => {
        const accountAction = document.getElementById('accountAction');
        const accountText = document.getElementById('accountText');
        const headerActions = document.querySelector('.header-actions');
        const chatAction = document.getElementById('chatAction');
        const chatWidget = document.getElementById('chat-toggle-btn');
        const logoutActionDropdown = document.getElementById('logoutAction');

        if (userData && accountAction && accountText) {
            // Thay chữ "Tài khoản" thành Tên (Đã bỏ theo yêu cầu người dùng để giữ chữ "Tài khoản")
            accountAction.href = "/pages/my-profile.html";
            accountAction.removeAttribute('onclick');

            // HIỆN nút Tin nhắn trên nav (trong dropdown hoặc nếu có ở ngoài thì bỏ qua vì code HTML đã xóa)
            // Hiện logoutAction trong menu 3 chấm
            if (logoutActionDropdown) {
                logoutActionDropdown.style.display = 'flex';
            }
            if (chatWidget) chatWidget.style.display = 'none';

        } else {
            // Nếu là Khách (Guest)
            if (chatAction) chatAction.style.display = 'none';
            if (chatWidget) chatWidget.style.display = 'flex';
        }
    };

    // Hàm check tin nhắn chưa đọc từ Admin (Dành cho Khách)
    window.checkCustomerUnreadMessages = async () => {
        if (!window.chatUserId) return;
        const badge = document.querySelector('.chat-unread-count');
        try {
            const res = await fetch(`/api/messages/customer/unread/${window.chatUserId}`);
            const data = await res.json();
            if (data.unreadCount > 0) {
                if (badge) {
                    badge.innerText = data.unreadCount;
                    badge.style.display = 'flex';
                }
            } else {
                if (badge) badge.style.display = 'none';
            }
        } catch (err) {
            console.error("Lỗi check unread:", err);
        }
    };

    // ================= XỬ LÝ THANH TÌM KIẾM =================
    const searchInput = document.getElementById('search-input') || document.querySelector('.search-box input');
    const searchBtn = document.getElementById('search-btn') || document.querySelector('.search-box i');
    const suggestionsBox = document.getElementById('search-suggestions');
    
    if (searchInput) {
        // Điền lại từ khoá vào ô tìm kiếm nếu đang truy vấn
        const currentUrlParams = new URLSearchParams(window.location.search);
        if (currentUrlParams.has('search')) {
            searchInput.value = currentUrlParams.get('search');
        }

        const triggerSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/index.html?search=${encodeURIComponent(query)}`;
            }
        };

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                triggerSearch();
            }
        });

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                triggerSearch();
            });
        }

        // --- Xử lý Gợi ý (Suggestions) ---
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = searchInput.value.trim();
            
            if (query.length < 2) {
                if (suggestionsBox) suggestionsBox.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
                    const products = await response.json();
                    
                    if (!suggestionsBox) return;

                    if (products.length > 0) {
                        const top5 = products.slice(0, 5);
                        let html = top5.map(p => `
                            <a href="product-detail.html?id=${p._id}" class="search-suggestion-item">
                                <img src="${p.images && p.images[0] ? p.images[0] : 'images/placeholder.jpg'}" alt="${p.name}">
                                <div class="suggestion-info">
                                    <span class="suggestion-name">${p.name}</span>
                                    <span class="suggestion-price">${p.price.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </a>
                        `).join('');
                        
                        html += `
                            <div class="suggestion-footer" onclick="window.location.href='index.html?search=${encodeURIComponent(query)}'">
                                Xem tất cả ${products.length} kết quả cho "${query}"
                            </div>
                        `;
                        
                        suggestionsBox.innerHTML = html;
                        suggestionsBox.style.display = 'block';
                    } else {
                        suggestionsBox.innerHTML = '<div class="no-suggestion">Không tìm thấy sản phẩm nào</div>';
                        suggestionsBox.style.display = 'block';
                    }
                } catch (err) {
                    console.error("Lỗi gợi ý tìm kiếm:", err);
                }
            }, 300);
        });

        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', (e) => {
            if (suggestionsBox && !e.target.closest('.search-box')) {
                suggestionsBox.style.display = 'none';
            }
        });
    }

    updateNavbarForUser();

    // Fetch Products from Backend API
    window.loadProducts = async () => {
        const productGrid = document.querySelector('.product-grid');
        // Chỉ chạy trên trang chủ, không chạy trên trang chi tiết (có related-grid)
        if (!productGrid || document.getElementById('related-grid')) return; 

        try {
            // Đọc params hiện hành trên URL (nếu có user click Menu hoặc Search)
            let queryString = window.location.search;
            
            // YÊU CẦU: Ngầm định trang chủ luôn là FINAL SALE
            if (!queryString || queryString === '?') {
                queryString = '?isSale=true';
                window.history.replaceState({}, '', 'index.html?isSale=true');
            }

            const response = await fetch(`/api/products${queryString}`);
            const products = await response.json();

            // Cập nhật tiêu đề trang (Hero Text) dựa vào Query
            // Biến Query (tạm thời chưa dùng ở đây nhưng khai báo để ko lỗi logic sau)
            let heroTitle = document.querySelector('.hero-text h1');
            let heroDesc = document.querySelector('.hero-text p');
            const urlParams = new URLSearchParams(window.location.search);
            const search = urlParams.get('search');
            const category = urlParams.get('category');
            const subCategory = urlParams.get('subCategory');

            // Cập nhật thanh bên (Sidebar)
            if (category) {
                window.updateSidebarCategories(category, subCategory);
            } else {
                const sidebarGroup = document.getElementById('sidebar-sub-categories')?.closest('.filter-group');
                if (sidebarGroup) sidebarGroup.style.display = 'none';
            }

            const isNewProduct = urlParams.get('isNewProduct');
            const isSale = urlParams.get('isSale');
            const isBestSeller = urlParams.get('isBestSeller');
            const label = urlParams.get('label');
            const parent = urlParams.get('parent'); // Danh mục cha (vd: Nam)

            // --- LOGIC PHÁT SÁNG MENU HIỆN TẠI ---
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.classList.remove('active-nav');
                item.classList.remove('new-arrivals'); // Quét sạch màu mặc định bị ghim tĩnh trong HTML
            });

            if (category) {
                const active = Array.from(navItems).find(n => n.href.includes(`category=${encodeURIComponent(category)}`) || n.href.includes(`category=${category}`));
                if (active) active.classList.add('active-nav');
            } else if (isSale === 'true') {
                const active = Array.from(navItems).find(n => n.href.includes('isSale=true'));
                if (active) active.classList.add('active-nav');
            } else if (isBestSeller === 'true') {
                const active = Array.from(navItems).find(n => n.href.includes('isBestSeller=true'));
                if (active) active.classList.add('active-nav');
            } else if (isNewProduct === 'true' || queryString === '' || queryString === '?') {
                const active = Array.from(navItems).find(n => n.href.includes('isNewProduct=true'));
                if (active) active.classList.add('active-nav');
            }
            // ------------------------------------

            // --- BREADCRUMB ---
            const breadcrumbBar = document.getElementById('breadcrumb-bar');
            const breadcrumbContent = document.getElementById('breadcrumb-content');
            if (breadcrumbBar && breadcrumbContent) {
                let parts = [];
                if (category) {
                    parts.push(`<a href="/index.html?category=${encodeURIComponent(category)}">${category}</a>`);
                    if (label) parts.push(`<span>|</span><span class="bc-current">${label}</span>`);
                } else if (parent) {
                    parts.push(`<a href="/index.html?category=${encodeURIComponent(parent)}">${parent}</a>`);
                    if (label) parts.push(`<span>|</span><span class="bc-current">${label}</span>`);
                } else if (label) {
                    parts.push(`<span class="bc-current">${label}</span>`);
                } else if (search) {
                    parts.push(`<span class="bc-current">Tìm kiếm: "${search}"</span>`);
                } else if (isNewProduct === 'true') {
                    parts.push(`<span class="bc-current">Sản phẩm mới</span>`);
                } else if (isSale === 'true') {
                    parts.push(`<span class="bc-current">Final Sale</span>`);
                } else if (subCategory) {
                    if (category) parts.push(`<a href="/index.html?category=${encodeURIComponent(category)}">${category}</a> <span>|</span>`);
                    parts.push(`<span class="bc-current">${subCategory}</span>`);
                }

                if (parts.length > 0) {
                    breadcrumbContent.innerHTML = parts.join(' ');
                    breadcrumbBar.style.display = 'flex';
                } else {
                    breadcrumbBar.style.display = 'none';
                }
            }

            // --- CẬP NHẬT BANNER & TIÊU ĐỀ ---
            const dynamicBanner = document.getElementById('dynamic-banner');
            const bannerImg = document.getElementById('banner-img');
            const bannerImgLeft = document.getElementById('banner-img-left');
            const bannerImgRight = document.getElementById('banner-img-right');
            const defaultHero = document.getElementById('default-hero');
            const quickCatNam = document.getElementById('quick-categories-nam');
            const quickCatNu = document.getElementById('quick-categories-nu');

            if (heroTitle && heroDesc) {
                if (label) {
                    heroTitle.innerText = label.toUpperCase();
                    heroDesc.innerText = `Tìm thấy ${products.length} sản phẩm`;
                } else if (search) {
                    heroTitle.innerText = `TÌM KIẾM`;
                    heroDesc.innerText = `Tìm thấy ${products.length} sản phẩm cho từ khoá: "${search}"`;
                } else if (subCategory) {
                    heroTitle.innerText = subCategory.toUpperCase();
                    heroDesc.innerText = `Các mẫu ${subCategory.toLowerCase()} chất lượng nhất cho bạn`;
                } else if (category) {
                    heroTitle.innerText = category.toUpperCase();
                    heroDesc.innerText = `Thời trang ${category} phong cách thời thượng (Tổng ${products.length} sp)`;
                } else if (isNewProduct === 'true') {
                    heroTitle.innerText = `SẢN PHẨM MỚI`;
                    heroDesc.innerText = `Cập nhật những mẫu xu hướng nhất mới cập bến Shop`;
                } else if (isSale === 'true') {
                    heroTitle.innerText = `FINAL SALE`;
                    heroDesc.innerText = `Hàng ngàn sản phẩm giảm tới 50%++ từ 19/03 - 25/03`;
                } else if (isBestSeller === 'true') {
                    heroTitle.innerText = `SẢN PHẨM BÁN CHẠY`;
                    heroDesc.innerText = `Những thiết kế được yêu thích nhất tại DAMOI SHOP`;
                } else {
                    heroTitle.innerText = "BẠN";
                    heroDesc.innerText = "Tất cả sản phẩm hiện đang có của chúng tôi";
                }
            }

            // 2. Logic Banner & Layout Toggle
            const banners = {
                'Nam': 'images/logo_nam.jpg',
                'Nữ': 'images/anhbannernu.jpg',
                'Bé Gái': 'images/cover-begai.jpg',
                'Bé Trai': 'images/cover-betrai.jpg',
                'Công Sở & Học Đường': 'images/cover-thuonghieu.jpg', // Dùng tạm ảnh Thương Hiệu hoặc placeholder
                'FINAL SALE': 'images/finalsale_cate_desktop-180326.webp'
            };

            let bannerKey = category;
            
            // Normalize category for bannerKey to handle encoding/special characters
            if (category) {
                const normalizedCat = category.toLowerCase().trim();
                if (normalizedCat === 'nam') {
                    bannerKey = 'Nam';
                } else if (normalizedCat === 'nữ' || normalizedCat.includes('nữ') || normalizedCat.includes('n%e1%bb%af')) {
                    bannerKey = 'Nữ';
                } else if (normalizedCat.includes('bé gái')) {
                    bannerKey = 'Bé Gái';
                } else if (normalizedCat.includes('bé trai')) {
                    bannerKey = 'Bé Trai';
                } else if (normalizedCat.includes('công sở') || normalizedCat.includes('học đường')) {
                    bannerKey = 'Công Sở & Học Đường';
                }
            }
            if (isSale === 'true' || isSale === true) bannerKey = 'FINAL SALE';

            // Quy tắc mới: Nếu có Phân loại phụ (subCategory), ẩn hết Banner và Quick Categories
            if (subCategory) {
                if (dynamicBanner) dynamicBanner.style.display = 'none';
                if (quickCatNam) quickCatNam.style.display = 'none';
                if (defaultHero) defaultHero.style.display = 'flex'; // Hiện tiêu đề
                
                // Ẩn bớt link xem tất cả trong hero cho gọn
                const viewAllLink = defaultHero.querySelector('.view-all-link');
                if (viewAllLink) viewAllLink.style.display = 'none';
            } else if (bannerKey && banners[bannerKey] && dynamicBanner && bannerImg) {
                // Trang danh mục chính: Hiện banner
                bannerImg.src = banners[bannerKey] + '?t=' + new Date().getTime();
                bannerImg.style.display = 'block'; // Ensure image is visible
                dynamicBanner.style.display = 'block';
                if (defaultHero) defaultHero.style.display = 'none';

                // Chỉ hiển thị 2 ảnh 2 bên nếu trang hiện tại là đồ Nam hoặc Nữ
                const bannerGrid = document.querySelector('.banner-grid');
                const sideBannerLeft = document.querySelector('.side-banner-left');
                const sideBannerRight = document.querySelector('.side-banner-right');

                if (bannerKey === 'Nam' || bannerKey === 'Nữ') {
                    if (bannerGrid) bannerGrid.classList.add('has-side-banners');
                    
                    // Hiển thị trực tiếp bằng inline style (tránh CSS specificity conflict)
                    if (sideBannerLeft) {
                        sideBannerLeft.style.display = 'block';
                        sideBannerLeft.style.height = '100%';
                    }
                    if (sideBannerRight) {
                        sideBannerRight.style.display = 'block';
                        sideBannerRight.style.height = '100%';
                    }

                    // Cập nhật ảnh 2 bên tương ứng
                    if (bannerKey === 'Nữ') {
                        if (bannerImgLeft) bannerImgLeft.src = 'images/bannnernu1.jpg';
                        if (bannerImgRight) bannerImgRight.src = 'images/bannnernu2.jpg';
                    } else {
                        // Mặc định là Nam
                        if (bannerImgLeft) bannerImgLeft.src = 'images/logobannernam.jpg';
                        if (bannerImgRight) bannerImgRight.src = 'images/logobannernam2.jpg';
                    }

                } else {
                    if (bannerGrid) bannerGrid.classList.remove('has-side-banners');
                    if (sideBannerLeft) sideBannerLeft.style.display = 'none';
                    if (sideBannerRight) sideBannerRight.style.display = 'none';
                }

                if (category === 'Nam' && quickCatNam) {
                    quickCatNam.style.display = 'block';
                } else if (quickCatNam) {
                    quickCatNam.style.display = 'none';
                }

                if (category === 'Nữ' && quickCatNu) {
                    quickCatNu.style.display = 'block';
                } else if (quickCatNu) {
                    quickCatNu.style.display = 'none';
                }
            } else {
                // Trang chủ hoặc mặc định
                if (dynamicBanner) dynamicBanner.style.display = 'none';
                if (defaultHero) {
                    defaultHero.style.display = 'flex';
                    const viewAllLink = defaultHero.querySelector('.view-all-link');
                    if (viewAllLink) viewAllLink.style.display = 'block';
                }
            }



            // Xóa HTML cứng tĩnh cũ đi
            productGrid.innerHTML = '';

            if (products.length === 0) {
                productGrid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; font-size: 18px; padding: 40px 0; color: #666;">Hiện chưa có sản phẩm nào trong danh mục này.</p>';
                return;
            }

            // Render tất cả cards một lần dứt khoát (tránh lỗi innerHTML +=)
            productGrid.innerHTML = products.map(product => {
                const priceFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);
                const oldPriceHtml = product.oldPrice ? `<span class="old-price">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.oldPrice)}</span>` : '';

                let badgeHtml = '';
                if (product.isSale && product.oldPrice) {
                    const discount = Math.round((product.oldPrice - product.price) / product.oldPrice * 100);
                    badgeHtml = `<span class="badge sale-badge">-${discount}%</span>`;
                } else if (product.isNewProduct) {
                    badgeHtml = `<span class="badge new-badge">Hàng mới</span>`;
                }

                const rawImg = product.images && product.images.length > 0 ? product.images[0] : "https://via.placeholder.com/400"; const imgSrc = (rawImg.startsWith("/") || rawImg.startsWith("http")) ? rawImg : "/" + rawImg;
                
                // --- Tạo giao diện thẻ màu sắc ---
                let colorThumbHtml = '';
                if (product.images && product.images.length > 0) {
                    const tempColors = product.images.slice(0, 2);
                    // Giả lập 2 màu nếu chỉ có 1 hình
                    if (tempColors.length === 1) tempColors.push(tempColors[0]);
                    
                    colorThumbHtml = '<div class="product-colors">';
                    tempColors.forEach((img, idx) => {
                        colorThumbHtml += `<div class="color-thumb ${idx === 0 ? 'active' : ''}" onclick="document.getElementById('img-${product._id}').src='${img}'; Array.from(this.parentNode.children).forEach(c => c.classList.remove('active')); this.classList.add('active'); event.preventDefault(); event.stopPropagation();"><img src="${img}" alt="Color"></div>`;
                    });
                    colorThumbHtml += '</div>';
                }

                const freeshipHtml = `<div class="freeship-badge">Freeship</div>`;

                return `
                    <div class="product-card">
                        <div class="product-image">
                            <a href="/pages/product-detail.html?id=${product._id}">
                                <img id="img-${product._id}" src="${imgSrc}" alt="${product.name}">
                            </a>
                            ${badgeHtml}
                            <button class="grid-wishlist-btn ${window.isInWishlist(product._id) ? 'active' : ''}" 
                                onclick="window.toggleWishlist(event, '${product._id}')" 
                                title="Thêm vào yêu thích">
                                <i class="${window.isInWishlist(product._id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
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

            // Re-bind Add to cart events
            if (typeof window.bindAddToCartEvents === 'function') {
                window.bindAddToCartEvents();
            }

        } catch (error) {
            console.error("Lỗi khi tải sản phẩm:", error);
            productGrid.innerHTML = '<p style="text-align:center; width: 100%; color: red;">Lỗi tải dữ liệu sản phẩm. Vui lòng thử lại sau.</p>';
        }
    };

    // Khởi tạo tải sản phẩm
    loadProducts();
});

/* --- More Menu Logic --- */
window.toggleMoreMenu = function(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('moreMenuDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' || dropdown.style.display === '' ? 'flex' : 'none';
    }
};

window.addEventListener('popstate', () => {
    if (window.loadProducts) window.loadProducts();
});

window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('moreMenuDropdown');
    if (dropdown && !e.target.closest('.more-menu-trigger')) {
        dropdown.style.display = 'none';
    }
});

