/*
  Archery Dashboard - Equipment Management Page
  - Uses shared localStorage key "archery_demo_data_v1"
  - Manages "equipment" (individual items)
  - Reads "archers" and "equipmentTypes" for dropdowns
*/

const STORAGE_KEY = "archery_demo_data_v1";

// Load data from localStorage
function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return null;
  
  let data;
  try { 
    data = JSON.parse(raw); 
  } catch(e) { 
    console.error("Error parsing data:", e);
    return null; 
  }

  // Initialize equipment array if it doesn't exist
  if (!data.equipment || !Array.isArray(data.equipment)) {
    data.equipment = [];
  }
  
  // Ensure equipmentTypes exists (from settings page)
  if (!data.equipmentTypes || !Array.isArray(data.equipmentTypes)) {
     data.equipmentTypes = [
      { id: "et1", name: "Recurve" },
      { id: "et2", name: "Compound" }
    ];
  }
  
  return data;
}

function saveData(data){ 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); 
}

// --- Render Functions ---

function renderStats(){
  const data = loadData();
  if(!data || !data.equipment) return;
  
  const totalCount = data.equipment.length;
  const assignedCount = data.equipment.filter(e => e.archerId).length;
  const unassignedCount = totalCount - assignedCount;

  document.getElementById('totalItems').textContent = totalCount;
  document.getElementById('assignedItems').textContent = assignedCount;
  document.getElementById('unassignedItems').textContent = unassignedCount;
}

