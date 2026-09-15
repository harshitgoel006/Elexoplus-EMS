import {
  initialCompanySettings,
  initialDepartments,
  initialDesignations,
  initialEmploymentTypes,
  initialEmployeeStatuses,
  initialPreferences,
} from "../mock/settingsMock";
import { SETTINGS_TABS } from "../config/settingsTabs";
import { mockStore } from "../../../mocks/appMockStore";

const clone = (value) => JSON.parse(JSON.stringify(value));
const get = (key, seed) => mockStore.get(`settings:${key}`, seed);
const set = (key, value) => mockStore.set(`settings:${key}`, value);

const create = (list, value) => ({ ...value, id: value.id || `${Date.now()}-${list.length + 1}` });
const update = (list, id, value) => list.map((item) => String(item.id) === String(id) ? { ...item, ...value, id: item.id } : item);
const remove = (list, id) => list.filter((item) => String(item.id) !== String(id));

export const getSettingsTabs = () => SETTINGS_TABS;
export const getCompanySettings = async () => clone(get("company", initialCompanySettings));
export const updateCompanySettings = async (value) => { const company = { ...get("company", initialCompanySettings), ...value }; set("company", company); return { success: true, settings: clone(company) }; };

export const getDepartments = async () => clone(get("departments", initialDepartments));
export const createDepartment = async (value) => { const departments = get("departments", initialDepartments); const item = create(departments, value); set("departments", [...departments, item]); return { success: true, department: clone(item) }; };
export const updateDepartment = async (id, value) => { set("departments", update(get("departments", initialDepartments), id, value)); return { success: true }; };
export const deleteDepartment = async (id) => { set("departments", remove(get("departments", initialDepartments), id)); return { success: true }; };

export const getDesignations = async () => clone(get("designations", initialDesignations));
export const createDesignation = async (value) => { const designations = get("designations", initialDesignations); const item = create(designations, value); set("designations", [...designations, item]); return { success: true, designation: clone(item) }; };
export const updateDesignation = async (id, value) => { set("designations", update(get("designations", initialDesignations), id, value)); return { success: true }; };
export const deleteDesignation = async (id) => { set("designations", remove(get("designations", initialDesignations), id)); return { success: true }; };

export const getEmploymentTypes = async () => clone(get("employmentTypes", initialEmploymentTypes));
export const createEmploymentType = async (value) => { const employmentTypes = get("employmentTypes", initialEmploymentTypes); const item = create(employmentTypes, value); set("employmentTypes", [...employmentTypes, item]); return { success: true, employmentType: clone(item) }; };
export const updateEmploymentType = async (id, value) => { set("employmentTypes", update(get("employmentTypes", initialEmploymentTypes), id, value)); return { success: true }; };
export const deleteEmploymentType = async (id) => { set("employmentTypes", remove(get("employmentTypes", initialEmploymentTypes), id)); return { success: true }; };

export const getEmployeeStatuses = async () => clone(get("employeeStatuses", initialEmployeeStatuses));
export const createEmployeeStatus = async (value) => { const employeeStatuses = get("employeeStatuses", initialEmployeeStatuses); const item = create(employeeStatuses, value); set("employeeStatuses", [...employeeStatuses, item]); return { success: true, status: clone(item) }; };
export const updateEmployeeStatus = async (id, value) => { set("employeeStatuses", update(get("employeeStatuses", initialEmployeeStatuses), id, value)); return { success: true }; };
export const deleteEmployeeStatus = async (id) => { set("employeeStatuses", remove(get("employeeStatuses", initialEmployeeStatuses), id)); return { success: true }; };

export const getPreferences = async () => clone(get("preferences", initialPreferences));
export const updatePreferences = async (value) => { const preferences = { ...get("preferences", initialPreferences), ...value }; set("preferences", preferences); return { success: true, preferences: clone(preferences) }; };
