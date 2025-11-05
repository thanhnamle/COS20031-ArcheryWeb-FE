/*
  Archery Dashboard - Statistics Page
  - Uses shared localStorage key "archery_demo_data_v1"
  - Calculates leaderboards and renders charts
*/

const STORAGE_KEY = "archery_demo_data_v1";

// Globals for charts
let scoreDistributionChart = null;
let performanceChart = null;

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

// --- Data Calculation ---

function getFilteredData(){
    const data = loadData();
    if (!data) return { archers: [], scores: [] };

    const archerFilter = document.getElementById('statArcherFilter').value;
    const roundFilter = document.getElementById('statRoundFilter').value;
    const genderFilter = document.getElementById('statGenderFilter').value;

    let filteredArchers = data.archers.slice();
    let archerIds = new Set(filteredArchers.map(a => a.id));

    // Filter archers by gender
    if (genderFilter) {
        filteredArchers = filteredArchers.filter(a => a.gender === genderFilter);
        archerIds = new Set(filteredArchers.map(a => a.id));
    }

    // Filter archers by selected archer (overrides gender)
    if (archerFilter) {
        filteredArchers = data.archers.filter(a => a.id === archerFilter);
        archerIds = new Set([archerFilter]);
    }
    
    // Filter scores based on archers and round
    let filteredScores = data.scores.filter(s => archerIds.has(s.archerId));
    if (roundFilter) {
        filteredScores = filteredScores.filter(s => s.roundId === roundFilter);
    }

    return { archers: filteredArchers, scores: filteredScores, allData: data };
}

function calculateStatistics() {
    const { archers, scores, allData } = getFilteredData();
    const stats = [];

    for (const archer of archers) {
        const archerScores = scores.filter(s => s.archerId === archer.id);
        
        if (archerScores.length === 0) {
            stats.push({
                archerId: archer.id,
                name: `${archer.first} ${archer.last}`,
                avatar: `${archer.first[0]}${archer.last[0]}`,
                bestScore: 0,
                avgScore: 0,
                totalXs: 0,
                scoreCount: 0
            });
            continue;
        }

        const bestScore = Math.max(...archerScores.map(s => s.total));
        const avgScore = Math.round(archerScores.reduce((sum, s) => sum + s.total, 0) / archerScores.length);
        const totalXs = archerScores.reduce((sum, s) => sum + (s.xCount || 0), 0);

        stats.push({
            archerId: archer.id,
            name: `${archer.first} ${archer.last}`,
            avatar: `${archer.first[0]}${archer.last[0]}`,
            bestScore,
            avgScore,
            totalXs,
            scoreCount: archerScores.length
        });
    }
    return stats;
}

// --- Render Functions ---

function populateFilters(){
  const data = loadData();
  const archerFilter = document.getElementById('statArcherFilter');
  const roundFilter = document.getElementById('statRoundFilter');
  
  if(archerFilter && data.archers){
    archerFilter.innerHTML = '<option value="">All Archers</option>';
    data.archers.sort((a,b) => a.first.localeCompare(b.first)).forEach(archer => {
      archerFilter.innerHTML += `<option value="${archer.id}">${archer.first} ${archer.last}</option>`;
    });
  }
  
  if(roundFilter && data.rounds){
    roundFilter.innerHTML = '<option value="">All Rounds</option>';
    data.rounds.sort((a,b) => a.name.localeCompare(b.name)).forEach(round => {
      roundFilter.innerHTML += `<option value="${round.id}">${round.name}</option>`;
    });
  }
}

function renderLeaderboards(stats) {
    const render = (tbodyId, data, key, unit = '') => {
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td class="muted text-center">No data available</td></tr>';
            return;
        }
        data.slice(0, 5).forEach((item, index) => { // Top 5
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="leader-rank">${index + 1}</span></td>
                <td>
                    <div class="archer-name">
                        <div class="avatar-small">${item.avatar}</div>
                        ${item.name}
                    </div>
                </td>
                <td class="leader-value">${item[key]} ${unit}</td>
            `;
            tbody.appendChild(row);
        });
    };

    // Best Score
    const bestScoreStats = stats.filter(s => s.bestScore > 0).sort((a, b) => b.bestScore - a.bestScore);
    render('leaderboardBestScore', bestScoreStats, 'bestScore');

    // Average Score
    const avgScoreStats = stats.filter(s => s.avgScore > 0).sort((a, b) => b.avgScore - a.avgScore);
    render('leaderboardAvgScore', avgScoreStats, 'avgScore', 'avg');

    // Total X's
    const totalXsStats = stats.filter(s => s.totalXs > 0).sort((a, b) => b.totalXs - a.totalXs);
    render('leaderboardTotalXs', totalXsStats, 'totalXs', "X's");
}

function renderCharts() {
    const { scores } = getFilteredData();
    const archerFilter = document.getElementById('statArcherFilter').value;

    // --- Chart 1: Score Distribution ---
    const distCtx = document.getElementById('scoreDistributionChart').getContext('2d');
    const scoreBuckets = { "0-199": 0, "200-299": 0, "300-399": 0, "400-499": 0, "500-599": 0, "600-720+": 0 };
    
    scores.forEach(s => {
        if (s.total <= 199) scoreBuckets["0-199"]++;
        else if (s.total <= 299) scoreBuckets["200-299"]++;
        else if (s.total <= 399) scoreBuckets["300-399"]++;
        else if (s.total <= 499) scoreBuckets["400-499"]++;
        else if (s.total <= 599) scoreBuckets["500-599"]++;
        else scoreBuckets["600-720+"]++;
    });

    if (scoreDistributionChart) scoreDistributionChart.destroy();
    scoreDistributionChart = new Chart(distCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(scoreBuckets),
            datasets: [{
                label: 'Number of Scores',
                data: Object.values(scoreBuckets),
                backgroundColor: '#dbeafe',
                borderColor: '#2563eb',
                borderWidth: 1
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // --- Chart 2: Performance Over Time ---
    const perfCtx = document.getElementById('performanceChart').getContext('2d');
    const subtitle = document.getElementById('performanceChartSubtitle');
    
    if (performanceChart) performanceChart.destroy();

    if (archerFilter) {
        // Only show this chart if one archer is selected
        const archerScores = scores
            .filter(s => s.archerId === archerFilter)
            .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
        
        subtitle.style.display = 'none';
        
        performanceChart = new Chart(perfCtx, {
            type: 'line',
            data: {
                labels: archerScores.map(s => new Date(s.recordedAt).toLocaleDateString()),
                datasets: [{
                    label: 'Total Score',
                    data: archerScores.map(s => s.total),
                    tension: 0.1,
                    borderColor: '#10b981',
                    backgroundColor: '#d1fae5',
                    fill: false
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } else {
        // Clear chart and show message if no archer is selected
        subtitle.style.display = 'block';
    }
}

// --- Init ---

function refreshAllStats(){
  const stats = calculateStatistics();
  renderLeaderboards(stats);
  renderCharts();
}

document.addEventListener("DOMContentLoaded", () => {
  populateFilters();
  refreshAllStats();
  
  // Event Listeners
  document.getElementById('statArcherFilter').addEventListener('change', refreshAllStats);
  document.getElementById('statRoundFilter').addEventListener('change', refreshAllStats);
  document.getElementById('statGenderFilter').addEventListener('change', refreshAllStats);
});