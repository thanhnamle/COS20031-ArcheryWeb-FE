import { apiGet } from './api.js';

let archer = null;
let scores = [];

async function loadArcherDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) return alert('Không tìm thấy archer');

  try {
    const [aRes, sRes] = await Promise.all([
      apiGet(`archer-detail.php?id=${id}`), // bạn tạo thêm file này nếu cần, hoặc dùng archers.php + filter
      apiGet('scores.php')
    ]);

    // Giả sử dùng archers.php + filter client-side
    const allArchers = await apiGet('archers.php');
    archer = allArchers.find(a => a.id == id);
    scores = sRes.filter(s => s.archerName === archer.name);

    if (!archer) return alert('Archer không tồn tại');

    renderHeader();
    renderOverall();
    renderHistory();
    renderChart();

  } catch (err) {
    alert('Lỗi load dữ liệu: ' + err.message);
  }
}

function renderHeader() {
  document.getElementById('archerName').textContent = archer.name;
  document.getElementById('archerCategory').textContent = archer.category;
  document.getElementById('archerClass').textContent = archer.class;
  document.getElementById('archerEquipment').textContent = archer.equipment;
  // ... thêm avatar, age, country nếu có
}

// Đoạn render biểu đồ – đã sửa 100% đúng cú pháp
function renderChart() {
  const ctx = document.getElementById('scoreChart');
  if (!ctx) return;

  const sorted = scores.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(s => new Date(s.date).toLocaleDateString('vi-VN'));
  const dataPoints = sorted.map(s => s.TotalScore);

  // Kiểm tra nếu đã có chart rồi thì destroy trước
  if (window.myChart instanceof Chart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Điểm số',
        data: dataPoints,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2563eb',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          suggestedMin: 0,
          suggestedMax: 1440
        }
      }
    }
  });
}

// gọi khi load
document.addEventListener('DOMContentLoaded', loadArcherDetail);