// archer-detail.js
// Logic for archer-detail.html
// - Load data from localStorage key "archery_demo_data_v1"
// - Render profile header, Overall tab, Performance tab (per-match table + summaries), History tab

const STORAGE_KEY = "archery_demo_data_v1";
let currentArcher = null;

// -------------------- Data helpers --------------------
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
function getArcherIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}

// -------------------- Utility helpers --------------------
function formatDateISO(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB");
  } catch {
    return dateStr;
  }
}
function formatDateTimeISO(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return dateStr;
  }
}
function escapeHTML(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function calculateAge(dobISO, asOfDate = new Date()) {
  if (!dobISO) return null;
  const dob = new Date(dobISO);
  let age = asOfDate.getFullYear() - dob.getFullYear();
  const m = asOfDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && asOfDate.getDate() < dob.getDate())) age--;
  return age;
}
function computeCategory(dobISO, gender, asOfDate = new Date()) {
  if (!dobISO || !gender) return "";
  const age = calculateAge(dobISO, asOfDate);
  if (age === null || isNaN(age)) return "";
  if (age >= 70) return `${age}+ ${gender === "F" ? "Female" : "Male"}`;
  if (age >= 60) return `${age}+ ${gender === "F" ? "Female" : "Male"}`;
  if (age >= 50) return `${age}+ ${gender === "F" ? "Female" : "Male"}`;
  if (age < 14) return `Under 14 ${gender === "F" ? "Female" : "Male"}`;
  if (age < 16) return `Under 16 ${gender === "F" ? "Female" : "Male"}`;
  if (age < 18) return `Under 18 ${gender === "F" ? "Female" : "Male"}`;
  if (age < 21) return `Under 21 ${gender === "F" ? "Female" : "Male"}`;
  return `${gender === "F" ? "Female Open" : "Male Open"}`;
}

// -------------------- Domain helpers --------------------
function getArcherStats(archerId, data) {
  const scores = (data.scores || []).filter(s => s.archerId === archerId);
  if (!scores.length) return { totalScores: 0, bestScore: "-", avgScore: "-", totalXs: 0, scores: [] };
  const totalScores = scores.length;
  const bestScore = Math.max(...scores.map(s => Number(s.total || 0)));
  const avgScore = Math.round(scores.reduce((a, b) => a + Number(b.total || 0), 0) / totalScores);
  const totalXs = scores.reduce((a, b) => a + Number(b.xCount || 0), 0);
  return { totalScores, bestScore, avgScore, totalXs, scores };
}
function getCompetitionName(id, data) {
  if (!id) return "";
  const comp = (data.competitions || []).find(c => c.id === id);
  return comp ? comp.name : "";
}

// -------------------- Rendering --------------------
function renderProfileAvatar(archer) {
  const avatarEl = document.getElementById("profileAvatar");
  if (!avatarEl) return;
  const initials = `${(archer.first || "").charAt(0)}${(archer.last || "").charAt(0)}`.toUpperCase();
  avatarEl.textContent = initials || "??";
}

function renderHeader(archer) {
  // header fields
  document.getElementById("archerName").textContent = `${archer.first || ""} ${archer.last || ""}`.trim() || "—";
  document.getElementById("archerGender").textContent = archer.gender || "—";
  const age = calculateAge(archer.dob);
  document.getElementById("archerAge").textContent = age !== null ? `${age}` : "—";
  document.getElementById("archerDOB").textContent = archer.dob ? formatDateISO(archer.dob) : "—";
  renderProfileAvatar(archer);
}

function renderOverallPanel(archer, data) {
  // overall detail fields
  document.getElementById("fieldId").textContent = archer.id || "—";
  document.getElementById("fieldFirst").textContent = archer.first || "—";
  document.getElementById("fieldLast").textContent = archer.last || "—";
  document.getElementById("fieldDob").textContent = archer.dob ? formatDateISO(archer.dob) : "—";
  document.getElementById("fieldGender").textContent = archer.gender || "—";
  document.getElementById("fieldEquipment").textContent = archer.defaultEquipment || "—";
  document.getElementById("fieldClub").textContent = archer.club || "—";
  document.getElementById("createAt").textContent = archer.createdAt ? new Date(archer.createdAt).toLocaleString() : "—";
  document.getElementById("lastUpdate").textContent = archer.updatedAt ? new Date(archer.updatedAt).toLocaleString() : "—";

  // header category (computed)
  const category = computeCategory(archer.dob, archer.gender);
  // place category in a visible spot if you want; profile-meta currently contains gender/age/DOB so we leave it.
  // If you want to place category into header, you can add an element or reuse archerGender.
  const stats = getArcherStats(archer.id, data);

  // If the detail UI has quick stats in a separate place, fill them here.
  // Many templates use elements with ids statTotalScores, statBestScore, statTotalXs — guard existence:
  const elTotal = document.getElementById("statTotalScores");
  if (elTotal) elTotal.textContent = stats.totalScores;
  const elBest = document.getElementById("statBestScore");
  if (elBest) elBest.textContent = stats.bestScore;
  const elXs = document.getElementById("statTotalXs");
  if (elXs) elXs.textContent = stats.totalXs;
}

