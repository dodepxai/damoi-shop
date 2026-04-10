// Global Cart Initialization
window.cart = [];
let selectedVoucherCode = '';
try {
    const rawCart = localStorage.getItem('damoi_cart');
    if (rawCart) {
        let parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) window.cart = parsed;
    }
} catch (e) {
    console.warn("Lỗi đọc giỏ hàng", e);
}

// ================== CONFIG ==================
const SUB_CATEGORIES = {
    'Nam': ['Áo phông - Áo thun', 'Áo polo', 'Áo sơ mi', 'Chống nắng', 'áo ba lỗ', 'Đồ thể thao'],
    'Nữ': ['Áo phông - Áo thun', 'Áo polo', 'Áo sơ mi', 'Chống nắng', 'Thể thao', 'Đồ mặc nhà & Đồ ngủ'],
    'Công Sở & Học Đường': ['Áo sơ mi', 'Quần tây', 'Chân váy', 'Áo vest', 'Đầm công sở', 'Đồng phục', 'Áo thun', 'Quần jeans', 'Balo']
};

window.updateSidebarCategories = function(category, currentSub) {
    const sidebar = document.getElementById('sidebar-sub-categories');
    if (!sidebar) return;

    const list = SUB_CATEGORIES[category] || [];
    if (list.length === 0) {
        const group = sidebar.closest('.filter-group');
        if (group) group.style.display = 'none';
        return;
    }

    const group = sidebar.closest('.filter-group');
    if (group) group.style.display = 'block';

    sidebar.innerHTML = list.map(sub => {
        const isActive = sub === currentSub ? 'active-filter' : '';
        // Ánh xạ tên hiển thị đẹp hơn cho các mục đặc biệt
        let label = sub;
        if (sub === 'Áo phông - Áo thun') label = 'Áo phông / Áo thun';
        if (sub === 'áo ba lỗ') label = 'Áo ba lỗ / Active';
        
        return `<a href="index.html?category=${encodeURIComponent(category)}&subCategory=${encodeURIComponent(sub)}&label=${encodeURIComponent(label)}" class="filter-cat-item ${isActive}">${label}</a>`;
    }).join('');
};

