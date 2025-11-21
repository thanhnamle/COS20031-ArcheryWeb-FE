<?php
$conn = new mysqli("localhost", "root", "lenam2005@", "Archery_final");
if ($conn->connect_error) die("DB Connection Failed");

// 1. Stats
$total = $conn->query("SELECT COUNT(*) FROM archer")->fetch_row()[0];
$male = $conn->query("SELECT COUNT(*) FROM archer WHERE Gender = 'M'")->fetch_row()[0];
$female = $conn->query("SELECT COUNT(*) FROM archer WHERE Gender = 'F'")->fetch_row()[0];
$avg_age = $conn->query("SELECT AVG(TIMESTAMPDIFF(YEAR, DateOfBirth, CURDATE())) FROM archer")->fetch_row()[0];
$avg_age = $avg_age ? round($avg_age) : 0;

// 2. All archers
$archers = $conn->query("
    SELECT a.Archer_ID, a.FullName, a.Gender, a.Country, a.DateOfBirth,
           cl.Name as className, eq.Name as equipment, cat.Name as category,
           TIMESTAMPDIFF(YEAR, a.DateOfBirth, CURDATE()) as age
    FROM archer a
    LEFT JOIN CLASS cl ON a.DefaultClassID = cl.ClassID
    LEFT JOIN EQUIPMENT eq ON a.DefaultEquipmentID = eq.EquipmentID
    LEFT JOIN CATEGORY cat ON cat.ClassID = cl.ClassID AND cat.EquipmentID = eq.EquipmentID
    ORDER BY a.Archer_ID
");

// 3. Leaderboard – Top 10 Best Score (100% chạy trên MySQL 5.7)
$best_scores = $conn->query("
    SELECT 
        a.Archer_ID,
        a.FullName,
        a.Gender,
        cl.Name AS ClassName,
        eq.Name AS Equipment,
        COALESCE(MAX(sh.TotalScore), 0) AS BestScore
    FROM archer a
    LEFT JOIN SCORE_HEADER sh ON sh.ArcherID = a.Archer_ID
    LEFT JOIN CLASS cl ON a.DefaultClassID = cl.ClassID
    LEFT JOIN EQUIPMENT eq ON a.DefaultEquipmentID = eq.EquipmentID
    GROUP BY a.Archer_ID, a.FullName, a.Gender, cl.Name, eq.Name
    HAVING BestScore > 0 OR BestScore = 0
    ORDER BY BestScore DESC
    LIMIT 10
");

// Gán rank bằng PHP (an toàn tuyệt đối)
$rank = 1;
$leaderboard_rows = [];
while ($row = $best_scores->fetch_assoc()) {
    $row['Rank'] = $rank++;
    $leaderboard_rows[] = $row;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Archery Score System — Archers</title>
    <link rel="stylesheet" href="/style/tyle.css"/>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons/css/flag-icons.min.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
    <style>
        .fi { margin-right: 6px; vertical-align: middle; font-size: 1.4em; }
        .age { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div id="header-placeholder"></div>

        <main class="archers-page" role="main">
            <div class="page-header">
                <div>
                    <h2>Archers Management</h2>
                    <p class="sub">Manage archer profiles and information</p>
                </div>
                <button class="btn-primary" onclick="alert('Chức năng thêm/sửa sẽ làm sau nhé!')">
                    <span>+</span> Add Archer
                </button>
            </div>

            <!-- Stats Cards -->
            <section class="cards">
                <div class="card"><div><div class="meta">Total Archers</div><div class="value"><?= $total ?></div></div><div class="icon">People</div></div>
                <div class="card"><div><div class="meta">Male Count</div><div class="value"><?= $male ?></div></div><div class="icon">Male</div></div>
                <div class="card"><div><div class="meta">Female Count</div><div class="value"><?= $female ?></div></div><div class="icon">Female</div></div>
                <div class="card"><div><div class="meta">Average Age</div><div class="value"><?= $avg_age ?></div></div><div class="icon">Person</div></div>
            </section>

            <!-- Leaderboard -->
            <section class="table-section">
                <header class="table-header"><h2>Leaderboard - Personal Best</h2></header>
                <table class="table">
                    <thead><tr><th>Rank</th><th>Name</th><th>Gender</th><th>Class</th><th>Equipment</th><th>Best Score</th></tr></thead>
                    <tbody>
                        <?php foreach ($leaderboard_rows as $row): ?>
                        <tr>
                            <td><strong>#<?= $row['Rank'] ?></strong></td>
                            <td><?= htmlspecialchars($row['FullName']) ?></td>
                            <td><?= $row['Gender'] == 'M' ? 'Male' : 'Female' ?></td>
                            <td><?= htmlspecialchars($row['ClassName'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($row['Equipment'] ?? '-') ?></td>
                            <td><strong><?= $row['BestScore'] ?></strong></td>
                        </tr>
                        <?php endforeach; ?>
                        <?php if (empty($leaderboard_rows)): ?>
                        <tr><td colspan="6" style="text-align:center;color:#999;">Chưa có điểm nào</td></tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </section>

            <!-- All Archers -->
            <section class="table-section">
                <header class="table-header">
                    <h2>All Archers</h2>
                    <input type="text" placeholder="Tìm kiếm..." onkeyup="filterTable(this.value)" style="padding:8px;border-radius:4px;border:1px solid #ccc;">
                </header>
                <table class="table" id="archersTable">
                    <thead><tr><th>ID</th><th>Name</th><th>Gender</th><th>Country</th><th>Age</th><th>Class</th><th>Equipment</th><th>Category</th></tr></thead>
                    <tbody>
                        <?php while ($a = $archers->fetch_assoc()): ?>
                        <tr>
                            <td><?= $a['Archer_ID'] ?></td>
                            <td><strong><?= htmlspecialchars($a['FullName']) ?></strong></td>
                            <td><?= $a['Gender'] == 'M' ? 'Male' : 'Female' ?></td>
                            <td><span class="fi fi-<?= strtolower($a['Country'] == 'Vietnam' ? 'vn' : 'us') ?>"></span> <?= $a['Country'] ?></td>
                            <td class="age"><?= $a['age'] ?? '-' ?> tuổi</td>
                            <td><?= htmlspecialchars($a['className'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($a['equipment'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($a['category'] ?? '-') ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </section>
        </main>
    </div>

    <script src="/javascript/layout.js"></script>
    <script>
        function filterTable(q) {
            const rows = document.querySelectorAll('#archersTable tbody tr');
            rows.forEach(r => r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none');
        }
    </script>
</body>
</html>