function renderPerformancePanel(archerId, data) {
  const stats = getArcherStats(archerId, data);
  const container = document.querySelector("#tab-performance .grid-2 > div");
  if (!container) return;

  // build the per-match table and summary
  const scores = stats.scores.slice().sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)); // newest first
  let sum = 0, sumXs = 0, best = scores.length ? -Infinity : "-";
  scores.forEach(s => {
    const t = Number(s.total || 0);
    sum += t;
    sumXs += Number(s.xCount || 0);
    if (t > best) best = t;
  });
  const avg = stats.totalScores ? Math.round(sum / stats.totalScores) : "-";
  // replace container's innerHTML with details table + match table
  container.innerHTML = `
    <div class="performance-summary" style="margin-bottom:1rem;display:flex;gap:1rem;flex-wrap:wrap;">
      <div class="stat-card small"><div class="stat-label">Total</div><div class="stat-value" id="perfTotal">${sum || 0}</div></div>
      <div class="stat-card small"><div class="stat-label">Best</div><div class="stat-value" id="perfBest">${best === -Infinity ? "-" : best}</div></div>
      <div class="stat-card small"><div class="stat-label">Average</div><div class="stat-value" id="perfAvg">${avg}</div></div>
      <div class="stat-card small"><div class="stat-label">Matches</div><div class="stat-value" id="perfCount">${scores.length}</div></div>
    </div>
    <div class="match-table-wrapper">
      <table class="match-table" style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:0.5rem;color:#6b7280">Date</th>
            <th style="text-align:left;padding:0.5rem;color:#6b7280">Round</th>
            <th style="text-align:left;padding:0.5rem;color:#6b7280">Competition</th>
            <th style="text-align:center;padding:0.5rem;color:#6b7280">Total</th>
            <th style="text-align:center;padding:0.5rem;color:#6b7280">X's</th>
          </tr>
        </thead>
        <tbody id="performanceTableBody"></tbody>
      </table>
    </div>
  `;

  const tbody = document.getElementById("performanceTableBody");
  if (!tbody) return;
  if (!scores.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:0.75rem;color:#6b7280">No matches recorded.</td></tr>`;
    return;
  }
  tbody.innerHTML = "";
  scores.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:0.6rem 0">${escapeHTML(formatDateISO(s.recordedAt))}</td>
      <td style="padding:0.6rem 0">${escapeHTML(s.roundSnapshot || "Unknown")}</td>
      <td style="padding:0.6rem 0">${escapeHTML(getCompetitionName(s.competitionId, data) || "Practice")}</td>
      <td class="text-center" style="padding:0.6rem 0;text-align:center">${Number(s.total || 0)}</td>
      <td class="text-center" style="padding:0.6rem 0;text-align:center">${Number(s.xCount || 0)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderHistoryPanel(archerId, data) {
  const container = document.querySelector("#tab-history .grid-2 > div");
  if (!container) return;
  const scores = (data.scores || []).filter(s => s.archerId === archerId).sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  // build a simple list view
  if (!scores.length) {
    container.innerHTML = `<div style="color:#6b7280;padding:0.5rem">No scores recorded.</div>`;
    return;
  }
  const rows = scores.map(s => {
    return `
      <div class="match-row" style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border-radius:8px;background:#fff;border:1px solid #eef2f6;margin-bottom:0.5rem">
        <div style="min-width:0">
          <div style="font-weight:700;color:#111827">${escapeHTML(s.roundSnapshot || "Unknown")}</div>
          <div style="color:#6b7280;font-size:0.95rem">${escapeHTML(formatDateTimeISO(s.recordedAt))} • ${escapeHTML(getCompetitionName(s.competitionId, data) || "Practice")}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:800;color:#2563eb">${Number(s.total || 0)}</div>
          <div style="color:#6b7280;font-size:0.95rem">${Number(s.xCount || 0)} X</div>
        </div>
      </div>
    `;
  }).join("");
  container.innerHTML = rows;
}

// -------------------- Actions --------------------
function goBack() {
  window.location.href = "/pages/archers.html";
}

// -------------------- Tabs --------------------
function showTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === `tab-${name}`));
}

// -------------------- Main render --------------------
function renderArcherProfile() {
  const id = getArcherIdFromURL();
  if (!id) {
    alert("No archer id provided.");
    window.location.href = "/pages/archers.html";
    return;
  }
  const data = loadData();
  if (!data) {
    alert("No data in storage.");
    window.location.href = "/pages/archers.html";
    return;
  }
  const archer = (data.archers || []).find(a => a.id === id);
  if (!archer) {
    alert("Archer not found.");
    window.location.href = "/pages/archers.html";
    return;
  }
  currentArcher = archer;

  renderHeader(archer);
  renderOverallPanel(archer, data);
  renderPerformancePanel(archer.id, data);
  renderHistoryPanel(archer.id, data);

  // ensure default tab is shown
  showTab("overall");
}

// -------------------- Init --------------------
document.addEventListener("DOMContentLoaded", () => {
  renderArcherProfile();
});