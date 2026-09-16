// src/features/sales/services/seSalesService.js
import { salesApi } from './salesApi';

export const fetchSEDashboardData = async () => {
  const [leads, orders, dashboard, targets, visits, expenses, reports] = await Promise.all([
    salesApi.listLeads(),
    salesApi.orders(),
    salesApi.dashboard(),
    salesApi.targets(),
    salesApi.visits(),
    salesApi.expenses(),
    salesApi.dailyReports(),
  ]);
  const myOrders = orders.map((order) => ({
    id: order.order_no || order.orderNo || order.order_id || order.id,
    orderId: order.order_id || order.id,
    customer: order.client_name || order.clientName || order.seName || "Unknown customer",
    type: order.order_type || order.type || "B2B",
    value: Number(order.order_value ?? order.value ?? 0),
    status: order.order_status || order.status || "Pending",
    date: order.order_date || order.orderDate || "—",
    items: Number(order.item_count ?? order.items ?? 0),
    paymentStatus: order.payment_status || order.paymentStatus || "Pending",
    address: order.delivery_address || order.address || order.territory || "—",
  }));
  const myLeads = leads.map((lead) => ({
    ...lead,
    id: lead.id || lead.lead_id,
    leadName: lead.name || lead.lead_name,
    customer: lead.contact_person || lead.contact || lead.company || lead.lead_name || "Unknown customer",
    type: lead.type || lead.segment,
    stage: lead.status || "New",
    value: Number(lead.value || lead.estimated_value || 0),
    lastActivity: lead.lastActivity || lead.last_activity || lead.updated_at || "—",
    notes: lead.activities || [],
  }));
  const activeTarget = targets.find((target) => target.status === "Active") || targets[0];
  const achievement = myOrders.filter((order) => order.status === "Delivered").reduce((sum, order) => sum + order.value, 0);
  const targetValue = Number(activeTarget?.target_value || 0);
  const achievementPercentage = targetValue ? Math.round((achievement / targetValue) * 100) : 0;
  const liveMetrics = { target: targetValue, achievement, achievementPercentage, totalOrders: myOrders.length, ordersSubText: "Orders from live database", projectedIncentive: 0, incentiveSubText: "Calculated from active target" };
  const visitsData = visits.map((visit) => ({
    ...visit,
    location: [visit.address, visit.city].filter(Boolean).join(", ") || visit.location || "—",
    id: visit.visit_id || visit.id,
    customer: visit.customer || visit.client_name || "Unknown client",
    checkIn: visit.checkIn || visit.check_in || "—",
    checkOut: visit.checkOut || visit.check_out || "—",
    status: visit.status || (visit.outcome ? "Completed" : "Scheduled"),
  }));
  return {
    topMetrics: liveMetrics,
    targetTrend: { timeframe: "Current target period", data: [{ date: "Current", target: targetValue, achievement }] },
    performanceGauge: { target: targetValue, achieved: achievement, balance: Math.max(targetValue - achievement, 0), percentage: achievementPercentage },
    mockSummaryData: { totalOrderValue: myOrders.reduce((sum, order) => sum + order.value, 0), paymentCollected: myOrders.filter((order) => order.paymentStatus === "Paid").reduce((sum, order) => sum + order.value, 0), productiveVisits: visitsData.filter((visit) => visit.status === "Completed").length, totalVisits: visitsData.length, newLeads: myLeads.filter((lead) => lead.stage === "New").length, ordersCreated: myOrders.length, leadExpenses: expenses.map((expense) => ({ id: expense.expense_id || expense.id, leadName: expense.description || expense.leadName || "Sales expense", amount: Number(expense.amount || 0), category: expense.expense_type || expense.category || "Other", status: expense.status || "Pending" })) },
    myLeads, myOrders, targets, visitsData, expenses, dailyReports: reports, apiDashboard: dashboard,
  };
};
