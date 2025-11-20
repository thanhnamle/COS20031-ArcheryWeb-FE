/*
  Archery Dashboard - Archers Management Page
  - Uses shared localStorage key "archery_demo_data_v1"
  - Manages archer CRUD operations
  - Displays archer list with stats and filters
*/

const STORAGE_KEY = "archery_demo_data_v1";

// ========== COUNTRY MAPPING (THÊM MỚI) ==========
const COUNTRY_NAMES = {
  'VN': 'Vietnam',
  'US': 'United States',
  'GB': 'United Kingdom',
  'AU': 'Australia',
  'CA': 'Canada',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'KR': 'South Korea',
  'CN': 'China',
  'IN': 'India',
  'TH': 'Thailand',
  'SG': 'Singapore',
  'MY': 'Malaysia',
  'ID': 'Indonesia',
  'PH': 'Philippines'
};

const COUNTRY_FLAGS = {
  'VN': '<i class="fi fi-vn"></i>',
  'US': '<i class="fi fi-us"></i>',
  'GB': '<i class="fi fi-gb"></i>',
  'AU': '<i class="fi fi-au"></i>',
  'CA': '<i class="fi fi-ca"></i>',
  'DE': '<i class="fi fi-de"></i>',
  'FR': '<i class="fi fi-fr"></i>',
  'JP': '<i class="fi fi-jp"></i>',
  'KR': '<i class="fi fi-kr"></i>',
  'CN': '<i class="fi fi-cn"></i>',
  'IN': '<i class="fi fi-in"></i>',
  'TH': '<i class="fi fi-th"></i>',
  'SG': '<i class="fi fi-sg"></i>',
  'MY': '<i class="fi fi-my"></i>',
  'ID': '<i class="fi fi-id"></i>',
  'PH': '<i class="fi fi-ph"></i>'
};

// Replace loadData() with this:
async function fetchArchers() {
    const res = await fetch('/api/archers.php');
    return await res.json();
}

// Replace saveArcher() logic with this:
async function saveArcher(event) {
    event.preventDefault();
    // ... get formData values ...

    await fetch('/api/archers.php', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
    
    // Refresh table...
}

//help function

function calculateAge(dob){
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if(monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())){
    age--;
  }
  
  return age;
}

function getArcherStats(archerId, data){
  const scores = data.scores.filter(s => s.archerId === archerId);
  
  if(scores.length === 0){
    return {
      totalScores: 0,
      bestScore: '-',
      avgScore: '-',
      totalXs: 0
    };
  }
  
  const totalScores = scores.length;
  const bestScore = Math.max(...scores.map(s => s.total));
  const avgScore = Math.round(scores.reduce((sum, s) => sum + s.total, 0) / totalScores);
  const totalXs = scores.reduce((sum, s) => sum + (s.xCount || 0), 0);
  
  return { totalScores, bestScore, avgScore, totalXs };
}

//render

function renderStats(){
  const data = loadData();
  if(!data || !data.archers) return;
  
  const totalCount = data.archers.length;
  const maleCount = data.archers.filter(a => a.gender === 'M').length;
  const femaleCount = data.archers.filter(a => a.gender === 'F').length;
  
  let avgAge = 0;
  if(totalCount > 0){
    const totalAge = data.archers.reduce((sum, a) => sum + calculateAge(a.dob), 0);
    avgAge = Math.round(totalAge / totalCount);
  }
  
  document.getElementById('totalArchers').textContent = totalCount;
  document.getElementById('maleCount').textContent = maleCount;
  document.getElementById('femaleCount').textContent = femaleCount;
  document.getElementById('avgAge').textContent = avgAge;
}

