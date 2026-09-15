import payrollService from "./payrollService";

export const employeePayrollService = {
  getPayroll: async () => (await payrollService.getPayrollDashboardData("SALES_EXECUTIVE")).personalPayroll,
};
