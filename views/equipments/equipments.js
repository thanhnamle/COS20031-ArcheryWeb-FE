// views/equipment/equipment.js
import { getArchers, getEquipment, addEquipment, deleteEquipment } from 'javascript/data.js';

// Hàm render
function renderEquipment(container) {
    const archers = getArchers();
    const equipment = getEquipment();
    const equipmentListContainer = container.querySelector('#equipment-list-container');
    
    equipmentListContainer.innerHTML = ''; // Xóa sạch

    if (archers.length === 0) {
        equipmentListContainer.innerHTML = '<p>Please add an archer first.</p>';
        return;
    }

    archers.forEach(archer => {
        const archerEquipment = equipment.filter(e => e.archerId === archer.id);
        let cardHTML = `
            <div class="equipment-card">
                <div class="equipment-card-header"><h3>${archer.name}</h3></div>
        `;
        
        if (archerEquipment.length === 0) {
            cardHTML += `<div class="equipment-item"><p>No equipment added.</p></div>`;
        } else {
            archerEquipment.forEach(item => {
                cardHTML += `
                    <div class="equipment-item">
                        <div class="equipment-details">
                            <h4>${item.name}</h4>
                            <p class="model">${item.model}</p>
                            <p>${item.description}</p>
                        </div>
                        <div class="equipment-actions">
                            <button class="btn btn-secondary btn-sm" data-id="${item.id}">Edit</button>
                            <button class="btn btn-danger btn-sm delete-equipment-btn" data-id="${item.id}">Delete</button>
                        </div>
                    </div>
                `;
            });
        }
        cardHTML += `</div>`;
        equipmentListContainer.innerHTML += cardHTML;
    });
}

// Hàm điền select
function populateArcherSelect(selectElement) {
    const archers = getArchers();
    selectElement.innerHTML = '<option value="">-- Select an Archer --</option>';
    archers.forEach(archer => {
        const option = document.createElement('option');
        option.value = archer.id;
        option.textContent = archer.name;
        selectElement.appendChild(option);
    });
}

// Hàm khởi tạo
export default function init(container) {
    const equipmentModal = container.querySelector('#add-equipment-modal');
    const addEquipmentBtn = container.querySelector('#add-equipment-btn');
    const closeEquipmentModalBtn = container.querySelector('#close-equipment-modal');
    const addEquipmentForm = container.querySelector('#add-equipment-form');
    const equipmentListContainer = container.querySelector('#equipment-list-container');
    const equipmentArcherSelect = container.querySelector('#equipment-archer');

    // Mở/Đóng Modal
    addEquipmentBtn.onclick = () => {
        populateArcherSelect(equipmentArcherSelect);
        equipmentModal.style.display = 'block';
    }
    closeEquipmentModalBtn.onclick = () => equipmentModal.style.display = 'none';

    // Submit Form
    addEquipmentForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newEquipment = {
            id: Date.now(),
            archerId: parseInt(equipmentArcherSelect.value),
            name: container.querySelector('#equipment-name').value,
            model: container.querySelector('#equipment-model').value,
            description: container.querySelector('#equipment-description').value,
        };
        addEquipment(newEquipment);
        renderEquipment(container); // Render lại
        equipmentModal.style.display = 'none';
        addEquipmentForm.reset();
    });

    // Xóa Equipment
    equipmentListContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-equipment-btn')) {
            const id = parseInt(event.target.dataset.id);
            if (confirm('Are you sure...?')) {
                deleteEquipment(id);
                renderEquipment(container); // Render lại
            }
        }
    });

    // Đóng modal
    window.addEventListener('click', (event) => {
        if (event.target == equipmentModal) {
            equipmentModal.style.display = 'none';
        }
    });

    // Render lần đầu
    renderEquipment(container);
}