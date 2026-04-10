// ================== AUTH GUARD ==================
const rawAdmin = sessionStorage.getItem('damoi_user') || localStorage.getItem('damoi_user');
const adminUser = rawAdmin ? JSON.parse(rawAdmin) : null;
if (!adminUser || adminUser.role !== 'admin') {
    alert('Truy cập bị từ chối! Trang này chỉ dành cho Quản Trị Viên.');
    localStorage.removeItem('damoi_user');
    sessionStorage.removeItem('damoi_user');
    window.location.replace('admin-login.html');
}

// Hiển thị tên admin
if (adminUser) {
    const name = adminUser.fullName || adminUser.email || 'Admin';
    document.getElementById('admin-name').textContent = name;
    document.getElementById('admin-avatar').textContent = name.charAt(0).toUpperCase();
}

// ================== CONFIG ==================
const fmt = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
const API_URL = '/api/products';
const ORDER_API_URL = '/api/orders';
const STATS_API_URL = '/api/stats';
const USER_API_URL = '/api/users';
const MESSAGE_API_URL = '/api/messages';
const VOUCHER_API_URL = '/api/vouchers';

let chatPollingInterval;
let activeChatUserId = null;

// Cache sản phẩm và đơn hàng
let allProducts = [];
let allOrders = [];

// ================== SUB-CATEGORY MAP ==================
const SUB_CATEGORIES = {
    'Nam': ['Áo phông - Áo thun', 'Áo polo', 'Áo sơ mi', 'Chống nắng', 'áo ba lỗ', 'Đồ thể thao'],
    'Nữ': ['Áo phông - Áo thun', 'Áo polo', 'Áo sơ mi', 'Chống nắng', 'Thể thao', 'Đồ mặc nhà & Đồ ngủ'],
    'Bé Trai': ['Áo thun', 'Áo sơ mi', 'Quần shorts', 'Quần dài', 'Đồ bộ'],
    'Bé Gái': ['Váy - Đầm', 'Áo kiểu', 'Chân váy', 'Quần', 'Đồ bộ'],
    'Công Sở & Học Đường': ['Áo sơ mi', 'Quần tây', 'Chân váy', 'Áo vest', 'Đầm công sở', 'Đồng phục', 'Áo thun', 'Quần jeans', 'Balo'],
    'Uncategorized': []
};

function updateSubCategoryOptions(selectedSub = '') {
    const mainCat = document.getElementById('pCategory').value;
    const subSelect = document.getElementById('pSubCategory');
    const options = SUB_CATEGORIES[mainCat] || [];

    subSelect.innerHTML = '<option value="">-- Không có --</option>';
    options.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        if (sub === selectedSub) opt.selected = true;
        subSelect.appendChild(opt);
    });
}

// ================== NAVIGATION ==================
function showSection(sectionId) {
    // Ẩn hết sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Hiện section + active nav
    document.getElementById(`section-${sectionId}`).classList.add('active');
    const navBtn = document.getElementById(`nav-${sectionId}`);
    if (navBtn) navBtn.classList.add('active');

    // Cập nhật topbar title
    const titles = {
        dashboard: ['Thống kê', 'Tổng quan hệ thống'],
        products: ['Sản Phẩm', 'Quản lý kho hàng'],
        orders: ['Đơn Hàng', 'Quản lý đơn hàng'],
        customers: ['Khách Hàng', 'Quản lý tài khoản khách'],
        messages: ['Tin Nhắn', 'Trò chuyện với khách hàng'],
        vouchers: ['Mã Giảm Giá', 'Quản lý chương trình ưu đãi'],
        shipping: ['Vận Chuyển', 'Cấu hình phí ship và đối tác']
    };
    const [title, breadcrumb] = titles[sectionId] || ['Admin', ''];
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-breadcrumb').textContent = breadcrumb;

    // Load data
    if (sectionId === 'dashboard') fetchDashboard();
    else if (sectionId === 'products') fetchProducts();
    else if (sectionId === 'orders') fetchOrders();
    else if (sectionId === 'customers') fetchCustomers();
    else if (sectionId === 'messages') {
        fetchConversations();
        startChatPolling();
    }
    else if (sectionId === 'vouchers') fetchVouchers();
    else if (sectionId === 'shipping') initShippingSection();

    // Stop polling if not in messages
    if (sectionId !== 'messages') stopChatPolling();
}

// ================== LOGOUT ==================
function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất không?')) {
        localStorage.removeItem('damoi_user');
        sessionStorage.removeItem('damoi_user');
        window.location.href = 'admin-login.html';
    }
}

// ================== TOAST ==================
function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast${isError ? ' error' : ''}`;
    toast.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-xmark' : 'fa-circle-check'}" style="color: ${isError ? 'var(--red)' : 'var(--green)'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ================== DASHBOARD ==================
let revenueChart, ordersChart;

async function fetchDashboard() {
    try {
        const [statsRes, ordersRes] = await Promise.all([
            fetch(STATS_API_URL),
            fetch(ORDER_API_URL)
        ]);

        if (!statsRes.ok) throw new Error('Lỗi API stats');

        const stats = await statsRes.json();
        const orders = await ordersRes.json();

        // Update stat cards
        document.getElementById('stat-revenue').textContent = fmt(stats.totalRevenue);
        document.getElementById('stat-orders').textContent = stats.totalOrders.toLocaleString();
        document.getElementById('stat-pending').textContent = stats.pendingOrders.toLocaleString();
        document.getElementById('stat-products').textContent = stats.totalProducts.toLocaleString();

        // Build chart data for last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        const labels = last7Days.map(d => {
            const [, m, day] = d.split('-');
            return `${day}/${m}`;
        });

        const revenueData = last7Days.map(date => {
            const found = stats.dailyOrders.find(o => o._id === date);
            return found ? found.revenue : 0;
        });
        const ordersData = last7Days.map(date => {
            const found = stats.dailyOrders.find(o => o._id === date);
            return found ? found.count : 0;
        });

        // Render charts
        renderRevenueChart(labels, revenueData);
        renderOrdersChart(labels, ordersData);

        // Recent orders (top 5)
        const recentBody = document.getElementById('recent-orders-list');
        recentBody.innerHTML = '';
        const recent = orders.slice(0, 5);
        if (recent.length === 0) {
            recentBody.innerHTML = '<tr class="loading-row"><td colspan="4">Chưa có đơn hàng nào</td></tr>';
        } else {
            recent.forEach(order => {
                const badge = getStatusBadge(order.status);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${order.shippingAddress?.fullName || 'Khách vãng lai'}</strong></td>
                    <td>${order.shippingAddress?.phone || 'N/A'}</td>
                    <td><strong style="color: var(--accent)">${fmt(order.totalPrice)}</strong></td>
                    <td>${badge}</td>
                `;
                recentBody.appendChild(tr);
            });
        }

    } catch (error) {
        console.error('Lỗi dashboard:', error);
    }
}

