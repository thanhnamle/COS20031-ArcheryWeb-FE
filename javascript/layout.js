/* javascript/layout.js */

document.addEventListener("DOMContentLoaded", () => {
    // === BẢO VỆ TRANG ===
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const userRaw = localStorage.getItem("archery_auth_user");
    
    // Nếu không có thông tin user, chuyển hướng về trang login
    if (!userRaw) {
        // Đảm bảo không chuyển hướng nếu chúng ta *đang* ở trang login/signup
        // (Mặc dù các trang đó không nên tải file này)
        if(window.location.pathname.includes('/pages/login.html') || window.location.pathname.includes('/pages/signup.html')) {
            return;
        }
        window.location.href = '/pages/login.html';
        return; // Dừng thực thi phần còn lại của script
    }
    // === KẾT THÚC BẢO VỆ ===
    const user = JSON.parse(userRaw);
    const userRole = user.role || 'archer'; // Mặc định là archer nếu thiếu
    const currentPath = window.location.pathname;

    // Danh sách trang chỉ dành cho Admin
    const adminOnlyPages = [
        '/pages/archers.html',
        '/pages/equipments.html',
        '/pages/settings.html',
        '/pages/statistics.html' // Thống kê cũng nên là của admin
    ];

    // Nếu là Archer VÀ đang ở trang Admin
    if (userRole === 'archer' && adminOnlyPages.some(page => currentPath.includes(page))) {
        console.warn("Access denied for role 'archer'. Redirecting to dashboard.");
        window.location.href = '/pages/dashboard.html';
        return;
    }
    loadHeader();
});

function loadHeader() {
    fetch('/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(html => {
            const placeholder = document.getElementById('header-placeholder');
            if (placeholder) {
                // Chúng ta không chèn vào placeholder nữa
                // mà chèn trực tiếp vào body
                document.body.insertAdjacentHTML('afterbegin', html);
            }
            updateNavForRole();
            
            setActiveNavigation();
        })
        .catch(error => {
            console.error('Error fetching header:', error);
        });
}

function updateNavForRole() {
    const userRaw = localStorage.getItem("archery_auth_user");
    if (!userRaw) return;

    const user = JSON.parse(userRaw);
    const userRole = user.role || 'archer';

    // Nếu không phải admin, ẩn các link quản lý
    if (userRole !== 'admin') {
        const nav = document.querySelector('nav.nav.sidebar-nav');
        if (!nav) return;

        // Các link cần ẩn
        const linksToHide = [
            'a[href="/pages/archers.html"]',
            'a[href="/pages/equipments.html"]',
            'a[href="/pages/settings.html"]',
            'a[href="/pages/statistics.html"]'
        ];

        linksToHide.forEach(selector => {
            const link = nav.querySelector(selector);
            if (link) {
                link.style.display = 'none';
            }
        });
    }
}

function setActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Sửa logic: index.html là trang dashboard
    const pageName = (currentPage === '' || currentPage === '/') 
        ? '/pages/dashboard.html' // Trang dashboard là index.html
        : currentPage;

    const navLinks = document.querySelectorAll('nav.nav a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        
        if (linkHref === pageName) {
            link.classList.add('active');
        }
    });
}

// === HÀM ĐĂNG XUẤT ===
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("archery_auth_user");
        localStorage.removeItem("archery_demo_data_v1"); // Xóa cả data demo
        window.location.href = '/index.html';
    }
}