import initialEmployees from "../mock/employees";
import { mockStore } from "../../../mocks/appMockStore";

const clone = (value) => JSON.parse(JSON.stringify(value));
const employeeSeed = initialEmployees.map((employee) => ({ ...employee }));
const getStore = () => mockStore.get("employees", employeeSeed);
const saveStore = (employees) => mockStore.set("employees", employees);
const nextId = () => `EMP${String(getStore().length + 1).padStart(3, "0")}`;

export const getEmployees = async () => clone(getStore());

export const createEmployee = async (employee) => {
  const created = { ...employee, id: employee.id || nextId(), status: employee.status || "Active", documents: employee.documents || [] };
  saveStore([created, ...getStore()]);
  return clone(created);
};

export const updateEmployee = async (employee) => {
  const id = employee.employeeId || employee.id;
  const employees = getStore();
  const index = employees.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Employee not found.");
  const updated = { ...employees[index], ...employee, id };
  saveStore(employees.map((item, itemIndex) => itemIndex === index ? updated : item));
  return clone(updated);
};

export const deleteEmployee = async (employeeId) => {
  const employees = getStore();
  const index = employees.findIndex((item) => item.id === employeeId);
  if (index < 0) throw new Error("Employee not found.");
  saveStore(employees.map((item, itemIndex) => itemIndex === index ? { ...item, status: "Inactive" } : item));
};

export const getEmployeeById = async (employeeId) => clone(getStore().find((item) => item.id === employeeId) || null);

export const uploadEmployeeDocument = async (employeeId, documentType, file) => {
  const employees = getStore();
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) throw new Error("Employee not found.");
  const document = { id: `${employeeId}-${Date.now()}`, name: file?.name || documentType, type: documentType, status: "Uploaded" };
  saveStore(employees.map((item) => item.id === employeeId
    ? { ...item, documents: [...(item.documents || []), document] }
    : item));
  return clone(document);
};

export const openEmployeeDocument = async (employeeId, documentId, download = false) => {
  const employee = getStore().find((item) => item.id === employeeId);
  const document = (employee?.documents || []).find((item) => item.id === documentId || item.name === documentId);
  if (!document) throw new Error("Document not found.");
  const url = URL.createObjectURL(new Blob([`Mock document: ${document.name}`], { type: "text/plain" }));
  const link = window.document.createElement("a");
  link.href = url;
  if (download) link.download = document.name || "employee-document.txt";
  else link.target = "_blank";
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
