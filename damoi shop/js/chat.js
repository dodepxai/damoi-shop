/**
 * DAMOI SHOP - CHAT WIDGET LOGIC
 * Chứa logic cho ô chat hỗ trợ trực tuyến
 */

document.addEventListener('componentsLoaded', () => {
    if (window.chatInitialized) return;
    window.chatInitialized = true;
    
    // ================== CHAT WIDGET LOGIC ==================
    const chatWindow = document.getElementById('chat-window');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('customer-chat-form');
    const chatInput = document.getElementById('customer-chat-input');

    if (!chatWindow) {
        console.warn("Chat window element not found. Waiting...");
        return;
    }

    window.toggleChat = async () => {
        if (!chatWindow) return;
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            // Đánh dấu đã đọc khi mở chat
            try {
                if (window.chatUserId) {
                    await fetch(`/api/messages/customer/read/${window.chatUserId}`, { method: 'PATCH' });
                    if (typeof window.checkCustomerUnreadMessages === 'function') window.checkCustomerUnreadMessages();
                }
            } catch (err) { }

            fetchCustomerMessages();
            // Cuộn xuống cuối
            setTimeout(() => {
                if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        }
    };

    const fetchCustomerMessages = async () => {
        if (!chatMessages || !window.chatUserId) return;
        try {
            const res = await fetch(`/api/messages/${window.chatUserId}`);
            if (!res.ok) return;
            const messages = await res.json();

            // Lọc bỏ tin nhắn trùng lặp theo _id nếu có
            const uniqueMessages = [];
            const msgIds = new Set();
            messages.forEach(m => {
                if (!msgIds.has(m._id)) {
                    msgIds.add(m._id);
                    uniqueMessages.push(m);
                }
            });

            // Xóa hết cũ trừ tin nhắn chào đầu tiên
            const welcomeMsg = chatMessages.querySelector('.chat-m-msg.received:first-child');
            chatMessages.innerHTML = '';
            if (welcomeMsg) chatMessages.appendChild(welcomeMsg);

            uniqueMessages.forEach(msg => {
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
            if (!content || !window.chatUserId) return;

            try {
                const userDataStr = localStorage.getItem('damoi_user');
                const userData = userDataStr ? JSON.parse(userDataStr) : null;

                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: userData ? userData._id : null,
                        senderName: userData ? userData.fullName : 'Khách',
                        content,
                        isAdmin: false,
                        userId: window.chatUserId
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
        if (typeof window.checkCustomerUnreadMessages === 'function') window.checkCustomerUnreadMessages();
    }, 5000);

    // Initial check
    setTimeout(() => {
        if (typeof window.checkCustomerUnreadMessages === 'function') window.checkCustomerUnreadMessages();
    }, 1000);
});

// ==========================================================================
//   GLOBAL DELEGATION (Outside componentsLoaded for basic UI triggers)
// ==========================================================================
document.addEventListener('click', (e) => {
    // Voucher Button Delegation
    const promoBtn = e.target.closest('.promo-code-btn');
    if (promoBtn) {
        if (typeof window.openVoucherModal === 'function') window.openVoucherModal();
        return;
    }

    // Click outside to close cart drawer
    const overlay = document.getElementById('cart-overlay');
    if (e.target === overlay) {
        if (typeof window.closeCartDrawer === 'function') window.closeCartDrawer();
    }
    
    // Voucher Apply logic
    const finalApplyBtn = e.target.closest('#final-apply-voucher');
    if (finalApplyBtn) {
        e.preventDefault();
        const code = window.selectedVoucherCode || document.getElementById('voucher-input')?.value;
        if (code) {
            if (typeof window.applyVoucherLogic === 'function') window.applyVoucherLogic(code);
        } else {
            alert('Vui lòng chọn 1 mã ưu đãi!');
        }
        return;
    }

    const inlineApplyBtn = e.target.closest('#voucher-apply-btn');
    if (inlineApplyBtn) {
        e.preventDefault();
        const inputCode = document.getElementById('voucher-input').value;
        if (inputCode && inputCode.trim().length > 0) {
            if (typeof window.applyVoucherLogic === 'function') window.applyVoucherLogic(inputCode.trim());
        }
        return;
    }
});
