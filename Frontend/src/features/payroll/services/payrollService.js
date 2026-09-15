import { getPayrollPermissions } from "../config/permissions/payrollPermissions";
import {
  ADMIN_STATS_MOCK,
  EMPLOYEES_MOCK,
  SALARY_STRUCTURES_MOCK,
  bankTransferBatchMock,
  initialLopCases,
  initialSalaryRevisions,
  mockPayrollRecords,
  mockPayrollSummary,
} from "../mock/adminMock";
import { asmPayrollMock } from "../mock/asmPayrollMock";
import { employeePayrollMock } from "../mock/employeePayrollMock";
import { hrPayrollMock } from "../mock/hrPayrollMock";
import { mockStore } from "../../../mocks/appMockStore";

// Frontend-first Payroll store. The public contract mirrors the old API
// service, while state intentionally stays in memory for the current tab.
const copy = (value) => JSON.parse(JSON.stringify(value));
const roleOf = (role) => {
  const value = String(role || "SALES_EXECUTIVE").toUpperCase();
  return value === "SE" || value === "EMPLOYEE" ? "SALES_EXECUTIVE" : value;
};
const number = (value) => Number(value) || 0;
const money = (value) => `₹${number(value).toLocaleString("en-IN")}`;
const getErrorMessage = (error, fallback = "The payroll request could not be completed.") => error?.message || fallback;

let records = mockStore.get("payroll:records", mockPayrollRecords.map((record) => ({
  ...record,
  payrollId: record.id,
  grossSalary: number(record.basicSalary) + number(record.allowances) + number(record.incentives),
  grossPay: number(record.basicSalary) + number(record.allowances) + number(record.incentives),
  totalIncentives: number(record.incentives),
  totalDeductions: number(record.deductions),
  attendanceDays: number(record.daysWorked),
  payableDays: number(record.totalWorkingDays),
  verificationStatus: record.status === "Processed" ? "Verified" : "Pending",
  payslipId: `PS-${record.id}`,
})));
let structures = mockStore.get("payroll:structures", SALARY_STRUCTURES_MOCK.map((structure) => ({
  ...structure,
  specialAllowance: number(structure.allowances?.specialAllowance),
  medicalAllowance: number(structure.allowances?.medicalAllowance),
  conveyanceAllowance: number(structure.allowances?.conveyanceAllowance),
  bonusType: structure.bonus?.type || "Fixed",
  bonusValue: number(structure.bonus?.value),
  bonusFrequency: structure.bonus?.frequency || "Monthly",
  assignedEmployees: [],
  status: "Active",
})));
let directory = mockStore.get("payroll:directory", EMPLOYEES_MOCK.map((employee) => ({
  ...employee,
  employeeId: employee.id,
  empId: employee.id,
  department: employee.dept,
  role: "Employee",
  status: employee.status === "UNASSIGNED" ? "Active" : employee.status,
  isHold: false,
})));
let revisions = mockStore.get("payroll:revisions", initialSalaryRevisions.map((revision) => ({ ...revision, status: "Pending", employeeId: revision.id })));
let lopCases = mockStore.get("payroll:lopCases", initialLopCases.map((item, index) => ({ ...item, id: `${item.id}-${index}`, status: "Pending" })));
let reimbursements = mockStore.get("payroll:reimbursements", copy(employeePayrollMock.expenseReimbursements).map((item) => ({ ...item, employeeName: "Harshit Goel" })));
let transfers = mockStore.get("payroll:transfers", bankTransferBatchMock.map((transfer) => ({
  ...transfer,
  payrollId: records[transfer.id - 1]?.id || records[0]?.id,
  employeeName: transfer.name,
  transferStatus: "Ready",
  isOnHold: false,
})));
let period = mockStore.get("payroll:period", { payroll_period_id: "PERIOD-2026-07", payroll_month: 7, payroll_year: 2026, status: "Draft" });
const save = (key, value) => { mockStore.set(`payroll:${key}`, value); return value; };

