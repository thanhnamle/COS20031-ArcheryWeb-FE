<?php
// api/competitions.php
require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->query("SELECT * FROM COMPETITION ORDER BY Date DESC");
    $rows = $stmt->fetchAll();
    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
