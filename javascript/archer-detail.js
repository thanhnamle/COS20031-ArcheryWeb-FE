/*
  Archery Dashboard - Archer Detail Page
  - Displays comprehensive archer information
  - Organized in tabs: Overall, Performance, Results, Match History
  - Fetches data from localStorage using shared key
*/

const STORAGE_KEY = "archery_demo_data_v1";

// Load data from localStorage
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error parsing data:", e);
    return null;
  }
}

// Get archer ID from URL parameters
function getArcherIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Calculate age from date of birth
function calculateAge(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

// Format timestamp for display
function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get archer statistics
function getArcherStats(archerId, data) {
  const scores = data.scores.filter(s => s.archerId === archerId);
  
  if (scores.length === 0) {
    return {
      totalScores: 0,
      bestScore: 0,
      avgScore: 0,
      totalXs: 0,
      approvedScores: 0,
      pendingScores: 0
    };
  }
  
  const totalScores = scores.length;
  const bestScore = Math.max(...scores.map(s => s.total));
  const avgScore = Math.round(scores.reduce((sum, s) => sum + s.total, 0) / totalScores);
  const totalXs = scores.reduce((sum, s) => sum + (s.xCount || 0), 0);
  const approvedScores = scores.filter(s => s.isApproved).length;
  const pendingScores = scores.filter(s => !s.isApproved).length;
  
  // Calculate total score (sum of all scores)
  const totalScore = scores.reduce((sum, s) => sum + s.total, 0);
  
  return { 
    totalScores, 
    bestScore, 
    avgScore, 
    totalXs,
    totalScore,
    approvedScores,
    pendingScores
  };
}

// Get match history for archer
function getMatchHistory(archerId, data) {
  return data.scores
    .filter(s => s.archerId === archerId)
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
}

// Display archer information
function displayArcherInfo(archer, data) {
  const stats = getArcherStats(archer.id, data);
  const age = calculateAge(archer.dob);
  
  // Update breadcrumb
  document.getElementById('breadcrumbName').textContent = 
    `${archer.first} ${archer.last}`.toUpperCase();
  
  // Update profile name and initials
  document.getElementById('archerName').textContent = 
    `${archer.first} ${archer.last}`;
  document.getElementById('archerInitials').textContent = 
    `${archer.first[0]}${archer.last[0]}`;
  
  // Handle photo
  if (archer.photoUrl) {
    document.getElementById('archerPhoto').src = archer.photoUrl;
    document.getElementById('archerPhoto').style.display = 'block';
    document.getElementById('archerPhotoPlaceholder').style.display = 'none';
  } else {
    document.getElementById('archerPhoto').style.display = 'none';
    document.getElementById('archerPhotoPlaceholder').style.display = 'flex';
  }
  
  // Update meta info
  document.getElementById('archerRanking').textContent = archer.ranking || 'N/A';
  document.getElementById('archerAge').textContent = age;
  document.getElementById('archerDOB').textContent = 
    `(${formatDate(archer.dob)})`;
  
  // Overall Tab - Basic Information
  document.getElementById('archerId').textContent = archer.id;
  document.getElementById('firstName').textContent = archer.first;
  document.getElementById('lastName').textContent = archer.last;
  document.getElementById('dateOfBirth').textContent = formatDate(archer.dob);
  document.getElementById('gender').textContent = 
    archer.gender === 'M' ? 'Male' : 'Female';
  document.getElementById('defaultEquipment').textContent = 
    archer.defaultEquipment || 'Not specified';
  document.getElementById('clubName').textContent = 
    archer.clubName || 'No club';
  document.getElementById('createdAt').textContent = 
    formatTimestamp(archer.createdAt);
  document.getElementById('updatedAt').textContent = 
    formatTimestamp(archer.updatedAt);
  
  // Performance Tab - Statistics
  document.getElementById('totalScore').textContent = stats.totalScore;
  document.getElementById('bestScore').textContent = stats.bestScore;
  document.getElementById('totalXs').textContent = stats.totalXs;
  document.getElementById('avgScore').textContent = stats.avgScore;
  document.getElementById('totalMatches').textContent = stats.totalScores;
  
  // Results Tab - Competition Results
  document.getElementById('totalCompetitions').textContent = stats.totalScores;
  document.getElementById('approvedScores').textContent = stats.approvedScores;
  document.getElementById('pendingScores').textContent = stats.pendingScores;
  
  // Match History Tab
  displayMatchHistory(archer.id, data);
}

// Display match history
function displayMatchHistory(archerId, data) {
  const matches = getMatchHistory(archerId, data);
  const tableBody = document.getElementById('matchesTableBody');
  const emptyState = document.getElementById('emptyMatches');
  const table = document.getElementById('matchesTable');
  
  if (matches.length === 0) {
    emptyState.style.display = 'block';
    table.style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  table.style.display = 'block';
  
  tableBody.innerHTML = '';
  
  matches.forEach(match => {
    const competition = match.competitionId 
      ? data.competitions.find(c => c.id === match.competitionId)
      : null;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(match.recordedAt)}</td>
      <td>${match.roundSnapshot || '-'}</td>
      <td>${competition ? competition.name : 'Practice'}</td>
      <td>${match.equipmentSnapshot || '-'}</td>
      <td class="score-highlight">${match.total}</td>
      <td>${match.xCount || 0}</td>
      <td>
        <span class="status-badge ${match.isApproved ? 'status-approved' : 'status-pending'}">
          ${match.isApproved ? 'Approved' : 'Pending'}
        </span>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Switch between tabs
function switchTab(tabName) {
  // Remove active class from all tabs and panes
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  // Add active class to selected tab and pane
  const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const selectedPane = document.getElementById(`tab-${tabName}`);
  
  if (selectedBtn && selectedPane) {
    selectedBtn.classList.add('active');
    selectedPane.classList.add('active');
  }
}

// Toggle favorite (placeholder function)
function toggleFavorite() {
  const btn = document.querySelector('.btn-favorite');
  const isFavorite = btn.classList.toggle('is-favorite');
  btn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
  
  // Here you could save favorite status to localStorage
  console.log('Favorite toggled:', isFavorite);
}

// Show error state
function showError(message) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('archerProfile').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
  document.getElementById('errorMessage').textContent = message;
}

// Initialize page
function init() {
  // Get archer ID from URL
  const archerId = getArcherIdFromURL();
  
  if (!archerId) {
    showError('No archer ID provided. Please select an archer from the list.');
    return;
  }
  
  // Load data
  const data = loadData();
  
  if (!data || !data.archers) {
    showError('Failed to load archer data. Please try again later.');
    return;
  }
  
  // Find archer
  const archer = data.archers.find(a => a.id === archerId);
  
  if (!archer) {
    showError(`Archer with ID "${archerId}" not found.`);
    return;
  }
  
  // Hide loading, show profile
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('archerProfile').style.display = 'block';
  
  // Display archer information
  displayArcherInfo(archer, data);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
