/*
  layout.js
  - Tải header và navigation dùng chung
  - Tự động đặt lớp 'active' cho liên kết điều hướng hiện tại
*/

document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
});

function loadHeader() {
    // Sử dụng fetch để lấy nội dung của _header.html
    fetch('header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(html => {
            // Chèn HTML vào placeholder
            const placeholder = document.getElementById('header-placeholder');
            if (placeholder) {
                placeholder.innerHTML = html;
            }
            
            // Sau khi chèn xong, gọi hàm để đặt link active
            setActiveNavigation();
        })
        .catch(error => {
            console.error('Error fetching header:', error);
            const placeholder = document.getElementById('header-placeholder');
            if (placeholder) {
                placeholder.innerHTML = '<p style="color:red;">Error loading header content.</p>';
            }
        });
}

function setActiveNavigation() {
    // Lấy tên tệp của trang hiện tại (ví dụ: "archers.html")
    const currentPage = window.location.pathname.split('/').pop();

    // CẬP NHẬT DÒNG NÀY: 'index.html' (trang landing mới) không có trong nav
    // Trang chủ của dashboard giờ là 'dashboard.html'
    const pageName = (currentPage === '' || currentPage === '/' || currentPage === 'index.html') 
        ? 'dashboard.html' // Mặc định là dashboard nếu không khớp
        : currentPage;
    
    // Xử lý trường hợp đặc biệt nếu người dùng truy cập 'index.html' (trang landing)
    // thì không active link nào, nhưng nếu họ ở trang dashboard.html thì phải active
    const effectivePageName = (currentPage === 'index.html') ? '' : pageName;

    // Lấy tất cả các liên kết trong <nav class="nav">
    const navLinks = document.querySelectorAll('nav.nav a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        
        // So sánh href của liên kết với tên trang hiện tại
        if (linkHref === effectivePageName) {
            link.classList.add('active');
        }
    });
}