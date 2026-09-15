import HERO_DATA from "../config/heroData";
import KPI_DATA from "../config/kpiData";
import ANALYTICS_DATA from "../config/analyticsData";
import QUICK_ACTION_DATA from "../config/quickActionData";
import DASHBOARD_PERMISSIONS from "../config/dashboardPermissions";
import PENDING_TASK_DATA from "../config/pendingTaskData";
import RECENT_ACTIVITY_DATA from "../config/recentActivityData";
import analyticsMock from "../mock/analyticsMock";
import initialEmployees from "../../employee-master/mock/employees";
import { leaveRequestSeed } from "../../leave/services/leaveService";
import { salesOrderSeed, salesTargetSeed, salesVisitSeed } from "../../sales/services/salesApi";
import { mockStore } from "../../../mocks/appMockStore";

const ANALYTICS_KEYS = {
  ADMIN: ["revenue_trend", "target_achievement", "department_distribution"],
  HR: ["attendance_trend", "attendance_score", "hiring_performance"],
  ASM: ["sales_trend", "target_achievement", "top_executives"],
  SALES_EXECUTIVE: ["daily_orders", "target_achievement", "visit_performance"],
};

const formatMetric = ({ value, format }) => {
  // Configured mock cards already contain display-ready strings such as
  // "₹18.4 L" and "82%". Do not coerce them to Number, otherwise NaN becomes
  // zero and the dashboard no longer matches its own mock data.
  if (!format) return String(value ?? 0);

  const number = Number(value || 0);

  if (format === "currency") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(number);
  }

  return format === "percentage" ? `${number}%` : String(number);
};

const number = (value) => Number(String(value ?? 0).replace(/[^0-9.-]/g, "")) || 0;
const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(number(value));

const liveKpis = (role) => {
  const employees = mockStore.get("employees", initialEmployees);
  const leaves = mockStore.get("leave:requests", leaveRequestSeed);
  const orders = mockStore.get("sales:orders", salesOrderSeed);
  const targets = mockStore.get("sales:targets", salesTargetSeed);
  const visits = mockStore.get("sales:visits", salesVisitSeed);
  const activeEmployees = employees.filter((employee) => String(employee.status || "Active").toLowerCase() === "active");
  const salesEmployees = activeEmployees.filter((employee) => /sales/i.test(`${employee.department} ${employee.role} ${employee.designation}`));
  const orderValue = orders.reduce((total, order) => total + number(order.value ?? order.order_value), 0);
  const payrollTotal = activeEmployees.reduce((total, employee) => total + number(employee.netSalary || employee.grossSalary), 0);
  const targetValue = targets.reduce((total, target) => total + number(target.target_value), 0);
  const achievedValue = targets.reduce((total, target) => total + number(target.achieved_value), 0);
  const targetAchievement = targetValue ? Math.round((achievedValue / targetValue) * 100) : 0;
  const pendingLeaves = leaves.filter((leave) => leave.status === "Pending").length;
  const pendingDocuments = employees.reduce((total, employee) => total + (employee.documents || [])
    .filter((document) => String(document.status || "").toLowerCase() !== "uploaded").length, 0);

  if (role === "ADMIN") return [activeEmployees.length, money(payrollTotal), money(orderValue), pendingLeaves];
  if (role === "HR") return [
    activeEmployees.length,
    employees.filter((employee) => String(employee.joiningDate || "").includes(String(new Date().getFullYear()))).length,
    pendingLeaves,
    pendingDocuments,
  ];
  if (role === "ASM") return [salesEmployees.length, `${targetAchievement}%`, money(orderValue), visits.filter((visit) => String(visit.status || "").toLowerCase() === "completed").length];
  return [
    visits.filter((visit) => String(visit.status || "").toLowerCase() === "completed").length,
    orders.length,
    `${targetAchievement}%`,
    money(Math.max(0, achievedValue - targetValue * 0.7) * 0.05),
  ];
};

const buildDashboard = (role) => {
  const metrics = KPI_DATA[role] || [];
  const liveValues = liveKpis(role);

  return {
    permissions: DASHBOARD_PERMISSIONS[role],
    hero: HERO_DATA[role] || {},
    kpis: metrics.map((metric, index) => ({
      ...(KPI_DATA[role] || [])[index],
      title: metric.title,
      value: liveValues[index] === undefined ? formatMetric(metric) : String(liveValues[index]),
      subtitle: "Current period",
    })),
    analytics: (ANALYTICS_DATA[role] || []).map((item) => ({
      ...item,
      data: analyticsMock[item.mock] || [],
    })),
    pending: PENDING_TASK_DATA[role] || [],
    activity: RECENT_ACTIVITY_DATA[role] || [],
    actions: QUICK_ACTION_DATA[role] || [],
  };
};

export const getDashboardData = async (role) => {
  const resolvedRole = role || "SALES_EXECUTIVE";
  // Dashboard configuration includes Lucide React components. Those component
  // references cannot be JSON-cloned by the generic data store, so build the
  // presentation model from the same frontend mock configuration on each read.
  return { ...buildDashboard(resolvedRole), role: resolvedRole, live: false };
};
