import { mockAsmDashboardData } from "../mock/salesData";
import { availableTerritories, mockOrdersData } from "../mock/mockOrders";
import { mockVisitsData, seMockData } from "../mock/seMockData";
import { mockStore } from "../../../mocks/appMockStore";

const clone = (value) => JSON.parse(JSON.stringify(value));
const leadSeed = clone(mockAsmDashboardData.leadsPipeline);
const orderSeed = clone(mockOrdersData);
const targetSeed = [{ id: "target-se-1", target_id: "target-se-1", status: "Active", target_value: seMockData.topMetrics.target, achieved_value: seMockData.topMetrics.achievement, employee_name: seMockData.profile.name }];
const get = (key, seed) => mockStore.get(`sales:${key}`, seed);
const set = (key, value) => mockStore.set(`sales:${key}`, value);

const dashboard = () => {
  const targets = get("targets", targetSeed);
  return { summary: { target_value: targets.reduce((sum, item) => sum + Number(item.target_value || 0), 0), achieved_value: targets.reduce((sum, item) => sum + Number(item.achieved_value || 0), 0) } };
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
  visits: async () => clone(get("visits", mockVisitsData)),
  expenses: async () => clone(get("expenses", seMockData.expenses)),
  dailyReports: async () => clone(get("dailyReports", seMockData.darLogs)),
  updateDailyReportFeedback: async () => ({ success: true }),
};