function getStatusBadge(status) {
    const map = {
        'Chờ xử lý': 'badge-pending',
        'Pending': 'badge-pending',
        'Đang giao hàng': 'badge-shipping',
        'Đã giao hàng': 'badge-delivered',
        'Delivered': 'badge-delivered',
        'Đã hủy': 'badge-cancelled',
        'Cancelled': 'badge-cancelled',
    };
    const cls = map[status] || 'badge-pending';
    return `<span class="badge ${cls}">${status}</span>`;
}

function renderRevenueChart(labels, data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (revenueChart) revenueChart.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(167,139,250,0.3)');
    gradient.addColorStop(1, 'rgba(167,139,250,0)');

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Doanh thu',
                data,
                borderColor: '#a78bfa',
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#a78bfa',
                pointRadius: 4,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ctx.raw)
                    },
                    backgroundColor: '#1e1e28',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleColor: '#e4e4f0',
                    bodyColor: '#e4e4f0',
                }
            },
            scales: {
                x: { ticks: { color: '#888', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: {
                    ticks: {
                        color: '#888', font: { size: 11 },
                        callback: (val) => val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : val >= 1000 ? (val/1000).toFixed(0) + 'K' : val
                    },
                    grid: { color: 'rgba(255,255,255,0.04)' }
                }
            }
        }
    });
}

function renderOrdersChart(labels, data) {
    const ctx = document.getElementById('ordersChart').getContext('2d');
    if (ordersChart) ordersChart.destroy();

    ordersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Đơn hàng',
                data,
                backgroundColor: 'rgba(96,165,250,0.5)',
                borderColor: '#60a5fa',
                borderWidth: 1.5,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e1e28',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleColor: '#e4e4f0',
                    bodyColor: '#e4e4f0',
                }
            },
            scales: {
                x: { ticks: { color: '#888', font: { size: 11 } }, grid: { display: false } },
                y: { ticks: { color: '#888', font: { size: 11 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.04)' } }
            }
        }
    });
}

// ================== PRODUCTS ==================
document.addEventListener('DOMContentLoaded', () => {
    showSection('dashboard');
    checkUnreadMessagesGlobal();
    setInterval(checkUnreadMessagesGlobal, 10000); // Poll globally every 10s
});

async function checkUnreadMessagesGlobal() {
    try {
        const response = await fetch(MESSAGE_API_URL + '/admin/list');
        const conversations = await response.json();
        const hasUnread = conversations.some(c => c.unreadCount > 0);
        
        const navBtn = document.getElementById('nav-messages');
        if (!navBtn) return;
        
        let dot = navBtn.querySelector('.nav-unread-dot');
        if (hasUnread) {
            if (!dot) {
                dot = document.createElement('span');
                dot.className = 'nav-unread-dot';
                dot.style.cssText = 'width: 8px; height: 8px; background: var(--red); border-radius: 50%; box-shadow: 0 0 5px var(--red); margin-left: auto;';
                navBtn.appendChild(dot);
            }
        } else {
            if (dot) dot.remove();
        }
    } catch (error) {
        // Ignore silent poll errors
    }
}

async function fetchProducts() {
    const listBody = document.getElementById('admin-product-list');
    listBody.innerHTML = '<tr class="loading-row"><td colspan="9">Đang tải dữ liệu...</td></tr>';

    try {
        const response = await fetch(API_URL);
        allProducts = await response.json();
        
        allProducts.sort((a, b) => {
            const catA = (a.category || '').toLowerCase();
            const catB = (b.category || '').toLowerCase();
            if (catA < catB) return -1;
            if (catA > catB) return 1;

            const subA = (a.subCategory || '').toLowerCase();
            const subB = (b.subCategory || '').toLowerCase();
            if (subA < subB) return -1;
            if (subA > subB) return 1;

            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;

            return 0;
        });

        renderProducts(allProducts);
    } catch (error) {
        console.error("Lỗi tải sản phẩm admin:", error);
        listBody.innerHTML = '<tr class="loading-row"><td colspan="9" style="color: var(--red);">Lỗi tải dữ liệu. Kiểm tra Backend.</td></tr>';
    }
}

function filterProducts() {
    const q = document.getElementById('product-search').value.toLowerCase();
    const filterType = document.getElementById('product-filter').value;

    let filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );

    // Áp dụng thêm bộ lọc theo loại
    if (filterType === 'sale') {
        filtered = filtered.filter(p => p.isSale);
    } else if (filterType === 'new') {
        filtered = filtered.filter(p => p.isNewProduct);
    } else if (filterType === 'instock') {
        filtered = filtered.filter(p => p.stockCount > 0);
    } else if (filterType === 'outofstock') {
        filtered = filtered.filter(p => p.stockCount <= 0);
    }

    renderProducts(filtered);
}

