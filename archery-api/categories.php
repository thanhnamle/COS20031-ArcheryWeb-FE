<?php
include 'connection.php';

$sql = "SELECT 
    cg.CategoryID AS id,
    cg.Name AS name,
    c.Name AS class,
    e.Name AS equipment,
    c.GenderRule AS gender,
    c.MinAgeYear,
    c.MaxAgeYear AS maxAge
FROM CATEGORY cg
JOIN CLASS c ON cg.ClassID = c.ClassID
JOIN EQUIPMENT e ON cg.EquipmentID = e.EquipmentID
ORDER BY cg.CategoryID";

$result = $conn->query($sql);
$data = $result->fetch_all(MYSQLI_ASSOC);
echo json_encode($data);
$conn->close();
?>