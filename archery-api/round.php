<?php
include 'connection.php';

$sql = "SELECT
    r.RoundID AS id,
    r.Name AS name,
    r.TotalArrows AS totalArrows,
    r.Description AS description,
    rg.Distance AS distance,
    rg.Ends AS ends,
    rg.ArrowsPerEnd AS arrowsPerEnd,
    tf.DiameterCM AS faceSize
FROM ROUND r
JOIN `RANGE` rg ON rg.RoundID = r.RoundID
JOIN TARGET_FACE tf ON tf.TargetFaceID = rg.TargetFaceID
ORDER BY r.RoundID, rg.Distance DESC";

$result = $conn->query($sql);
$data = $result->fetch_all(MYSQLI_ASSOC);
echo json_encode($data);
$conn->close();
?>