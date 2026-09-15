<?php

$composerAutoload = __DIR__ . '/../../../vendor/autoload.php';
require file_exists($composerAutoload) ? $composerAutoload : __DIR__ . '/../../../bootstrap/autoload.php';

$files = ['leave_policies.sql', 'leave_balances.sql', 'leave_requests.sql', 'leave_approvals.sql', 'holidays.sql'];
foreach ($files as $file) {
    $sql = file_get_contents(__DIR__ . '/Migrations/' . $file);
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
        if ($statement !== '') \Core\Database::connection()->exec($statement);
    }
}
echo "Leave schema is ready.\n";
