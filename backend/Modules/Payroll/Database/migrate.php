<?php

$composerAutoload = __DIR__ . '/../../../vendor/autoload.php';
require file_exists($composerAutoload) ? $composerAutoload : __DIR__ . '/../../../bootstrap/autoload.php';

// The lightweight payroll API only reads issued payslips. These schemas are
// retained because payslip downloads join payroll records and payroll periods.
$files = [
    'payroll.sql' => 'payrolls',
    'payslips.sql' => 'payslips',
];
foreach ($files as $file => $table) {
    $exists = \Core\Database::connection()->prepare('SHOW TABLES LIKE ?');
    $exists->execute([$table]);
    if ($exists->fetchColumn()) {
        echo "Skipped (already exists): $table\n";
        continue;
    }
    $sql = file_get_contents(__DIR__ . '/Migrations/' . $file);
    if ($sql === false) throw new RuntimeException("Migration file is missing: $file");
    // Historical export headers point at a developer-local database. The
    // configured connection already chooses the correct database.
    $sql = preg_replace('/^USE\\s+[^;]+;\\s*/mi', '', $sql);
    foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
        \Core\Database::connection()->exec($statement);
    }
    echo "Applied: $file\n";
}

echo "Payroll schema is ready.\n";
