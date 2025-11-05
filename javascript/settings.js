/*
  Archery Dashboard - Settings Page
  - Uses shared localStorage key "archery_demo_data_v1"
  - Manages "Rounds" and "EquipmentTypes"
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

  // Initialize equipmentTypes array if it doesn't exist
  if (!data.equipmentTypes || !Array.isArray(data.equipmentTypes)) {
    data.equipmentTypes = [
      { id: "et1", name: "Recurve" },
      { id: "et2", name: "Compound" }
    ];
    // Ghi chú: Không lưu ngay lập tức, chỉ khởi tạo để render
  }
  
  return data;
}

function saveData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// --- Render Functions ---

function renderEquipmentTypesTable(){
  const data = loadData();
  const tbody = document.getElementById('equipmentTypesTableBody');
  if(!tbody || !data || !data.equipmentTypes) return;

  tbody.innerHTML = ''; // Clear table
  
  data.equipmentTypes.sort((a,b) => a.name.localeCompare(b.name));
  
  if(data.equipmentTypes.length === 0){
    tbody.innerHTML = '<tr><td colspan="2" class="text-center muted">No equipment types defined.</td></tr>';
    return;
  }

  data.equipmentTypes.forEach(type => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${type.name}</strong></td>
      <td class="text-center">
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="editEquipmentType('${type.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteEquipmentType('${type.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderRoundsTable(){
  const data = loadData();
  const tbody = document.getElementById('roundsTableBody');
  if(!tbody || !data || !data.rounds) return;

  tbody.innerHTML = ''; // Clear table
  
  data.rounds.sort((a,b) => a.name.localeCompare(b.name));

  if(data.rounds.length === 0){
    tbody.innerHTML = '<tr><td colspan="3" class="text-center muted">No rounds defined.</td></tr>';
    return;
  }
  
  data.rounds.forEach(round => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${round.name}</strong></td>
      <td>${round.description || ''}</td>
      <td class="text-center">
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="editRound('${round.id}')" title="Edit">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteRound('${round.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// --- Equipment Type Modal ---

function showEquipmentTypeModal(){
  const modal = document.getElementById('equipmentTypeModal');
  const form = document.getElementById('equipmentTypeForm');
  if(!modal || !form) return;
  
  form.reset();
  document.getElementById('equipmentTypeId').value = '';
  clearFormErrors('equipmentTypeForm');
  
  document.getElementById('equipmentTypeModalTitle').textContent = 'Add Equipment Type';
  document.getElementById('equipmentTypeSaveButtonText').textContent = 'Add Type';
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('equipmentTypeName').focus(), 100);
}

function editEquipmentType(id){
  const data = loadData();
  const type = data.equipmentTypes.find(t => t.id === id);
  if(!type) return;

  showEquipmentTypeModal(); // Mở modal trước

  document.getElementById('equipmentTypeId').value = type.id;
  document.getElementById('equipmentTypeName').value = type.name;
  
  document.getElementById('equipmentTypeModalTitle').textContent = 'Edit Equipment Type';
  document.getElementById('equipmentTypeSaveButtonText').textContent = 'Update Type';
}

function saveEquipmentType(event){
  event.preventDefault();
  const data = loadData();
  
  const id = document.getElementById('equipmentTypeId').value;
  const name = document.getElementById('equipmentTypeName').value.trim();

  if(!name){
    document.getElementById('equipmentTypeNameError').textContent = "Name is required";
    return;
  }
  
  if(id){
    // Update
    const index = data.equipmentTypes.findIndex(t => t.id === id);
    if(index !== -1){
      data.equipmentTypes[index].name = name;
      showToast("Equipment type updated!", "success");
    }
  } else {
    // Create
    const newType = {
      id: `et${Date.now()}`,
      name: name
    };
    data.equipmentTypes.push(newType);
    showToast("Equipment type added!", "success");
  }

  saveData(data);
  closeModal('equipmentTypeModal');
  refreshAll();
}

function deleteEquipmentType(id){
  if(!confirm("Delete this equipment type?\nThis action cannot be undone.")) return;

  const data = loadData();
  data.equipmentTypes = data.equipmentTypes.filter(t => t.id !== id);
  
  saveData(data);
  showToast("Equipment type deleted", "info");
  refreshAll();
}

// --- Round Modal ---

function showRoundModal(){
  const modal = document.getElementById('roundModal');
  const form = document.getElementById('roundForm');
  if(!modal || !form) return;
  
  form.reset();
  document.getElementById('roundId').value = '';
  clearFormErrors('roundForm');
  
  document.getElementById('roundModalTitle').textContent = 'Add Round';
  document.getElementById('roundSaveButtonText').textContent = 'Add Round';
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('roundName').focus(), 100);
}

function editRound(id){
  const data = loadData();
  const round = data.rounds.find(r => r.id === id);
  if(!round) return;

  showRoundModal(); // Mở modal trước

  document.getElementById('roundId').value = round.id;
  document.getElementById('roundName').value = round.name;
  document.getElementById('roundDescription').value = round.description || '';
  
  document.getElementById('roundModalTitle').textContent = 'Edit Round';
  document.getElementById('roundSaveButtonText').textContent = 'Update Round';
}

function saveRound(event){
  event.preventDefault();
  const data = loadData();
  
  const id = document.getElementById('roundId').value;
  const name = document.getElementById('roundName').value.trim();
  const description = document.getElementById('roundDescription').value.trim();

  if(!name){
    document.getElementById('roundNameError').textContent = "Name is required";
    return;
  }
  
  if(id){
    // Update
    const index = data.rounds.findIndex(r => r.id === id);
    if(index !== -1){
      data.rounds[index].name = name;
      data.rounds[index].description = description;
      showToast("Round updated!", "success");
    }
  } else {
    // Create
    const newRound = {
      id: `r${Date.now()}`,
      name: name,
      description: description,
      // Thêm các giá trị mặc định nếu cần
      distances:[],
      endsPerDistance:0,
      arrowsPerEnd:0
    };
    data.rounds.push(newRound);
    showToast("Round added!", "success");
  }

  saveData(data);
  closeModal('roundModal');
  refreshAll();
}

function deleteRound(id){
  if(!confirm("Delete this round?\nScores using this round will not be affected but may show 'Unknown Round'.")) return;

  const data = loadData();
  data.rounds = data.rounds.filter(r => r.id !== id);
  
  saveData(data);
  showToast("Round deleted", "info");
  refreshAll();
}


// --- Modal & Toast Helpers ---

function closeModal(modalId){
  const modal = document.getElementById(modalId);
  if(!modal) return;
  
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  clearFormErrors(`${modalId.replace('Modal','')}Form`);
}

function clearFormErrors(formId){
    const form = document.getElementById(formId);
    if(!form) return;
    
    const errors = form.querySelectorAll('.form-error');
    errors.forEach(error => error.textContent = '');
    
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => input.classList.remove('invalid'));
}

function showToast(message, type = "info"){
  const toast = document.getElementById('toast');
  if(!toast) { alert(message); return; }
  
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 3000);
}

function refreshAll(){
  renderEquipmentTypesTable();
  renderRoundsTable();
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  refreshAll();
  
  // Form submits
  const eqForm = document.getElementById('equipmentTypeForm');
  if(eqForm) eqForm.addEventListener('submit', saveEquipmentType);
  
  const roundForm = document.getElementById('roundForm');
  if(roundForm) roundForm.addEventListener('submit', saveRound);

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      if(document.getElementById('equipmentTypeModal').style.display === 'flex') {
        closeModal('equipmentTypeModal');
      }
      if(document.getElementById('roundModal').style.display === 'flex') {
        closeModal('roundModal');
      }
    }
  });
});

// Save data on page unload
window.addEventListener("beforeunload", () => {
  const data = loadData();
  if(data) saveData(data);
});