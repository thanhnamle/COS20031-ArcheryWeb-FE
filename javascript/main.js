/*
  Archery Dashboard demo
  - Data stored in localStorage key "archery_demo_data_v1"
  - Minimal model: archers, competitions, rounds, scores (scores include ends/arrows)
  - This demo creates seed data on first run. Use Reset to re-seed.
*/

const STORAGE_KEY = "archery_demo_data_v1";

// Seed data
function seedData(){
  const archers = [
    { id: "a1", first: "James", last: "Wilson", dob: "1992-05-10", gender:"M" },
    { id: "a2", first: "Evan", last: "Thompson", dob: "2001-08-21", gender:"M" },
    { id: "a3", first: "Maria", last: "Nguyen", dob: "1998-02-14", gender:"F" }
  ];

  const rounds = [
    { id: "r1", name: "WA 720", description: "72 arrows, 4 distances", distances:[70,60,50,30], endsPerDistance:6, arrowsPerEnd:3 },
    { id: "r2", name: "WA 1440", description: "1440 round", distances:[90,70,50,30], endsPerDistance:12, arrowsPerEnd:3 }
  ];

  const competitions = [
    { id:"c1", name:"Club Indoor Cup", start:"2024-11-01", end:"2024-11-01", roundId:"r1" }
  ];

  const scores = [
    {
      id:"s1", archerId:"a1", roundId:"r1", roundSnapshot:"WA 720",
      competitionId:"c1", recordedAt:"2024-11-01T10:10:00", isApproved:true,
      total:702, xCount:42, categorySnapshot:"Senior", equipmentSnapshot:"Recurve",
      ends: buildEndsForTotal(702,72)
    },
    {
      id:"s2", archerId:"a2", roundId:"r1", roundSnapshot:"WA 720",
      competitionId:null, recordedAt:"2024-10-20T15:40:00", isApproved:false,
      total:610, xCount:20, categorySnapshot:"Senior", equipmentSnapshot:"Recurve",
      ends: buildEndsForTotal(610,72)
    },
    {
      id:"s3", archerId:"a3", roundId:"r2", roundSnapshot:"WA 1440",
      competitionId:null, recordedAt:"2024-09-12T09:20:00", isApproved:false,
      total:648, xCount:25, categorySnapshot:"Senior", equipmentSnapshot:"Compound",
      ends: buildEndsForTotal(648,144)
    }
  ];

  const payload = { archers, rounds, competitions, scores, createdAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

// Helper to build dummy ends/arrows list from total (for demo)
function buildEndsForTotal(total, arrowsCount){
  const arr = [];
  let remaining = total;
  for(let i=0;i<arrowsCount;i++){
    const remainArrows = arrowsCount - i;
    const avg = Math.max(0, Math.round(remaining / remainArrows));
    const val = Math.min(10, Math.max(0, avg + Math.round((Math.random()-0.5)*2)));
    arr.push(val);
    remaining -= val;
  }
  const ends = [];
  for(let i=0;i<arr.length;i+=3){
    ends.push({ arrows: arr.slice(i,i+3), endTotal: arr.slice(i,i+3).reduce((a,b)=>a+b,0) });
  }
  return ends;
}

function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return seedData();
  try{ return JSON.parse(raw); } catch(e){ return seedData(); }
}

function saveData(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

const data = loadData();

function computeMetrics(dt){
  const totalArchers = dt.archers.length;
  const totalCompetitions = dt.competitions.length;
  const approvedScores = dt.scores.filter(s => s.isApproved).length;
  const avgScore = Math.round((dt.scores.reduce((a,b)=>a+b.total,0) / Math.max(1, dt.scores.length)));
  return { totalArchers, totalCompetitions, approvedScores, avgScore };
}

function renderMetrics(){
  const m = computeMetrics(data);
  document.getElementById("totalArchers").textContent = m.totalArchers;
  document.getElementById("totalCompetitions").textContent = m.totalCompetitions;
  document.getElementById("approvedScores").textContent = m.approvedScores;
  document.getElementById("avgScore").textContent = m.avgScore;
}

function renderRecent(){
  const listContainer = document.getElementById("recentList");
  listContainer.innerHTML = "";
  const sorted = data.scores.slice().sort((a,b)=> new Date(b.recordedAt) - new Date(a.recordedAt)).slice(0,5);
  for(const s of sorted){
    const ar = data.archers.find(a=>a.id===s.archerId) || {first:"Unknown", last:""};
    const comp = s.competitionId ? (data.competitions.find(c=>c.id===s.competitionId)?.name || "") : "";
    const dateStr = new Date(s.recordedAt).toLocaleDateString();
    const div = document.createElement("div");
    div.className = "score-item";
    div.innerHTML = `
      <div class="score-left">
        <div class="avatar">${(ar.first[0]||"A")+(ar.last[0]||"")}</div>
        <div class="score-info">
          <div class="name">${ar.first} ${ar.last}</div>
          <div class="meta">${s.roundSnapshot} • ${dateStr}${comp ? " • " + comp : ""}</div>
        </div>
      </div>
      <div class="score-right">
        <div class="score-val">${s.total}</div>
        <div class="score-sub">${s.isApproved ? "Approved" : "Staged"} • ${s.xCount}X</div>
      </div>
    `;
    listContainer.appendChild(div);
  }
}

let chartInstance = null;
function renderChart(){
  const ctx = document.getElementById("scoreChart").getContext("2d");
  const scoresSorted = data.scores.slice().sort((a,b)=> new Date(a.recordedAt) - new Date(b.recordedAt));
  const labels = scoresSorted.map(s => new Date(s.recordedAt).toLocaleDateString());
  const scores = scoresSorted.map(s=>s.total);
  if(chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total Score',
        data: scores,
        tension: 0.2,
        fill:false,
        pointRadius:6,
        borderWidth:2,
        borderColor:'#2563eb',
        backgroundColor:'#2563eb'
      }]
    },
    options: {
      plugins:{ legend:{ display:false } },
      scales: {
        y: { beginAtZero:true, suggestedMax: 720 },
        x: { ticks: { maxRotation:0 } }
      },
      responsive:true,
      maintainAspectRatio:false
    }
  });
}

// Buttons
document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("exportBtn").addEventListener("click", ()=>{
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "archery_data_export.json"; a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("resetBtn").addEventListener("click", ()=>{
    if(!confirm("Reset demo data? This will overwrite local changes.")) return;
    const nd = seedData();
    Object.assign(data, nd);
    saveData(nd);
    refreshAll();
  });

  refreshAll();
});

// initial render helpers
function refreshAll(){
  renderMetrics();
  renderRecent();
  renderChart();
}

// Save on unload
window.addEventListener("beforeunload", ()=> saveData(data));
