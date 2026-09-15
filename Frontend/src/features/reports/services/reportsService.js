import { reportsData } from "../mock/reportsData";
import { mockStore } from "../../../mocks/appMockStore";
import initialEmployees from "../../employee-master/mock/employees";
import { leaveRequestSeed } from "../../leave/services/leaveService";
import { salesOrderSeed, salesTargetSeed } from "../../sales/services/salesApi";

const clone = (value) => JSON.parse(JSON.stringify(value));
const data = () => mockStore.get("reports", reportsData);
const employees = () => mockStore.get("employees", initialEmployees);
const leaves = () => mockStore.get("leave:requests", leaveRequestSeed);
const orders = () => mockStore.get("sales:orders", salesOrderSeed);
const targets = () => mockStore.get("sales:targets", salesTargetSeed);
const number = (value) => Number(String(value ?? 0).replace(/[^0-9.-]/g, "")) || 0;
const initials = (name) => String(name || "Employee").split(" ").map((part) => part[0]).join("").slice(0, 2);

const currentEmployeeReports = () => employees().map((employee) => ({
  id: employee.id,
  employeeId: employee.id,
  name: employee.name,
  employeeName: employee.name,
  department: employee.department || "Unassigned",
  designation: employee.designation || employee.role || "Employee",
  branch: employee.branch || employee.location || "Head Office",
  employmentType: employee.employmentType || "Full Time",
  joiningDate: employee.joiningDate || null,
  status: employee.status || "Active",
}));

const currentAttendanceReports = () => {
  const byId = new Map(employees().map((employee) => [String(employee.id), employee]));
  return data().attendanceReports
    .filter((row) => byId.has(String(row.employeeId)))
    .map((row) => {
      const employee = byId.get(String(row.employeeId));
      return { ...row, employeeName: employee.name, avatar: initials(employee.name), department: employee.department || row.department };
    });
};

const currentSalesReports = () => orders().map((order, index) => {
  const target = targets()[index % Math.max(targets().length, 1)] || {};
  const achievement = number(order.value ?? order.order_value);
  const targetValue = number(target.target_value) || achievement;
  return {
    id: order.id || order.order_id || `sales-${index}`,
    salesExecutive: order.seName || order.employee_name || "Sales Executive",
    employeeName: order.seName || order.employee_name || "Sales Executive",
    region: order.territory || "Unassigned",
    month: order.orderDate || order.order_date || "Current period",
    target: targetValue,
    achievement,
    percentage: targetValue ? Math.round((achievement / targetValue) * 100) : 0,
    status: order.order_status || order.status || "Created",
  };
});

const currentMetrics = () => {
  const employeeList = employees();
  const activeEmployees = employeeList.filter((employee) => String(employee.status || "Active").toLowerCase() === "active");
  const orderValue = orders().reduce((total, order) => total + number(order.value ?? order.order_value), 0);
  const targetValue = targets().reduce((total, target) => total + number(target.target_value), 0);
  const achievedValue = targets().reduce((total, target) => total + number(target.achieved_value), 0);
  const pendingLeaves = leaves().filter((leave) => leave.status === "Pending").length;
  return {
    ...data().metrics,
    overview: { ...data().metrics.overview, totalEmployees: employeeList.length, activeReports: pendingLeaves, salesAchievement: targetValue ? Math.round((achievedValue / targetValue) * 100) : 0 },
    companyKpis: {
      ...data().metrics.companyKpis,
      totalRevenue: { value: `₹${new Intl.NumberFormat("en-IN").format(orderValue)}`, trend: "Current mock data" },
      activeEmployees: { value: String(activeEmployees.length), trend: `${pendingLeaves} pending leaves` },
    },
  };
};
const contains = (value, search = "") => !search || String(value || "").toLowerCase().includes(String(search).toLowerCase());
const scope = (rows, params = {}) => rows.filter((row) => {
  const search = params.search || "";
  return contains(row.employeeName || row.name || row.salesExecutive, search) || contains(row.employeeId || row.id, search);
});

export const reportsService = {
  getAttendanceReports: async (params = {}) => clone(scope(currentAttendanceReports(), params)),
  getSalesReports: async (params = {}) => clone(scope(currentSalesReports(), params)),
  getAsmReports: async (params = {}) => clone(scope(data().asmReports, params)),
  getEmployeeReports: async (params = {}) => clone(scope(currentEmployeeReports(), params)),
  getCompanyMetrics: async () => clone(currentMetrics()),
  getChartData: async () => clone(data().chartData),
};
