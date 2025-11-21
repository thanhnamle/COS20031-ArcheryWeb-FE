// add-score.js
// Logic for add-score.html page
// USER submits scores for admin review (ONLY FOR THEMSELVES)

const STORAGE_KEY = "archery_demo_data_v1";
const AUTH_KEY = "archery_auth_user";

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

function getAuthUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

// ========== Auto-detect Face Size ==========
function autoDetectFaceSize(distance) {
  const distanceNum = parseInt(distance);
  if (isNaN(distanceNum)) return '80cm';
  if (distanceNum >= 70) return '122cm';
  if (distanceNum >= 60) return '122cm';
  if (distanceNum >= 50) return '80cm';
  if (distanceNum >= 30) return '80cm';
  if (distanceNum >= 18) return '60cm';
  return '40cm';
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
      face = autoDetectFaceSize(distance);
    }
    
    result.push({ arrows, distance, ends, face });
  });
  
  return result;
}

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
  const user = getAuthUser();
  
  // Check if user is logged in
  if (!user) {
    alert('❌ You must be logged in to add scores!');
    window.location.href = '/login.html';
    return;
  }
  
  // Check if user needs to register as archer
  if (user.role === 'archer' && !user.archerId) {
    showRegistrationModal(user);
  } else {
    initPage(user);
  }
});

function initPage(user) {
  const data = loadData();
  
  // Display current archer info
  displayCurrentArcher(user);
  
  // Populate dropdowns (NO ARCHER DROPDOWN)
  populateRounds();
  populateCompetitions();
  
  // Set default date/time
  const now = new Date();
  const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  const recordedInput = document.getElementById('recordedAt');
  if (recordedInput) recordedInput.value = localIso;
  
  updateDateDisplay();
  
  // Attach listeners (NO ARCHER CHANGE LISTENER)
  document.getElementById('selectRound')?.addEventListener('change', handleRoundChange);
  document.getElementById('selectCompetition')?.addEventListener('change', updateCompetitionDisplay);
  document.getElementById('recordedAt')?.addEventListener('change', updateDateDisplay);
  
  renderScoreTable(null);
}

// ========== Display Current Archer Info (WITH AUTO-SYNC) ==========
function displayCurrentArcher(user) {
  const displayElement = document.getElementById('currentArcherDisplay');
  if (!displayElement) return;
  
  const data = loadData();
  if (!data || !data.archers) {
    displayElement.textContent = 'Unknown Archer';
    return;
  }
  
  const archer = data.archers.find(a => a.id === user.archerId);
  
  if (archer) {
    // ✅ AUTO-SYNC NAME FROM AUTH TO ARCHER PROFILE
    const nameParts = (user.name || "User").split(' ');
    const authFirstName = nameParts[0];
    const authLastName = nameParts.slice(1).join(' ') || "";
    
    // Check if name is different → Update
    if (archer.first !== authFirstName || archer.last !== authLastName) {
      console.log(`🔄 Syncing name: ${archer.first} ${archer.last} → ${authFirstName} ${authLastName}`);
      archer.first = authFirstName;
      archer.last = authLastName;
      archer.updatedAt = new Date().toISOString();
      saveData(data);
      console.log('✅ Archer name synced with auth user');
    }
    
    // Sync email if different
    if (archer.email !== user.email) {
      archer.email = user.email;
      archer.updatedAt = new Date().toISOString();
      saveData(data);
      console.log('✅ Archer email synced');
    }
    
    displayElement.textContent = `${archer.first} ${archer.last}`;
  } else {
    displayElement.textContent = 'Unknown Archer';
  }
}

// ========== Registration Logic ==========
function showRegistrationModal(user) {
  const modal = document.getElementById('registrationModal');
  if (!modal) return;

  const nameParts = (user.name || "User").split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || "Archer";

  document.getElementById('regFirstName').value = firstName;
  document.getElementById('regLastName').value = lastName;

  // ✅ CHECK IF ARCHER ALREADY EXISTS (by email)
  const data = loadData();
  const existingArcher = data.archers ? data.archers.find(a => a.email === user.email) : null;

  if (existingArcher) {
    // ✅ PRE-FILL EXISTING DATA
    document.getElementById('regDob').value = existingArcher.dob || '';
    document.getElementById('regGender').value = existingArcher.gender || '';
    document.getElementById('regEquipment').value = existingArcher.defaultEquipment || '';
    document.getElementById('regClub').value = existingArcher.club || '';
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const form = document.getElementById('registrationForm');
  form.onsubmit = (e) => {
    e.preventDefault();
    completeRegistration(user);
  };
}

function completeRegistration(user) {
  const dob = document.getElementById('regDob').value;
  const gender = document.getElementById('regGender').value;
  const equipment = document.getElementById('regEquipment').value.trim();
  const club = document.getElementById('regClub').value.trim();
  const first = document.getElementById('regFirstName').value;
  const last = document.getElementById('regLastName').value;

  if (!dob || !gender) {
    alert('❌ Please fill in Date of Birth and Gender!');
    return;
  }

  const data = loadData();
  if (!data.archers) data.archers = [];

  //  CHECK IF ARCHER ALREADY EXISTS (by email)
  const existingArcher = data.archers.find(a => a.email === user.email);

  if (existingArcher) {
    //  UPDATE EXISTING ARCHER (ONLY NAME + OPTIONAL FIELDS)
    existingArcher.first = first;
    existingArcher.last = last;
    existingArcher.dob = dob;
    existingArcher.gender = gender;
    existingArcher.defaultEquipment = equipment;
    existingArcher.club = club;
    existingArcher.updatedAt = new Date().toISOString();

    // Update auth user's archerId
    user.archerId = existingArcher.id;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));

    saveData(data);

    alert("✅ Profile updated! You can now submit scores.");
  } else {
    // CREATE NEW ARCHER
    const newId = `a${Date.now()}`;
    const newArcher = {
      id: newId,
      first: first,
      last: last,
      email: user.email,
      dob: dob,
      gender: gender,
      country: 'VN', // Default country
      defaultEquipment: equipment,
      club: club,
      createdAt: new Date().toISOString()
    };

    data.archers.push(newArcher);
    saveData(data);

    user.archerId = newId;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));

    alert("✅ Registration complete! You can now submit scores.");
  }

  document.getElementById('registrationModal').style.display = 'none';
  document.body.style.overflow = 'auto';
  
  initPage(user);
}

