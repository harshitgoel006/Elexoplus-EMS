/**
 * AttendanceDataProvider (Repository)
 * -----------------------------------
 * Single source of truth for all Attendance data. This is the ONLY file
 * in the Attendance module that touches raw/seed data. When the backend
 * is available, replace the internals of these methods with `fetch(...)`
 * / API-client calls — the exported shape stays the same, so
 * `attendanceService` and every page/component keep working unchanged.
 *
 * Data flow:
 *   Page → attendanceService → AttendanceDataProvider → (Backend later)
 *
 * Components and pages MUST NOT import from `../mock/*` or from this
 * provider directly. They go through `attendanceService`.
 */

import {
  ATTENDANCE_EMPLOYEES,
  ATTENDANCE_RECORDS,
} from "../mock/attendanceRecords";
import { CORRECTION_REQUESTS } from "../mock/corrections";
import { ATTENDANCE_NOTIFICATIONS } from "../mock/notifications";
import { CORRECTION_STATUS } from "../config/attendanceStatus";
import { mockStore } from "../../../mocks/appMockStore";
// Simulated network latency so pages exercise their loading state.
// When wiring the real backend, remove `wait` and return the API promise.
const LATENCY_MS = 150;
const wait = (data, ms = LATENCY_MS) =>
  data;

// In-memory stores. Cloned from seed data so runtime mutations
// (approve/reject/submit) don't leak back into the seed arrays.
const employees = () => mockStore.get("attendance:employees", ATTENDANCE_EMPLOYEES);
const records = () => mockStore.get("attendance:records", ATTENDANCE_RECORDS);
const corrections = () => mockStore.get("attendance:corrections", CORRECTION_REQUESTS);
const notifications = () => mockStore.get("attendance:notifications", ATTENDANCE_NOTIFICATIONS);

// ---------- Employees ----------
const fetchEmployees = () => wait(employees().map((e) => ({ ...e })));

const fetchEmployeeById = (id) => {
  const emp = employees().find((e) => e.id === id);
  return wait(emp ? { ...emp } : null);
};

const fetchEmployeeByName = (name) => {
  const emp = employees().find((e) => e.name === name);
  return wait(emp ? { ...emp } : null);
};

const fetchDepartments = () =>
  wait([...new Set(employees().map((e) => e.department))]);

const fetchBranches = () =>
  wait([...new Set(employees().map((e) => e.branch))]);

// ---------- Attendance records ----------
const fetchAllRecords = () => wait(records().map((r) => ({ ...r })));

const fetchRecordsForEmployee = (empId) =>
  wait(records().filter((r) => r.employeeId === empId).map((r) => ({ ...r })));

const fetchRecordsForTeam = (employeeIds) =>
  wait(
    records()
      .filter((r) => employeeIds.includes(r.employeeId))
      .map((r) => ({ ...r })),
  );

const fetchTodayRecords = () => {
  // Fall back to the most recent working day so demo dashboards stay populated.
  const ref = new Date();
  ref.setHours(0, 0, 0, 0);
  while (ref.getDay() === 0 || ref.getDay() === 6) {
    ref.setDate(ref.getDate() - 1);
  }
  const today = records()
    .filter((r) => {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === ref.getTime();
    })
    .map((r) => ({ ...r }));
  return wait(today);
};

const updateAttendanceRecord = (id, payload) => {
  const existing = records().find((record) => record.id === id);
  if (!existing) return wait(null);

  const date = String(existing.date).slice(0, 10);
  const toIso = (value) => (value ? new Date(`${date}T${value}:00`).toISOString() : null);
  const checkIn = payload.check_in === undefined ? existing.checkIn : toIso(payload.check_in);
  const checkOut = payload.check_out === undefined ? existing.checkOut : toIso(payload.check_out);
  const breakMinutes = payload.break_minutes === undefined
    ? existing.breakMinutes
    : Math.max(0, Number(payload.break_minutes) || 0);
  const workingHours = checkIn && checkOut
    ? Math.max(0, (new Date(checkOut) - new Date(checkIn)) / 3600000 - breakMinutes / 60)
    : 0;

  const updated = {
    ...existing,
    checkIn,
    checkOut,
    breakMinutes,
    workingHours,
    overtime: Math.max(0, workingHours - 8),
    status: payload.status || existing.status,
    remarks: payload.remarks ?? existing.remarks,
  };
  mockStore.set("attendance:records", records().map((record) => (record.id === id ? updated : record)));
  return wait({ ...updated });
};

// ---------- Corrections ----------
const fetchCorrections = () => wait(corrections().map((c) => ({ ...c })));

const fetchCorrectionsForEmployee = (empId) =>
  wait(corrections().filter((c) => c.employeeId === empId).map((c) => ({ ...c })));

const createCorrection = ({ employee, form }) => {
  const record = {
    id: `COR-${Math.floor(Math.random() * 9000) + 1000}`,
    employeeId: employee?.id,
    employeeName: employee?.name || "You",
    department: employee?.department || "—",
    date: form.date,
    requestedCheckIn: form.checkIn,
    requestedCheckOut: form.checkOut,
    reason: form.reason,
    status: CORRECTION_STATUS.PENDING,
    submittedOn: new Date().toISOString().slice(0, 10),
  };
  mockStore.set("attendance:corrections", [record, ...corrections()]);
  return wait({ ...record });
};

const updateCorrectionStatus = (id, status) => {
  const next = corrections().map((c) =>
    c.id === id ? { ...c, status } : c,
  );
  mockStore.set("attendance:corrections", next);
  const updated = next.find((c) => c.id === id);
  return wait(updated ? { ...updated } : null);
};

// ---------- Notifications ----------
const fetchNotifications = () => wait(notifications().map((n) => ({ ...n })));

export const AttendanceDataProvider = {
  fetchEmployees,
  fetchEmployeeById,
  fetchEmployeeByName,
  fetchDepartments,
  fetchBranches,
  fetchAllRecords,
  fetchRecordsForEmployee,
  fetchRecordsForTeam,
  fetchTodayRecords,
  updateAttendanceRecord,
  fetchCorrections,
  fetchCorrectionsForEmployee,
  createCorrection,
  updateCorrectionStatus,
  fetchNotifications,
};

