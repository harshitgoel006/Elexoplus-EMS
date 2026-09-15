import {
  initialDepartments,
  initialDesignations,
  initialEmploymentTypes,
  initialEmployeeStatuses,
} from "../../settings/mock/settingsMock";
import { mockStore } from "../../../mocks/appMockStore";

const active = (item) => String(item.status || "Active").toLowerCase() === "active";
const values = (key, seed) => mockStore.get(`settings:${key}`, seed)
  .filter(active)
  .map((item) => item.name)
  .filter(Boolean);

export const employeeDepartments = () => values("departments", initialDepartments);
export const employeeDesignations = () => values("designations", initialDesignations);
export const employeeEmploymentTypes = () => values("employmentTypes", initialEmploymentTypes);
export const employeeStatuses = () => values("employeeStatuses", initialEmployeeStatuses);

export const departmentFilterOptions = () => [
  { label: "All Departments", value: "" },
  ...employeeDepartments().map((name) => ({ label: name, value: name })),
];

export const designationFilterOptions = () => [
  { label: "All Roles", value: "" },
  ...employeeDesignations().map((name) => ({ label: name, value: name })),
];

export const statusFilterOptions = () => [
  { label: "All Status", value: "" },
  ...employeeStatuses().map((name) => ({ label: name, value: name })),
];
