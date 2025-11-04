// js/main.js

// Tải các module (file JS) của từng trang.
// Việc này sẽ tự động chạy code khởi tạo bên trong mỗi file.
import { renderArchers } from 'views/archers/archers.js';
import { renderEquipment } from 'views/equipments/equipments.js';

// --- QUẢN LÝ ĐIỀU HƯỚNG (NAVIGATION) ---

const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const viewName = link.getAttribute('data-view'); // e.g., "archers"
        
        // 1. Cập nhật link "active"
        navLinks.forEach(nav => nav.classList.remove('active'));
        link.classList.add('active');
        
        // 2. Ẩn/Hiện view
        views.forEach(view => {
            // ID của view là "archers-view", "equipment-view", etc.
            if (view.id === `${viewName}-view`) {
                view.style.display = 'block';
            } else {
                view.style.display = 'none';
            }
        });

        // 3. (Quan trọng) Render lại dữ liệu mỗi khi chuyển trang
        //    để đảm bảo dữ liệu luôn mới nhất
        if (viewName === 'archers') {
            renderArchers();
        } else if (viewName === 'equipment') {
            renderEquipment();
        }
    });
});

// Khởi tạo: Đảm bảo trang archers được hiển thị mặc định
// (Vì code trong archers.js và equipment.js đã tự chạy 1 lần,
// chúng ta chỉ cần đảm bảo đúng view được hiển thị)
document.getElementById('archers-view').style.display = 'block';
document.getElementById('equipment-view').style.display = 'none';