function renderEquipmentTable(filters = {}){
  const data = loadData();
  if(!data) return;
  
  const tbody = document.getElementById('equipmentTableBody');
  const emptyState = document.getElementById('emptyState');
  
  if(!tbody) return;
  
  let equipmentList = data.equipment.slice();
  
  // Apply type filter
  if(filters.type){
    equipmentList = equipmentList.filter(e => e.equipmentTypeId === filters.type);
  }
  
  // Apply archer filter
  if(filters.archer){
     if(filters.archer === 'unassigned') {
        equipmentList = equipmentList.filter(e => !e.archerId);
     } else {
        equipmentList = equipmentList.filter(e => e.archerId === filters.archer);
     }
  }
  
  // Apply search filter
  if(filters.search){
    const searchLower = filters.search.toLowerCase();
    equipmentList = equipmentList.filter(e => {
      const nameMatch = e.name.toLowerCase().includes(searchLower);
      const notesMatch = (e.notes || '').toLowerCase().includes(searchLower);
      return nameMatch || notesMatch;
    });
  }
  
  // Sort by name
  equipmentList.sort((a, b) => a.name.localeCompare(b.name));
  
  // Clear table
  tbody.innerHTML = '';
  
  // Show/hide empty state
  if(equipmentList.length === 0){
    if(emptyState) emptyState.style.display = 'block';
    tbody.closest('table').style.display = 'none';
    return;
  } else {
    if(emptyState) emptyState.style.display = 'none';
    tbody.closest('table').style.display = 'table';
  }
  
  // Render rows
  equipmentList.forEach(item => {
    const archer = data.archers.find(a => a.id === item.archerId);
    const type = data.equipmentTypes.find(t => t.id === item.equipmentTypeId);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td>
         <span class="type-badge">${type ? type.name : 'Unknown'}</span>
      </td>
      <td>
        ${archer ? `
          <div class="archer-name">
            <div class="avatar-small">${archer.first[0]}${archer.last[0]}</div>
            ${archer.first} ${archer.last}
          </div>
        ` : '<span class="muted">Unassigned</span>'}
      </td>
      <td class="notes-cell">${item.notes || ''}</td>
      <td class="text-center">
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="editEquipment('${item.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteEquipment('${item.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function populateFilters(){
  const data = loadData();
  const typeFilter = document.getElementById('typeFilter');
  const archerFilter = document.getElementById('archerFilter');
  
  if(typeFilter && data.equipmentTypes){
    typeFilter.innerHTML = '<option value="">All Types</option>'; // Reset
    data.equipmentTypes.sort((a,b) => a.name.localeCompare(b.name)).forEach(type => {
      typeFilter.innerHTML += `<option value="${type.id}">${type.name}</option>`;
    });
  }
  
  if(archerFilter && data.archers){
    archerFilter.innerHTML = '<option value="">All Archers</option><option value="unassigned">Unassigned</option>'; // Reset
    data.archers.sort((a,b) => a.first.localeCompare(b.first)).forEach(archer => {
      archerFilter.innerHTML += `<option value="${archer.id}">${archer.first} ${archer.last}</option>`;
    });
  }
}

// --- Modal Functions ---

function showEquipmentModal(){
  const modal = document.getElementById('equipmentModal');
  const form = document.getElementById('equipmentForm');
  if(!modal || !form) return;
  
  form.reset();
  document.getElementById('equipmentId').value = '';
  clearFormErrors();
  
  document.getElementById('modalTitle').textContent = 'Add New Equipment';
  document.getElementById('saveButtonText').textContent = 'Add Equipment';
  
  // Populate dropdowns
  const data = loadData();
  const archerSelect = document.getElementById('archerId');
  const typeSelect = document.getElementById('equipmentTypeId');
  
  archerSelect.innerHTML = '<option value="">None (Unassigned)</option>';
  data.archers.sort((a,b) => a.first.localeCompare(b.first)).forEach(a => {
    archerSelect.innerHTML += `<option value="${a.id}">${a.first} ${a.last}</option>`;
  });
  
  typeSelect.innerHTML = '<option value="">Select type...</option>';
  data.equipmentTypes.sort((a,b) => a.name.localeCompare(b.name)).forEach(t => {
    typeSelect.innerHTML += `<option value="${t.id}">${t.name}</option>`;
  });

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('equipmentName').focus(), 100);
}

function closeEquipmentModal(){
  const modal = document.getElementById('equipmentModal');
  if(!modal) return;
  
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  clearFormErrors();
}

function clearFormErrors(){
  const errors = document.querySelectorAll('.form-error');
  errors.forEach(error => error.textContent = '');
  
  const inputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
  inputs.forEach(input => input.classList.remove('invalid'));
}

function validateEquipmentForm(formData){
  const errors = {};
  if(!formData.name || formData.name.trim().length < 2){
    errors.equipmentName = "Name must be at least 2 characters";
  }
  if(!formData.equipmentTypeId){
    errors.equipmentTypeId = "Please select an equipment type";
  }
  return errors;
}

function displayFormErrors(errors){
  clearFormErrors();
  Object.keys(errors).forEach(field => {
    const errorElement = document.getElementById(`${field}Error`);
    const inputElement = document.getElementById(field);
    
    if(errorElement) errorElement.textContent = errors[field];
    if(inputElement) inputElement.classList.add('invalid');
  });
}

function saveEquipment(event){
  event.preventDefault();
  
  const formData = {
    id: document.getElementById('equipmentId').value,
    name: document.getElementById('equipmentName').value.trim(),
    equipmentTypeId: document.getElementById('equipmentTypeId').value,
    archerId: document.getElementById('archerId').value || null, // Lưu null nếu không chọn
    notes: document.getElementById('notes').value.trim()
  };
  
  const errors = validateEquipmentForm(formData);
  if(Object.keys(errors).length > 0){
    displayFormErrors(errors);
    return;
  }
  
  const data = loadData();
  
  if(formData.id){
    // Update
    const index = data.equipment.findIndex(e => e.id === formData.id);
    if(index !== -1){
      data.equipment[index] = formData;
      showToast("Equipment updated!", "success");
    }
  } else {
    // Create
    const newItem = {
      ...formData,
      id: `eq${Date.now()}`
    };
    data.equipment.push(newItem);
    showToast("Equipment added!", "success");
  }

  saveData(data);
  closeEquipmentModal();
  refreshAll();
}

function editEquipment(id){
  const data = loadData();
  const item = data.equipment.find(e => e.id === id);
  if(!item) return;

  showEquipmentModal(); // Mở modal và điền dropdowns

  document.getElementById('equipmentId').value = item.id;
  document.getElementById('equipmentName').value = item.name;
  document.getElementById('equipmentTypeId').value = item.equipmentTypeId;
  document.getElementById('archerId').value = item.archerId || '';
  document.getElementById('notes').value = item.notes || '';
  
  document.getElementById('modalTitle').textContent = 'Edit Equipment';
  document.getElementById('saveButtonText').textContent = 'Update Equipment';
}

function deleteEquipment(id){
  if(!confirm("Delete this equipment item?\nThis action cannot be undone.")) return;

  const data = loadData();
  data.equipment = data.equipment.filter(e => e.id !== id);
  
  saveData(data);
  showToast("Equipment deleted", "info");
  refreshAll();
}

// --- Toast ---
function showToast(message, type = "info"){
  const toast = document.getElementById('toast');
  if(!toast) { alert(message); return; }
  
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.style.display = 'block';
  
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 3000);
}

// --- Init ---

function refreshAll(){
  const filters = {
    search: document.getElementById('searchInput')?.value || '',
    type: document.getElementById('typeFilter')?.value || '',
    archer: document.getElementById('archerFilter')?.value || ''
  };
  renderStats();
  renderEquipmentTable(filters);
}

document.addEventListener("DOMContentLoaded", () => {
  populateFilters();
  refreshAll();
  
  // Event Listeners
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const archerFilter = document.getElementById('archerFilter');
  
  [searchInput, typeFilter, archerFilter].forEach(el => {
    if(el) el.addEventListener('input', refreshAll);
  });
  
  // Form submit
  const equipmentForm = document.getElementById('equipmentForm');
  if(equipmentForm) equipmentForm.addEventListener('submit', saveEquipment);
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      const modal = document.getElementById('equipmentModal');
      if(modal && modal.style.display === 'flex'){
        closeEquipmentModal();
      }
    }
  });
});

// Save data on page unload
window.addEventListener("beforeunload", () => {
  const data = loadData();
  if(data) saveData(data);
});