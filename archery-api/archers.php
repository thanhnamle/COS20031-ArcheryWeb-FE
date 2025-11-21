<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');  // Fix CORS
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$conn = new mysqli("localhost", "root", "", "Archery_final");
if ($conn->connect_error) { 
    http_response_code(500);
    echo json_encode(["error" => "DB Connection Failed"]); 
    exit; 
}

$sql = "SELECT a.Archer_ID as id, a.FullName as name, a.Gender as gender, a.Country as country, a.DateOfBirth as dob, cl.Name as className, eq.Name as equipment, cat.Name as category FROM ARCHER a LEFT JOIN CLASS cl ON a.DefaultClassID=cl.ClassID LEFT JOIN EQUIPMENT eq ON a.DefaultEquipmentID=eq.EquipmentID LEFT JOIN CATEGORY cat ON cat.ClassID=cl.ClassID AND cat.EquipmentID=eq.EquipmentID ORDER BY a.Archer_ID";

$result = $conn->query($sql);
$rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
echo json_encode($rows);
$conn->close();
?>