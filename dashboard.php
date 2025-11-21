<?php
$conn = new mysqli("localhost", "root", "lenam2005@", "Archery_final");
if ($conn->connect_error) die("DB error");

// Đúng tên bảng chữ thường
$total_archers      = $conn->query("SELECT COUNT(*) FROM archer")->fetch_row()[0];
$total_competitions = $conn->query("SELECT COUNT(*) FROM COMPETITION")->fetch_row()[0];
$scores             = $conn->query("SELECT COUNT(*) as c, AVG(TotalScore) as a FROM SCORE_HEADER")->fetch_assoc();
$total_scores       = $scores['c'];
$avg_score          = $total_scores > 0 ? round($scores['a']) : 0;

// Recent 5 scores
$recent = $conn->query("
    SELECT sh.TotalScore, sh.DateShot, a.FullName, COALESCE(c.Name,'Practice') as comp 
    FROM SCORE_HEADER sh 
    JOIN archer a ON a.Archer_ID = sh.ArcherID 
    LEFT JOIN COMPETITION c ON c.CompetitionID = sh.CompetitionID 
    ORDER BY sh.DateShot DESC, sh.ScoreID DESC LIMIT 5");

// Chart data
$chart = $conn->query("SELECT DateShot, TotalScore FROM SCORE_HEADER ORDER BY DateShot DESC LIMIT 50");
$labels = $values = [];
while ($r = $chart->fetch_assoc()) {
    $labels[] = date('d/m', strtotime($r['DateShot']));
    $values[] = $r['TotalScore'];
}
$labels = array_reverse($labels);
$values = array_reverse($values);
?>

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Archery Score System — Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <link rel="stylesheet" href="/style/style.css">
</head>
<body>
  <div class="container">
    <div id="header-placeholder"></div>
    <header class="topbar"></header>

    <main class="dashboard">
      <h2>Dashboard</h2>
      <p class="sub">Overview of your archery data</p>

      <section class="cards">
        <div class="card"><div><div class="meta">Total Archers</div><div class="value"><?php echo $total_archers; ?></div></div><div class="icon">👥</div></div>
        <div class="card"><div><div class="meta">Competitions</div><div class="value"><?php echo $total_competitions; ?></div></div><div class="icon">🏆</div></div>
        <div class="card"><div><div class="meta">Approved Scores</div><div class="value"><?php echo $total_scores; ?></div></div><div class="icon">🎯</div></div>
        <div class="card"><div><div class="meta">Average Score</div><div class="value"><?php echo $avg_score; ?></div></div><div class="icon">📈</div></div>
      </section>

      <section class="chart-card">
        <div class="chart-title">Score Trend</div>
        <div class="chart-wrapper"><canvas id="scoreChart" height="160"></canvas></div>
      </section>

      <section class="recent-card">
        <div class="recent-header"><h3>Recent Scores</h3><div class="muted">Showing latest 5</div></div>
        <div id="recentList">
          <?php while ($r = $recent->fetch_assoc()): ?>
            <div class="score-item">
              <div class="score-info">
                <div class="name"><?php echo htmlspecialchars($r['FullName']); ?></div>
                <div class="meta"><?php echo htmlspecialchars($r['comp']); ?> • <?php echo date('d/m/Y', strtotime($r['DateShot'])); ?></div>
              </div>
              <div class="score-val"><?php echo $r['TotalScore']; ?></div>
            </div>
          <?php endwhile; ?>
        </div>
      </section>

      <footer>Dữ liệu lấy trực tiếp từ MySQL – Database: Archery_final</footer>
    </main>
  </div>

  <script src="javascript/layout.js"></script>
  <script>
    new Chart(document.getElementById('scoreChart').getContext('2d'), {
      type: 'line',
      data: {
        labels: <?php echo json_encode($labels); ?>,
        datasets: [{ label:'Score', data: <?php echo json_encode($values); ?>, borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,0.1)', tension:0.3, fill:true }]
      },
      options: { responsive:true, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true} } }
    });
  </script>
</body>
</html>