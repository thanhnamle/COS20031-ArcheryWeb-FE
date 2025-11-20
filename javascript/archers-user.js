/*
  Archery Dashboard - Archers User View Page
  - Uses shared localStorage key "archery_demo_data_v1"
  - Read-only view for regular users
  - Displays archer list with stats and leaderboard
*/

const STORAGE_KEY = "archery_demo_data_v1";

// Load data from localStorage
function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return null;
  try{ 
    return JSON.parse(raw); 
  } catch(e){ 
    console.error("Error parsing data:", e);
    return null; 
  }
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
      <td class="text-center">${stats.totalScores}</td>
      <td class="text-center">
        <span class="score-highlight">${stats.bestScore}</span>
      </td>
      <td class="text-center">${stats.avgScore}</td>
      <td class="text-center">${stats.totalXs}</td>
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
});

// View archer detail page (user view)
function viewArcherDetail(id){
  window.location.href = `/archer-detail-user.html?id=${id}`;
}