const personalFor = (role) => {
  if (role === "ASM") return {
    stats: copy(asmPayrollMock.payroll.stats),
    payrollData: {
      grossSalary: 104000, totalIncentives: 32000, totalDeductions: 11400, netPay: 112600,
      salaryBreakup: copy(asmPayrollMock.payroll.salaryBreakup), deductions: copy(asmPayrollMock.payroll.deductions),
    },
    payrollHistory: copy(asmPayrollMock.history), latestPayslip: copy(asmPayrollMock.latestPayslip),
    salaryRevisions: copy(asmPayrollMock.revisions), expenseReimbursements: copy(asmPayrollMock.expenseReimbursements),
    incentiveProjection: { currentSales: 1180000, targetQuota: 1000000, baseIncentivePercentage: 2.5 },
  };
  if (role === "HR") return {
    stats: copy(hrPayrollMock.personalPayroll.payroll.stats),
    payrollData: { ...copy(hrPayrollMock.personalPayroll.payroll.salaryBreakup), grossSalary: 114000, totalIncentives: 7000, totalDeductions: 12300, netPay: 108700 },
    payrollHistory: copy(hrPayrollMock.personalPayroll.history), latestPayslip: copy(hrPayrollMock.personalPayroll.latestPayslip),
    salaryRevisions: copy(hrPayrollMock.personalPayroll.revisions), expenseReimbursements: [],
    incentiveProjection: { currentSales: 0, targetQuota: 0, baseIncentivePercentage: 0 },
  };
  const data = employeePayrollMock;
  return {
    stats: copy(data.payroll.stats),
    payrollData: {
      ...copy(data.payroll.salaryBreakup), grossSalary: 75000, totalIncentives: 24500, totalDeductions: 9600, netPay: 89900,
      deductions: copy(data.payroll.deductions),
    },
    payrollHistory: copy(data.history), latestPayslip: copy(data.latestPayslip),
    salaryRevisions: copy(data.revisions), expenseReimbursements: copy(data.expenseReimbursements),
    incentiveProjection: copy(data.incentiveProjection),
  };
};

const updateRecord = (id, patch) => {
  const existing = records.find((record) => String(record.id) === String(id));
  if (!existing) throw new Error("Payroll record was not found.");
  const updated = { ...existing, ...patch };
  records = save("records", records.map((record) => String(record.id) === String(id) ? updated : record));
  return copy(updated);
};
const findOrFail = (items, id, label) => {
  const item = items.find((entry) => String(entry.id) === String(id));
  if (!item) throw new Error(`${label} was not found.`);
  return item;
};
const getPayrollDashboardData = async (inputRole) => {
  const role = roleOf(inputRole);
  const manager = role === "ADMIN" || role === "HR";
  const isAsm = role === "ASM";
  const payrollRecords = copy(records);
  const dashboard = {
    permissions: getPayrollPermissions(role),
    metrics: role === "ADMIN" ? copy(ADMIN_STATS_MOCK) : role === "HR" ? copy(hrPayrollMock.statsData) : [],
    records: payrollRecords,
    summary: copy(mockPayrollSummary),
    structures: manager ? copy(structures) : [],
    directory: manager ? copy(directory) : [],
    salaryRevisions: manager ? copy(revisions) : [],
    lopCases: manager ? copy(lopCases) : [],
    reimbursements: role === "ASM" ? copy(asmPayrollMock.expenseReimbursements) : copy(reimbursements),
    reports: payrollRecords,
    bankTransfers: role === "ADMIN" ? copy(transfers) : [],
    personalPayroll: personalFor(role),
    stages: role === "HR" ? copy(hrPayrollMock.stages) : [
      { id: 1, stageNumber: "Stage 1", title: "Attendance & Draft" },
      { id: 2, stageNumber: "Stage 2", title: "Processing" },
      { id: 3, stageNumber: "Stage 3", title: "Verification" },
      { id: 4, stageNumber: "Stage 4", title: "Completed" },
    ],
    currentStage: period.status === "Draft" ? 1 : period.status === "Processing" ? 2 : period.status === "Verification" ? 3 : 4,
    isAttendanceFrozen: period.status !== "Draft",
    currentPeriodId: period.payroll_period_id,
    currentPeriodLabel: "July 2026",
    currentPeriodStatus: period.status,
    exceptions: role === "HR" ? copy(hrPayrollMock.exceptions) : [],
    complianceData: role === "HR" ? copy(hrPayrollMock.complianceData) : [],
    departmentLiability: role === "HR" ? copy(hrPayrollMock.departmentLiability) : [],
    joiningExitData: role === "HR" ? copy(hrPayrollMock.joiningExitData) : null,
    teamData: isAsm ? {
      ...copy(asmPayrollMock.dashboard),
      expenseReimbursements: copy(asmPayrollMock.expenseReimbursements),
      attendanceImpact: copy(asmPayrollMock.attendanceImpact),
    } : null,
  };
  return dashboard;
};