// ========== Populate Dropdowns (NO ARCHER DROPDOWN) ==========
function populateRounds() {
  const data = loadData();
  if (!data || !data.rounds) return;
  
  const select = document.getElementById('selectRound');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select round...</option>';
  data.rounds.forEach(round => {
    const option = document.createElement('option');
    option.value = round.id;
    option.textContent = round.name;
    select.appendChild(option);
  });
}

function populateCompetitions() {
  const data = loadData();
  if (!data || !data.competitions) return;
  
  const select = document.getElementById('selectCompetition');
  if (!select) return;
  
  select.innerHTML = '<option value="">Practice (No competition)</option>';
  data.competitions.forEach(comp => {
    const option = document.createElement('option');
    option.value = comp.id;
    option.textContent = comp.name;
    select.appendChild(option);
  });
}

// ========== Render Score Tables ==========
function renderScoreTable(round) {
  const container = document.getElementById('scoreTablesContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!round) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#6b7280;">
        <i class="fas fa-bullseye" style="font-size:3rem;margin-bottom:1rem;opacity:0.3;"></i>
        <p style="font-size:1.1rem;margin:0;">Please select a round to start entering scores</p>
      </div>
    `;
    return;
  }
  
  let ranges = parseRoundDetails(round.details);
  
  if (ranges.length === 0) {
    ranges = [
      { arrows: 36, distance: '30m', ends: 6, face: '80cm' },
      { arrows: 36, distance: '30m', ends: 6, face: '80cm' }
    ];
  }
  
  const totalArrows = ranges.reduce((sum, r) => sum + r.arrows, 0);
  const totalEnds = ranges.reduce((sum, r) => sum + r.ends, 0);
  
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
  
  ranges.forEach((range, index) => {
    renderSingleRange(container, index + 1, range);
  });
  
  renderGrandTotal(container);
  attachInputListeners();
  calculateTotals();
}

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
        <tbody id="range${rangeNum}Body"></tbody>
      </table>
    </div>
  `;
  
  container.appendChild(rangeSection);
  
  const tbody = document.getElementById(`range${rangeNum}Body`);
  
  for (let endNum = 1; endNum <= range.ends; endNum++) {
    const row = document.createElement('tr');
    let html = `<td class="text-center"><strong>${endNum}</strong></td>`;
    
    for (let arrowNum = 1; arrowNum <= 6; arrowNum++) {
      html += `<td><input type="number" class="score-input" data-range="${rangeNum}" data-end="${endNum}" data-arrow="${arrowNum}" min="0" max="10" value="0" /></td>`;
    }
    
    html += `<td class="text-center end-total" id="r${rangeNum}e${endNum}total">0</td>`;
    row.innerHTML = html;
    tbody.appendChild(row);
  }
  
  const totalRow = document.createElement('tr');
  totalRow.classList.add('range-total-row');
  totalRow.innerHTML = `
    <td class="text-center" style="background:#f9fafb;"><strong>Range Total</strong></td>
    <td colspan="6" style="background:#f9fafb;"></td>
    <td class="text-center range-total" id="range${rangeNum}Total" style="background:#f9fafb;"><strong>0</strong></td>
  `;
  tbody.appendChild(totalRow);
}

function renderGrandTotal(container) {
  const grandTotalSection = document.createElement('div');
  grandTotalSection.className = 'grand-total-section';
  grandTotalSection.style.marginTop = '2rem';
  
  grandTotalSection.innerHTML = `
    <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:1.5rem;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <h3 style="margin:0;color:white;display:flex;align-items:center;gap:0.5rem;">
          <i class="fas fa-trophy" style="font-size:1.5rem;"></i> GRAND TOTAL
        </h3>
        <div style="display:flex;gap:2rem;align-items:center;">
          <div style="text-align:right;">
            <div style="color:rgba(255,255,255,0.8);font-size:0.875rem;">Total Score</div>
            <div id="grandTotal" style="font-size:2.5rem;font-weight:800;color:white;line-height:1;">0</div>
          </div>
          <div style="text-align:right;">
            <div style="color:rgba(255,255,255,0.8);font-size:0.875rem;">X's</div>
            <div id="grandXCount" style="font-size:2rem;font-weight:700;color:#10b981;line-height:1;">0</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(grandTotalSection);
}

// ========== Attach Input Listeners ==========
function attachInputListeners() {
  const inputs = document.querySelectorAll('.score-input');
  
  inputs.forEach(input => {
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  });
  
  const newInputs = document.querySelectorAll('.score-input');
  
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
        const allInputs = Array.from(document.querySelectorAll('.score-input'));
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
  const inputs = document.querySelectorAll('.score-input');
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
      const endCell = document.getElementById(`r${rangeNum}e${endNum}total`);
      if (endCell) endCell.textContent = endTotal;
      rangeTotal += endTotal;
    });
    
    const rangeCell = document.getElementById(`range${rangeNum}Total`);
    if (rangeCell) rangeCell.innerHTML = `<strong>${rangeTotal}</strong>`;
  });
  
  const grandTotalCell = document.getElementById('grandTotal');
  if (grandTotalCell) grandTotalCell.textContent = grandTotal;
  
  const grandXCountCell = document.getElementById('grandXCount');
  if (grandXCountCell) grandXCountCell.textContent = grandXCount;
  
  const totalScoreDisplay = document.getElementById('totalScoreDisplay');
  if (totalScoreDisplay) totalScoreDisplay.textContent = grandTotal;
}

// ========== Update Displays ==========
function updateCompetitionDisplay() {
  const competitionId = document.getElementById('selectCompetition').value;
  const data = loadData();
  
  if (competitionId) {
    const comp = data.competitions.find(c => c.id === competitionId);
    document.getElementById('tournamentDisplay').textContent = comp ? comp.name : 'Practice';
  } else {
    document.getElementById('tournamentDisplay').textContent = 'Practice';
  }
}

function updateDateDisplay() {
  const dateValue = document.getElementById('recordedAt').value;
  if (dateValue) {
    const date = new Date(dateValue);
    const formatted = date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    document.getElementById('submittedDisplay').textContent = formatted;
  }
}

function handleRoundChange() {
  const roundId = document.getElementById('selectRound').value;
  const data = loadData();
  const round = data.rounds.find(r => r.id === roundId);
  
  document.getElementById('roundDisplay').textContent = round ? round.name : '-';
  
  if (!roundId) {
    renderScoreTable(null);
    return;
  }
  
  renderScoreTable(round);
}

// ========== Submit Score (AUTO USE CURRENT USER'S ARCHER ID) ==========
function approveScore() {
  const user = getAuthUser();
  
  if (!user || !user.archerId) {
    alert('❌ Archer profile not found! Please complete registration.');
    return;
  }
  
  const archerId = user.archerId;
  const roundId = document.getElementById('selectRound').value;
  const competitionId = document.getElementById('selectCompetition').value || null;
  const recordedAt = document.getElementById('recordedAt').value;
  
  if (!roundId) {
    alert('❌ Please select a round!');
    return;
  }
  
  if (!recordedAt) {
    alert('❌ Please select date and time!');
    return;
  }
  
  const data = loadData();
  const round = data.rounds.find(r => r.id === roundId);
  const archer = data.archers.find(a => a.id === archerId);
  
  const inputs = document.querySelectorAll('.score-input');
  const arrows = [];
  
  inputs.forEach(input => {
    arrows.push(parseInt(input.value) || 0);
  });
  
  const total = arrows.reduce((sum, val) => sum + val, 0);
  const xCount = arrows.filter(s => s === 10).length;
  
  if (total === 0) {
    if (!confirm('⚠️ Total score is 0. Do you want to save anyway?')) {
      return;
    }
  }
  
  if (!data.stagingScores) data.stagingScores = [];
  
  const stagingScore = {
    id: `st${Date.now()}`,
    archerId: archerId,
    competitionId: competitionId,
    roundId: roundId,
    roundSnapshot: round ? round.name : 'Unknown',
    userScore: {
      arrows: arrows,
      total: total,
      xCount: xCount,
      recordedBy: user.username || user.email,
      recordedAt: new Date(recordedAt).toISOString()
    },
    adminScore: null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.stagingScores.push(stagingScore);
  saveData(data);
  
  const archerName = archer ? `${archer.first} ${archer.last}` : 'You';
  alert(`✅ Score submitted for admin review!\n\n` +
        `Archer: ${archerName}\n` +
        `Round: ${round ? round.name : 'Unknown'}\n` +
        `Total: ${total} points\n` +
        `X's: ${xCount}\n\n` +
        `Your score will appear on Archers page after admin approval.`);
  
  window.location.href = '/archers.php';
}

function disapproveScore() {
  if (confirm('⚠️ Are you sure you want to discard this score?\n\nAll entered data will be lost.')) {
    window.location.href = '/archers.php';
  }
}