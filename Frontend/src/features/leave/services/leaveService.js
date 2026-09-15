import { BadgeCheck, CalendarCheck, ClipboardList, Clock3, Tags, XCircle } from "lucide-react";
import { leaveBalanceData, leaveHistory } from "../mock/employeeLeaveData.js";
import {
  LeaveApplicationsData,
  companyHolidaysData,
  initialLeavePolicies,
  teamLeaveCalendarEvents,
} from "../mock/leaveData.js";
import { mockStore } from "../../../mocks/appMockStore";

// Frontend-first leave store. It intentionally persists only for the running
// browser session; no leave request, document or policy is sent to the API.
const clone = (value) => JSON.parse(JSON.stringify(value));
const normalizedRole = (role) => String(role || "").trim().toUpperCase();
const policyDefaults = {
  accrualFrequency: "Yearly",
  accrualMethod: "Upfront",
  carryForwardAllowed: false,
  maxCarryForwardDays: 0,
  allowHalfDay: true,
  requiresDocument: false,
  isPaid: true,
  status: "Active",
};

const policySeed = initialLeavePolicies.map((policy) => ({ ...policyDefaults, ...policy }));
const requestSeed = [
  ...LeaveApplicationsData.map((request) => ({ ...request, document: "Not Attached" })),
  ...leaveHistory.map((request) => ({
    ...request,
    employeeName: "Nisha Barnwal",
    designation: "Sales Executive",
    initials: "NB",
    leaveType: request.leaveType.includes("(")
      ? request.leaveType.match(/\(([^)]+)\)/)?.[1] || request.leaveType
      : request.leaveType,
    appliedOn: request.date,
    approvedBy: request.status === "Approved" ? "Gaurav Kumar" : "Awaiting approval",
    approverRole: "ASM",
    canDecide: false,
  })),
];

const policies = () => mockStore.get("leave:policies", policySeed);
const requests = () => mockStore.get("leave:requests", requestSeed);
const savePolicies = (value) => mockStore.set("leave:policies", value);
const saveRequests = (value) => mockStore.set("leave:requests", value);

const policyById = (id) => policies().find((policy) => String(policy.id) === String(id));
const policyForRequest = (request) => policyById(request.leavePolicyId)
  || policies().find((policy) => policy.leaveTypeCode === request.leaveType);
const daysBetween = (fromDate, toDate, dayType) => {
  if (dayType !== "Full Day") return 0.5;
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
};
const formatDuration = (days, dayType) => dayType === "Full Day"
  ? `${days} ${days === 1 ? "Day" : "Days"}`
  : "0.5 Day";
const isOwnRequest = (request, userId) => String(request.employeeId) === String(userId);
const canActOn = (request, role, asmId) => {
  if (request.status !== "Pending" || request.canDecide === false) return false;
  if (role === "ADMIN" || role === "HR") return true;
  return role === "ASM" && String(request.asmId || "") === String(asmId || "EMP003");
};
const visibleManagementRequests = (role, asmId) => {
  if (role === "ADMIN" || role === "HR") return requests();
  if (role === "ASM") return requests().filter((request) => String(request.asmId || "") === String(asmId || "EMP003"));
  return [];
};
const requestView = (request, role, asmId) => ({
  ...clone(request),
  canDecide: canActOn(request, role, asmId),
  approverRole: request.status === "Pending" ? request.approverRole || "Pending approval" : request.approverRole,
});

export const getLeaveDashboard = async ({ role, userId, asmId } = {}) => {
  const currentRole = normalizedRole(role);
  const ownRequests = requests().filter((request) => isOwnRequest(request, userId));
  const management = visibleManagementRequests(currentRole, asmId)
    .map((request) => requestView(request, currentRole, asmId));
  const actionable = management.filter((request) => request.canDecide);
  const balances = clone(leaveBalanceData);
  const calendarEvents = [...teamLeaveCalendarEvents, ...requests()]
    .filter((request) => request.status !== "Cancelled")
    .map((request) => ({
      id: request.id,
      employeeName: request.employeeName || "Employee",
      leaveType: request.leaveType,
      startDate: request.startDate || request.fromDate,
      endDate: request.endDate || request.toDate,
      status: request.status,
    }));

  return {
    managementCards: [
      { icon: ClipboardList, title: "Waiting on You", value: actionable.length, description: "Approval queue" },
      { icon: CalendarCheck, title: "Approved Requests", value: management.filter((request) => request.status === "Approved").length, description: "Visible approved requests" },
      { icon: Tags, title: "Leave Types", value: policies().length, description: "Active leave policies" },
    ],
    summaryCards: [
      { title: "Available Leaves", value: balances.reduce((total, item) => total + Number(item.available || 0), 0), description: "Total remaining leaves", icon: CalendarCheck },
      { title: "Pending Requests", value: ownRequests.filter((request) => request.status === "Pending").length, description: "Your open requests", icon: Clock3 },
      { title: "Approved This Year", value: ownRequests.filter((request) => request.status === "Approved").length, description: "Your approved requests", icon: BadgeCheck },
      { title: "Rejected", value: ownRequests.filter((request) => request.status === "Rejected").length, description: "Your rejected requests", icon: XCircle },
    ],
    leaveBalanceData: balances,
    leavePolicies: clone(policies()),
    teamLeaves: management,
    leaveHistory: ownRequests.map((request) => clone(request)),
    calendarData: { events: calendarEvents, holidays: clone(companyHolidaysData) },
  };
};

