/*
  Archery Dashboard - Matches & Scores Page
  - Uses shared localStorage key "archery_demo_data_v1"
  - Manages score CRUD operations
  - Displays score list with stats and filters
*/

const STORAGE_KEY = "archery_demo_data_v1";

// Load data from localStorage
function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return null;
  try { 
    return JSON.parse(raw); 
  } catch(e) { 
    console.error("Error parsing data:", e);
    return null; 
  }
}

function saveData(data){ 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); 
}

// --- Render Functions ---

function renderStats(){
  const data = loadData();
  if(!data || !data.scores) return;
  
  const totalCount = data.scores.length;
  const approvedCount = data.scores.filter(s => s.isApproved).length;
  const totalX = data.scores.reduce((sum, s) => sum + (s.xCount || 0), 0);
  
  let avgScore = 0;
  if(totalCount > 0){
    avgScore = Math.round(data.scores.reduce((sum, s) => sum + s.total, 0) / totalCount);
  }
  
  document.getElementById('totalScores').textContent = totalCount;
  document.getElementById('approvedScores').textContent = approvedCount;
  document.getElementById('avgScore').textContent = avgScore;
  document.getElementById('totalXs').textContent = totalX;
}

function renderScoresTable(filters = {}){
  const data = loadData();
  if(!data || !data.scores) return;
  
  const tbody = document.getElementById('scoresTableBody');
  const emptyState = document.getElementById('emptyState');
  
  if(!tbody) return;
  
  let scores = data.scores.slice();
  
  // Apply status filter
  if(filters.status){
    const isApproved = filters.status === 'approved';
    scores = scores.filter(s => s.isApproved === isApproved);
  }
  
  // Apply round filter
  if(filters.round){
    scores = scores.filter(s => s.roundId === filters.round);
  }
  
  // Apply search filter (by archer name)
  if(filters.search){
    const searchLower = filters.search.toLowerCase();
    scores = scores.filter(s => {
      const archer = data.archers.find(a => a.id === s.archerId);
      if(!archer) return false;
      const fullName = `${archer.first} ${archer.last}`.toLowerCase();
      return fullName.includes(searchLower);
    });
  }
  
  // Sort by date (newest first)
  scores.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  
  // Clear table
  tbody.innerHTML = '';
  
  // Show/hide empty state
  if(scores.length === 0){
    if(emptyState) emptyState.style.display = 'block';
    tbody.closest('table').style.display = 'none';
    return;
  } else {
    if(emptyState) emptyState.style.display = 'none';
    tbody.closest('table').style.display = 'table';
  }
  
  // Render rows
  scores.forEach(score => {
    const archer = data.archers.find(a => a.id === score.archerId) || {first:"Unknown", last:""};
    const competition = data.competitions.find(c => c.id === score.competitionId);
    const dateFormatted = new Date(score.recordedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="archer-name">
          <div class="avatar-small">${archer.first[0] || '?'}${archer.last[0] || ''}</div>
          <strong>${archer.first} ${archer.last}</strong>
        </div>
      </td>
      <td>${score.roundSnapshot || 'N/A'}</td>
      <td class="text-center score-total">${score.total}</td>
      <td class="text-center">${score.xCount}X</td>
      <td class="text-center">
        <span class="status-badge ${score.isApproved ? 'status-approved' : 'status-staged'}">
          ${score.isApproved ? 'Approved' : 'Staged'}
        </span>
      </td>
      <td>${dateFormatted}</td>
      <td>${competition ? competition.name : 'Practice'}</td>
      <td class="text-center">
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="editScore('${score.id}')" title="Edit">
            ✏️
          </button>
          <button class="btn-icon btn-delete" onclick="deleteScore('${score.id}')" title="Delete">
            🗑️
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function populateFilters(){
  const data = loadData();
  const roundFilter = document.getElementById('roundFilter');
  if(!data || !data.rounds || !roundFilter) return;

  roundFilter.innerHTML = '<option value="">All Rounds</option>'; // Reset
  data.rounds.forEach(round => {
    const option = document.createElement('option');
    option.value = round.id;
    option.textContent = round.name;
    roundFilter.appendChild(option);
  });
}

// --- Modal Functions ---

function showAddScoreModal(){
  const modal = document.getElementById('scoreModal');
  const form = document.getElementById('scoreForm');
  
  if(!modal || !form) return;
  
  // Reset form
  form.reset();
  document.getElementById('scoreId').value = '';
  clearFormErrors();
  
  // Update modal title
  document.getElementById('modalTitle').textContent = 'Add New Score';
  document.getElementById('saveButtonText').textContent = 'Add Score';
  
  // Populate dropdowns
  const data = loadData();
  const archerSelect = document.getElementById('archerId');
  const roundSelect = document.getElementById('roundId');
  const compSelect = document.getElementById('competitionId');
  
  archerSelect.innerHTML = '<option value="">Select archer...</option>';
  data.archers.sort((a,b) => a.first.localeCompare(b.first)).forEach(a => {
    archerSelect.innerHTML += `<option value="${a.id}">${a.first} ${a.last}</option>`;
  });
  
  roundSelect.innerHTML = '<option value="">Select round...</option>';
  data.rounds.forEach(r => {
    roundSelect.innerHTML += `<option value="${r.id}">${r.name}</option>`;
  });
  
  compSelect.innerHTML = '<option value="">None (Practice)</option>';
  data.competitions.forEach(c => {
    compSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
  
  // Set default date
  document.getElementById('recordedAt').value = new Date().toISOString().slice(0, 16);

  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  setTimeout(() => archerSelect.focus(), 100);
}

function closeScoreModal(){
  const modal = document.getElementById('scoreModal');
  if(!modal) return;
  
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  clearFormErrors();
}

function clearFormErrors(){
  const errors = document.querySelectorAll('.form-error');
  errors.forEach(error => error.textContent = '');
  
  const inputs = document.querySelectorAll('.form-group input, .form-group select');
  inputs.forEach(input => input.classList.remove('invalid'));
}

function validateScoreForm(formData){
  const errors = {};
  
  if(!formData.archerId) errors.archerId = "Please select an archer";
  if(!formData.roundId) errors.roundId = "Please select a round";
  if(formData.total === '' || isNaN(formData.total) || formData.total < 0) errors.total = "Invalid total score";
  if(formData.xCount === '' || isNaN(formData.xCount) || formData.xCount < 0) errors.xCount = "Invalid X count";
  if(!formData.recordedAt) errors.recordedAt = "Please set a date";
  
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

function saveScore(event){
  event.preventDefault();
  
  const data = loadData();
  if(!data) return;

  // Get form data
  const formData = {
    id: document.getElementById('scoreId').value,
    archerId: document.getElementById('archerId').value,
    roundId: document.getElementById('roundId').value,
    competitionId: document.getElementById('competitionId').value || null,
    total: parseInt(document.getElementById('total').value, 10),
    xCount: parseInt(document.getElementById('xCount').value, 10),
    recordedAt: document.getElementById('recordedAt').value,
    isApproved: document.getElementById('isApproved').checked
  };
  
  // Validate
  const errors = validateScoreForm(formData);
  if(Object.keys(errors).length > 0){
    displayFormErrors(errors);
    return;
  }
  
  // Get snapshots
  const round = data.rounds.find(r => r.id === formData.roundId);
  const archer = data.archers.find(a => a.id === formData.archerId);

  const scoreData = {
      ...formData,
      roundSnapshot: round ? round.name : 'Unknown Round',
      // These fields are from the original seed data, let's add defaults
      categorySnapshot: "Senior", // Default
      equipmentSnapshot: "Recurve", // Default
      ends: [] // We don't have the ends builder here, so save an empty array
  };

  if(formData.id){
    // Update
    const index = data.scores.findIndex(s => s.id === formData.id);
    if(index !== -1){
      data.scores[index] = { ...data.scores[index], ...scoreData };
      showToast("Score updated!", "success");
    }
  } else {
    // Create new
    const newScore = {
      ...scoreData,
      id: `s${Date.now()}`,
    };
    data.scores.push(newScore);
    showToast("New score added!", "success");
  }
  
  saveData(data);
  closeScoreModal();
  refreshAll();
}

function editScore(id){
  const data = loadData();
  const score = data.scores.find(s => s.id === id);
  
  if(!score){
    showToast("Score not found!", "error");
    return;
  }
  
  // Show modal and populate dropdowns first
  showAddScoreModal(); 
  
  // Fill form
  document.getElementById('scoreId').value = score.id;
  document.getElementById('archerId').value = score.archerId;
  document.getElementById('roundId').value = score.roundId;
  document.getElementById('competitionId').value = score.competitionId || '';
  document.getElementById('total').value = score.total;
  document.getElementById('xCount').value = score.xCount;
  document.getElementById('recordedAt').value = score.recordedAt.slice(0, 16);
  document.getElementById('isApproved').checked = score.isApproved;
  
  // Update modal title
  document.getElementById('modalTitle').textContent = 'Edit Score';
  document.getElementById('saveButtonText').textContent = 'Update Score';
}

function deleteScore(id){
  const data = loadData();
  const score = data.scores.find(s => s.id === id);
  
  if(!score) return;
  
  if(!confirm(`Delete score ${score.total} for ${score.roundSnapshot}?\n\nThis action cannot be undone.`)){
    return;
  }
  
  data.scores = data.scores.filter(s => s.id !== id);
  saveData(data);
  showToast(`Score deleted`, "info");
  refreshAll();
}

// --- Toast ---
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

// --- Init ---

function refreshAll(){
  const filters = {
    search: document.getElementById('searchInput')?.value || '',
    round: document.getElementById('roundFilter')?.value || '',
    status: document.getElementById('statusFilter')?.value || ''
  };
  renderStats();
  renderScoresTable(filters);
}

document.addEventListener("DOMContentLoaded", () => {
  populateFilters();
  refreshAll();
  
  // Event Listeners
  const searchInput = document.getElementById('searchInput');
  const roundFilter = document.getElementById('roundFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  [searchInput, roundFilter, statusFilter].forEach(el => {
    if(el) el.addEventListener('input', refreshAll);
  });
  
  // Form submit
  const scoreForm = document.getElementById('scoreForm');
  if(scoreForm) scoreForm.addEventListener('submit', saveScore);
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      const modal = document.getElementById('scoreModal');
      if(modal && modal.style.display === 'flex'){
        closeScoreModal();
      }
    }
  });
});

// Save data on page unload
window.addEventListener("beforeunload", () => {
  const data = loadData();
  if(data) saveData(data);
});