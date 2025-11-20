<?php
include 'connection.php';

$sql = "SELECT
    sh.ScoreID AS id,
    sh.DateShot AS date,
    sh.TotalScore,
    a.FullName AS archerName,
    cg.Name AS category,
    r.Name AS roundName,
    cp.Name AS competitionName
FROM SCORE_HEADER sh
JOIN ARCHER a ON a.Archer_ID = sh.ArcherID
JOIN SCORE_DETAIL sd ON sd.ScoreID = sh.ScoreID
JOIN EQUIVALENT_ROUND er ON er.EquivalentRoundID = sd.EquivalentRoundID
JOIN ROUND r ON r.RoundID = er.BaseRoundID
JOIN CATEGORY cg ON cg.CategoryID = er.CategoryID
LEFT JOIN COMPETITION cp ON cp.CompetitionID = sh.CompetitionID
ORDER BY sh.DateShot DESC
LIMIT 200";

$result = $conn->query($sql);
$data = $result->fetch_all(MYSQLI_ASSOC);
echo json_encode($data);
$conn->close();
?>