function renderProducts(products) {
    const listBody = document.getElementById('admin-product-list');
    listBody.innerHTML = '';

    const countEl = document.getElementById('products-count');
    if (countEl) countEl.textContent = `(Tất cả: ${products.length} sản phẩm)`;

    if (products.length === 0) {
        listBody.innerHTML = '<tr class="loading-row"><td colspan="9">Không tìm thấy sản phẩm nào.</td></tr>';
        return;
    }

    products.forEach((product, index) => {
        const imageSrc = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/44';
        const tags = [
            product.isNewProduct ? '<span class="badge badge-delivered" style="font-size:11px;">Mới</span>' : '',
            product.isSale ? '<span class="badge badge-shipping" style="font-size:11px;">Sale</span>' : ''
        ].filter(Boolean).join(' ') || '<span style="color: var(--text-muted); font-size: 12px;">–</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center; font-weight: 500; color: var(--text-muted);">${index + 1}</td>
            <td><img src="${imageSrc}" alt="${product.name}" onclick="viewImageFull('${imageSrc}')" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" title="Nhấn để phóng to"></td>
            <td>
                <strong>${product.name}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">${product.subCategory || ''}</div>
            </td>
            <td style="color: var(--text-muted); font-size: 13px;">${product.sku}</td>
            <td style="font-size: 13px;">${product.category || '–'}</td>
            <td style="color: var(--accent); font-weight: 600;">${fmt(product.price)}</td>
            <td>${product.stockCount} <span style="color: var(--text-muted); font-size: 12px;">chiếc</span></td>
            <td>${tags}</td>
            <td>
                <div class="btn-actions">
                    <button class="btn-icon edit" onclick="editProduct('${product._id}')" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon delete" onclick="deleteProduct('${product._id}', '${(product.name || '').replace(/'/g, "\\'")}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        listBody.appendChild(tr);
    });
}

// ======================== TÍNH NĂNG XÓA ========================
async function deleteProduct(id, name) {
    if (!confirm('Bạn chắc chắn muốn xóa chứ?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

        if (response.ok) {
            showToast('Đã xóa sản phẩm thành công!');
            fetchProducts();
        } else {
            const err = await response.json();
            showToast('Lỗi: ' + (err.message || 'Không xác định'), true);
        }
    } catch (error) {
        showToast('Lỗi hệ thống khi xóa sản phẩm', true);
    }
}

// ======================== MODAL ========================
const modal = document.getElementById('productModal');
let selectedFiles = []; // Lưu trữ các File mới được chọn
let existingImages = []; // Lưu trữ các URL ảnh đã có từ trước (khi sửa)
let productColors = []; // Lưu trữ tên màu tương ứng với từng ảnh (theo thứ tự)

function openAddModal() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('pColors').value = '';
    document.getElementById('pSizes').value = '';
    selectedFiles = [];
    existingImages = [];
    productColors = [];
    renderImagePreviews();
    document.getElementById('modalTitle').textContent = 'Thêm Sản Phẩm Mới';
    updateSubCategoryOptions(); 
    modal.classList.add('open');
}

function closeModal() {
    modal.classList.remove('open');
}

function handleModalBgClick(event) {
    if (event.target === modal) closeModal();
}

function viewImageFull(src) {
    document.getElementById('detail-full-image').src = src;
    document.getElementById('imageDetailModal').classList.add('open');
}

function closeImageDetailModal() {
    document.getElementById('imageDetailModal').classList.remove('open');
}

async function editProduct(id) {
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa Sản phẩm';
    document.getElementById('productId').value = id;

    try {
        const response = await fetch(`${API_URL}/${id}`);
        const product = await response.json();

        document.getElementById('pName').value = product.name;
        document.getElementById('pSku').value = product.sku;
        document.getElementById('pCategory').value = product.category || 'Uncategorized';
        updateSubCategoryOptions(product.subCategory || '');
        document.getElementById('pPrice').value = new Intl.NumberFormat('vi-VN').format(product.price);
        document.getElementById('pOldPrice').value = product.oldPrice ? new Intl.NumberFormat('vi-VN').format(product.oldPrice) : '';
        document.getElementById('pStock').value = product.stockCount;

        // Xử lý ảnh cũ
        selectedFiles = [];
        existingImages = product.images || [];
        productColors = product.colors || [];
        renderImagePreviews();

        document.getElementById('pSizes').value = (product.sizes || []).join(', ');

        document.getElementById('pDesc').value = product.description || '';
        document.getElementById('pIsNew').checked = product.isNewProduct;
        document.getElementById('pIsSale').checked = product.isSale;

        modal.classList.add('open');
    } catch (error) {
        showToast('Không thể tải thông tin sản phẩm', true);
    }
}

// Hàm render danh sách ảnh preview kèm ô nhập tên màu
function renderImagePreviews() {
    const container = document.getElementById('image-preview-list');
    container.innerHTML = '';

    // Render ảnh đã có
    existingImages.forEach((src, idx) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        const colorName = productColors[idx] || '';
        div.innerHTML = `
            <img src="${src}" alt="Existing">
            <input type="text" class="color-name-input" placeholder="Tên màu..." value="${colorName}" 
                   onchange="updateColorName(${idx}, this.value)" title="Nhập tên màu cho ảnh này">
            <button type="button" class="remove-img" onclick="removeExistingImage(${idx})">&times;</button>
        `;
        container.appendChild(div);
    });

    // Render ảnh mới chọn (dùng URL.createObjectURL để xem trước)
    selectedFiles.forEach((file, idx) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        const url = URL.createObjectURL(file);
        // Tên màu cho ảnh mới lưu ở cuối mảng productColors (sau existingImages)
        const globalIdx = existingImages.length + idx;
        const colorName = productColors[globalIdx] || '';
        div.innerHTML = `
            <img src="${url}" alt="New">
            <input type="text" class="color-name-input" placeholder="Màu mới..." value="${colorName}" 
                   onchange="updateColorName(${globalIdx}, this.value)" title="Nhập tên màu cho ảnh này">
            <button type="button" class="remove-img" onclick="removeSelectedFile(${idx})">&times;</button>
        `;
        container.appendChild(div);
    });
}

// Cập nhật tên màu vào mảng tạm
window.updateColorName = (idx, value) => {
    productColors[idx] = value.trim();
};

window.removeExistingImage = (idx) => {
    existingImages.splice(idx, 1);
    productColors.splice(idx, 1); // Xóa màu tương ứng
    renderImagePreviews();
};

window.removeSelectedFile = (idx) => {
    const globalIdx = existingImages.length + idx;
    selectedFiles.splice(idx, 1);
    productColors.splice(globalIdx, 1); // Xóa màu tương ứng
    renderImagePreviews();
};

// Lắng nghe chọn file
document.getElementById('pImageFile').addEventListener('change', function (e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
            showToast(`Ảnh ${file.name} quá nặng (>2MB)!`, true);
            return;
        }
        selectedFiles.push(file);
    });
    
    renderImagePreviews();
    this.value = ''; // Reset để có thể chọn lại cùng 1 file nếu vừa xóa
});

