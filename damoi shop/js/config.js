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
        
        return `<a href="/index.html?category=${encodeURIComponent(category)}&subCategory=${encodeURIComponent(sub)}&label=${encodeURIComponent(label)}" class="filter-cat-item ${isActive}">${label}</a>`;
    }).join('');
};

// ==========================================================================
