import { reportsData } from "../mock/reportsData";
import { mockStore } from "../../../mocks/appMockStore";

const clone = (value) => JSON.parse(JSON.stringify(value));
const data = () => mockStore.get("reports", reportsData);
const contains = (value, search = "") => !search || String(value || "").toLowerCase().includes(String(search).toLowerCase());
const scope = (rows, params = {}) => rows.filter((row) => {
  const search = params.search || "";
  return contains(row.employeeName || row.name || row.salesExecutive, search) || contains(row.employeeId || row.id, search);
});

export const reportsService = {
  getAttendanceReports: async (params = {}) => clone(scope(data().attendanceReports, params)),
  getSalesReports: async (params = {}) => clone(scope(data().salesReports, params)),
  getAsmReports: async (params = {}) => clone(scope(data().asmReports, params)),
  getEmployeeReports: async (params = {}) => clone(scope(data().employeeReports, params)),
  getCompanyMetrics: async () => clone(data().metrics),
  getChartData: async () => clone(data().chartData),
};
