    // ================== YÊU THÍCH (WISHLIST) ==================
    window.isInWishlist = (id) => {
        const wishlist = JSON.parse(localStorage.getItem('damoi_wishlist')) || [];
        return wishlist.includes(id);
    };

    window.toggleWishlist = (event, id) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        let wishlist = JSON.parse(localStorage.getItem('damoi_wishlist')) || [];
        const index = wishlist.indexOf(id);
        const btn = event.currentTarget;
        const icon = btn.querySelector('i');

        if (index === -1) {
            wishlist.push(id);
            btn.classList.add('active');
            if (icon) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
            }
        } else {
            wishlist.splice(index, 1);
            btn.classList.remove('active');
            if (icon) {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
            }
        }

        localStorage.setItem('damoi_wishlist', JSON.stringify(wishlist));
    };

/* --- Wishlist Interactions --- */
window.addToWishlist = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) return;

    const btn = document.querySelector('.image-wishlist-btn');
    const icon = btn.querySelector('i');
    
    let wishlist = JSON.parse(localStorage.getItem('damoi_wishlist')) || [];
    const index = wishlist.indexOf(productId);

    if (index === -1) {
        wishlist.push(productId);
        if (icon) {
            icon.classList.replace('fa-regular', 'fa-solid');
            icon.style.color = 'var(--accent-color)';
        }
    } else {
        wishlist.splice(index, 1);
        if (icon) {
            icon.classList.replace('fa-solid', 'fa-regular');
            icon.style.color = '#666';
        }
    }

    localStorage.setItem('damoi_wishlist', JSON.stringify(wishlist));
};