// Submit form
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('productId').value;
    const isEditMode = id !== '';
    const sku = document.getElementById('pSku').value.trim();
    
    if (!sku) {
        showToast('Vui lòng nhập mã SKU để hệ thống tạo thư mục ảnh!', true);
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang xử lý ảnh...'; }

    try {
        // === BƯỚC 1: Upload tất cả ảnh mới vào thư mục SKU ===
        const newImageUrls = [];
        
        for (const file of selectedFiles) {
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (evt) => resolve(evt.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: base64Data, fileName: file.name, sku: sku })
            });

            if (uploadRes.ok) {
                const result = await uploadRes.json();
                newImageUrls.push(result.imageUrl);
            } else {
                console.error('Lỗi upload file:', file.name);
            }
        }

        // Kết hợp ảnh cũ còn giữ lại và ảnh mới upload
        const finalImages = [...existingImages, ...newImageUrls];

        if (finalImages.length === 0) {
            if (!confirm('Sản phẩm chưa có ảnh nào. Bạn vẫn muốn lưu chứ?')) {
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '💾 LƯU THÔNG TIN'; }
                return;
            }
        }

        // === BƯỚC 2: Lưu vào database ===
        const productData = {
            name: document.getElementById('pName').value.trim(),
            sku: sku,
            category: document.getElementById('pCategory').value,
            subCategory: document.getElementById('pSubCategory').value,
            price: Number(document.getElementById('pPrice').value.replace(/\./g, '')),
            oldPrice: document.getElementById('pOldPrice').value ? Number(document.getElementById('pOldPrice').value.replace(/\./g, '')) : null,
            stockCount: Number(document.getElementById('pStock').value) || 100,
            colors: productColors, // Maintain 1:1 mapping with images (do not filter out empty strings)
            sizes: document.getElementById('pSizes').value.split(',').map(s => s.trim()).filter(s => s !== ''),
            images: finalImages,
            description: document.getElementById('pDesc').value,
            isNewProduct: document.getElementById('pIsNew').checked,
            isSale: document.getElementById('pIsSale').checked
        };

        const url = isEditMode ? `${API_URL}/${id}` : API_URL;
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            showToast(isEditMode ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!');
            closeModal();
            fetchProducts();
        } else {
            const err = await response.json();
            const errMsg = err.error || err.message || '';
            if (errMsg.includes('E11000')) {
                showToast('❌ Mã SKU "' + sku + '" đã tồn tại!', true);
            } else {
                showToast('Lỗi: ' + errMsg, true);
            }
        }
    } catch (error) {
        showToast('Lỗi: ' + error.message, true);
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '💾 LƯU THÔNG TIN'; }
    }
});