export const submitLeaveApplication = async ({ leaveType, dayType, fromDate, toDate, reason, emergencyContact, document, employee = {} }) => {
  const policy = policyForRequest({ leavePolicyId: leaveType?.id, leaveType: leaveType?.value });
  if (!policy) throw new Error("Select a valid leave policy.");
  if (!fromDate || !toDate || new Date(toDate) < new Date(fromDate)) throw new Error("Enter a valid leave date range.");
  const days = daysBetween(fromDate, toDate, dayType);
  const employeeId = employee.employeeId || employee.employeeCode || employee.id || "EMP004";
  const newRequest = {
    id: `LV-${Date.now()}`, employeeId, employeeName: employee.name || "Nisha Barnwal",
    designation: employee.designation || employee.role || "Employee",
    initials: (employee.name || "Nisha Barnwal").split(" ").map((part) => part[0]).join("").slice(0, 2),
    asmId: employee.asmId || "EMP003", leavePolicyId: policy.id, leaveType: policy.leaveTypeCode,
    fromDate, toDate, duration: formatDuration(days, dayType), dayType, reason: String(reason || "").trim(),
    emergencyContact: String(emergencyContact || "").trim(), document: document?.name || "Not Attached",
    documents: document ? [{ id: `DOC-${Date.now()}`, name: document.name, type: "Supporting Document" }] : [],
    appliedOn: new Date().toISOString().slice(0, 10), approvedBy: "Awaiting approval", approverRole: "ASM", status: "Pending",
  };
  saveRequests([newRequest, ...requests()]);
  return clone(newRequest);
};

export const updateLeaveApplicationStatus = async (leaveId, status) => {
  const nextStatus = status === "Approved" ? "Approved" : status === "Rejected" ? "Rejected" : null;
  if (!nextStatus) throw new Error("Choose Approved or Rejected.");
  const existing = requests().find((request) => String(request.id) === String(leaveId));
  if (!existing) throw new Error("Leave request was not found.");
  if (existing.status !== "Pending") throw new Error("Only pending leave requests can be decided.");
  const updated = { ...existing, status: nextStatus, approvedBy: nextStatus, canDecide: false };
  saveRequests(requests().map((request) => String(request.id) === String(leaveId) ? updated : request));
  return { success: true, request: clone(updated) };
};

export const cancelLeaveApplication = async (leaveId) => {
  const existing = requests().find((request) => String(request.id) === String(leaveId));
  if (!existing) throw new Error("Leave request was not found.");
  if (existing.status !== "Pending") throw new Error("Only pending leave requests can be cancelled.");
  const updated = { ...existing, status: "Cancelled", canDecide: false };
  saveRequests(requests().map((request) => String(request.id) === String(leaveId) ? updated : request));
  return { success: true, request: clone(updated) };
};

export const getLeaveRequestDocuments = async (leaveId) => {
  const request = requests().find((item) => String(item.id) === String(leaveId));
  if (!request) throw new Error("Leave request was not found.");
  if (request.documents?.length) return clone(request.documents);
  return request.document && request.document !== "Not Attached" ? [{ id: `DOC-${request.id}`, name: request.document, type: "Supporting Document" }] : [];
};

export const openLeaveDocument = async (documentId) => {
  const document = requests().flatMap((request) => request.documents || []).find((item) => String(item.id) === String(documentId));
  const name = document?.name || "leave-supporting-document.txt";
  const url = URL.createObjectURL(new Blob([`Demo document: ${name}`], { type: "text/plain" }));
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const getLeavePolicies = async () => clone(policies());

export const updateLeavePolicy = async (policy) => {
  const index = policies().findIndex((item) => String(item.id) === String(policy.id));
  if (index === -1) throw new Error("Leave policy was not found.");
  const updated = { ...policies()[index], ...policyDefaults, ...policy, leaveTypeCode: String(policy.leaveTypeCode || "").trim().toUpperCase() };
  if (!updated.leaveTypeName?.trim() || !updated.leaveTypeCode) throw new Error("Leave type name and code are required.");
  savePolicies(policies().map((item, itemIndex) => itemIndex === index ? updated : item));
  return clone(updated);
};

export const createLeavePolicy = async (policy) => {
  const code = String(policy.leaveTypeCode || "").trim().toUpperCase();
  if (!policy.leaveTypeName?.trim() || !code) throw new Error("Leave type name and code are required.");
  if (policies().some((item) => item.leaveTypeCode === code)) throw new Error("A leave policy with this code already exists.");
  const created = { ...policyDefaults, ...policy, id: `POL-${Date.now()}`, leaveTypeCode: code, status: "Active" };
  savePolicies([...policies(), created]);
  return clone(created);
};

export const deleteLeavePolicy = async (policyId) => {
  if (!policies().some((policy) => String(policy.id) === String(policyId))) throw new Error("Leave policy was not found.");
  savePolicies(policies().filter((policy) => String(policy.id) !== String(policyId)));
  return { success: true };
};
