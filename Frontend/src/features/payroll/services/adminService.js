import {
  ADMIN_STATS_MOCK, 
  SALARY_STRUCTURES_MOCK, 
  EMPLOYEES_MOCK,
  mockPayrollRecords,
  mockPayrollSummary,
  initialSalaryRevisions,
  initialLopCases,
  payrollReportsList,
  bankTransferBatchMock
} from "../mock/adminMock"; 
import payrollService from "./payrollService";

// Local memory stores for mock mutation with safe defaults
let localStructures = [...SALARY_STRUCTURES_MOCK];
let localPayrollRecords = mockPayrollRecords.map(record => ({
  incentives: 5000,
  totalWorkingDays: 22,
  daysWorked: 20,
  taxes: 4000,
  pf: 1000,
  ...record
}));

let localSalaryRevisions = [...initialSalaryRevisions];
let localLopCases = [...initialLopCases];
let localReports = [...payrollReportsList];
let localBankTransfers = [...bankTransferBatchMock];

export const adminService = {
  getDashboardStats: async () => {
    return new Promise((resolve) => setTimeout(() => resolve(ADMIN_STATS_MOCK), 150));
  },

  getSalaryStructures: async () => {
    return new Promise((resolve) => setTimeout(() => resolve(localStructures), 150));
  },

  getEmployees: async () => {
    return new Promise((resolve) => setTimeout(() => resolve(EMPLOYEES_MOCK), 150));
  },

  saveSalaryStructure: async (structureData) => {
    const index = localStructures.findIndex((s) => (s.id || s._id) === structureData.id);
    if (index !== -1) {
      localStructures[index] = structureData;
    } else {
      localStructures = [structureData, ...localStructures];
    }
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, data: structureData }), 150));
  },

  assignStructureToEmployees: async (structureId, employeeIds) => {
    localStructures = localStructures.map((s) => {
      if ((s.id || s._id) === structureId) {
        return { ...s, assignedEmployees: employeeIds, assignedCount: employeeIds.length };
      }
      return s;
    });
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 150));
  },

  deleteSalaryStructure: async (structureId) => {
    localStructures = localStructures.filter((s) => (s.id || s._id) !== structureId);
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, id: structureId }), 150));
  },

  // --- PAYROLL METHODS ---

  getPayrollSummary: async () => {
    return new Promise((resolve) => setTimeout(() => resolve({ data: mockPayrollSummary }), 150));
  },

  getPayrollRecords: async () => {
    return new Promise((resolve) => setTimeout(() => resolve({ data: localPayrollRecords }), 150));
  },

  processPayroll: async (payrollId) => {
    localPayrollRecords = localPayrollRecords.map((record) => 
      record.id === payrollId ? { ...record, status: "Processed" } : record
    );

    return new Promise((resolve) => 
      setTimeout(() => resolve({ success: true, id: payrollId, status: "Processed" }), 150)
    );
  },

  // --- SALARY REVISION METHODS ---

  getSalaryRevisions: async () => {
    return new Promise((resolve) => setTimeout(() => resolve({ data: localSalaryRevisions }), 150));
  },

  approveSalaryRevision: async (revisionId) => {
    localSalaryRevisions = localSalaryRevisions.filter((item) => item.id !== revisionId);
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, id: revisionId }), 150));
  },

  rejectSalaryRevision: async (revisionId) => {
    localSalaryRevisions = localSalaryRevisions.filter((item) => item.id !== revisionId);
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, id: revisionId }), 150));
  },

  // --- LOP CASES METHODS ---

  getLopCases: async () => {
    return new Promise((resolve) => setTimeout(() => resolve({ data: localLopCases }), 150));
  },

  resolveLopCase: async (caseId) => {
    localLopCases = localLopCases.filter((item) => item.id !== caseId);
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, id: caseId }), 150));
  },

  // --- REPORTS & BANK TRANSFER METHODS ---

  getPayrollReports: async () => {
    return new Promise((resolve) => setTimeout(() => resolve({ data: localReports }), 150));
  },

  getBankTransfers: async () => {
    return new Promise((resolve) => setTimeout(() => resolve({ data: localBankTransfers }), 150));
  },
};

// Compatibility for older admin-only hooks: these methods now point at the
// same mock-store-backed payroll service used by PayrollManagement.
Object.assign(adminService, {
  getDashboardStats: async () => (await payrollService.getPayrollDashboardData("ADMIN")).metrics,
  getSalaryStructures: payrollService.getSalaryStructures,
  getEmployees: payrollService.getEmployees,
  saveSalaryStructure: payrollService.saveSalaryStructure,
  assignStructureToEmployees: payrollService.assignStructureToEmployees,
  deleteSalaryStructure: payrollService.deleteSalaryStructure,
  getPayrollSummary: payrollService.getPayrollSummary,
  getPayrollRecords: payrollService.getPayrollRecords,
  processPayroll: payrollService.processPayroll,
  getSalaryRevisions: payrollService.getSalaryRevisions,
  approveSalaryRevision: payrollService.approveSalaryRevision,
  rejectSalaryRevision: payrollService.rejectSalaryRevision,
  getLopCases: payrollService.getLopCases,
  resolveLopCase: payrollService.resolveLopCase,
  getPayrollReports: payrollService.getPayrollReports,
  getBankTransfers: payrollService.getBankTransfers,
});

export default adminService;
