<?php
// conf
include_once("conf.php");

// Données reçues
$origin = (array_key_exists('HTTP_REFERER', $_SERVER)) ? preg_split("/;|\?/", $_SERVER["HTTP_REFERER"])[0] : "";
$method = $_SERVER["REQUEST_METHOD"];
$port = $_SERVER["SERVER_PORT"];

// condition d'acceptation d'une requête HTTP :
// methode GET sur le port du CASLogger depuis l'url d'origine du serveur CAS
$accept = ($method == "GET" AND $origin == $cas_login_url AND $port == $caslogger_port);
//if (!$accept) { exit(); }

// Détermination de l'URL de redirection
$default_redirection = $cas_login_url;

// si c'est une requête SAML, on cherche le "RelayState"
if (array_key_exists('SAMLRequest', $_GET)) {
    $redirect_to = (array_key_exists("RelayState", $_GET)) ? $_GET["RelayState"] : $default_redirection;
} else {
    $redirect_to = (array_key_exists($service_name, $_GET)) ? $_GET[$service_name] : $default_redirection;
}


// Après l'envoi du header de redirection
// ======================================

// récupération du user CAS authentifié
require_once("CAS.php");
phpCAS::setDebug("/var/www/html/caslogger/phpCASlog/phpCAS.log");
//phpCAS::setVerbose(true);

$client = phpCAS::client(CAS_VERSION_2_0, $cas_server, $cas_port, $cas_path);
phpCAS::setNoCasServerValidation();
phpCAS::checkAuthentication();

// Redirection 
header('Location: '.$redirect_to);
$username = phpCAS::getUser();

// récupération des données de la requête http entrante
$REQ = $_GET;
$ticket = $REQ[$ticket_name];                   // db :ticket
$ip = $_SERVER["REMOTE_ADDR"];                  // db: ip   
$forwarded = (array_key_exists('HTTP_X_FORWARDED_FOR', $_SERVER)) ? $_SERVER["HTTP_X_FORWARDED_FOR"] : ""; // db : forwarded 

// Connexion à la base de donnée et mise à jour de la tentative de connexion CAS aboutie
$mysqli = new mysqli($db_server, $db_user, $db_passwd, $db);
if ($mysqli->connect_errno) {
    echo("Erreur de connexion à la base de données :<br/>");
    echo("code erreur : " .  $mysqli->connect_errno . "<br/>");
    echo("erreur : " .  $mysqli->connect_error . "<br/>");
    exit();
}

$sql = 'UPDATE tentatives SET authenticated = true ';
// temp : si le redirecteur a une URL différente du CASlogger, ils peuvent avoir une IP différentes derrière un proxy, donc j'enlève la condition sur IP
//$sql = $sql . 'WHERE username = "' . $username . '" AND ip = "' . $ip . '" AND forwarded = "' . $forwarded . '"';
$sql = $sql . 'WHERE username = "' . $username . '" AND forwarded = "' . $forwarded . '"';
$sql = $sql . ' AND ticket = "' . $ticket . '" AND authenticated = false';
$sql = $sql . ' ORDER BY id DESC LIMIT 1';
$res = $mysqli->query($sql);
$mysqli->close();

?>