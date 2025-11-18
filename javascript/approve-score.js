// approve-score.js
// Admin verifies scores with dropdown selection

const STORAGE_KEY = "archery_demo_data_v1";
let currentStagingId = null;

// ========== Data Helpers ==========
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse storage data", e);
    return null;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ========== Parse Round Details ==========
function parseRoundDetails(detailsStr) {
  if (!detailsStr) return [];
  
  const ranges = detailsStr.split(',').map(d => d.trim());
  const result = [];
  
  ranges.forEach(rangeStr => {
    const parts = rangeStr.split('@');
    if (parts.length !== 2) return;
    
    let arrowsStr = parts[0].trim();
    const distance = parts[1].trim();
    
    let face = null;
    let faceExplicit = false;
    
    if (arrowsStr.includes('+')) {
      face = '122cm';
      faceExplicit = true;
      arrowsStr = arrowsStr.replace('+', '');
    } else if (arrowsStr.includes('*')) {
      face = '80cm';
      faceExplicit = true;
      arrowsStr = arrowsStr.replace('*', '');
    }
    
    const arrows = parseInt(arrowsStr);
    if (isNaN(arrows) || arrows < 6) return;
    
    const ends = Math.floor(arrows / 6);
    
    if (!faceExplicit) {
      const distanceNum = parseInt(distance);
      if (distanceNum >= 70) face = '122cm';
      else if (distanceNum >= 60) face = '122cm';
      else if (distanceNum >= 50) face = '80cm';
      else if (distanceNum >= 30) face = '80cm';
      else if (distanceNum >= 18) face = '60cm';
      else face = '40cm';
    }
    
    result.push({ arrows, distance, ends, face });
  });
  
  return result;
}

