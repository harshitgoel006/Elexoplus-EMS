<?php

namespace Modules\Payroll\Models;

use Core\Database;

class Payslip
{
    public static function find(string $id): ?array { $s=Database::connection()->prepare('SELECT ps.*,p.gross_salary,p.net_salary,p.payroll_status,pp.payroll_month,pp.payroll_year,e.employee_code,e.full_name FROM payslips ps JOIN payrolls p ON p.payroll_id=ps.payroll_id JOIN payroll_periods pp ON pp.payroll_period_id=p.payroll_period_id JOIN employees e ON e.employee_id=ps.employee_id WHERE ps.payslip_id=?');$s->execute([$id]);return $s->fetch() ?: null; }
    public static function forEmployee(string $employeeId): array { $s=Database::connection()->prepare('SELECT ps.*,p.net_salary,p.gross_salary,p.payroll_status,pp.payroll_month,pp.payroll_year FROM payslips ps JOIN payrolls p ON p.payroll_id=ps.payroll_id JOIN payroll_periods pp ON pp.payroll_period_id=p.payroll_period_id WHERE ps.employee_id=? ORDER BY pp.payroll_year DESC,pp.payroll_month DESC');$s->execute([$employeeId]);return $s->fetchAll(); }
}
