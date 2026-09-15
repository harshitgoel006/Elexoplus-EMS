import payrollService from "./payrollService";

export const hrPayrollService = {
  getPayroll: async () => {
    const data = await payrollService.getPayrollDashboardData("HR");
    return {
      statsData: data.metrics,
      stages: data.stages,
      exceptions: data.exceptions,
      complianceData: data.complianceData,
      directoryEmployees: data.directory,
      departmentLiability: data.departmentLiability,
      joiningExitData: data.joiningExitData,
      currentStage: data.currentStage,
      isAttendanceFrozen: data.isAttendanceFrozen,
    };
  },
  getPersonalPayroll: async () => (await payrollService.getPayrollDashboardData("HR")).personalPayroll,
  freezeAttendance: async () => {
    await payrollService.freezeAttendance();
    return { success: true, attendanceFrozen: true };
  },
  submitToFinance: async () => {
    await payrollService.submitToFinance();
    return { success: true, nextStage: 3, attendanceFrozen: true };
  },
  updateSalaryHold: async (_employees, payload) => {
    await payrollService.updateSalaryHold(payload);
    return (await payrollService.getPayrollDashboardData("HR")).directory;
  },
};