function renderArchersTable(filters = {}){
  const data = loadData();
  if(!data || !data.archers) return;
  
  const tbody = document.getElementById('archersTableBody');
  const emptyState = document.getElementById('emptyState');
  
  if(!tbody) return;
  
  let archers = data.archers.slice();
  
  // Apply gender filter
  if(filters.gender){
    archers = archers.filter(a => a.gender === filters.gender);
  }
  
  // Apply search filter
  if(filters.search){
    const searchLower = filters.search.toLowerCase();
    archers = archers.filter(a => {
      const fullName = `${a.first} ${a.last}`.toLowerCase();
      return fullName.includes(searchLower);
    });
  }
  
  // Sort by name
  archers.sort((a, b) => (a.first + a.last).localeCompare(b.first + b.last));
  
  // Clear table
  tbody.innerHTML = '';
  
  // Show/hide empty state
  if(archers.length === 0){
    if(emptyState) emptyState.style.display = 'block';
    tbody.closest('table').style.display = 'none';
    return;
  } else {
    if(emptyState) emptyState.style.display = 'none';
    tbody.closest('table').style.display = 'table';
  }
  
  // Render rows
  archers.forEach((archer, index) => {
    const stats = getArcherStats(archer.id, data);
    const age = calculateAge(archer.dob);
    const dobFormatted = new Date(archer.dob).toLocaleDateString('en-GB');
    
    // ===== THÊM COUNTRY INFO =====
    const countryCode = archer.country || 'VN';
    const countryFlag = COUNTRY_FLAGS[countryCode] || '🌍';
    const countryName = COUNTRY_NAMES[countryCode] || 'Unknown';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="text-center">${index + 1}</td>
      <td>
        <div class="archer-name" style="cursor: pointer;" onclick="viewArcherDetail('${archer.id}')">
          <div class="avatar-small">${archer.first[0]}${archer.last[0]}</div>
          <strong>${archer.first} ${archer.last}</strong>
        </div>
      </td>
      <td class="text-center">
        <span class="gender-badge gender-${archer.gender}">
          ${archer.gender === 'M' ? 'Male' : 'Female'}
        </span>
      </td>
      <td class="text-center">${age}</td>
      <td class="text-center">${dobFormatted}</td>
      <td class="text-center">
        <span style="font-size:1.2rem;" title="${countryName}">${countryFlag}</span>
        <span style="font-size:0.85rem;color:#6b7280;margin-left:0.25rem;">${countryCode}</span>
      </td>
      
      <td class="text-center">
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="editArcher('${archer.id}')" title="Edit">
            ✏️
          </button>
          <button class="btn-icon btn-delete" onclick="deleteArcher('${archer.id}')" title="Delete">
            🗑️
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Render Leaderboard with same UI style as Archers List
function renderLeaderboardTable(filters = {}) {
  const data = loadData();
  if (!data || !data.archers || !data.scores) return;
  
  const tbody = document.getElementById('leaderboardTableBody');
  const emptyState = document.getElementById('leaderboardEmptyState');
  
  if(!tbody) return;
  
  let archerStats = [];
  
  data.archers.forEach(a => {
    // Filter scores by competition if selected
    let scores = data.scores.filter(s => s.archerId === a.id);
    
    if(filters.competition){
      scores = scores.filter(s => s.competitionId === filters.competition);
    }
    
    if (scores.length === 0) return;
    
    // Apply gender filter
    if(filters.gender && a.gender !== filters.gender) return;
    
    const totalScore = scores.reduce((sum, s) => sum + (s.total || 0), 0);
    const bestScore = Math.max(...scores.map(s => s.total || 0));
    const avgScore = Math.round(totalScore / scores.length);
    const totalXs = scores.reduce((sum, s) => sum + (s.xCount || 0), 0);
    
    archerStats.push({
      id: a.id,
      first: a.first,
      last: a.last,
      gender: a.gender,
      totalScore,
      bestScore,
      avgScore,
      matches: scores.length,
      totalXs
    });
  });

  // Apply search filter
  if(filters.search){
    const searchLower = filters.search.toLowerCase();
    archerStats = archerStats.filter(a => {
      const fullName = `${a.first} ${a.last}`.toLowerCase();
      return fullName.includes(searchLower);
    });
  }

  // Sort by total score descending
  archerStats.sort((a, b) => b.totalScore - a.totalScore);

  // Clear table
  tbody.innerHTML = '';

  // Show/hide empty state
  if (archerStats.length === 0) {
    tbody.closest('table').style.display = 'none';
    emptyState.style.display = 'block';
    return;
  } else {
    tbody.closest('table').style.display = 'table';
    emptyState.style.display = 'none';
  }

  // Render rows - same style as archers table
  archerStats.forEach((a, i) => {
    const row = document.createElement('tr');
    
    // Add medal emoji for top 3
    let rankDisplay = i + 1;
    if(i === 0) rankDisplay = '🥇';
    else if(i === 1) rankDisplay = '🥈';
    else if(i === 2) rankDisplay = '🥉';
    
    row.innerHTML = `
      <td class="text-center">${rankDisplay}</td>
      <td>
        <div class="archer-name" style="cursor: pointer;" onclick="viewArcherDetail('${a.id}')">
          <div class="avatar-small">${a.first[0]}${a.last[0]}</div>
          <strong>${a.first} ${a.last}</strong>
        </div>
      </td>
      <td class="text-center">
        <span class="gender-badge gender-${a.gender}">
          ${a.gender === 'M' ? 'Male' : 'Female'}
        </span>
      </td>
      <td class="text-center">${a.avgScore}</td>
      <td class="text-center">
        <span class="score-highlight">${a.bestScore}</span>
      </td>
      <td class="text-center"><strong>${a.totalScore}</strong></td>
      <td class="text-center">${a.matches}</td>
      <td class="text-center">${a.totalXs}</td>
    `;
    
    tbody.appendChild(row);
  });
}

// Populate competition filter dropdown
function populateCompetitionFilter(){
  const data = loadData();
  if(!data || !data.competitions) return;
  
  const select = document.getElementById('competitionFilter');
  if(!select) return;
  
  // Clear existing options except "All Competitions"
  select.innerHTML = '<option value="">All Competitions</option>';
  
  // Add competition options
  data.competitions.forEach(comp => {
    const option = document.createElement('option');
    option.value = comp.id;
    option.textContent = comp.name;
    select.appendChild(option);
  });
}

//modal fuction

function showAddArcherModal(){
  const modal = document.getElementById('archerModal');
  const form = document.getElementById('archerForm');
  
  if(!modal || !form) return;
  
  // Reset form
  form.reset();
  document.getElementById('archerId').value = '';
  clearFormErrors();
  
  // Update modal title
  document.getElementById('modalTitle').textContent = 'Add New Archer';
  document.getElementById('saveButtonText').textContent = 'Add Archer';
  
  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Focus first input
  setTimeout(() => {
    const firstInput = document.getElementById('firstName');
    if(firstInput) firstInput.focus();
  }, 100);
}

function closeArcherModal(){
  const modal = document.getElementById('archerModal');
  if(!modal) return;
  
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Reset form
  const form = document.getElementById('archerForm');
  if(form) form.reset();
  clearFormErrors();
}

function clearFormErrors(){
  const errors = document.querySelectorAll('.form-error');
  errors.forEach(error => error.textContent = '');
  
  const inputs = document.querySelectorAll('.form-group input, .form-group select');
  inputs.forEach(input => input.classList.remove('invalid'));
}

function validateArcherForm(formData){
  const errors = {};
  
  if(!formData.firstName || formData.firstName.trim().length < 2){
    errors.firstName = "First name must be at least 2 characters";
  }
  
  if(!formData.lastName || formData.lastName.trim().length < 2){
    errors.lastName = "Last name must be at least 2 characters";
  }
  
  if(!formData.dob){
    errors.dob = "Date of birth is required";
  } else {
    const age = calculateAge(formData.dob);
    if(age < 5 || age > 100){
      errors.dob = "Age must be between 5 and 100";
    }
  }
  
  if(!formData.gender || !['M', 'F'].includes(formData.gender)){
    errors.gender = "Please select a valid gender";
  }
  
  // ===== THÊM VALIDATION CHO COUNTRY =====
  if(!formData.country || !COUNTRY_NAMES[formData.country]){
    errors.country = "Please select a valid country";
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

function saveArcher(event){
  event.preventDefault();
  
  // Get form data
  const formData = {
    id: document.getElementById('archerId').value,
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    country: document.getElementById('country').value // ===== THÊM COUNTRY =====
  };
  
  // Validate
  const errors = validateArcherForm(formData);
  
  if(Object.keys(errors).length > 0){
    displayFormErrors(errors);
    return;
  }
  
  const data = loadData();
  if(!data){
    showToast("Failed to load data!", "error");
    return;
  }
  
  if(formData.id){
    // Update existing archer
    const index = data.archers.findIndex(a => a.id === formData.id);
    if(index !== -1){
      data.archers[index] = {
        ...data.archers[index],
        first: formData.firstName,
        last: formData.lastName,
        dob: formData.dob,
        gender: formData.gender,
        country: formData.country, // ===== THÊM COUNTRY =====
        updatedAt: new Date().toISOString()
      };
      
      saveData(data);
      showToast(`${formData.firstName} ${formData.lastName} updated!`, "success");
      closeArcherModal();
      refreshAll();
    }
  } else {
    // Add new archer
    const newArcher = {
      id: `a${Date.now()}`,
      first: formData.firstName,
      last: formData.lastName,
      dob: formData.dob,
      gender: formData.gender,
      country: formData.country, // ===== THÊM COUNTRY =====
      createdAt: new Date().toISOString()
    };
    
    data.archers.push(newArcher);
    saveData(data);
    showToast(`${formData.firstName} ${formData.lastName} added!`, "success");
    closeArcherModal();
    refreshAll();
  }
}

function editArcher(id){
  const data = loadData();
  const archer = data.archers.find(a => a.id === id);
  
  if(!archer){
    showToast("Archer not found!", "error");
    return;
  }
  
  // Fill form
  document.getElementById('archerId').value = archer.id;
  document.getElementById('firstName').value = archer.first;
  document.getElementById('lastName').value = archer.last;
  document.getElementById('dob').value = archer.dob;
  document.getElementById('gender').value = archer.gender;
  document.getElementById('country').value = archer.country || 'VN'; // ===== THÊM COUNTRY =====
  
  // Update modal title
  document.getElementById('modalTitle').textContent = 'Edit Archer';
  document.getElementById('saveButtonText').textContent = 'Update Archer';
  
  // Show modal
  const modal = document.getElementById('archerModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  updateAgeDisplay();
}

function deleteArcher(id){
  const data = loadData();
  const archer = data.archers.find(a => a.id === id);
  
  if(!archer) return;
  
  if(!confirm(`Delete ${archer.first} ${archer.last}?\n\nThis action cannot be undone.`)){
    return;
  }
  
  // Check if archer has scores
  const hasScores = data.scores.some(s => s.archerId === id);
  
  if(hasScores){
    if(!confirm("⚠️ This archer has scores recorded. Delete anyway?")){
      return;
    }
  }
  
  // Remove archer
  data.archers = data.archers.filter(a => a.id !== id);
  saveData(data);
  showToast(`${archer.first} ${archer.last} deleted`, "info");
  refreshAll();
}

function updateAgeDisplay(){
  const dobInput = document.getElementById('dob');
  const ageDisplay = document.getElementById('ageDisplay');
  
  if(!dobInput || !ageDisplay) return;
  
  if(dobInput.value){
    const age = calculateAge(dobInput.value);
    ageDisplay.textContent = `Age: ${age} years old`;
    ageDisplay.style.display = 'block';
  } else {
    ageDisplay.style.display = 'none';
  }
}

function showToast(message, type = "info"){
  const toast = document.getElementById('toast');
  
  if(!toast){
    alert(message);
    return;
  }
  
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
  renderStats();
  renderArchersTable({
    search: document.getElementById('searchInput')?.value || '',
    gender: document.getElementById('genderFilter')?.value || ''
  });
  renderLeaderboardTable({
    search: document.getElementById('leaderboardSearchInput')?.value || '',
    competition: document.getElementById('competitionFilter')?.value || '',
    gender: document.getElementById('leaderboardGenderFilter')?.value || ''
  });
}

//event listener

document.addEventListener("DOMContentLoaded", () => {
  // Initial render
  populateCompetitionFilter();
  refreshAll();
  
  // Archers table search input
  const searchInput = document.getElementById('searchInput');
  if(searchInput){
    searchInput.addEventListener('input', (e) => {
      renderArchersTable({
        search: e.target.value,
        gender: document.getElementById('genderFilter')?.value || ''
      });
    });
  }
  
  // Archers table gender filter
  const genderFilter = document.getElementById('genderFilter');
  if(genderFilter){
    genderFilter.addEventListener('change', (e) => {
      renderArchersTable({
        search: document.getElementById('searchInput')?.value || '',
        gender: e.target.value
      });
    });
  }
  
  // Leaderboard search input
  const leaderboardSearchInput = document.getElementById('leaderboardSearchInput');
  if(leaderboardSearchInput){
    leaderboardSearchInput.addEventListener('input', (e) => {
      renderLeaderboardTable({
        search: e.target.value,
        competition: document.getElementById('competitionFilter')?.value || '',
        gender: document.getElementById('leaderboardGenderFilter')?.value || ''
      });
    });
  }
  
  // Competition filter
  const competitionFilter = document.getElementById('competitionFilter');
  if(competitionFilter){
    competitionFilter.addEventListener('change', (e) => {
      renderLeaderboardTable({
        search: document.getElementById('leaderboardSearchInput')?.value || '',
        competition: e.target.value,
        gender: document.getElementById('leaderboardGenderFilter')?.value || ''
      });
    });
  }
  
  // Leaderboard gender filter
  const leaderboardGenderFilter = document.getElementById('leaderboardGenderFilter');
  if(leaderboardGenderFilter){
    leaderboardGenderFilter.addEventListener('change', (e) => {
      renderLeaderboardTable({
        search: document.getElementById('leaderboardSearchInput')?.value || '',
        competition: document.getElementById('competitionFilter')?.value || '',
        gender: e.target.value
      });
    });
  }
  
  // DOB input - update age display
  const dobInput = document.getElementById('dob');
  if(dobInput){
    dobInput.addEventListener('change', updateAgeDisplay);
  }
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      const modal = document.getElementById('archerModal');
      if(modal && modal.style.display === 'flex'){
        closeArcherModal();
      }
    }
  });
  
  // Form submit
  const archerForm = document.getElementById('archerForm');
  if(archerForm){
    archerForm.addEventListener('submit', saveArcher);
  }
});

// Save data on page unload
window.addEventListener("beforeunload", () => {
  const data = loadData();
  if(data) saveData(data);
});

// View archer detail page
function viewArcherDetail(id){
  window.location.href = `/pages/archer-detail.html?id=${id}`;
}