// ==========================================================================
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
            cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 30px 0; color:#999; font-size: 14px;">Giỏ hàng trống.</p>';
            if (drawerSubtotal) drawerSubtotal.innerText = '0 đ';
            if (drawerCartCount) drawerCartCount.innerText = '0';
            if (drawerSelectedCount) drawerSelectedCount.innerText = '0';
            if (promoRemaining) promoRemaining.innerText = '420.000 đ';
            
            const selectAllCheckbox = document.getElementById('select-all-cart');
            if (selectAllCheckbox) selectAllCheckbox.checked = false;
            
            if (promoCodeBtn) {
                promoCodeBtn.innerHTML = `
                    <span><i class="fa-solid fa-ticket"></i> Mã ưu đãi</span>
                    <span>Chọn hoặc nhập mã <i class="fa-solid fa-chevron-right"></i></span>
                `;
            }
            
            return;
        }

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
                    <div style="display:flex; justify-content:space-between; align-items: flex-start;">
                        <span class="drawer-item-title">${item.name}</span>
                        <div class="drawer-item-actions">
                            <button class="drawer-edit-btn" title="Chỉnh sửa" onclick="window.openEditModal(${index})"><i class="fa-solid fa-pen"></i></button>
                            <button class="drawer-delete-btn" onclick="window.removeDrawerItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                    <span class="drawer-item-variant">${item.size || 'M'} | ${item.color || 'Mặc định'}</span>
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

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            // Simple toggle for now (could be enhanced with a proper slide-out menu)
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

    const updateNavbarForUser = () => {
        const accountAction = document.getElementById('accountAction');
        const accountText = document.getElementById('accountText');
        const headerActions = document.querySelector('.header-actions');
        const chatAction = document.getElementById('chatAction');
        const chatWidget = document.getElementById('chat-toggle-btn');

        if (userData && accountAction && accountText) {
            // Thay chữ "Tài khoản" thành Tên
            accountText.innerHTML = userData.fullName.split(' ').pop();
            accountAction.href = "tracking.html";
            accountAction.innerHTML = `<i class="fa-solid fa-truck-fast"></i><span id="accountText">${userData.fullName.split(' ').pop()}</span>`;
            accountAction.style.color = "#4CAF50";

            // HIỆN nút Tin nhắn trên nav và ẨN bong bóng chat bên dưới
            if (chatAction) chatAction.style.display = 'flex';
            if (chatWidget) chatWidget.style.display = 'none';

            // Xoá và tạo lại một nút Đăng xuất
            if (!document.getElementById('btnLogout') && headerActions) {
                const logoutBtn = document.createElement('a');
                logoutBtn.href = "#";
                logoutBtn.id = "btnLogout";
                logoutBtn.className = "action-item";
                logoutBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i><span>Đăng xuất</span>`;
                headerActions.appendChild(logoutBtn);

                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('damoi_user');
                    sessionStorage.removeItem('damoi_user');
                    alert("Đăng xuất thành công!");
                    window.location.reload();
                });
            }
        } else {
            // Nếu là Khách (Guest)
            if (chatAction) chatAction.style.display = 'none';
            if (chatWidget) chatWidget.style.display = 'flex';
        }
    };

    // Hàm check tin nhắn chưa đọc từ Admin (Dành cho Khách)
    const checkCustomerUnreadMessages = async () => {
        if (!chatUserId) return;
        const badge = document.querySelector('.chat-unread-count');
        try {
            const res = await fetch(`/api/messages/customer/unread/${chatUserId}`);
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
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        // Điền lại từ khoá vào ô tìm kiếm nếu đang truy vấn
        const currentUrlParams = new URLSearchParams(window.location.search);
        if (currentUrlParams.has('search')) {
            searchInput.value = currentUrlParams.get('search');
        }

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                // Luôn chuyển hướng về index.html để hiển thị kết quả Search
                window.location.href = `index.html?search=${encodeURIComponent(query)}`;
            }
        });
    }

    updateNavbarForUser();

    // Fetch Products from Backend API
    const loadProducts = async () => {
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
                    parts.push(`<a href="index.html?category=${encodeURIComponent(category)}">${category}</a>`);
                    if (label) parts.push(`<span>|</span><span class="bc-current">${label}</span>`);
                } else if (parent) {
                    parts.push(`<a href="index.html?category=${encodeURIComponent(parent)}">${parent}</a>`);
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
                    if (category) parts.push(`<a href="index.html?category=${encodeURIComponent(category)}">${category}</a> <span>|</span>`);
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
            if (isSale === 'true') bannerKey = 'FINAL SALE';

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
                bannerImg.onerror = function () { this.style.display = 'none'; };
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

                const imgSrc = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400';
                
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
                        <a href="product-detail.html?id=${product._id}" class="product-image">
                            <img id="img-${product._id}" src="${imgSrc}" alt="${product.name}">
                            ${badgeHtml}
                        </a>
                        <div class="product-info">
                            ${colorThumbHtml}
                            <a href="product-detail.html?id=${product._id}"><h3 class="product-name">${product.name}</h3></a>
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
            bindAddToCartEvents();

        } catch (error) {
            console.error("Lỗi khi tải sản phẩm:", error);
            productGrid.innerHTML = '<p style="text-align:center; width: 100%; color: red;">Lỗi tải dữ liệu sản phẩm. Vui lòng thử lại sau.</p>';
        }
    };

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

    // Tách riêng hàm attach sự kiện Add To Cart cho HomePage
    const bindAddToCartEvents = () => {
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
                    window.openCartDrawer(); // NGUY CƠ: Tự động mở Mini Cart khi bấm Thêm
                }

                // Hiệu ứng nút khi bấm (Animation cao cấp)
                const originalContent = btn.innerHTML;
                const originalBg = btn.style.background;
                const originalColor = btn.style.color;

                btn.innerHTML = '<i class="fa-solid fa-check" style="font-size: 20px;"></i>';
                btn.style.background = '#e32124'; // Đổi sang nền đỏ khi đã thêm
                btn.style.color = '#ffffff';

                if (cartCountElement) {
                    cartCountElement.style.transform = 'scale(1.5)';
                    setTimeout(() => {
                        cartCountElement.style.transform = 'scale(1)';
                    }, 200);
                }

                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.style.background = originalBg;
                    btn.style.color = originalColor;
                }, 2000);
            });
        });
    };

    // Gọi hàm fetch khi trang vừa tải xong
    loadProducts();

    // ================== CHAT WIDGET LOGIC ==================
    const chatWindow = document.getElementById('chat-window');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('customer-chat-form');
    const chatInput = document.getElementById('customer-chat-input');

    window.toggleChat = async () => {
        if (!chatWindow) return;
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            // Đánh dấu đã đọc khi mở chat
            try {
                await fetch(`/api/messages/customer/read/${chatUserId}`, { method: 'PATCH' });
                checkCustomerUnreadMessages();
            } catch (err) { }

            fetchCustomerMessages();
            // Cuộn xuống cuối
            setTimeout(() => {
                if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        }
    };

    const fetchCustomerMessages = async () => {
        if (!chatMessages) return;
        try {
            const res = await fetch(`/api/messages/${chatUserId}`);
            const messages = await res.json();

            // Xóa hết cũ trừ tin nhắn chào đầu tiên
            const welcomeMsg = chatMessages.firstElementChild;
            chatMessages.innerHTML = '';
            if (welcomeMsg) chatMessages.appendChild(welcomeMsg);

            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `chat-m-msg ${msg.isAdmin ? 'received' : 'sent'}`;
                div.innerHTML = `
                    <div class="m-content">${msg.content}</div>
                    <span class="m-time">${new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                `;
                chatMessages.appendChild(div);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (err) {
            console.error("Lỗi fetch chat:", err);
        }
    };

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = chatInput.value.trim();
            if (!content) return;

            try {
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: userData ? userData._id : null,
                        senderName: userData ? userData.fullName : 'Khách',
                        content,
                        isAdmin: false,
                        userId: chatUserId
                    })
                });

                if (res.ok) {
                    chatInput.value = '';
                    fetchCustomerMessages();
                }
            } catch (err) {
                console.error("Lỗi gửi chat:", err);
            }
        });
    }

    // Polling mỗi 5 giây
    setInterval(() => {
        if (chatWindow && chatWindow.classList.contains('open')) {
            fetchCustomerMessages();
        }
        checkCustomerUnreadMessages();
    }, 5000);

    // Voucher input feedback
    const voucherInput = document.getElementById('voucher-input');
    const voucherApplyBtn = document.getElementById('voucher-apply-btn');
    if (voucherInput && voucherApplyBtn) {
        voucherInput.addEventListener('input', (e) => {
            if (e.target.value.trim().length > 0) {
                voucherApplyBtn.classList.add('active');
            } else {
                voucherApplyBtn.classList.remove('active');
            }
        });
    }

    // Initial check
    checkCustomerUnreadMessages();
    loadProducts();
    window.updateCartCount();

});

// ==========================================================================
//   INSTANT INTERACTION (Outside DOMContentLoaded for speed)
// ==========================================================================
document.addEventListener('click', (e) => {
    // Cart Icon Delegation
    const cartLink = e.target.closest('a[href="cart.html"]');
    if (cartLink) {
        e.preventDefault();
        window.openCartDrawer();
        return;
    }

    // Voucher Button Delegation
    const promoBtn = e.target.closest('.promo-code-btn');
    if (promoBtn) {
        window.openVoucherModal();
        return;
    }

    // Click outside to close cart drawer
    const overlay = document.getElementById('cart-overlay');
    if (e.target === overlay) {
        window.closeCartDrawer();
    }
    
    // Voucher Apply logic
    const finalApplyBtn = e.target.closest('#final-apply-voucher');
    if (finalApplyBtn) {
        e.preventDefault();
        const code = window.selectedVoucherCode || document.getElementById('voucher-input')?.value;
        if (code) {
            window.applyVoucherLogic(code);
        } else {
            alert('Vui lòng chọn 1 mã ưu đãi!');
        }
        return;
    }

    const inlineApplyBtn = e.target.closest('#voucher-apply-btn');
    if (inlineApplyBtn) {
        e.preventDefault();
        const inputCode = document.getElementById('voucher-input').value;
        if (inputCode.trim().length > 0) {
            window.applyVoucherLogic(inputCode.trim());
        }
        return;
    }
});

// ================== AUTH MODAL LOGIC ==================
window.injectAuthModal = function() {
    if (document.getElementById('auth-modal-overlay')) return;
    const modalHTML = `
    <!-- Auth Modal Overlay -->
    <div class="auth-modal-overlay" id="auth-modal-overlay" onclick="closeAuthModal()">
        <div class="auth-modal" onclick="event.stopPropagation()">
            <div class="auth-container-wrapper">
                <div class="auth-banner-container">
                    <!-- New Clean Layout Overlays -->
                    <div class="auth-banner-overlay-v2">
                        <div class="banner-left-content">
                            <h3 class="banner-heading-v2">QUYỀN LỢI<br>THÀNH VIÊN</h3>
                            <div class="banner-promo-list">
                                <div class="promo-item"><i class="fa-solid fa-ticket"></i> Voucher giảm giá</div>
                                <div class="promo-item"><i class="fa-solid fa-percent"></i> Ưu đãi lên tới 20%</div>
                                <div class="promo-item"><i class="fa-solid fa-truck-fast"></i> Vô vàn freeship</div>
                                <div class="promo-item"><i class="fa-solid fa-certificate"></i> Chất lượng tạo nên uy tín!</div>
                            </div>
                        </div>
                        <div class="banner-logo-v2">
                            DAMOI<br><span>SHOP</span>
                        </div>
                    </div>
                    <img src="images/auth-banner-clean-v2.png" alt="Quyền lợi thành viên">
                </div>
                <button class="auth-close-btn" onclick="closeAuthModal()" style="position: absolute; right: 20px; top: 15px; z-index: 1000; background: rgba(255,255,255,0.9); border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.15); transition: 0.3s;"><i class="fa-solid fa-xmark" style="font-size: 18px; color: #333;"></i></button>

                <!-- Step 1: Info Form (Phone Only) -->
                <div id="auth-step-1">
                    <h2 class="auth-title">ĐĂNG NHẬP</h2>
                    <p class="auth-subtitle">Đăng nhập miễn phí để trở thành Khách hàng thân thiết và nhận ưu đãi độc quyền từ DAMOI.</p>
                    
                    <form id="otp-request-form" class="auth-form active-form">
                        <div class="form-group" style="margin-bottom: 12px;">
                            <div class="auth-input-wrapper">
                                <input type="tel" id="auth-phone" placeholder="Vui lòng nhập số điện thoại" maxlength="10" required>
                                <button type="button" id="auth-clear-phone" class="auth-clear-btn" style="display: none;">
                                    <i class="fa-solid fa-circle-xmark"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Hidden inputs for legacy name/email support if needed, but not showing for user -->
                        <input type="hidden" id="auth-name" value="Khách Mới">
                        <input type="hidden" id="auth-email" value="">

                        <button type="submit" class="btn-auth">TIẾP TỤC</button>
                        <p class="auth-terms">
                            * Khi ấn tiếp tục, bạn xác nhận đã đọc và đồng ý với <a href="dieu-khoan-dich-vu.html" target="_blank">Điều khoản dịch vụ</a> cùng <a href="chinh-sach-bao-mat.html" target="_blank">Chính sách bảo mật</a> của Damoi.
                        </p>
                    </form>
                </div>

                <!-- Step 2: Choose Method -->
                <div id="auth-step-2" style="display: none; text-align: center;">
                    <h3 style="margin-bottom: 25px; font-size: 20px; line-height: 1.4; font-weight: 700; color: #333;">Chọn phương thức nhận<br>mã xác thực</h3>
                    <div class="auth-methods-grid" style="display: flex; gap: 15px; justify-content: center; margin-bottom: 25px;">
                        <div class="auth-method-card" onclick="window.selectAuthMethod('zalo')" style="cursor: pointer; border: 1px solid #f0f0f0; padding: 15px; border-radius: 12px; flex: 1; background: #fafafa; transition: 0.2s;">
                            <div class="auth-method-icon">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" style="width: 40px;">
                            </div>
                            <div class="auth-method-name" style="margin-top: 8px; font-size: 14px; font-weight: 600;">Zalo</div>
                        </div>
                        <div class="auth-method-card" onclick="window.selectAuthMethod('sms')" style="cursor: pointer; border: 1px solid #f0f0f0; padding: 15px; border-radius: 12px; flex: 1; background: #fafafa; transition: 0.2s;">
                            <div class="auth-method-icon">
                                <div style="background: #808c99; width: 40px; height: 40px; border-radius: 10px; display: flex; justify-content: center; align-items: center; margin: 0 auto;">
                                    <i class="fa-solid fa-mobile-screen-button" style="font-size: 20px; color: #fff;"></i>
                                </div>
                            </div>
                            <div class="auth-method-name" style="margin-top: 8px; font-size: 14px; font-weight: 600;">Tin nhắn SMS</div>
                        </div>
                    </div>
                    <button class="auth-back-btn" onclick="window.authStep(1)" style="background: none; border: none; font-size: 14px; color: #777; cursor: pointer; font-weight: 500;"><i class="fa-solid fa-arrow-left"></i> Quay lại</button>
                </div>

                <!-- Step 3: Enter OTP -->
                <div id="auth-step-3" style="display: none; text-align: center;">
                    <h3 style="margin-bottom: 10px; font-size: 20px; font-weight: 700; color: #333;">Nhập mã xác thực</h3>
                    <p style="font-size: 14px; color: #777; margin-bottom: 25px;">Mã xác thực đã được gửi cho số điện thoại <b id="display-phone" style="font-weight: 700; color: #333;"></b></p>
                    <div class="otp-inputs" style="display: flex; gap: 8px; justify-content: center;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                    </div>
                    <button id="btn-verify-otp" class="btn-auth" style="margin-top: 25px; width: 100%; height: 50px; background: #f5f5f5; color: #ccc; font-weight: 700; font-size: 16px; border: none; border-radius: 12px; cursor: default; transition: 0.3s;" onclick="window.verifyOtp()">XÁC NHẬN</button>
                    <div style="margin-top: 20px; font-size: 14px;">
                        <a href="javascript:void(0)" onclick="window.authStep(2)" style="color: #e32124; text-decoration: none; font-weight: 600;">Gửi lại mã</a>
                    </div>
                </div>
            </div>

            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const phoneInput = document.getElementById('auth-phone');
    const clearBtn = document.getElementById('auth-clear-phone');
    const submitBtn = document.querySelector('#otp-request-form .btn-auth');

    if (phoneInput && clearBtn && submitBtn) {
        phoneInput.addEventListener('input', () => {
            const val = phoneInput.value;
            clearBtn.style.display = val ? 'block' : 'none';
            
            // Activate button if phone is 10 digits
            if (val.length === 10) {
                submitBtn.classList.add('active');
                submitBtn.disabled = false;
            } else {
                submitBtn.classList.remove('active');
                submitBtn.disabled = true;
            }
        });

        clearBtn.addEventListener('click', () => {
            phoneInput.value = '';
            clearBtn.style.display = 'none';
            submitBtn.classList.remove('active');
            submitBtn.disabled = true;
            phoneInput.focus();
        });
    }

    const otpForm = document.getElementById('otp-request-form');
    if (otpForm) {
        otpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const phoneVal = document.getElementById('auth-phone').value.trim();
            const nameVal = document.getElementById('auth-name').value.trim();

            // Validate số điện thoại chuẩn Việt Nam (10 số, bắt đầu bằng 0)
            const phonePattern = /^0[0-9]{9}$/;
            if (!phonePattern.test(phoneVal)) {
                alert("Số điện thoại không hợp lệ!\nVui lòng nhập đúng 10 chữ số chuẩn của Việt Nam (VD: 0987654321).");
                document.getElementById('auth-phone').focus();
                return;
            }
            
            // Validation thủ công chữ ký cho họ tên khách hàng thường
            if (!nameVal || nameVal.length < 3) {
                alert("Vui lòng nhập Họ và Tên đầy đủ của bạn!");
                document.getElementById('auth-name').focus();
                return;
            }
            if (nameVal.indexOf(' ') === -1) {
                alert("Họ tên chưa hợp lệ!\nVui lòng nhập đầy đủ ít nhất 2 chữ (họ và tên), cách nhau bằng khoảng trắng. VD: Nguyễn Văn A.");
                document.getElementById('auth-name').focus();
                return;
            }
            if (/[0-9]/.test(nameVal)) {
                alert("Họ tên không được chứa chữ số hoặc ký tự lạ! Vui lòng nhập lại.");
                document.getElementById('auth-name').focus();
                return;
            }

            window.tempAuthData = {
                phone: phoneVal,
                name: nameVal,
                email: document.getElementById('auth-email').value.trim()
            };
            window.authStep(2);
        });
    }
}

window.authStep = function(step) {
    document.getElementById('auth-step-1').style.display = 'none';
    document.getElementById('auth-step-2').style.display = 'none';
    document.getElementById('auth-step-3').style.display = 'none';
    document.getElementById('auth-step-' + step).style.display = 'block';

    // Toggle banner visibility and add layout class for verification
    const banner = document.querySelector('.auth-banner-container');
    const content = document.querySelector('.auth-modal');
    
    if (banner && content) {
        if (step === 1) {
            banner.style.display = 'block';
            content.classList.remove('verification-mode');
        } else {
            banner.style.display = 'none';
            content.classList.add('verification-mode');
        }
    }

    if (step === 3) {
        document.getElementById('display-phone').innerText = window.tempAuthData.phone;
        const inputs = document.querySelectorAll('.otp-input');
        inputs.forEach(i => i.value = '');
        setTimeout(() => inputs[0].focus(), 100);
    }
};

window.selectAuthMethod = async function(method) {
    // Tạo mã xác thực ngẫu nhiên cho mục đích demo/phát triển
    window.mockOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
        // Gửi lệnh lên Backend Node.js để kết nối với SpeedSMS API
        const response = await fetch('/api/users/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: window.tempAuthData.phone,
                method: method,
                otp: window.mockOtpCode
            })
        });
        
        if (!response.ok) {
            console.warn("Lưu ý: Không tìm thấy Backend để gửi tin nhắn thực tế. Đang chuyển sang chế độ Demo...");
        }
        
    } catch (err) {
        console.warn("Lưu ý: Máy chủ Backend hiện chưa khởi động. Đang chạy ở chế độ Demo UI...");
    }

    // Định nghĩa hàm hiển thị thông báo mã OTP (nếu chưa có)
    if (!window.showMockOtpToast) {
        window.showMockOtpToast = function(code) {
            let old = document.getElementById('damoi-mock-toast');
            if (old) old.remove();

            const toast = document.createElement('div');
            toast.id = 'damoi-mock-toast';
            toast.innerHTML = `
                <i class="fa-solid fa-bell" style="font-size:26px; color:#f39c12;"></i>
                <div style="text-align: left; display: flex; align-items: center; gap: 10px;">
                    <div style="font-size:18px; color: #555; font-weight: 500;">Mã OTP:</div>
                    <strong style="font-size:32px; letter-spacing:6px; color:#1a1a1a; line-height: 1;">${code}</strong>
                </div>
            `;
            Object.assign(toast.style, {
                position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)',
                background: '#ffffff', color: '#333',
                padding: '15px 35px', borderRadius: '50px', border: '1px solid rgba(227,33,36,0.2)',
                boxShadow: '0 15px 30px rgba(0,0,0,0.1), 0 5px 15px rgba(227,33,36,0.1)', zIndex: '999999',
                display: 'flex', alignItems: 'center', gap: '20px', fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            });
            document.body.appendChild(toast);
        };
    }

    // Hiển thị toast chứa mã OTP và chuyển sang bước 3
    window.showMockOtpToast(window.mockOtpCode);
    window.authStep(3);
};