// ======================== ORDERS ========================
async function fetchOrders() {
    const listBody = document.getElementById('admin-order-list');
    listBody.innerHTML = '<tr class="loading-row"><td colspan="6">Đang tải đơn hàng...</td></tr>';

    try {
        const response = await fetch(ORDER_API_URL);
        const orders = await response.json();
        allOrders = orders;

        listBody.innerHTML = '';
        document.getElementById('orders-count').textContent = `${orders.length} đơn hàng`;

        if (orders.length === 0) {
            listBody.innerHTML = '<tr class="loading-row"><td colspan="6">Chưa có đơn hàng nào!</td></tr>';
            return;
        }

        orders.forEach(order => {
            const itemsHtml = (order.orderItems || []).map(item =>
                `<div style="font-size: 13px; margin-bottom: 3px;">• <strong>${item.qty || 1}x</strong> ${item.name || 'Sản phẩm'} <span style="color: var(--text-muted);">(${item.color || ''}/${item.size || ''})</span></div>`
            ).join('');

            const selectVal = (status) => {
                const opts = ['Chờ xử lý', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
                return opts.map(o => `<option value="${o}" ${order.status === o || (o === 'Chờ xử lý' && order.status === 'Pending') || (o === 'Đã giao hàng' && order.status === 'Delivered') || (o === 'Đã hủy' && order.status === 'Cancelled') ? 'selected' : ''}>${o}</option>`).join('');
            };

            const orderCode = order._id.slice(-6).toUpperCase();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-family: monospace; font-weight: 700; color: var(--accent); cursor: pointer; display: inline-block; padding-bottom: 3px;" onclick="viewOrderDetail('${order._id}')">#${orderCode}</div>
                    <strong style="display: block; margin-top: 2px;">${order.shippingAddress?.fullName || 'Khách Vãng Lai'}</strong>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                </td>
                <td>
                    <div style="font-size: 13px;"><i class="fa-solid fa-phone" style="color: var(--text-muted); font-size:11px;"></i> ${order.shippingAddress?.phone || 'N/A'}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">${order.shippingAddress?.address || ''}</div>
                </td>
                <td>${itemsHtml}</td>
                <td><strong style="color: var(--accent2);">${fmt(order.totalPrice)}</strong></td>
                <td>${getStatusBadge(order.status)}</td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select class="status-select" onchange="updateOrderStatus('${order._id}', this.value)">
                            ${selectVal(order.status)}
                        </select>
                        <button class="btn-icon" onclick="printInvoice('${order._id}')" title="In Hóa Đơn" style="color: var(--blue);"><i class="fa-solid fa-print"></i></button>
                        <button class="btn-icon delete" onclick="deleteOrder('${order._id}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            listBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Lỗi tải đơn hàng admin:", error);
        listBody.innerHTML = '<tr class="loading-row"><td colspan="6" style="color: var(--red);">Lỗi tải dữ liệu. Kiểm tra Backend.</td></tr>';
    }
}

// Chi tiết đơn hàng
window.viewOrderDetail = function(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;
    
    document.getElementById('detail-order-id').innerText = '#' + order._id.slice(-6).toUpperCase();
    
    const countItems = (order.orderItems || []).reduce((acc, i) => acc + (i.qty || 1), 0);
    const itemsHtml = (order.orderItems || []).map(item => {
        const linkedProduct = allProducts.find(p => p.name === item.name);
        const sku = linkedProduct ? linkedProduct.sku : (item.sku || 'N/A');
        
        return `
        <div style="display: flex; gap: 15px; margin-bottom: 15px; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 15px;">
            <img src="${item.image}" alt="" onclick="viewImageFull('${item.image}')" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px; background: #fff; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" title="Nhấn để phóng to">
            <div>
                <div style="font-weight: 600; font-size: 15px; color: #333; margin-bottom: 5px;">${item.name}</div>
                <div style="font-size: 13px; color: #666; margin-bottom: 3px;">Mã SKU: <span style="color: #333; font-family: monospace;">${sku}</span></div>
                <div style="font-size: 13px; color: #666;">Phân loại: ${item.color} / ${item.size}</div>
                <div style="font-size: 14px; margin-top: 5px; color: var(--accent); font-weight: 600;">
                    ${item.qty} x ${fmt(item.price)}
                </div>
            </div>
        </div>
        `;
    }).join('');

    const discountAmount = order.discountValue || 0;
    const shippingPrice = order.shippingPrice || 0;
    const subtotal = order.totalPrice - shippingPrice + discountAmount;
    const finalProductTotal = subtotal - discountAmount;

    document.getElementById('order-detail-content').innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px; margin-bottom: 20px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                <h4 style="color: #333; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">👤 Thông Tin Khách Hàng</h4>
                <div style="margin-bottom: 8px; color: #444;"><strong>Họ Tên:</strong> ${order.shippingAddress?.fullName || 'N/A'}</div>
                <div style="margin-bottom: 8px; color: #444;"><strong>SĐT:</strong> ${order.shippingAddress?.phone || 'N/A'}</div>
                <div style="line-height: 1.5; color: #444;"><strong>Địa chỉ:</strong> ${order.shippingAddress?.address || 'N/A'}</div>
                ${order.shippingAddress?.email ? `<div style="margin-top: 8px; color: #444;"><strong>Email:</strong> ${order.shippingAddress.email}</div>` : ''}
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                <h4 style="color: #333; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">📦 Tóm Tắt Thanh Toán</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #444;">
                    <span>Tạm tính (${countItems} SP):</span> <span>${fmt(subtotal)}</span>
                </div>
                ${discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #10b981; font-weight: 500;">
                    <span>Voucher (${order.voucherCode || 'Đã áp dụng'}):</span> <span>-${fmt(discountAmount)}</span>
                </div>` : `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #888;">
                    <span>Voucher:</span> <span>Không áp dụng</span>
                </div>`}
                <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-weight: 700; color: #d63384; font-size: 16px;">
                    <span>TIỀN HÀNG:</span> <span>${fmt(finalProductTotal)}</span>
                </div>
                <div style="margin-top: 15px;">
                    <strong style="color: #333;">Trạng thái:</strong> ${getStatusBadge(order.status)}
                </div>
            </div>
        </div>
        <div>
            <h4 style="color: #333; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">🛍️ Danh Sách Sản Phẩm</h4>
            ${itemsHtml}
        </div>
    `;

    document.getElementById('orderDetailModal').classList.add('open');
};

window.closeOrderDetailModal = function() {
    document.getElementById('orderDetailModal').classList.remove('open');
};

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${ORDER_API_URL}/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showToast(`Đã cập nhật trạng thái: ${newStatus}`);
            fetchOrders();
        } else {
            const err = await response.json();
            showToast('Lỗi cập nhật: ' + err.message, true);
        }
    } catch (error) {
        showToast('Lỗi hệ thống khi cập nhật trạng thái.', true);
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Bạn chắc chắn muốn xóa chứ?')) return;
    try {
        const response = await fetch(`${ORDER_API_URL}/${orderId}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Đã xóa đơn hàng thành công');
            fetchOrders();
            if (document.getElementById('section-dashboard').classList.contains('active')) {
                fetchDashboard();
            }
        } else {
            const err = await response.json();
            showToast('Lỗi: ' + (err.message || 'Không thể xóa'), true);
        }
    } catch (error) {
        showToast('Lỗi hệ thống khi xóa đơn hàng.', true);
    }
}

// Hàm in hóa đơn
function printInvoice(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) {
        showToast('Không tìm thấy dữ liệu đơn hàng!', true);
        return;
    }
    
    let itemsHtml = '';
    (order.orderItems || []).forEach((item, index) => {
        itemsHtml += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.name} <br><small style="color: #666;">(${item.color} - ${item.size})</small></td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.qty}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${fmt(item.price)}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;"><strong>${fmt(item.price * item.qty)}</strong></td>
            </tr>
        `;
    });

    const win = window.open('', '_blank');
    const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>Hóa Đơn Bán Hàng - ${order._id}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
                .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0; color: #111; font-size: 32px; text-transform: uppercase; font-weight: 800; letter-spacing: 2px; }
                .header p { margin: 5px 0 0; color: #555; font-size: 14px; }
                .invoice-title { text-align: center; margin: 30px 0; }
                .invoice-title h2 { font-size: 24px; color: #222; margin: 0; text-transform: uppercase; }
                .invoice-title p { margin: 5px 0 0; color: #666; font-size: 14px; }
                .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px; }
                .info-box { background: #fafafa; padding: 20px; border-radius: 8px; flex: 1; border: 1px solid #eee; }
                .info-box h3 { margin-top: 0; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; font-size: 15px; text-transform: uppercase; }
                .info-box p { margin: 8px 0; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #f4f4f4; padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 14px; color: #333; text-transform: uppercase; }
                .total-section { width: 350px; float: right; }
                .total-line { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 15px; }
                .total-line.grand-total { font-size: 18px; font-weight: bold; color: #d32f2f; border-bottom: none; border-top: 2px solid #333; padding-top: 15px; margin-top: 10px; }
                .footer { clear: both; text-align: center; margin-top: 80px; font-style: italic; color: #777; border-top: 1px solid #eee; padding-top: 30px; font-size: 13px; }
                @media print {
                    body { padding: 0; margin: 0; }
                    .info-box { border: none; padding: 0; background: transparent; }
                    .info-box h3 { border-bottom: 1px solid #333; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>DAMOI SHOP</h1>
                <p>170 La Thành, P. Ô Chợ Dừa, Đống Đa, Hà Nội</p>
                <p>Điện thoại: 024 - 7303.0222 | Email: info@damoishop.com</p>
            </div>

            <div class="invoice-title">
                <h2>HÓA ĐƠN BÁN HÀNG</h2>
                <p>Mã đơn hàng: <strong>#${order._id.substring(order._id.length - 8).toUpperCase()}</strong></p>
                <p>Ngày tạo: ${new Date(order.createdAt).toLocaleDateString('vi-VN')} - ${new Date(order.createdAt).toLocaleTimeString('vi-VN')}</p>
            </div>

            <div class="invoice-info">
                <div class="info-box">
                    <h3>Thông tin khách hàng</h3>
                    <p><strong>Khách hàng:</strong> ${order.shippingAddress?.fullName || 'Khách vãng lai'}</p>
                    <p><strong>Điện thoại:</strong> ${order.shippingAddress?.phone || 'Không có'}</p>
                    <p><strong>Địa chỉ giao:</strong> ${order.shippingAddress?.address || 'Tại cửa hàng'}</p>
                </div>
                <div class="info-box">
                    <h3>Chi tiết thanh toán</h3>
                    <p><strong>Phương thức:</strong> ${order.paymentMethod || 'Thanh toán khi nhận hàng (COD)'}</p>
                    <p><strong>Trạng thái:</strong> <span style="font-weight:bold; color: ${order.status === 'Đã giao hàng' ? '#2ca01c' : '#333'}">${order.status}</span></p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align: center; width: 40px;">STT</th>
                        <th>Sản phẩm</th>
                        <th style="text-align: center; width: 60px;">SL</th>
                        <th style="text-align: right; width: 110px;">Đơn giá</th>
                        <th style="text-align: right; width: 130px;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-line">
                    <span>Tổng tiền hàng:</span>
                    <span>${fmt(order.totalPrice)}</span>
                </div>
                <div class="total-line">
                    <span>Phí giao hàng:</span>
                    <span>Miễn phí</span>
                </div>
                <div class="total-line grand-total">
                    <span>Tổng số tiền:</span>
                    <span>${fmt(order.totalPrice)}</span>
                </div>
            </div>

            <div class="footer">
                <p>Cảm ơn quý khách đã tin tưởng và mua sắm tại DAMOI SHOP!</p>
                <p>Quý khách vui lòng giữ lại hóa đơn để được hỗ trợ bảo hành & đổi trả trong vòng 7 ngày.</p>
                <p style="margin-top: 20px;">------------------------------------------------------</p>
            </div>
            
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;
    
    win.document.write(html);
    win.document.close();
}

// ======================== CUSTOMERS ========================
async function fetchCustomers() {
    const listBody = document.getElementById('admin-customer-list');
    listBody.innerHTML = '<tr class="loading-row"><td colspan="6">Đang tải khách hàng...</td></tr>';

    try {
        const response = await fetch(USER_API_URL);
        const customers = await response.json();

        listBody.innerHTML = '';

        if (customers.length === 0) {
            listBody.innerHTML = '<tr class="loading-row"><td colspan="6">Chưa có khách hàng nào!</td></tr>';
            return;
        }

        customers.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${user.fullName}</strong></td>
                <td>${user.email}</td>
                <td>${user.phone || '–'}</td>
                <td><div style="max-width: 200px; font-size: 12px; color: var(--text-muted);">${user.address || '–'}</div></td>
                <td>${new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn-primary" onclick="viewCustomerOrders('${user.phone || ''}', '${(user.fullName || '').replace(/'/g, "\\'")}')" style="font-size: 11px; padding: 5px 10px;">
                            <i class="fa-solid fa-eye"></i> Xem đơn
                        </button>
                        <button class="btn-icon delete" onclick="deleteCustomer('${user._id}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            listBody.appendChild(tr);
        });
    } catch (error) {
        console.error("Lỗi tải khách hàng:", error);
        listBody.innerHTML = '<tr class="loading-row"><td colspan="6" style="color: var(--red);">Lỗi tải dữ liệu.</td></tr>';
    }
}

async function viewCustomerOrders(phone, fullName) {
    const modal = document.getElementById('customerDetailModal');
    const historyContainer = document.getElementById('customer-order-history');
    document.getElementById('customerModalTitle').textContent = `Đơn hàng của: ${fullName}`;
    
    historyContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Đang tải lịch sử đơn hàng...</div>';
    modal.classList.add('open');

    if (!phone) {
        historyContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Khách hàng này chưa có Số điện thoại trong hệ thống nên không thể tra cứu đơn hàng.</div>';
        return;
    }

    try {
        const response = await fetch(`${ORDER_API_URL}/myorders/${phone}`);
        const orders = await response.json();

        if (orders.length === 0) {
            historyContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Khách hàng này chưa có đơn hàng nào.</div>';
            return;
        }

        let html = `
            <table style="margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Ngày đặt</th>
                        <th>Sản phẩm</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(order => {
            const items = order.orderItems.map(item => 
                `<div style="font-size: 12px;">${item.qty}x ${item.name}</div>`
            ).join('');

            html += `
                <tr>
                    <td>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>${items}</td>
                    <td><strong style="color: var(--accent2)">${fmt(order.totalPrice)}</strong></td>
                    <td>${getStatusBadge(order.status)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        historyContainer.innerHTML = html;

    } catch (error) {
        historyContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--red);">Lỗi khi tải lịch sử đơn hàng.</div>';
    }
}

function closeCustomerModal() {
    document.getElementById('customerDetailModal').classList.remove('open');
}

function handleCustomerModalBgClick(event) {
    if (event.target.id === 'customerDetailModal') closeCustomerModal();
}

async function deleteCustomer(userId) {
    if (!confirm('Bạn chắc chắn muốn xóa chứ?')) return;
    try {
        const response = await fetch(`${USER_API_URL}/${userId}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Đã xóa khách hàng thành công');
            fetchCustomers();
        } else {
            const err = await response.json();
            showToast('Lỗi: ' + (err.message || 'Không thể xóa'), true);
        }
    } catch (error) {
        showToast('Lỗi hệ thống khi xóa khách hàng.', true);
    }
}

// ======================== MESSAGES (CHAT) ========================
async function fetchConversations() {
    const chatList = document.getElementById('admin-chat-list');
    try {
        const response = await fetch(`${MESSAGE_API_URL}/admin/list`);
        const conversations = await response.json();

        if (conversations.length === 0) {
            chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">Chưa có cuộc trò chuyện nào</div>';
            return;
        }

        chatList.innerHTML = '';
        conversations.forEach(conv => {
            const time = new Date(conv.latestTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const item = document.createElement('div');
            item.className = `chat-item ${activeChatUserId === conv._id ? 'active' : ''}`;
            item.onclick = (e) => {
                if (e.target.closest('.btn-chat-action')) return;
                loadChat(conv._id, conv.userName);
            };
            
            item.innerHTML = `
                <div class="name">
                    ${conv.isPriority ? '<i class="fa-solid fa-star priority-star"></i>' : ''}
                    ${conv.userName} 
                    ${conv.unreadCount > 0 ? `<span class="unread-dot"></span>` : ''}
                </div>
                <div class="latest">${conv.latestMsg}</div>
                <span class="time">${time}</span>
                <div class="chat-item-actions">
                    <button class="btn-chat-action priority ${conv.isPriority ? 'active' : ''}" onclick="togglePriority('${conv._id}', ${conv.isPriority})" title="Quan trọng">
                        <i class="fa-solid fa-star"></i>
                    </button>
                    <button class="btn-chat-action delete" onclick="deleteConversation('${conv._id}', '${conv.userName}')" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            chatList.appendChild(item);
        });
    } catch (error) {
        console.error("Lỗi fetch conversations:", error);
    }
}

async function loadChat(userId, userName) {
    activeChatUserId = userId;
    
    // UI Update
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    const items = document.querySelectorAll('.chat-item');
    items.forEach(item => {
        if (item.querySelector('.name').textContent.includes(userName)) {
            item.classList.add('active');
        }
    });

    document.getElementById('chat-empty-state').style.display = 'none';
    document.getElementById('chat-active-window').style.display = 'flex';
    document.getElementById('chat-target-name').textContent = userName;
    document.getElementById('chat-target-id').textContent = `ID: ${userId}`;
    document.getElementById('active-chat-userId').value = userId;
    document.getElementById('active-chat-userName').value = userName;

    // Đánh dấu đã đọc
    markAsRead(userId);
    fetchMessages(userId);
}

async function markAsRead(userId) {
    try {
        await fetch(`${MESSAGE_API_URL}/read/${userId}`, { method: 'PATCH' });
        // Không fetchConversations ở đây để tránh giật lag khi đang mở chat, 
        // Polling sẽ tự động cập nhật list
        checkUnreadMessagesGlobal(); // Update the sidebar dot immediately
    } catch (error) {
        console.error("Lỗi đánh dấu đã đọc:", error);
    }
}

async function togglePriority(userId, currentStatus) {
    try {
        await fetch(`${MESSAGE_API_URL}/priority/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPriority: !currentStatus })
        });
        fetchConversations();
    } catch (error) {
        console.error("Lỗi cập nhật ưu tiên:", error);
    }
}

async function deleteConversation(userId, userName) {
    if (!confirm('Bạn chắc chắn muốn xóa chứ?')) return;
    try {
        const res = await fetch(`${MESSAGE_API_URL}/conversation/${userId}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Đã xóa cuộc hội thoại');
            if (activeChatUserId === userId) {
                activeChatUserId = null;
                document.getElementById('chat-empty-state').style.display = 'flex';
                document.getElementById('chat-active-window').style.display = 'none';
            }
            fetchConversations();
        }
    } catch (error) {
        console.error("Lỗi xóa hội thoại:", error);
    }
}

async function fetchMessages(userId) {
    if (!userId) return;
    const body = document.getElementById('admin-chat-body');
    try {
        const response = await fetch(`${MESSAGE_API_URL}/${userId}`);
        const messages = await response.json();

        // Chỉ render lại nếu số lượng tin nhắn thay đổi (để mượt hơn)
        if (body.children.length !== messages.length) {
            body.innerHTML = '';
            messages.forEach(msg => {
                const time = new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const div = document.createElement('div');
                div.className = `chat-msg ${msg.isAdmin ? 'sent' : 'received'}`;
                div.innerHTML = `
                    <div class="msg-content">${msg.content}</div>
                    <span class="msg-time">${time}</span>
                `;
                body.appendChild(div);
            });
            body.scrollTop = body.scrollHeight;
        }
    } catch (error) {
        console.error("Lỗi fetch messages:", error);
    }
}

document.getElementById('admin-chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('admin-chat-input');
    const userId = document.getElementById('active-chat-userId').value;
    const userName = document.getElementById('active-chat-userName').value;
    const content = input.value.trim();

    if (!content || !userId) return;

    try {
        const response = await fetch(MESSAGE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: adminUser._id,
                senderName: 'Admin',
                content,
                isAdmin: true,
                userId: userId
            })
        });

        if (response.ok) {
            input.value = '';
            fetchMessages(userId);
            fetchConversations(); // Update latest message in list
        }
    } catch (error) {
        console.error("Lỗi gửi tin nhắn admin:", error);
    }
});

function startChatPolling() {
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    chatPollingInterval = setInterval(() => {
        fetchConversations();
        if (activeChatUserId) fetchMessages(activeChatUserId);
    }, 5000);
}

function stopChatPolling() {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
    }
}

// ================== VOUCHER MANAGEMENT ==================
function formatCurrencyInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value !== '') {
        input.value = new Intl.NumberFormat('vi-VN').format(value);
    } else {
        input.value = '';
    }
}

