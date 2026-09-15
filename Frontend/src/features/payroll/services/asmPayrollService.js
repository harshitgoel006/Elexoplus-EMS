import payrollService from "./payrollService";

export const asmPayrollService = {
  getPayroll: async () => {
    const data = await payrollService.getPayrollDashboardData("ASM");
    return {
      ...data.personalPayroll,
      team: data.teamData || {},
      stats: data.personalPayroll?.stats || [],
      expenseReimbursements: data.reimbursements || [],
      attendanceImpact: data.teamData?.attendanceImpact || {},
    };
  },
};
