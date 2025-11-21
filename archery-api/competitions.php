<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = new mysqli("localhost", "root", "", "Archery_final");
if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

$sql = "SELECT CompetitionID as id, Name, Date FROM COMPETITION ORDER BY Date DESC";
$result = $conn->query($sql);
$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}
echo json_encode($data);
$conn->close();
?>