<?php
// connection.php

$servername = "localhost";
$username = "root";
$password = "lenam2005@";
$dbname = "Archery_final";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}
?>