<?php

use Core\Router;

date_default_timezone_set(config('timezone'));

if (config('debug')) {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

$origins = config('cors', ['*']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
if (in_array('*', $origins) || in_array($origin, $origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


// The frontend owns all business-module demo state through its central mock
// store. The API is intentionally limited to identity/session functions and
// the authenticated password-change flow.
$activeRouteModules = ['Authentication', 'Profile'];
foreach ($activeRouteModules as $module) {
    foreach (glob(__DIR__ . "/../Modules/{$module}/Routes/*.php") as $file) {
        require $file;
    }
}

Router::dispatch();
