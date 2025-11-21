// archers.js & archers-user.js - CÙNG DÙNG FILE NÀY (đổi tên 1 trong 2 thành cái kia hoặc symlink)
import { apiGet } from './api.js';

let allArchers = [];
let allScores = [];
let allCategories = [];

async function loadAllData() {
  try {
    const [archers, scores, categories] = await Promise.all([
      apiGet('archers.php'),
      apiGet('scores.php'),
      apiGet('categories.php')
    ]);
    allArchers = archers;
    allScores = scores;
    allCategories = categories;
    refreshAll();
  } catch (err) {
    alert('Lỗi kết nối database: ' + err.message);
  }
}

function getArcherStats(archerId) {
  const scores = allScores.filter(s => s.archerName === archer.name);
  if (scores.length === 0) return { totalScores: 0, bestScore: '-', avgScore: '-', totalXs: 0 };
  
  const totals = scores.map(s => s.TotalScore);
  return {
    totalScores: scores.length,
    bestScore: Math.max(...totals),
    avgScore: Math.round(totals.reduce((a,b)=>a+b,0)/totals.length),
    totalXs: scores.reduce((a,s)=> a + (s.xCount||0), 0)
  };
}

function renderArchersTable(filters = {}) {
  const tbody = document.getElementById('archersTableBody') || document.getElementById('userArchersTableBody');
  if (!tbody) return;

  let list = allArchers.slice();

  if (filters.gender) list = list.filter(a => a.gender === filters.gender);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(a => a.name.toLowerCase().includes(s) || a.category.toLowerCase().includes(s));
  }

  tbody.innerHTML = list.map(a => {
    const stats = getArcherStats(a);
    return `
      <tr onclick="viewArcherDetail('${a.id}')">
        <td>${a.name}</td>
        <td>${a.gender === 'F' ? 'Female' : 'Male'}</td>
        <td>${a.class}</td>
        <td>${a.equipment}</td>
        <td>${a.category}</td>
        <td>${stats.totalScores}</td>
        <td>${stats.bestScore}</td>
        <td>${stats.avgScore}</td>
      </tr>`;
  }).join('') || '<tr><td colspan="8">Không có dữ liệu</td></tr>';
}

// Tương tự cho leaderboard, rankings.php đã có sẵn top 10
async function renderLeaderboardTable() {
  const tbody = document.getElementById('leaderboardTableBody');
  if (!tbody) return;
  const rankings = await apiGet('rankings.php');
  tbody.innerHTML = rankings.map((r,i) => `
    <tr>
      <td>${r.Rank}</td>
      <td>${r.Category}</td>
      <td>${r.Name}</td>
      <td>${r.Class}</td>
      <td>${r.Equipment}</td>
      <td>${r.BestScore}</td>
    </tr>
  `).join('');
}

function viewArcherDetail(id) {
  const isUserPage = window.location.pathname.includes('-user');
  window.location.href = isUserPage ? `/archer-detail-user.html?id=${id}` : `/archer-detail.html?id=${id}`;
}

document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  renderLeaderboardTable();

  // filters events...
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    renderArchersTable({search: e.target.value});
  });
  // ... các filter khác tương tự
});