<?php
header('Content-Type: application/json');
include('db_config.php');
//
$user = $_POST['userName'] ?? ''; 
$pass = $_POST['userPass'] ?? '';
$role = $_POST['role'] ?? 'cliente';


$query = "SELECT id_cliente, nombre, rol, id_isla_asignada FROM usuarios 
          WHERE LOWER(email) = LOWER($1) 
          AND contrasena = $2 
          AND rol = $3";

$result = pg_query_params($dbconn, $query, array($user, $pass, $role));

if ($row = pg_fetch_assoc($result)) {
    echo json_encode([
        "success" => true, 
        "user" => $row['nombre'], 
        "role" => $row['rol'],
        "id_cliente" => $row['id_cliente'], // <--- ESTO ES VITAL
        "isla_id" => $row['id_isla_asignada'] 
    ]);
} else {
    echo json_encode([
        "success" => false, 
        "message" => "Usuario o contraseña incorrectos."
    ]);
}
pg_close($dbconn);
?>