// ========== Format DateTime ==========
function formatDateTime(isoStr) {
  if (!isoStr) return '-';
  const date = new Date(isoStr);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ========== Render Staging Scores Table ==========
function renderStagingScores(filter = '') {
  const data = loadData();
  if (!data) return;
  
  if (!data.stagingScores) {
    data.stagingScores = [];
    saveData(data);
  }
  
  const tbody = document.getElementById('stagingTableBody');
  const emptyState = document.getElementById('emptyState');
  
  if (!tbody || !emptyState) return;
  
  let stagingScores = data.stagingScores.slice();
  
  if (!filter) {
    stagingScores = stagingScores.filter(s => s.status === 'pending' || s.status === 'verified');
  } else if (filter) {
    stagingScores = stagingScores.filter(s => s.status === filter);
  }
  
  stagingScores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  tbody.innerHTML = '';
  
  if (stagingScores.length === 0) {
    emptyState.style.display = 'block';
    tbody.closest('table').style.display = 'none';
    document.getElementById('adminScoreEntrySection').style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  tbody.closest('table').style.display = 'table';
  
  stagingScores.forEach((staging, index) => {
    const archer = data.archers.find(a => a.id === staging.archerId);
    const competition = staging.competitionId ? 
      data.competitions.find(c => c.id === staging.competitionId) : null;
    
    const row = document.createElement('tr');
    row.id = `staging-row-${staging.id}`;
    
    // Calculate match status
    const isVerified = staging.adminScore !== null;
    const isMatch = isVerified && staging.adminScore.total === staging.userScore.total;
    
    row.innerHTML = `
      <td class="text-center">${index + 1}</td>
      <td>${archer ? `${archer.first} ${archer.last}` : 'Unknown'}</td>
      <td>${staging.roundSnapshot}</td>
      <td>${competition ? competition.name : 'Practice'}</td>
      <td class="text-center">
        <strong style="color:#2563eb;font-size:1.2rem;">${staging.userScore.total}</strong>
        <br><small style="color:#6b7280;">${staging.userScore.xCount} X's</small>
      </td>
      <td class="text-center" id="admin-score-cell-${staging.id}">
        ${staging.adminScore ? 
          `<strong style="color:#10b981;font-size:1.2rem;">${staging.adminScore.total}</strong>
           <br><small style="color:#6b7280;">${staging.adminScore.xCount} X's</small>
           ${isMatch ? '<br><span style="color:#10b981;font-size:0.75rem;">✅ Match</span>' : '<br><span style="color:#ef4444;font-size:0.75rem;">❌ No Match</span>'}` : 
          '<span style="color:#9ca3af;">Not verified</span>'}
      </td>
      <td class="text-center">
        <span class="status-badge status-${staging.status}">
          ${staging.status.toUpperCase()}
        </span>
      </td>
      <td class="text-center">
        <small>${formatDateTime(staging.createdAt)}</small>
      </td>
      <td class="text-center">
        <div class="action-buttons" id="actions-${staging.id}">
          ${staging.status === 'verified' && isMatch ? `
            <button class="btn-icon btn-success" onclick="approveScore('${staging.id}')" title="Approve">
              ✓
            </button>
          ` : ''}
          ${staging.status === 'pending' || staging.status === 'verified' ? `
            <button class="btn-icon btn-danger" onclick="rejectScore('${staging.id}')" title="Reject">
              ✕
            </button>
          ` : ''}
          <button class="btn-icon btn-delete" onclick="deleteStaging('${staging.id}')" title="Delete">
            🗑️
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Show admin entry section and populate dropdown
  const hasPending = stagingScores.some(s => s.status === 'pending' || s.status === 'verified');
  if (hasPending) {
    document.getElementById('adminScoreEntrySection').style.display = 'block';
    populateStagingScoresDropdown(stagingScores);
  } else {
    document.getElementById('adminScoreEntrySection').style.display = 'none';
  }
}

// ========== Populate Staging Scores Dropdown ==========
function populateStagingScoresDropdown(stagingScores) {
  const data = loadData();
  const select = document.getElementById('selectStagingScore');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select a pending score...</option>';
  
  const pendingScores = stagingScores.filter(s => s.status === 'pending' || s.status === 'verified');
  
  pendingScores.forEach(staging => {
    const archer = data.archers.find(a => a.id === staging.archerId);
    const archerName = archer ? `${archer.first} ${archer.last}` : 'Unknown';
    
    const option = document.createElement('option');
    option.value = staging.id;
    option.textContent = `${archerName} - ${staging.roundSnapshot} - ${staging.userScore.total} pts`;
    select.appendChild(option);
  });
  
  // Attach change listener
  select.addEventListener('change', handleStagingScoreChange);
}

// ========== Handle Staging Score Change ==========
function handleStagingScoreChange() {
  const stagingId = document.getElementById('selectStagingScore').value;
  
  if (!stagingId) {
    document.getElementById('selectedScoreInfo').style.display = 'none';
    document.getElementById('scoreEntryWrapper').style.display = 'none';
    currentStagingId = null;
    return;
  }
  
  const data = loadData();
  const staging = data.stagingScores.find(s => s.id === stagingId);
  
  if (!staging) return;
  
  currentStagingId = stagingId;
  
  // Show score info
  const archer = data.archers.find(a => a.id === staging.archerId);
  const competition = staging.competitionId ? 
    data.competitions.find(c => c.id === staging.competitionId) : null;
  
  document.getElementById('infoArcher').textContent = archer ? `${archer.first} ${archer.last}` : 'Unknown';
  document.getElementById('infoRound').textContent = staging.roundSnapshot;
  document.getElementById('infoCompetition').textContent = competition ? competition.name : 'Practice';
  document.getElementById('infoUserScore').textContent = `${staging.userScore.total} (${staging.userScore.xCount} X's)`;
  
  document.getElementById('selectedScoreInfo').style.display = 'block';
  document.getElementById('scoreEntryWrapper').style.display = 'block';
  
  // Render score entry table
  const round = data.rounds.find(r => r.id === staging.roundId);
  if (round) {
    renderAdminScoreTable(round, staging);
  }
}

// ========== Render Admin Score Table (GIỐNG ADD-SCORE) ==========
function renderAdminScoreTable(round, staging) {
  const container = document.getElementById('adminScoreTablesContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  let ranges = parseRoundDetails(round.details);
  
  if (ranges.length === 0) {
    ranges = [
      { arrows: 36, distance: '30m', ends: 6, face: '80cm' },
      { arrows: 36, distance: '30m', ends: 6, face: '80cm' }
    ];
  }
  
  const totalArrows = ranges.reduce((sum, r) => sum + r.arrows, 0);
  const totalEnds = ranges.reduce((sum, r) => sum + r.ends, 0);
  
  // Round summary
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'round-summary';
  summaryDiv.style.cssText = 'background:#f0f9ff;padding:1rem;border-radius:8px;margin-bottom:1.5rem;border-left:4px solid #2563eb;';
  summaryDiv.innerHTML = `
    <div style="display:flex;gap:2rem;flex-wrap:wrap;justify-content:center;">
      <div><span style="color:#6b7280;font-size:0.875rem;">Round:</span> <strong style="color:#111827;margin-left:0.5rem;">${round.name}</strong></div>
      <div><span style="color:#6b7280;font-size:0.875rem;">Ranges:</span> <strong style="color:#111827;margin-left:0.5rem;">${ranges.length}</strong></div>
      <div><span style="color:#6b7280;font-size:0.875rem;">Total Ends:</span> <strong style="color:#111827;margin-left:0.5rem;">${totalEnds}</strong></div>
      <div><span style="color:#6b7280;font-size:0.875rem;">Total Arrows:</span> <strong style="color:#111827;margin-left:0.5rem;">${totalArrows}</strong></div>
    </div>
  `;
  container.appendChild(summaryDiv);
  
  // Render each range
  ranges.forEach((range, index) => {
    renderSingleRange(container, index + 1, range);
  });
  
  // Grand total
  renderGrandTotal(container);
  
  // Pre-fill if admin score exists
  if (staging.adminScore && staging.adminScore.arrows) {
    setTimeout(() => {
      const inputs = document.querySelectorAll('.admin-score-input');
      staging.adminScore.arrows.forEach((score, i) => {
        if (inputs[i]) inputs[i].value = score;
      });
      calculateTotals();
    }, 100);
  }
  
  // Attach listeners
  attachInputListeners();
  calculateTotals();
}

// ========== Render Single Range ==========
function renderSingleRange(container, rangeNum, range) {
  const rangeSection = document.createElement('div');
  rangeSection.className = 'range-section';
  rangeSection.style.marginBottom = '2rem';
  
  rangeSection.innerHTML = `
    <div class="range-header" style="background:#f9fafb;padding:1rem;border-radius:8px 8px 0 0;border:2px solid #e5e7eb;border-bottom:none;">
      <h4 style="margin:0;display:flex;align-items:center;gap:0.75rem;">
        <span style="background:#2563eb;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.875rem;">R${rangeNum}</span>
        <span style="color:#111827;">Range ${rangeNum}: ${range.distance}</span>
        <span style="color:#6b7280;font-weight:400;font-size:0.9rem;">(${range.ends} ends, ${range.arrows} arrows, ${range.face} face)</span>
      </h4>
    </div>
    <div class="table-responsive">
      <table class="score-entry-table">
        <thead>
          <tr>
            <th style="width: 60px;">End</th>
            <th>Arrow 1</th>
            <th>Arrow 2</th>
            <th>Arrow 3</th>
            <th>Arrow 4</th>
            <th>Arrow 5</th>
            <th>Arrow 6</th>
            <th style="width: 100px;">End Total</th>
          </tr>
        </thead>
        <tbody id="adminRange${rangeNum}Body"></tbody>
      </table>
    </div>
  `;
  
  container.appendChild(rangeSection);
  
  const tbody = document.getElementById(`adminRange${rangeNum}Body`);
  
  for (let endNum = 1; endNum <= range.ends; endNum++) {
    const row = document.createElement('tr');
    let html = `<td class="text-center"><strong>${endNum}</strong></td>`;
    
    for (let arrowNum = 1; arrowNum <= 6; arrowNum++) {
      html += `<td><input type="number" class="score-input admin-score-input" data-range="${rangeNum}" data-end="${endNum}" data-arrow="${arrowNum}" min="0" max="10" value="0" /></td>`;
    }
    
    html += `<td class="text-center end-total" id="adminR${rangeNum}e${endNum}total">0</td>`;
    row.innerHTML = html;
    tbody.appendChild(row);
  }
  
  const totalRow = document.createElement('tr');
  totalRow.classList.add('range-total-row');
  totalRow.innerHTML = `
    <td class="text-center" style="background:#f9fafb;"><strong>Range Total</strong></td>
    <td colspan="6" style="background:#f9fafb;"></td>
    <td class="text-center range-total" id="adminRange${rangeNum}Total" style="background:#f9fafb;"><strong>0</strong></td>
  `;
  tbody.appendChild(totalRow);
}

// ========== Render Grand Total ==========
function renderGrandTotal(container) {
  const grandTotalSection = document.createElement('div');
  grandTotalSection.className = 'grand-total-section';
  grandTotalSection.style.marginTop = '2rem';
  
  grandTotalSection.innerHTML = `
    <div style="background:linear-gradient(135deg,#10b981,#059669);padding:1.5rem;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <h3 style="margin:0;color:white;display:flex;align-items:center;gap:0.5rem;">
          <i class="fas fa-trophy" style="font-size:1.5rem;"></i> ADMIN GRAND TOTAL
        </h3>
        <div style="display:flex;gap:2rem;align-items:center;">
          <div style="text-align:right;">
            <div style="color:rgba(255,255,255,0.8);font-size:0.875rem;">Total Score</div>
            <div id="adminGrandTotal" style="font-size:2.5rem;font-weight:800;color:white;line-height:1;">0</div>
          </div>
          <div style="text-align:right;">
            <div style="color:rgba(255,255,255,0.8);font-size:0.875rem;">X's</div>
            <div id="adminGrandXCount" style="font-size:2rem;font-weight:700;color:#fbbf24;line-height:1;">0</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(grandTotalSection);
}

// ========== Attach Input Listeners ==========
function attachInputListeners() {
  const inputs = document.querySelectorAll('.admin-score-input');
  
  inputs.forEach(input => {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  });
  
  const newInputs = document.querySelectorAll('.admin-score-input');
  
  newInputs.forEach(input => {
    input.addEventListener('input', function() {
      let val = parseInt(this.value);
      if (isNaN(val) || val < 0) this.value = 0;
      else if (val > 10) this.value = 10;
      calculateTotals();
    });
    
    input.addEventListener('change', function() {
      if (this.value === '' || isNaN(parseInt(this.value))) this.value = 0;
      calculateTotals();
    });
    
    input.addEventListener('focus', function() {
      this.select();
    });
    
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        const allInputs = Array.from(document.querySelectorAll('.admin-score-input'));
        const currentIndex = allInputs.indexOf(this);
        if (currentIndex < allInputs.length - 1) {
          e.preventDefault();
          allInputs[currentIndex + 1].focus();
        }
      }
    });
  });
}

// ========== Calculate Totals ==========
function calculateTotals() {
  const inputs = document.querySelectorAll('.admin-score-input');
  const data = {};
  let grandTotal = 0;
  let grandXCount = 0;
  
  inputs.forEach(input => {
    const range = parseInt(input.dataset.range);
    const end = parseInt(input.dataset.end);
    const value = parseInt(input.value) || 0;
    
    if (!data[range]) data[range] = {};
    if (!data[range][end]) data[range][end] = [];
    
    data[range][end].push(value);
    grandTotal += value;
    if (value === 10) grandXCount++;
  });
  
  Object.keys(data).forEach(rangeNum => {
    let rangeTotal = 0;
    
    Object.keys(data[rangeNum]).forEach(endNum => {
      const endTotal = data[rangeNum][endNum].reduce((sum, val) => sum + val, 0);
      const endCell = document.getElementById(`adminR${rangeNum}e${endNum}total`);
      if (endCell) endCell.textContent = endTotal;
      rangeTotal += endTotal;
    });
    
    const rangeCell = document.getElementById(`adminRange${rangeNum}Total`);
    if (rangeCell) rangeCell.innerHTML = `<strong>${rangeTotal}</strong>`;
  });
  
  const grandTotalCell = document.getElementById('adminGrandTotal');
  if (grandTotalCell) grandTotalCell.textContent = grandTotal;
  
  const grandXCountCell = document.getElementById('adminGrandXCount');
  if (grandXCountCell) grandXCountCell.textContent = grandXCount;
  
  // Update current staging score
  if (currentStagingId) {
    updateCurrentStagingScore(grandTotal, grandXCount);
  }
}

// ========== Update Current Staging Score ==========
function updateCurrentStagingScore(total, xCount) {
  const loadedData = loadData();
  if (!loadedData || !currentStagingId) return;
  
  const inputs = document.querySelectorAll('.admin-score-input');
  const arrows = [];
  inputs.forEach(input => {
    arrows.push(parseInt(input.value) || 0);
  });
  
  const stagingIndex = loadedData.stagingScores.findIndex(s => s.id === currentStagingId);
  if (stagingIndex === -1) return;
  
  const staging = loadedData.stagingScores[stagingIndex];
  
  staging.adminScore = {
    arrows: arrows,
    total: total,
    xCount: xCount,
    recordedBy: 'CongHuann',
    recordedAt: new Date().toISOString()
  };
  
  // ✅ CHỈ đổi status thành verified khi scores khớp
  const isMatch = staging.adminScore.total === staging.userScore.total;
  
  // Nếu khớp → verified, nếu không khớp → giữ pending
  if (isMatch) {
    staging.status = 'verified';
  } else {
    // Giữ nguyên status pending nếu không khớp
    if (staging.status !== 'rejected' && staging.status !== 'approved') {
      staging.status = 'pending';
    }
  }
  
  staging.updatedAt = new Date().toISOString();
  
  saveData(loadedData);
  
  // Update UI cell
  const cell = document.getElementById(`admin-score-cell-${currentStagingId}`);
  if (cell) {
    cell.innerHTML = `
      <strong style="color:#10b981;font-size:1.2rem;">${staging.adminScore.total}</strong>
      <br><small style="color:#6b7280;">${staging.adminScore.xCount} X's</small>
      ${isMatch ? '<br><span style="color:#10b981;font-size:0.75rem;">✅ Match</span>' : '<br><span style="color:#ef4444;font-size:0.75rem;">❌ No Match</span>'}
    `;
  }
  
  // Update status badge
  const row = document.getElementById(`staging-row-${currentStagingId}`);
  if (row) {
    const statusBadge = row.querySelector('.status-badge');
    if (statusBadge) {
      statusBadge.className = `status-badge status-${staging.status}`;
      statusBadge.textContent = staging.status.toUpperCase();
    }
    
    // Update actions - chỉ show Approve button khi verified (tức là đã khớp)
    const actionsDiv = document.getElementById(`actions-${currentStagingId}`);
    if (actionsDiv) {
      actionsDiv.innerHTML = `
        ${staging.status === 'verified' && isMatch ? `
          <button class="btn-icon btn-success" onclick="approveScore('${currentStagingId}')" title="Approve">
            ✓
          </button>
        ` : ''}
        ${staging.status === 'pending' || staging.status === 'verified' ? `
          <button class="btn-icon btn-danger" onclick="rejectScore('${currentStagingId}')" title="Reject">
            ✕
          </button>
        ` : ''}
        <button class="btn-icon btn-delete" onclick="deleteStaging('${currentStagingId}')" title="Delete">
          🗑️
        </button>
      `;
    }
  }
}

// ========== Approve Score ==========
function approveScore(stagingId) {
  const data = loadData();
  const staging = data.stagingScores.find(s => s.id === stagingId);
  
  if (!staging || !staging.adminScore) {
    alert('❌ Please enter admin score first!');
    return;
  }
  
  if (staging.adminScore.total !== staging.userScore.total) {
    alert('❌ Cannot approve: Scores do not match!');
    return;
  }
  
  if (!confirm(`✅ Approve this score?\n\nScore: ${staging.adminScore.total} pts`)) {
    return;
  }
  
  const approvedScore = {
    id: `s${Date.now()}`,
    archerId: staging.archerId,
    competitionId: staging.competitionId,
    roundId: staging.roundId,
    roundSnapshot: staging.roundSnapshot,
    total: staging.adminScore.total,
    xCount: staging.adminScore.xCount,
    recordedAt: staging.userScore.recordedAt,
    isApproved: true,
    arrows: staging.adminScore.arrows,
    recordedBy: staging.userScore.recordedBy,
    verifiedBy: 'CongHuann',
    approvedBy: 'CongHuann',
    approvedAt: new Date().toISOString(),
    stagingId: staging.id
  };
  
  data.scores.push(approvedScore);
  
  const stagingIndex = data.stagingScores.findIndex(s => s.id === stagingId);
  if (stagingIndex !== -1) {
    data.stagingScores[stagingIndex].status = 'approved';
    data.stagingScores[stagingIndex].approvedAt = new Date().toISOString();
  }
  
  saveData(data);
  
  alert('✅ Score approved and saved!');
  
  // Reset and reload
  currentStagingId = null;
  document.getElementById('selectStagingScore').value = '';
  document.getElementById('selectedScoreInfo').style.display = 'none';
  document.getElementById('scoreEntryWrapper').style.display = 'none';
  
  renderStagingScores();
}

// ========== Reject Score ==========
function rejectScore(stagingId) {
  const reason = prompt('Reason for rejection (optional):');
  if (reason === null) return;
  
  const data = loadData();
  const stagingIndex = data.stagingScores.findIndex(s => s.id === stagingId);
  
  if (stagingIndex !== -1) {
    data.stagingScores[stagingIndex].status = 'rejected';
    data.stagingScores[stagingIndex].rejectedAt = new Date().toISOString();
    data.stagingScores[stagingIndex].rejectionReason = reason || 'No reason provided';
  }
  
  saveData(data);
  
  alert('❌ Score rejected');
  
  // Reset if current
  if (currentStagingId === stagingId) {
    currentStagingId = null;
    document.getElementById('selectStagingScore').value = '';
    document.getElementById('selectedScoreInfo').style.display = 'none';
    document.getElementById('scoreEntryWrapper').style.display = 'none';
  }
  
  renderStagingScores();
}

// ========== Delete Staging ==========
function deleteStaging(stagingId) {
  if (!confirm('⚠️ Delete this staging score permanently?')) return;
  
  const data = loadData();
  data.stagingScores = data.stagingScores.filter(s => s.id !== stagingId);
  saveData(data);
  
  alert('✅ Deleted');
  
  // Reset if current
  if (currentStagingId === stagingId) {
    currentStagingId = null;
    document.getElementById('selectStagingScore').value = '';
    document.getElementById('selectedScoreInfo').style.display = 'none';
    document.getElementById('scoreEntryWrapper').style.display = 'none';
  }
  
  renderStagingScores();
}

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Approve Scores page loaded');
  renderStagingScores();
  
  document.getElementById('statusFilter')?.addEventListener('change', (e) => {
    renderStagingScores(e.target.value);
  });
});