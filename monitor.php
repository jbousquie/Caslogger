<?php
include_once("conf.php");

session_start();

if ($_SESSION["authentifie"] == false) {
    header('Location: monitor_menu.html');
}

$mysqli = new mysqli($db_server, $db_user, $db_passwd, $db);
if ($mysqli->connect_errno) {
    echo("Erreur de connexion à la base de données :<br/>");
    echo("code erreur : " .  $mysqli->connect_errno . "<br/>");
    echo("erreur : " .  $mysqli->connect_error . "<br/>");
}

$sql = 'SELECT * FROM tentatives ORDER BY id DESC LIMIT 100';

$res = $mysqli->query($sql);

function cellify($val) {
    return "<td>".$val."</td>";
}

function displayRows($result) {
    if (!$result) { return; }
    $html_row = "";
    while($row = $result->fetch_row()) {
        $class = classCondition($row);
        $html_row = $html_row . '<tr class="' . $class .'">';
        for ($i = 0; $i < $result->field_count; $i++) {
            $html_row = $html_row . cellify($row[$i]);
        }
        $html_row = $html_row . "</tr>\n";
    }
    echo($html_row);
};

function classCondition($row) {
    $class = "pending";
    $class = ($row[10] == 1) ? "auth" : $class;
    $class = ($row[3] == "10.10.0.2" AND $row[10] == 1) ? "wifi" : $class;
    return $class;
};

?>
<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>CASLogger Monitor</title>
    <link rel="stylesheet" href="monitor.css">
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <h1>Tentatives de connexion CAS</h1>
    <p><i>reload automatique toutes les 5 secondes des 100 dernières tentatives</i></p>
    <div id="content">
        <div id="legend">
            <span class="auth">&nbsp;&nbsp;authentifié&nbsp;&nbsp;</span>
            <span class="wifi">&nbsp;&nbsp;portail captif&nbsp;&nbsp;</span>
            <span class="pending">&nbsp;&nbsp;tentative&nbsp;&nbsp;</span>
        </div>
        <table>
            <tr>
                <th>id</th>
                <th>username</th>
                <th>ip  d'origine</th>
                <th>forwarded for</th>
                <th>service demandé</th>
                <th>venant de : </th>
                <th>ré-envoi sur le message :</th>
                <th>timestamp</th>
                <th>user agent</th>
                <th>ticket</th>
                <th>authentifié</th>
            </tr>
            <?php displayRows($res); ?>
        </table>
    </div>

</body>
</html>
<?php
// libération des ressources
$res->close();
$mysqli->close();
?>