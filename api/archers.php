<?php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Fetch and map columns to match frontend JS
    $stmt = $conn->prepare("SELECT * FROM ARCHER");
    $stmt->execute();
    $dbArchers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $archers = [];
    foreach($dbArchers as $row) {
        // Split FullName back into First/Last for frontend
        $parts = explode(" ", $row['FullName'], 2);
        $archers[] = [
            "id" => $row['Archer_ID'],
            "first" => $parts[0],
            "last" => $parts[1] ?? "",
            "dob" => $row['DateOfBirth'],
            "gender" => $row['Gender'],
            "country" => $row['Country']
        ];
    }
    echo json_encode($archers);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    // Concatenate First/Last name for DB
    $fullName = $data->firstName . " " . $data->lastName;

    $sql = "INSERT INTO ARCHER (Archer_ID, FullName, DateOfBirth, Gender, Country) 
            VALUES (:id, :name, :dob, :gender, :country)";
    
    $stmt = $conn->prepare($sql);
    $success = $stmt->execute([
        'id' => $data->id,
        'name' => $fullName,
        'dob' => $data->dob,
        'gender' => $data->gender,
        'country' => $data->country
    ]);

    echo json_encode(["status" => $success ? "success" : "error"]);
}
?>