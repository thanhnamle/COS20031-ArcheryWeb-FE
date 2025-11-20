// main.js - Dashboard dùng dữ liệu thật từ MySQL
const API_BASE = '../archery-api';

async function loadDashboardData() {
    try {
        const [archers, scores, competitions] = await Promise.all([
            fetch(`${API_BASE}/archers.php`).then(r => r.json()),
            fetch(`${API_BASE}/scores.php`).then(r => r.json()),
            fetch(`${API_BASE}/competitions.php`).then(r => r.json()).catch(() => [])
        ]);

        // Cập nhật 4 ô số liệu
        document.getElementById('totalArchers').textContent = archers.length;
        document.getElementById('totalCompetitions').textContent = competitions.length || 0;
        document.getElementById('totalApprovedScores').textContent = scores.length;
        document.getElementById('averageScore').textContent = scores.length > 0 
            ? Math.round(scores.reduce((s,v) => s + v.TotalScore, 0) / scores.length) 
            : 0;

        // Recent Scores (hiển thị 5 cái mới nhất)
        const recentList = document.getElementById('recentScoresList');
        if (recentList) {
            recentList.innerHTML = '';
            const recent = scores.slice(0, 5);
            if (recent.length === 0) {
                recentList.innerHTML = '<div class="no-data">Chưa có điểm nào</div>';
            } else {
                recent.forEach(s => {
                    const div = document.createElement('div');
                    div.className = 'score-item';
                    div.innerHTML = `
                        <div class="score-info">
                            <div class="name">${s.archerName || 'Unknown'}</div>
                            <div class="meta">${s.roundName || 'Unknown Round'} • ${new Date(s.date).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <div class="score-val">${s.TotalScore}</div>
                    `;
                    recentList.appendChild(div);
                });
            }
        }

        // Biểu đồ Score Trend
        renderChart(scores);

    } catch (err) {
        console.error('Lỗi load dashboard:', err);
        alert('Không kết nối được database. Kiểm tra folder archery-api!');
    }
}

function renderChart(scores) {
    const ctx = document.getElementById('scoreChart');
    if (!ctx) return;

    const sorted = scores.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(s => new Date(s.date).toLocaleDateString('vi-VN'));
    const data = sorted.map(s => s.TotalScore);

    // Xóa chart cũ nếu có
    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['Chưa có dữ liệu'],
            datasets: [{
                label: 'Điểm số',
                data: data.length ? data : [0],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, suggestedMax: 1440 }
            }
        }
    });
}

// Tự động chạy khi mở dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();

    // Xóa nút Reset + Export cũ (không cần nữa)
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    if (resetBtn) resetBtn.style.display = 'none';
    if (exportBtn) exportBtn.style.display = 'none';
});