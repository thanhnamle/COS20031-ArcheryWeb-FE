<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($data->action)) {
    
    // === LOGIN ===
    if ($data->action === 'login') {
        $email = $data->email;
        $pass = $data->password;

        $stmt = $conn->prepare("SELECT * FROM RECORDER WHERE Email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($pass, $user['Password'])) {
            unset($user['Password']); // Don't send password back
            // Map your DB columns to what frontend expects
            $responseUser = [
                "name" => $user['FullName'],
                "email" => $user['Email'],
                "role" => $user['Role'],
                "archerId" => $user['RecorderID'] // Assuming Recorders are also Archers
            ];
            echo json_encode(["status" => "success", "user" => $responseUser]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
        }
    }

    // === SIGNUP ===
    elseif ($data->action === 'signup') {
        $id = "rec" . time(); // Generate ID
        $passHash = password_hash($data->password, PASSWORD_DEFAULT);
        
        $sql = "INSERT INTO RECORDER (RecorderID, FullName, Email, Password, Role, Gender) 
                VALUES (:id, :name, :email, :pass, 'archer', 'M')";
        
        try {
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                'id' => $id,
                'name' => $data->name,
                'email' => $data->email,
                'pass' => $passHash
            ]);
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Email exists or error"]);
        }
    }
}
?>