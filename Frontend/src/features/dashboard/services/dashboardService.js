import HERO_DATA from "../config/heroData";
import KPI_DATA from "../config/kpiData";
import ANALYTICS_DATA from "../config/analyticsData";
import QUICK_ACTION_DATA from "../config/quickActionData";
import DASHBOARD_PERMISSIONS from "../config/dashboardPermissions";
import PENDING_TASK_DATA from "../config/pendingTaskData";
import RECENT_ACTIVITY_DATA from "../config/recentActivityData";
import analyticsMock from "../mock/analyticsMock";

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

const buildDashboard = (role) => {
  const metrics = KPI_DATA[role] || [];

  return {
    permissions: DASHBOARD_PERMISSIONS[role],
    hero: HERO_DATA[role] || {},
    kpis: metrics.map((metric, index) => ({
      ...(KPI_DATA[role] || [])[index],
      title: metric.title,
      value: formatMetric(metric),
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