async function fetchVouchers() {
    const list = document.getElementById('admin-voucher-list');
    if (!list) return;
    
    try {
        const res = await fetch(VOUCHER_API_URL);
        const vouchers = await res.json();
        
        list.innerHTML = '';
        if (vouchers.length === 0) {
            list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Chưa có mã giảm giá nào.</td></tr>';
            return;
        }

        vouchers.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${v.code}</strong></td>
                <td style="color: var(--green); font-weight:700;">-${fmt(v.discountAmount)}</td>
                <td>${fmt(v.minOrderValue)}</td>
                <td>${new Date(v.expiryDate).toLocaleDateString('vi-VN')}</td>
                <td style="font-size: 13px; color: var(--text-muted);">${v.description}</td>
                <td>
                    <button class="btn-action delete" onclick="deleteVoucher('${v._id}')" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            list.appendChild(tr);
        });
    } catch (err) {
        console.error("Lỗi fetch vouchers:", err);
    }
}

function openVoucherAdminModal() {
    document.getElementById('voucherAdminModal').classList.add('open');
}

function closeVoucherAdminModal() {
    document.getElementById('voucherAdminModal').classList.remove('open');
    document.getElementById('voucherForm').reset();
}

function handleVoucherModalBgClick(e) {
    if (e.target.id === 'voucherAdminModal') closeVoucherAdminModal();
}

