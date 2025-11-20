<?php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Join Header and Archer to get data
    $sql = "SELECT h.ScoreID, h.TotalScore, h.DateShot, a.Archer_ID, a.FullName, r.Name as RoundName, h.CompetitionID
            FROM SCORE_HEADER h
            LEFT JOIN ARCHER a ON h.ArcherID = a.Archer_ID
            LEFT JOIN SCORE_DETAIL sd ON h.ScoreID = sd.ScoreID
            LEFT JOIN EQUIVALENT_ROUND er ON sd.EquivalentRoundID = er.EquivalentRoundID
            LEFT JOIN ROUND r ON er.BaseRoundID = r.RoundID
            ORDER BY h.DateShot DESC";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map to frontend format
    $scores = [];
    foreach($rows as $r) {
        $nameParts = explode(" ", $r['FullName']);
        $scores[] = [
            "id" => $r['ScoreID'],
            "archerId" => $r['Archer_ID'],
            "total" => (int)$r['TotalScore'],
            "recordedAt" => $r['DateShot'],
            "roundSnapshot" => $r['RoundName'] ?? 'Unknown Round',
            "competitionId" => $r['CompetitionID'],
            "isApproved" => true // Simplified for display
        ];
    }
    echo json_encode($scores);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    try {
        $conn->beginTransaction();

        // 1. Insert Header
        $stmt = $conn->prepare("INSERT INTO SCORE_HEADER (ScoreID, ArcherID, CompetitionID, DateShot, TotalScore, Stage) VALUES (:id, :aid, :cid, :date, :total, 0)");
        $stmt->execute([
            'id' => $data->id,
            'aid' => $data->archerId,
            'cid' => $data->competitionId ?: null,
            'date' => $data->recordedAt,
            'total' => $data->total
        ]);

        // 2. Insert Score Detail (Required by your schema)
        // Note: We are using a dummy EquivalentRoundID '1' for demo purposes. 
        // In a real app, you must lookup the correct ID based on the Round selected.
        $detailId = rand(1000, 99999); 
        $stmt = $conn->prepare("INSERT INTO SCORE_DETAIL (ScoreDetailID, ScoreID, EquivalentRoundID, TotalScore) VALUES (:did, :sid, 1, :total)");
        $stmt->execute([
            'did' => $detailId,
            'sid' => $data->id,
            'total' => $data->total
        ]);

        // 3. Insert Ends and Arrows
        // Your frontend sends 'ends' like: [ [10,9,8], [9,9,9] ]
        if (isset($data->ends) && is_array($data->ends)) {
            foreach ($data->ends as $index => $endArrows) {
                $endId = rand(10000, 999999);
                $endTotal = array_sum($endArrows);
                
                // Insert End
                $stmt = $conn->prepare("INSERT INTO SCORE_END (EndID, ScoreDetailID, RangeID, EndNumber, TotalEndScore) VALUES (:eid, :sdid, 1, :num, :etotal)");
                $stmt->execute([
                    'eid' => $endId,
                    'sdid' => $detailId,
                    'num' => $index + 1,
                    'etotal' => $endTotal
                ]);

                // Insert Arrows
                foreach ($endArrows as $arrowVal) {
                    $arrowId = rand(100000, 9999999);
                    $stmt = $conn->prepare("INSERT INTO ARROW (ArrowID, EndID, ArrowValue) VALUES (:aid, :eid, :val)");
                    $stmt->execute(['aid' => $arrowId, 'eid' => $endId, 'val' => $arrowVal]);
                }
            }
        }

        $conn->commit();
        echo json_encode(["status" => "success"]);

    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>