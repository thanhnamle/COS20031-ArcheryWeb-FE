// views/archers/archers.js
import { getArchers, addArcher, deleteArcher } from 'javascript/data.js';

// Hàm render chính, giờ đây nó cũng là một hàm riêng
function renderArchers(tableBody, searchInput) {
    const archerList = getArchers();
    const searchTerm = searchInput.value.toLowerCase();
    
    const filteredArchers = archerList.filter(archer => 
        archer.name.toLowerCase().includes(searchTerm) ||
        archer.contact.toLowerCase().includes(searchTerm)
    );

    tableBody.innerHTML = ''; // Xóa nội dung cũ
    
    if (filteredArchers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No archers found.</td></tr>';
        return;
    }

    filteredArchers.forEach(archer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${archer.name}</td>
            <td>${archer.dob}</td>
            <td>${archer.gender}</td>
            <td>${archer.equipment}</td>
            <td>${archer.contact}</td>
            <td>
                <button class="btn btn-secondary btn-sm" data-id="${archer.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-archer-btn" data-id="${archer.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Hàm khởi tạo của module
export default function init(container) {
    // Phải querySelector từ 'container' (chính là #app-container)
    const archerModal = container.querySelector('#add-archer-modal');
    const addArcherBtn = container.querySelector('#add-archer-btn');
    const closeArcherModalBtn = container.querySelector('#close-archer-modal');
    const addArcherForm = container.querySelector('#add-archer-form');
    const archerTableBody = container.querySelector('#archer-table-body');
    const searchInput = container.querySelector('#archer-search-input');

    // Mở/Đóng Modal
    addArcherBtn.onclick = () => archerModal.style.display = 'block';
    closeArcherModalBtn.onclick = () => archerModal.style.display = 'none';

    // Submit Form
    addArcherForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newArcher = {
            id: Date.now(),
            name: container.querySelector('#name').value,
            dob: container.querySelector('#dob').value,
            gender: container.querySelector('#gender').value,
            equipment: container.querySelector('#equipment').value,
            contact: container.querySelector('#contact').value,
        };
        addArcher(newArcher);
        renderArchers(archerTableBody, searchInput); // Render lại
        archerModal.style.display = 'none';
        addArcherForm.reset();
    });

    // Xóa Archer
    archerTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-archer-btn')) {
            const id = parseInt(event.target.dataset.id);
            if (confirm('Are you sure...?')) {
                deleteArcher(id);
                renderArchers(archerTableBody, searchInput); // Render lại
            }
        }
    });

    // Tìm kiếm
    searchInput.addEventListener('input', () => renderArchers(archerTableBody, searchInput));

    // Đóng modal khi nhấn bên ngoài
    window.addEventListener('click', (event) => {
        if (event.target == archerModal) {
            archerModal.style.display = 'none';
        }
    });

    // Render lần đầu khi tải view
    renderArchers(archerTableBody, searchInput);
}