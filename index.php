<?php
// conf
include_once("conf.php");


// Données reçues
$origin = (array_key_exists('HTTP_REFERER', $_SERVER)) ? preg_split("/;|\?/", $_SERVER["HTTP_REFERER"])[0] : "";
$method = $_SERVER["REQUEST_METHOD"];
$port = $_SERVER["SERVER_PORT"];

// condition d'acceptation d'une requête HTTP :
// methode POST sur le port du CASLogger depuis l'url d'origine du serveur CAS
$accept = ($method == "POST" AND $origin == $cas_login_url AND $port == $caslogger_port);
if (!$accept) { exit(); }


// headers
$REQ = $_POST;
$username = addslashes($REQ["username"]);           // db : username
$service = addslashes($REQ["service"]);             // db: service
$ticket = addslashes($REQ["ticket"]);               // db :ticket
$client_error = addslashes($REQ["err"]);            // db : error
$referer = addslashes($REQ["ref"]);                 // db : referer
$ip = addslashes($_SERVER["REMOTE_ADDR"]);          // db: ip   
$agent = addslashes($_SERVER["HTTP_USER_AGENT"]);   // db : agent
$forwarded = (array_key_exists('HTTP_X_FORWARDED_FOR', $_SERVER)) ? $_SERVER["HTTP_X_FORWARDED_FOR"] : ""; // db : forwarded 

$mysqli = new mysqli($db_server, $db_user, $db_passwd, $db);
if ($mysqli->connect_errno) {
    echo("Erreur de connexion à la base de données :<br/>");
    echo("code erreur : " .  $mysqli->connect_errno . "<br/>");
    echo("erreur : " .  $mysqli->connect_error . "<br/>");
    exit();
}

$sql = 'INSERT INTO tentatives (username, ip, forwarded, service, referer, error, agent, ticket) ';
$sql = $sql . 'VALUES ("'. $username .'", "'. $ip . '", "' . $forwarded . '", "' . $service . '", "' . $referer . '", "' . $client_error . '", "' . $agent . '", "' . $ticket . '")';
$res = $mysqli->query($sql);
$mysqli->close();

?>