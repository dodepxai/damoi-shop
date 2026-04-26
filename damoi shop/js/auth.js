// ================== AUTH MODAL LOGIC ==================
window.injectAuthModal = function() {
    if (document.getElementById('auth-modal-overlay')) return;
    const modalHTML = `
    <!-- Auth Modal Overlay -->
    <div class="auth-modal-overlay" id="auth-modal-overlay" onclick="closeAuthModal()">
        <div class="auth-modal" onclick="event.stopPropagation()">
            <div class="auth-banner-container">
                <div class="banner-logo-v2">
                    DAMOI<br><span>SHOP</span>
                </div>
                <div class="auth-banner-overlay-v2">
                    <div class="banner-left-content">
                        <h3 class="banner-heading-v2">QUYỀN LỢI<br>THÀNH VIÊN</h3>
                        <div class="banner-promo-list">
                            <div class="promo-item"><i class="fa-solid fa-ticket"></i> Voucher giảm giá</div>
                            <div class="promo-item"><i class="fa-solid fa-percent"></i> Ưu đãi lên tới 20%</div>
                            <div class="promo-item"><i class="fa-solid fa-truck-fast"></i> Vô vàn freeship</div>
                            <div class="promo-item"><i class="fa-solid fa-certificate"></i> Sản phẩm chất lượng</div>
                        </div>
                    </div>
                </div>
                <img src="images/auth-banner-clean-v2.png" alt="Quyền lợi thành viên">
                <button class="auth-close-btn" onclick="closeAuthModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="auth-container-wrapper">

                <!-- Step 1: Info Form -->
                <div id="auth-step-1">
                    <div class="auth-tabs-v2">
                        <div class="auth-tab-v2 active" onclick="window.switchAuthTab('login')">ĐĂNG NHẬP</div>
                        <div class="auth-tab-v2" onclick="window.switchAuthTab('register')">ĐĂNG KÝ</div>
                    </div>
                    
                    <div id="login-section">
                        <p class="auth-subtitle">Vui lòng nhập Email hoặc Số điện thoại để tiếp tục.</p>
                        <form id="login-form-v2" class="auth-form active-form">
                            <div class="form-group" style="margin-bottom: 8px;">
                                <div class="auth-input-wrapper">
                                    <input type="text" id="login-identifier" placeholder="Email hoặc Số điện thoại" maxlength="25" required>
                                </div>
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <div class="auth-input-wrapper">
                                    <input type="password" id="login-password" placeholder="Mật khẩu" maxlength="25" required>
                                    <button type="button" class="password-toggle-btn" onclick="window.togglePasswordVisibility('login-password')">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="login-error-msg" style="color: #e32124; font-size: 12px; margin-top: -10px; margin-bottom: 10px; display: none; text-align: left; font-weight: 500;"></div>
                            <button type="submit" class="btn-auth">ĐĂNG NHẬP</button>
                        </form>
                    </div>

                    <div id="register-section" style="display: none;">
                        <p class="auth-subtitle">Trở thành thành viên để nhận ưu đãi từ DAMOI.</p>
                        <form id="register-form-v2" class="auth-form">
                            <div class="form-group" style="margin-bottom: 6px;">
                                <div class="auth-input-wrapper">
                                    <input type="text" id="reg-name" placeholder="Họ và Tên" maxlength="25" required>
                                    <span class="field-warning-icon">!</span>
                                </div>
                                <span class="empty-warning-text">Không được để trống mục này</span>
                            </div>
                            <div class="form-group" style="margin-bottom: 6px;">
                                <div class="email-input-container">
                                    <input type="text" id="reg-email" placeholder="Địa chỉ Email" maxlength="25" required>
                                    <span class="email-suffix">@gmail.com</span>
                                    <span class="field-warning-icon">!</span>
                                </div>
                                <span class="empty-warning-text">Không được để trống mục này</span>
                            </div>
                            <div class="form-group" style="margin-bottom: 6px;">
                                <div class="auth-input-wrapper">
                                    <input type="tel" id="reg-phone" placeholder="Số điện thoại" maxlength="10" required>
                                    <span class="field-warning-icon">!</span>
                                </div>
                                <span class="empty-warning-text">Không được để trống mục này</span>
                            </div>
                            <div class="form-group" style="margin-bottom: 10px;">
                                <div class="auth-input-wrapper">
                                    <input type="password" id="reg-password" placeholder="Mật khẩu" maxlength="25" required>
                                    <button type="button" class="password-toggle-btn" onclick="window.togglePasswordVisibility('reg-password')">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                    <span class="field-warning-icon has-eye">!</span>
                                </div>
                                <span class="empty-warning-text">Không được để trống mục này</span>
                            </div>
                            <button type="submit" class="btn-auth">ĐĂNG KÝ NGAY</button>
                        </form>
                    </div>

                    <p class="auth-terms">
                        * Khi ấn tiếp tục/đăng ký, bạn xác nhận đã đọc và đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Damoi.
                    </p>
                </div>

                <!-- Step 2: OTP Verification -->
                <div id="auth-step-2" style="display: none; text-align: center;">
                    <div style="margin-bottom: 20px;">
                        <i class="fa-solid fa-envelope-circle-check" style="font-size: 48px; color: #002b5c;"></i>
                    </div>
                    <h3 style="margin-bottom: 10px; font-size: 20px; font-weight: 700; color: #333;">Xác minh Email</h3>
                    <p style="font-size: 14px; color: #777; margin-bottom: 25px;">
                        Mã OTP đã được gửi đến địa chỉ:<br>
                        <strong id="display-otp-email" style="color: #002b5c; font-weight: 700;">example@gmail.com</strong>
                    </p>
                    
                    <div class="otp-inputs" style="display: flex; gap: 8px; justify-content: center; margin-bottom: 25px;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                        <input type="text" maxlength="1" class="otp-input" onkeyup="window.focusNextOtp(this, event)" style="width: 42px; height: 50px; border: 1px solid #eee; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 700; background: #fafafa;">
                    </div>

                    <button class="btn-auth" onclick="window.verifyEmailOtp()">XÁC NHẬN</button>
                    
                    <p style="margin-top: 20px; font-size: 13px; color: #888;">
                        Không nhận được mã? <a href="#" id="resend-otp-btn" onclick="window.handleResendOtp()" style="color: #002b5c; font-weight: 600; text-decoration: none;">Gửi lại</a>
                    </p>
                    <button class="auth-back-btn" onclick="window.authStep(1)" style="margin-top: 20px; background: none; border: none; font-size: 14px; color: #777; cursor: pointer; font-weight: 500;"><i class="fa-solid fa-arrow-left"></i> Quay lại</button>
                </div>

                <!-- Step 3: Celebration Success -->
                <div id="auth-step-3" style="display: none; text-align: center; padding: 50px 30px; background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                    <div class="success-animation" style="margin-bottom: 30px;">
                        <i class="fa-solid fa-circle-check" style="font-size: 90px; color: #22c55e;"></i>
                    </div>
                    <h2 style="font-size: 32px; font-weight: 900; color: #e32124; margin-bottom: 20px; line-height: 1.1; letter-spacing: -1px;">XIN CHÀO<br>THÀNH VIÊN MỚI!</h2>
                    <p style="font-size: 18px; color: #111; line-height: 1.6; font-weight: 600;">
                        Chúc mừng quý khách đã trở thành thành viên chính thức của <span style="color: #e32124;">DAMOI SHOP</span>.
                    </p>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">Vô vàn ưu đãi độc quyền đang chờ đón bạn!</p>
                    
                    <div style="margin-top: 40px;">
                        <div class="loading-dots">
                            <span style="background: #e32124;"></span>
                            <span style="background: #e32124;"></span>
                            <span style="background: #e32124;"></span>
                        </div>
                        <p style="font-size: 14px; color: #002b5c; margin-top: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Đang chuẩn bị cửa hàng cho bạn...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// --- Utilities ---
window.togglePasswordVisibility = function(inputId) {
    const input = document.getElementById(inputId);
    const btn = input.nextElementSibling;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

function initAuthListeners() {
    document.addEventListener('input', (e) => {
        const target = e.target;
        if (target.id === 'reg-phone' || target.id === 'auth-phone') {
            target.value = target.value.replace(/[^0-9]/g, '');
            // Nếu ký tự đầu tiên không phải số 0, xóa đi
            if (target.value.length > 0 && target.value[0] !== '0') {
                target.value = '';
                showFieldError(target.id, "Số điện thoại phải bắt đầu bằng số 0!");
            }
            if (target.value.length > 10) target.value = target.value.slice(0, 10);
        }
        if (target.id === 'reg-email') {
            target.value = target.value.replace(/@/g, '');
        }
        // Clear warnings
        const parent = target.closest('.form-group');
        if (parent && target.value.trim() !== '') {
            target.classList.remove('input-error');
            target.style.borderColor = "#e5e7eb";
            const icon = parent.querySelector('.field-warning-icon');
            const text = parent.querySelector('.empty-warning-text');
            if (icon) icon.style.display = 'none';
            if (text) text.style.display = 'none';
        }
    });

    const loginForm = document.getElementById('login-form-v2');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('login-identifier').value.trim();
            const password = document.getElementById('login-password').value.trim();
            
            try {
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('damoi_user', JSON.stringify(data));
                    window.location.reload();
                } else {
                    // Hiển thị lỗi ngay dưới form
                    const errorMsg = document.getElementById('login-error-msg');
                    if (errorMsg) {
                        errorMsg.innerText = data.message || "Thông tin không chính xác!";
                        errorMsg.style.display = 'block';
                    }
                    // Bôi đỏ 2 ô nhập liệu
                    document.getElementById('login-identifier').style.borderColor = '#e32124';
                    document.getElementById('login-password').style.borderColor = '#e32124';
                    document.getElementById('login-form-v2').classList.add('otp-error');
                    setTimeout(() => {
                        document.getElementById('login-form-v2').classList.remove('otp-error');
                    }, 500);
                }
            } catch (err) {
                console.error("Lỗi đăng nhập:", err);
            }
        });
    }

    const registerForm = document.getElementById('register-form-v2');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            let email = document.getElementById('reg-email').value.trim();
            if (!email.includes('@')) email += '@gmail.com';
            const phone = document.getElementById('reg-phone').value.trim();
            const password = document.getElementById('reg-password').value.trim();

            if (email === "damoi282930@gmail.com") {
                showFieldError('reg-email', 'Email này dành cho quản trị viên!');
                return;
            }

            // Kiểm tra số điện thoại (10 số, bắt đầu bằng 0)
            const phonePattern = /^0[0-9]{9}$/;
            if (!phonePattern.test(phone)) {
                showFieldError('reg-phone', "Số điện thoại không hợp lệ (Phải có 10 số và bắt đầu bằng 0)!");
                return;
            }

            window.tempAuthData = { name, email, phone, password };
            const displayEmail = document.getElementById('display-otp-email');
            if (displayEmail) displayEmail.innerText = email;
            window.authStep(2);
        });
    }
}

window.switchAuthTab = function(tab) {
    const tabs = document.querySelectorAll('.auth-tab-v2');
    const loginSec = document.getElementById('login-section');
    const regSec = document.getElementById('register-section');
    tabs.forEach(t => t.classList.remove('active'));
    if (tab === 'login') {
        tabs[0].classList.add('active');
        loginSec.style.display = 'block';
        regSec.style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        loginSec.style.display = 'none';
        regSec.style.display = 'block';
    }
};

window.authStep = function(step) {
    const s1 = document.getElementById('auth-step-1');
    const s2 = document.getElementById('auth-step-2');
    const s3 = document.getElementById('auth-step-3');
    const banner = document.querySelector('.auth-banner-container');
    const modal = document.querySelector('.auth-modal');
    
    if (s1) s1.style.display = step === 1 ? 'block' : 'none';
    if (s2) s2.style.display = step === 2 ? 'block' : 'none';
    if (s3) s3.style.display = step === 3 ? 'block' : 'none';
    
    if (step === 2) {
        if (banner) banner.style.display = 'none';
        if (modal) modal.style.minHeight = '400px';
        window.mockOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
        window.sendRealOtpEmail(window.tempAuthData.email, window.mockOtpCode);
        
        // Tự động kích hoạt đếm ngược 50s ngay khi vừa hiện màn hình OTP
        setTimeout(() => {
            window.startResendTimer(50);
            const first = document.querySelector('.otp-input');
            if (first) first.focus();
        }, 300);
    } else if (step === 3) {
        if (modal) {
            // XÓA SẠCH VÀ VẼ LẠI TỪ ĐẦU - KHÔNG DÙNG CẤU TRÚC CŨ
            modal.style.minHeight = '450px';
            modal.style.background = '#ffffff';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '2000000';
            modal.style.borderRadius = '24px';
            
            modal.innerHTML = `
                <div style="text-align: center; padding: 40px; width: 100%;">
                    <div style="margin-bottom: 30px;">
                        <i class="fa-solid fa-circle-check" style="font-size: 100px; color: #22c55e;"></i>
                    </div>
                    <h2 style="font-size: 35px; font-weight: 900; color: #e32124; margin-bottom: 20px; line-height: 1.1;">XIN CHÀO<br>THÀNH VIÊN MỚI!</h2>
                    <p style="font-size: 20px; color: #000; line-height: 1.6; font-weight: 700; margin-bottom: 30px;">
                        Chúc mừng bạn đã trở thành<br>thành viên của DAMOI SHOP!
                    </p>
                    <div class="loading-dots">
                        <span style="background: #e32124;"></span>
                        <span style="background: #e32124;"></span>
                        <span style="background: #e32124;"></span>
                    </div>
                    <p style="font-size: 14px; color: #666; margin-top: 15px; font-weight: 600;">ĐANG ĐƯA BẠN ĐẾN CỬA HÀNG...</p>
                </div>
            `;
        }
        // Trigger Fireworks!
        window.triggerFireworks();
    } else {
        if (banner) banner.style.display = 'block';
        if (modal) {
            modal.style.minHeight = 'auto';
            modal.style.background = '#fff';
            modal.style.boxShadow = '0 20px 60px rgba(0,0,0,0.15)';
        }
    }
};

window.triggerFireworks = function() {
    var duration = 5 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999999 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
};

window.sendRealOtpEmail = function(userEmail, otpCode) {
    const serviceID = "service_ucgohhn";
    const templateID = "template_6nvmeng";
    const templateParams = {
        to_email: userEmail,
        to_name: window.tempAuthData.name || "Khách hàng",
        otp_code: otpCode,
        reply_to: "damoishop@gmail.com"
    };
    emailjs.send(serviceID, templateID, templateParams)
        .then(res => console.log('Email sent!'))
        .catch(err => console.error('Email failed!', err));
};

window.focusNextOtp = function(elem, event) {
    if (!/^\d$/.test(elem.value) && elem.value !== "") {
        elem.value = "";
        return;
    }
    const inputs = document.querySelectorAll('.otp-input');
    const index = Array.from(inputs).indexOf(elem);
    elem.style.borderColor = "#eee";
    if (event.key === 'Backspace' && elem.value === '') {
        const prev = inputs[index - 1];
        if (prev) prev.focus();
    } else if (elem.value.length >= elem.maxLength) {
        const next = inputs[index + 1];
        if (next) next.focus();
    }
};

window.verifyEmailOtp = function() {
    const inputs = document.querySelectorAll('.otp-input');
    let enteredCode = "";
    inputs.forEach(input => enteredCode += input.value);
    if (enteredCode.length < 6) return;

    if (enteredCode === window.mockOtpCode) {
        window.completeRegistration();
    } else {
        inputs.forEach(input => {
            input.style.borderColor = "#e32124";
            input.classList.add('otp-error');
            input.value = "";
        });
        inputs[0].focus();
        setTimeout(() => inputs.forEach(i => i.classList.remove('otp-error')), 500);
    }
};

window.completeRegistration = async function() {
    const userData = {
        fullName: window.tempAuthData.name,
        email: window.tempAuthData.email,
        phone: window.tempAuthData.phone,
        password: window.tempAuthData.password
    };
    const btn = document.querySelector('#auth-step-2 .btn-auth');
    if (btn) { btn.innerText = "ĐANG XỬ LÝ..."; btn.disabled = true; }

    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('damoi_user', JSON.stringify(data));
            window.tempAuthData = null;
            // Chuyển sang màn hình ăn mừng
            window.authStep(3);
            // Reload sau 4 giây để tận hưởng pháo hoa
            setTimeout(() => {
                window.location.reload();
            }, 4500);
        } else {
            alert(data.message || "Lỗi đăng ký.");
            if (btn) { btn.innerText = "XÁC NHẬN"; btn.disabled = false; }
        }
    } catch (err) {
        alert("Lỗi kết nối server!");
        if (btn) { btn.innerText = "XÁC NHẬN"; btn.disabled = false; }
    }
};



window.openAuthModal = function() {
    window.injectAuthModal();
    window.authStep(1);
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) modal.classList.add('open');
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) modal.classList.remove('open');
    if (toast) toast.remove();
};

document.addEventListener("componentsLoaded", function() {
    const userStr = localStorage.getItem('damoi_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const accountAction = document.getElementById('accountAction');
        if (accountAction) {
            accountAction.href = '/pages/my-profile.html';
            accountAction.removeAttribute('onclick');
        }
        const logoutAction = document.getElementById('logoutAction');
        if (logoutAction) logoutAction.style.display = 'flex';
    }
    initAuthListeners();
});

window.showFieldError = function(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.style.borderColor = "#e32124";
    input.classList.add('otp-error');
    const parent = input.closest('.form-group');
    const warningText = parent.querySelector('.empty-warning-text');
    if (warningText) {
        warningText.innerText = message;
        warningText.style.display = 'block';
        warningText.style.color = '#e32124';
    }
    setTimeout(() => input.classList.remove('otp-error'), 500);
};

window.handleResendOtp = function() {
    const btn = document.getElementById('resend-otp-btn');
    if (!btn || btn.classList.contains('disabled')) return;

    window.mockOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    window.sendRealOtpEmail(window.tempAuthData.email, window.mockOtpCode);
    
    window.startResendTimer(50);
};

window.startResendTimer = function(seconds) {
    const btn = document.getElementById('resend-otp-btn');
    if (!btn) return;

    let timeLeft = seconds;
    btn.classList.add('disabled');
    btn.style.color = '#ccc';
    btn.style.pointerEvents = 'none';
    
    if (window.resendInterval) clearInterval(window.resendInterval);

    window.resendInterval = setInterval(() => {
        timeLeft--;
        btn.innerText = `Gửi lại (${timeLeft}s)`;
        
        if (timeLeft <= 0) {
            clearInterval(window.resendInterval);
            btn.innerText = 'Gửi lại';
            btn.style.color = '#002b5c';
            btn.style.pointerEvents = 'auto';
            btn.classList.remove('disabled');
        }
    }, 1000);
};

window.handleLogout = function() {
    window.showToast("Hẹn gặp lại bạn sớm nhé! Đừng quên đăng nhập để nhận thêm nhiều ưu đãi từ DAMOI.");
    setTimeout(() => {
        localStorage.removeItem('damoi_user');
        window.location.href = '/index.html';
    }, 2500);
};

window.showToast = function(message) {
    let container = document.querySelector('.damoi-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'damoi-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'damoi-toast';
    toast.innerHTML = `
        <i class="fa-solid fa-heart" style="color: #002b5c;"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
};
