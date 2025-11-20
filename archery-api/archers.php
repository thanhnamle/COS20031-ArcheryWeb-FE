<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = new mysqli("localhost", "root", "lenam2005@", "Archery_final");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}

$sql = "SELECT 
    a.Archer_ID AS id,
    a.FullName AS name,
    a.Gender AS gender,
    a.Country AS country,
    a.DateOfBirth AS dob,
    cl.Name AS className,
    eq.Name AS equipment,
    cat.Name AS category
FROM ARCHER a
LEFT JOIN CLASS cl ON a.DefaultClassID = cl.ClassID
LEFT JOIN EQUIPMENT eq ON a.DefaultEquipmentID = eq.EquipmentID
LEFT JOIN CATEGORY cat ON cat.ClassID = cl.ClassID AND cat.EquipmentID = eq.EquipmentID
ORDER BY a.Archer_ID";

$result = $conn->query($sql);
$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
?>