window.focusNextOtp = function(elem, event) {
    const inputs = document.querySelectorAll('.otp-input');
    const index = Array.from(inputs).indexOf(elem);
    const btn = document.getElementById('btn-verify-otp');

    // Handle backspace
    if (event.key === 'Backspace' && elem.value === '') {
        const prev = inputs[index - 1];
        if (prev) prev.focus();
    } 
    // Handle digit input
    else if (elem.value.length >= elem.maxLength) {
        const next = inputs[index + 1];
        if (next) next.focus();
    }

    // Check if OTP is full (6 digits)
    const code = Array.from(inputs).map(i => i.value).join('');
    if (code.length === 6) {
        if (btn) {
            btn.style.background = '#e32124';
            btn.style.color = '#fff';
            btn.style.cursor = 'pointer';
            btn.classList.add('active');
        }
    } else {
        if (btn) {
            btn.style.background = '#f5f5f5';
            btn.style.color = '#ccc';
            btn.style.cursor = 'default';
            btn.classList.remove('active');
        }
    }
};

window.verifyOtp = async function() {
    let otp = '';
    document.querySelectorAll('.otp-input').forEach(i => otp += i.value);
    
    if (otp.length < 6) {
        alert("Vui lòng nhập đủ 6 số mã xác thực!");
        return;
    }
    
    // Khớp mã OTP xác thực thực tế
    if (window.mockOtpCode && otp !== window.mockOtpCode) {
        alert("Mã xác thực không chính xác, vui lòng kiểm tra lại tin nhắn!");
        return;
    }

    try {
        let authData = {
            _id: "mock_" + Date.now(),
            fullName: window.tempAuthData.name,
            phone: window.tempAuthData.phone,
            role: 'customer'
        };

        const userData = {
            fullName: window.tempAuthData.name,
            email: window.tempAuthData.email,
            phone: window.tempAuthData.phone,
            password: 'Damoishop_Auth_123'
        };
        
        // Cố đăng ký trước, nếu lỗi tồn tại SĐT thì Đăng nhập
        let response = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        let data = await response.json();

        if (!response.ok && data.message && data.message.includes('tồn tại')) {
            const loginData = { identifier: window.tempAuthData.phone, password: 'Damoishop_Auth_123' };
            response = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            data = await response.json();
            
            if (response.ok) {
                authData = data;
            }
        } else if (response.ok) {
            authData = data;
        }

        localStorage.setItem('damoi_user', JSON.stringify(authData));
        window.location.reload();

    } catch (error) {
        // Fallback offline mock
        const authData = { _id: "mock_" + Date.now(), fullName: window.tempAuthData.name, phone: window.tempAuthData.phone, role: 'customer' };
        localStorage.setItem('damoi_user', JSON.stringify(authData));
        window.location.reload();
    }
};

window.openAuthModal = function() {
    window.injectAuthModal();
    window.authStep(1); // Reset
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) modal.classList.add('open');
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) modal.classList.remove('open');
    if (typeof window.hideMockOtpToast === 'function') window.hideMockOtpToast();
};
