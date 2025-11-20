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
),
Ranked AS (
    SELECT
        bs.*,
        ROW_NUMBER() OVER (PARTITION BY bs.CategoryID ORDER BY bs.BestScore DESC) AS Rank
    FROM BestScores bs
)
SELECT
    r.Rank,
    r.CategoryID,
    cg.Name AS Category,
    a.Archer_ID AS ID,
    a.FullName AS Name,
    e.Name AS Equipment,
    cl.Name AS Class,
    r.BestScore
FROM Ranked r
JOIN ARCHER a ON a.Archer_ID = r.Archer_ID
JOIN CATEGORY cg ON cg.CategoryID = r.CategoryID
JOIN CLASS cl ON cl.ClassID = cg.ClassID
JOIN EQUIPMENT e ON e.EquipmentID = cg.EquipmentID
WHERE r.Rank <= 10
ORDER BY r.CategoryID, r.Rank";

$result = $conn->query($sql);
$data = $result->fetch_all(MYSQLI_ASSOC);
echo json_encode($data);
$conn->close();
?>