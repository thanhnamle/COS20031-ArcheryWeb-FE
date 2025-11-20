<?php
include 'connection.php';

$sql = "WITH BestScores AS (
    SELECT
        a.Archer_ID,
        er.CategoryID,
        MAX(sh.TotalScore) AS BestScore
    FROM SCORE_HEADER sh
    JOIN SCORE_DETAIL sd ON sd.ScoreID = sh.ScoreID
    JOIN EQUIVALENT_ROUND er ON er.EquivalentRoundID = sd.EquivalentRoundID
    JOIN ARCHER a ON a.Archer_ID = sh.ArcherID
    GROUP BY a.Archer_ID, er.CategoryID
)
SELECT
    bs.CategoryID,
    cg.Name AS CategoryName,
    a.Archer_ID AS ArcherID,
    a.FullName AS ArcherName,
    e.Name AS Equipment,
    cl.Name AS Class,
    r.Name AS RoundName,
    bs.BestScore
FROM BestScores bs
JOIN ARCHER a ON a.Archer_ID = bs.Archer_ID
JOIN CATEGORY cg ON cg.CategoryID = bs.CategoryID
JOIN CLASS cl ON cl.ClassID = cg.ClassID
JOIN EQUIPMENT e ON e.EquipmentID = cg.EquipmentID
JOIN SCORE_DETAIL sd ON sd.TotalScore = bs.BestScore AND sd.ScoreID IN (
    SELECT ScoreID FROM SCORE_HEADER WHERE ArcherID = a.Archer_ID
)
JOIN EQUIVALENT_ROUND er ON er.EquivalentRoundID = sd.EquivalentRoundID
JOIN ROUND r ON r.RoundID = er.BaseRoundID
ORDER BY bs.CategoryID, bs.BestScore DESC";

$result = $conn->query($sql);
$data = $result->fetch_all(MYSQLI_ASSOC);
echo json_encode($data);
$conn->close();
?>