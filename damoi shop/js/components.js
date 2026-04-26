// ==========================================================================
//   COMPONENT LOADER (Injects HTML components)
// ==========================================================================
async function loadHTMLComponent(id, file) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
        const res = await fetch(file);
        if (res.ok) {
            el.outerHTML = await res.text();
        }
    } catch (e) {
        console.error('Failed to load component', file, e);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load all components in parallel
    await Promise.all([
        loadHTMLComponent('app-header', '/components/header.html'),
        loadHTMLComponent('app-footer', '/components/footer.html'),
        loadHTMLComponent('app-chat', '/components/chat.html'),
        loadHTMLComponent('app-cart', '/components/cart.html'),
        loadHTMLComponent('app-voucher', '/components/voucher.html'),
        loadHTMLComponent('app-auth', '/components/auth.html')
    ]);
    
    // Báo hiệu đã tải xong components để script chính chạy
    document.dispatchEvent(new Event('componentsLoaded'));
});

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