export const payrollService = {
  getPayrollDashboardData,
  getSalaryStructures: async () => ({ data: copy(structures) }),
  getSalaryStructureDetail: async (id) => {
    const structure = findOrFail(structures, id, "Salary structure");
    return { structure: copy(structure), assignments: structure.assignedEmployees.map((employee_id) => ({ employee_id })) };
  },
  getEmployees: async () => ({ data: copy(directory) }),
  getPayrollRecords: async () => ({ data: copy(records), summary: copy(mockPayrollSummary) }),
  getPayrollDetail: async (id) => {
    const payroll = findOrFail(records, id, "Payroll record");
    const payslip = { id: payroll.payslipId, payslipId: payroll.payslipId, payrollId: payroll.id, employeeName: payroll.employeeName, month: payroll.payPeriod, grossPay: payroll.grossPay, netPay: payroll.netPay, status: payroll.status };
    return { payroll: copy(payroll), incentives: [], deductions: [], payslip, payslipData: { ...copy(payroll), ...payslip } };
  },
  getPayrollSummary: async () => ({ data: copy(mockPayrollSummary) }),
  getSalaryRevisions: async () => ({ data: copy(revisions) }),
  getLopCases: async () => ({ data: copy(lopCases) }),
  getPayrollReports: async () => ({ data: copy(records) }),
  getBankTransfers: async () => ({ data: copy(transfers) }),
  getPayrollPeriods: async () => ({ data: [copy(period)] }),
  processPayroll: async (id) => updateRecord(id, { status: "Processed", verificationStatus: "Pending" }),
  verifyPayroll: async (id) => updateRecord(id, { verificationStatus: "Verified" }),
  rejectPayroll: async (id) => updateRecord(id, { status: "Rejected", verificationStatus: "Rejected" }),
  approvePayroll: async (id) => updateRecord(id, { status: "Approved", verificationStatus: "Verified" }),
  payPayroll: async (id) => updateRecord(id, { status: "Paid", verificationStatus: "Verified" }),
  approveSalaryRevision: async (id) => {
    findOrFail(revisions, id, "Salary revision"); revisions = save("revisions", revisions.map((revision) => String(revision.id) === String(id) ? { ...revision, status: "Approved" } : revision)); return { success: true };
  },
  rejectSalaryRevision: async (id) => {
    findOrFail(revisions, id, "Salary revision"); revisions = save("revisions", revisions.map((revision) => String(revision.id) === String(id) ? { ...revision, status: "Rejected" } : revision)); return { success: true };
  },
  createSalaryRevision: async (payload) => { const created = { ...payload, id: `REV-${Date.now()}`, status: "Pending" }; revisions = save("revisions", [created, ...revisions]); return copy(created); },
  resolveLopCase: async (id, status = "Resolved") => { findOrFail(lopCases, id, "LOP case"); lopCases = save("lopCases", lopCases.map((item) => String(item.id) === String(id) ? { ...item, status } : item)); return { success: true }; },
  reviewReimbursement: async (id, status) => { findOrFail(reimbursements, id, "Reimbursement"); reimbursements = save("reimbursements", reimbursements.map((item) => String(item.id) === String(id) ? { ...item, status } : item)); return { success: true }; },
  applyReimbursement: async (id, payrollId) => { findOrFail(reimbursements, id, "Reimbursement"); reimbursements = save("reimbursements", reimbursements.map((item) => String(item.id) === String(id) ? { ...item, status: "Applied", payrollId } : item)); return { success: true }; },
  createReimbursement: async (payload) => { const created = { ...payload, id: `EXP-${Date.now()}`, status: "Pending" }; reimbursements = save("reimbursements", [created, ...reimbursements]); return copy(created); },
  dispatchBankTransfer: async (payrollId, transactionReference = "") => { transfers = save("transfers", transfers.map((transfer) => String(transfer.payrollId) === String(payrollId) ? { ...transfer, transferStatus: "Dispatched", transactionReference } : transfer)); return { success: true }; },
  freezeAttendance: async (id) => { if (id && id !== period.payroll_period_id) throw new Error("Payroll period was not found."); if (period.status !== "Draft") throw new Error("Attendance has already been frozen."); period = save("period", { ...period, status: "Processing" }); return copy(period); },
  submitToFinance: async (id) => { if (id && id !== period.payroll_period_id) throw new Error("Payroll period was not found."); if (period.status !== "Processing") throw new Error("Freeze attendance before submitting to finance."); period = save("period", { ...period, status: "Verification" }); return copy(period); },
  updateSalaryHold: async ({ employeeId, empId, isHold, reason = "", notes = "" }) => { const id = employeeId || empId; findOrFail(directory, id, "Employee"); directory = save("directory", directory.map((employee) => String(employee.id) === String(id) ? { ...employee, isHold: Boolean(isHold), status: isHold ? "On Hold" : "Active", holdReason: reason, holdNotes: notes } : employee)); return { success: true }; },
  saveSalaryStructure: async (data) => {
    if (!data.name?.trim() || !data.code?.trim()) throw new Error("Structure name and code are required.");
    const normalized = { ...data, id: data.id || `STR-${Date.now()}`, code: data.code.trim().toUpperCase(), status: data.status || "Active", assignedEmployees: data.assignedEmployees || [], assignedCount: data.assignedCount || 0, allowances: { specialAllowance: number(data.specialAllowance), medicalAllowance: number(data.medicalAllowance), conveyanceAllowance: number(data.conveyanceAllowance) }, bonus: { type: data.bonusType, value: number(data.bonusValue), frequency: data.bonusFrequency } };
    structures = save("structures", data.id ? structures.map((item) => String(item.id) === String(data.id) ? normalized : item) : [...structures, normalized]); return copy(normalized);
  },
  assignStructureToEmployees: async (structureId, employeeIds) => { findOrFail(structures, structureId, "Salary structure"); structures = save("structures", structures.map((structure) => String(structure.id) === String(structureId) ? { ...structure, assignedEmployees: [...employeeIds], assignedCount: employeeIds.length } : structure)); return { success: true }; },
  deleteSalaryStructure: async (id) => { findOrFail(structures, id, "Salary structure"); structures = save("structures", structures.filter((structure) => String(structure.id) !== String(id))); return { success: true }; },
  downloadPayslip: async (payslipId, fileName = "Payslip.pdf") => { if (!payslipId) throw new Error("This payroll does not have a generated payslip yet."); const url = URL.createObjectURL(new Blob([`Demo payslip: ${payslipId}`], { type: "text/plain" })); const link = document.createElement("a"); link.href = url; link.download = fileName.replace(/\.pdf$/i, ".txt"); document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); },
  getErrorMessage,
};

export default payrollService;
