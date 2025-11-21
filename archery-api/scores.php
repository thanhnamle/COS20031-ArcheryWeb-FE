<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = new mysqli("localhost", "root", "", "Archery_final");
if ($conn->connect_error) die(json_encode([]));

$sql = "SELECT 
            sh.DateShot as date,
            sh.TotalScore,
            a.FullName as archerName,
            COALESCE(c.Name, 'Practice Session') as competitionName
        FROM SCORE_HEADER sh
        JOIN ARCHER a ON a.Archer_ID = sh.ArcherID
        LEFT JOIN COMPETITION c ON c.CompetitionID = sh.CompetitionID
        ORDER BY sh.DateShot DESC
        LIMIT 50";

$result = $conn->query($sql);
$data = [];
while($row = $result->fetch_assoc()) $data[] = $row;
echo json_encode($data);
?>