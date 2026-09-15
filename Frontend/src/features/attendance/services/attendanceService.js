import authStorage from "../../auth/utils/authStorage";
import { AttendanceDataProvider } from "../providers/AttendanceDataProvider";
import { ATTENDANCE_STATUS, CORRECTION_STATUS } from "../config/attendanceStatus";
import { mockStore } from "../../../mocks/appMockStore";

// Attendance is deliberately frontend-first for the demo build. The provider
// owns mutable in-memory data; the public service contract stays API-shaped so
// existing pages can later be reconnected without component rewrites.
const currentUser = () => authStorage.getCurrentUser() || {};
const clone = (value) => JSON.parse(JSON.stringify(value));
const normalize = (value) => String(value || "").trim().toLowerCase();
const todayStates = () => mockStore.get("attendance:todayStates", {});

const resolveCurrentEmployee = async () => {
  const user = currentUser();
  const employees = await AttendanceDataProvider.fetchEmployees();
  return employees.find((employee) =>
    normalize(employee.name) === normalize(user.name)
    || normalize(employee.email) === normalize(user.email)
    || normalize(employee.id) === normalize(user.employeeCode || user.employee_code),
  ) || employees.find((employee) => employee.id === "EMP001") || null;
};

const getTodayState = async () => {
  const employee = await resolveCurrentEmployee();
  if (!employee) return null;
  const key = employee.id;
  if (todayStates()[key]) return clone(todayStates()[key]);
  return {
    id: `TODAY-${key}`,
    employeeId: key,
    employeeName: employee.name,
    checkIn: null,
    checkOut: null,
    breakMinutes: 0,
    breakStartedAt: null,
    status: ATTENDANCE_STATUS.PRESENT,
  };
};

const saveTodayState = async (next) => {
  mockStore.set("attendance:todayStates", { ...todayStates(), [next.employeeId]: next });
  return clone(next);
};

const getOverview = async () => {
  const [employees, allRecords, todayRecords, allCorrections] = await Promise.all([
    AttendanceDataProvider.fetchEmployees(),
    AttendanceDataProvider.fetchAllRecords(),
    AttendanceDataProvider.fetchTodayRecords(),
    AttendanceDataProvider.fetchCorrections(),
  ]);
  return {
    currentEmployee: await resolveCurrentEmployee(),
    employees,
    records: allRecords,
    todayRecords,
    corrections: allCorrections,
  };
};

const refresh = async () => getOverview();
const records = async () => AttendanceDataProvider.fetchAllRecords();
const corrections = async () => AttendanceDataProvider.fetchCorrections();

export const attendanceService = {
  getOverview,
  refresh,
  getEmployees: () => AttendanceDataProvider.fetchEmployees(),
  getEmployeeById: (id) => AttendanceDataProvider.fetchEmployeeById(id),
  getEmployeeByName: (name) => AttendanceDataProvider.fetchEmployeeByName(name),
  getDepartments: () => AttendanceDataProvider.fetchDepartments(),
  getBranches: () => AttendanceDataProvider.fetchBranches(),
  getAttendanceRecords: records,
  getAllRecords: records,
  getEmployeeAttendance: async (id) => (await records()).filter((r) => r.employeeId === id),
  getRecordsForEmployee: async (id) => (await records()).filter((r) => r.employeeId === id),
  getTodayAttendance: () => AttendanceDataProvider.fetchTodayRecords(),
  getTodayRecords: () => AttendanceDataProvider.fetchTodayRecords(),
  getTeamAttendance: async (ids) => (await records()).filter((r) => ids.includes(r.employeeId)),
  getRecordsForTeam: async (ids) => (await records()).filter((r) => ids.includes(r.employeeId)),
  getCorrections: corrections,
  getEmployeeCorrections: async (id) => (await corrections()).filter((r) => r.employeeId === id),
  getCorrectionsForEmployee: async (id) => (await corrections()).filter((r) => r.employeeId === id),
  getNotifications: () => AttendanceDataProvider.fetchNotifications(),
  getTodayState,
  checkIn: async () => {
    const state = await getTodayState();
    if (!state) throw new Error("Employee profile is unavailable.");
    if (state.checkIn) throw new Error("You have already checked in today.");
    return saveTodayState({ ...state, checkIn: new Date().toISOString(), status: ATTENDANCE_STATUS.PRESENT });
  },
  checkOut: async () => {
    const state = await getTodayState();
    if (!state?.checkIn) throw new Error("Check in before checking out.");
    if (state.breakStartedAt) throw new Error("End your break before checking out.");
    if (state.checkOut) throw new Error("You have already checked out today.");
    return saveTodayState({ ...state, checkOut: new Date().toISOString() });
  },
  startBreak: async () => {
    const state = await getTodayState();
    if (!state?.checkIn || state.checkOut) throw new Error("An active check-in is required to start a break.");
    if (state.breakStartedAt) throw new Error("A break is already in progress.");
    return saveTodayState({ ...state, breakStartedAt: new Date().toISOString() });
  },
  endBreak: async () => {
    const state = await getTodayState();
    if (!state?.breakStartedAt) throw new Error("No active break was found.");
    const elapsed = Math.max(0, Math.round((Date.now() - new Date(state.breakStartedAt).getTime()) / 60000));
    return saveTodayState({ ...state, breakStartedAt: null, breakMinutes: state.breakMinutes + elapsed });
  },
  updateRecord: async (id, payload) => {
    const updated = await AttendanceDataProvider.updateAttendanceRecord(id, payload);
    if (!updated) throw new Error("Attendance record was not found.");
    return updated;
  },
  submitCorrection: ({ employee, form }) => AttendanceDataProvider.createCorrection({ employee, form }),
  approveCorrection: async (id) => {
    const updated = await AttendanceDataProvider.updateCorrectionStatus(id, CORRECTION_STATUS.APPROVED);
    if (!updated) throw new Error("Correction request was not found.");
    return updated;
  },
  rejectCorrection: async (id) => {
    const updated = await AttendanceDataProvider.updateCorrectionStatus(id, CORRECTION_STATUS.REJECTED);
    if (!updated) throw new Error("Correction request was not found.");
    return updated;
  },
};
