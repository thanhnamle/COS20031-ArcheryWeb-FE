// js/data.js

// --- DỮ LIỆU ---

// Tải dữ liệu từ localStorage hoặc dùng mảng mẫu
let archers = JSON.parse(localStorage.getItem('archers')) || [
    { id: 1, name: 'Emma Thompson', dob: '1995-06-15', gender: 'Female', equipment: 'Recurve', contact: 'emma.thompson@email.com' },
    { id: 2, name: 'James Wilson', dob: '1988-03-22', gender: 'Male', equipment: 'Compound', contact: 'james.wilson@email.com' },
    { id: 3, name: 'Sarah Martinez', dob: '2002-11-08', gender: 'Female', equipment: 'Barebow', contact: 'sarah.martinez@email.com' }
];

let equipment = JSON.parse(localStorage.getItem('equipment')) || [
    { id: 101, archerId: 1, name: 'Recurve', model: 'Hoyt Formula Xi', description: 'Competition bow' },
    { id: 102, archerId: 2, name: 'Compound', model: 'Mathews V3', description: 'Tournament setup' },
    { id: 103, archerId: 3, name: 'Barebow', model: 'Cartel Fantom', description: 'Training bow' }
];

// --- HÀM LƯU TRỮ (STORAGE) ---
function saveArchers() {
    localStorage.setItem('archers', JSON.stringify(archers));
}

function saveEquipment() {
    localStorage.setItem('equipment', JSON.stringify(equipment));
}

// --- HÀM TRUY CẬP DỮ LIỆU (GETTERS/SETTERS) ---

// Các file khác sẽ dùng các hàm này để lấy hoặc thay đổi dữ liệu
export function getArchers() {
    return archers;
}

export function getEquipment() {
    return equipment;
}

export function addArcher(archer) {
    archers.push(archer);
    saveArchers();
}

export function addEquipment(item) {
    equipment.push(item);
    saveEquipment();
}

export function deleteArcher(archerId) {
    archers = archers.filter(a => a.id !== archerId);
    saveArchers();
    // Khi xóa archer, cũng xóa luôn equipment của họ
    equipment = equipment.filter(e => e.archerId !== archerId);
    saveEquipment();
}

export function deleteEquipment(equipmentId) {
    equipment = equipment.filter(e => e.id !== equipmentId);
    saveEquipment();
}