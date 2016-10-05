<?php
// Paramètres du serveur CAS à surveiller
$cas_server = "cas.iut-rodez.fr";
$cas_path = "/cas";
$cas_port = 443;

// port d'écoute de CASLogger (attention si reverse proxy)
$caslogger_port = "80";

// nom du ticket dans l'URL du redirecteur
$ticket_name = "_cLt";

// nom du service dans l'URL du redirecteur
$service_name = "_cLs";


// Base de données
$db_server = "mysql_server";
$db_user = "mysql_user";
$db_passwd = "msql_password";
$db = "caslogger";


// variables communes : ne pas modifier
$port_string = ($cas_port == 80 Or $cas_port == 443) ? "" : ":" . $cas_port;
$cas_login_url = "https://" . $cas_server . $port_string . $cas_path . "/login";

?>