// ======================== VOUCHERS ========================
async function fetchVouchers() {
    const listBody = document.getElementById('admin-voucher-list');
    if (!listBody) return;
    
    listBody.innerHTML = '<tr class="loading-row"><td colspan="6">Đang tải mã giảm giá...</td></tr>';

    try {
        const response = await fetch(VOUCHER_API_URL);
        const vouchers = await response.json();

        listBody.innerHTML = '';
        const countEl = document.getElementById('vouchers-count');
        if (countEl) countEl.textContent = `(${vouchers.length} mã)`;

        if (vouchers.length === 0) {
            listBody.innerHTML = '<tr class="loading-row"><td colspan="6">Chưa có mã giảm giá nào.</td></tr>';
            return;
        }

        vouchers.forEach(voucher => {
            const tr = document.createElement('tr');
            const expDate = new Date(voucher.expiryDate);
            const isExpired = expDate < new Date();
            
            tr.innerHTML = `
                <td><strong style="color: var(--accent); font-family: monospace; font-size: 15px;">${voucher.code}</strong></td>
                <td style="font-size: 13px;">${voucher.description || 'Không có mô tả'}</td>
                <td style="color: var(--green); font-weight: 600;">${fmt(voucher.discountAmount)}</td>
                <td>${voucher.minOrderValue > 0 ? fmt(voucher.minOrderValue) : 'Không giới hạn'}</td>
                <td style="${isExpired ? 'color: var(--red);' : ''}">${expDate.toLocaleDateString('vi-VN')} ${isExpired ? '(Hết hạn)' : ''}</td>
                <td>
                    <button class="btn-icon delete" onclick="deleteVoucher('${voucher._id}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            listBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Lỗi tải vouchers admin:", error);
        listBody.innerHTML = '<tr class="loading-row"><td colspan="6" style="color: var(--red);">Lỗi tải dữ liệu.</td></tr>';
    }
}

document.getElementById('voucherForm').addEventListener('submit', async (e) => {

    e.preventDefault();
    
    const data = {
        code: document.getElementById('vCode').value.toUpperCase(),
        discountAmount: Number(document.getElementById('vDiscount').value.replace(/\./g, '')),
        minOrderValue: Number(document.getElementById('vMinOrder').value.replace(/\./g, '')),
        expiryDate: document.getElementById('vExpiry').value,
        description: document.getElementById('vDesc').value
    };

    try {
        const res = await fetch(VOUCHER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast('✅ Đã tạo mã giảm giá thành công!');
            closeVoucherAdminModal();
            fetchVouchers();
        } else {
            const err = await res.json();
            showToast('❌ Lỗi: ' + err.message);
        }
    } catch (err) {
        console.error("Lỗi tạo voucher:", err);
        showToast('❌ Lỗi kết nối server');
    }
});

async function deleteVoucher(id) {
    if (!confirm('Bạn chắc chắn muốn xóa chứ?')) return;
    
    try {
        const res = await fetch(`${VOUCHER_API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('🗑️ Đã xóa mã giảm giá');
            fetchVouchers();
        }
    } catch (err) {
        console.error("Lỗi xóa voucher:", err);
    }
}

// ================== SHIPPING CONFIG ==================
const DEFAULT_SHIPPING_CONFIG = {
    defaultFee: 30000,
    expressFee: 50000,
    threshold: 500000,
    standardTime: '2-5 ngày',
    expressTime: '2-4h',
    expressCities: 'Thành phố Hà Nội',
    carriers: { ghn: true, shopee: true, lex: true, ahamove: true }
};

function getShippingConfig() {
    const saved = localStorage.getItem('damoi_shipping_config');
    return saved ? JSON.parse(saved) : DEFAULT_SHIPPING_CONFIG;
}

function initShippingSection() {
    const config = getShippingConfig();
    const formatter = new Intl.NumberFormat('vi-VN');
    
    document.getElementById('ship-default-fee').value = formatter.format(config.defaultFee);
    document.getElementById('ship-express-fee').value = formatter.format(config.expressFee);
    document.getElementById('ship-threshold').value = formatter.format(config.threshold);
    document.getElementById('ship-express-cities').value = config.expressCities;
    document.getElementById('ship-standard-time').value = config.standardTime;
    document.getElementById('ship-express-time').value = config.expressTime;
    
    document.getElementById('cp-ghn').checked = config.carriers.ghn;
    document.getElementById('cp-shopee').checked = config.carriers.shopee;
    document.getElementById('cp-lex').checked = config.carriers.lex;
    document.getElementById('cp-ahamove').checked = config.carriers.ahamove;
}

function saveShippingConfig() {
    const config = {
        defaultFee: Number(document.getElementById('ship-default-fee').value.replace(/\./g, '')),
        expressFee: Number(document.getElementById('ship-express-fee').value.replace(/\./g, '')),
        threshold: Number(document.getElementById('ship-threshold').value.replace(/\./g, '')),
        expressCities: document.getElementById('ship-express-cities').value.trim(),
        standardTime: document.getElementById('ship-standard-time').value.trim() || '2-5 ngày',
        expressTime: document.getElementById('ship-express-time').value.trim() || '2-4h',
        carriers: {
            ghn: document.getElementById('cp-ghn').checked,
            shopee: document.getElementById('cp-shopee').checked,
            lex: document.getElementById('cp-lex').checked,
            ahamove: document.getElementById('cp-ahamove').checked
        }
    };
    
    localStorage.setItem('damoi_shipping_config', JSON.stringify(config));
    showToast('✅ Đã lưu cấu hình vận chuyển thành công!');
}
