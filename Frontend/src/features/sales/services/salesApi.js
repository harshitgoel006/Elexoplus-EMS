import { mockAsmDashboardData } from "../mock/salesData";
import { availableTerritories, mockOrdersData } from "../mock/mockOrders";
import { mockVisitsData, seMockData } from "../mock/seMockData";
import { mockStore } from "../../../mocks/appMockStore";

const clone = (value) => JSON.parse(JSON.stringify(value));
export const salesLeadSeed = clone(mockAsmDashboardData.leadsPipeline);
export const salesOrderSeed = clone(mockOrdersData);
export const salesTargetSeed = [{ id: "target-se-1", target_id: "target-se-1", status: "Active", target_value: seMockData.topMetrics.target, achieved_value: seMockData.topMetrics.achievement, employee_name: seMockData.profile.name }];
export const salesVisitSeed = clone(mockVisitsData);
const leadSeed = salesLeadSeed;
const orderSeed = salesOrderSeed;
const targetSeed = salesTargetSeed;
const get = (key, seed) => mockStore.get(`sales:${key}`, seed);
const set = (key, value) => mockStore.set(`sales:${key}`, value);

const dashboard = () => {
  const targets = get("targets", targetSeed);
  const orders = get("orders", orderSeed);
  const totalTarget = targets.reduce((sum, item) => sum + Number(item.target_value || 0), 0);
  const totalAchievement = targets.reduce((sum, item) => sum + Number(item.achieved_value || 0), 0);
  const totalSales = orders.reduce((sum, item) => sum + Number(item.order_value ?? item.value ?? 0), 0);
  const executives = new Set([
    ...targets.map((item) => item.employee_name).filter(Boolean),
    ...orders.map((item) => item.seName).filter(Boolean),
  ]);
  const regionTotals = orders.reduce((result, item) => {
    const name = item.region || item.territory || "Unassigned";
    result[name] = (result[name] || 0) + Number(item.order_value ?? item.value ?? 0);
    return result;
  }, {});
  const regionTotal = Object.values(regionTotals).reduce((sum, value) => sum + value, 0);
  const trend = orders.reduce((result, item) => {
    const period = item.period || item.orderDate?.match(/[A-Za-z]+/)?.[0] || "Current";
    const existing = result.find((row) => row.period === period);
    const value = Number(item.order_value ?? item.value ?? 0);
    if (existing) existing.sales += value;
    else result.push({ period, sales: value });
    return result;
  }, []);

  return {
    summary: {
      target_value: totalTarget,
      achieved_value: totalAchievement,
      total_asm: 1,
      total_se: executives.size,
      total_sales: totalSales,
      target_achievement: totalTarget ? Math.round((totalAchievement / totalTarget) * 100) : 0,
    },
    trend,
    regions: Object.entries(regionTotals).map(([name, value]) => ({
      name,
      value: regionTotal ? Math.round((value / regionTotal) * 100) : 0,
    })),
  };
};

export const salesApi = {
  listLeads: async () => clone(get("leads", leadSeed)),
  createLead: async (payload) => { const item = { id: `lead-${Date.now()}`, lead_id: `lead-${Date.now()}`, current_status: "New", status: "New", ...payload }; set("leads", [item, ...get("leads", leadSeed)]); return clone(item); },
  updateLead: async (id, payload) => { const leads = get("leads", leadSeed); const next = leads.map((item) => String(item.id || item.lead_id) === String(id) ? { ...item, ...payload } : item); set("leads", next); return clone(next.find((item) => String(item.id || item.lead_id) === String(id))); },
  addActivity: async (id, payload) => { const item = { id: `activity-${Date.now()}`, lead_id: id, ...payload }; set("activities", [item, ...get("activities", [])]); return clone(item); },
  dashboard: async () => clone(dashboard()),
  orders: async () => clone(get("orders", orderSeed)),
  updateOrderStatus: async (id, order_status) => { set("orders", get("orders", orderSeed).map((item) => String(item.id || item.order_id) === String(id) ? { ...item, order_status } : item)); return { success: true }; },
  territories: async () => clone(availableTerritories),
  assignOrderTerritory: async (id, territory) => { set("orders", get("orders", orderSeed).map((item) => String(item.id || item.order_id) === String(id) ? { ...item, territory } : item)); return { success: true }; },
  targets: async () => clone(get("targets", targetSeed)),
  createTarget: async (payload) => { const item = { id: `target-${Date.now()}`, target_id: `target-${Date.now()}`, status: "Active", ...payload }; set("targets", [item, ...get("targets", targetSeed)]); return clone(item); },
  updateTarget: async (id, payload) => { set("targets", get("targets", targetSeed).map((item) => String(item.id || item.target_id) === String(id) ? { ...item, ...payload } : item)); return { success: true }; },
  visits: async () => clone(get("visits", salesVisitSeed)),
  expenses: async () => clone(get("expenses", seMockData.expenses)),
  dailyReports: async () => clone(get("dailyReports", seMockData.darLogs)),
  updateDailyReportFeedback: async () => ({ success: true }),
};
