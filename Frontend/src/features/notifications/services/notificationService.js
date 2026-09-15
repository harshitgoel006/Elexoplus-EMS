import { getInitialNotifications } from "../mock/notificationsData";
import { mockStore } from "../../../mocks/appMockStore";

const notificationSeed = getInitialNotifications().map((item) => ({ ...item }));
const notifications = () => mockStore.get("notifications", notificationSeed);
const saveNotifications = (value) => mockStore.set("notifications", value);
const clone = (value) => JSON.parse(JSON.stringify(value));

const filtered = (filters = {}) => notifications().filter((item) => {
  const { category = "all", type = "all", status = "all", archived = false, search = "" } = filters;
  if (Boolean(item.isArchived) !== Boolean(archived)) return false;
  if (category !== "all" && item.category !== category) return false;
  if (type !== "all" && item.type !== type) return false;
  if (status === "read" && !item.isRead) return false;
  if (status === "unread" && item.isRead) return false;
  return !search.trim() || `${item.title} ${item.message}`.toLowerCase().includes(search.trim().toLowerCase());
});

export const getAllNotifications = async () => clone(filtered());
export const getUnreadCount = async () => filtered().filter((item) => !item.isRead).length;
export const getRecentUnread = async (limit = 5) => clone(filtered().filter((item) => !item.isRead).slice(0, limit));
export const markAsRead = async (id) => { const item = notifications().find((value) => value.id === id); if (!item) throw new Error("Notification not found."); const updated = { ...item, isRead: true }; saveNotifications(notifications().map((value) => value.id === id ? updated : value)); return { success: true, notification: clone(updated) }; };
export const markAllAsRead = async () => { saveNotifications(notifications().map((item) => item.isArchived ? item : { ...item, isRead: true })); return { success: true }; };
export const archiveNotification = async (id) => { const item = notifications().find((value) => value.id === id); if (!item) throw new Error("Notification not found."); saveNotifications(notifications().map((value) => value.id === id ? { ...value, isArchived: true } : value)); return { success: true }; };
export const addNotification = async (notification) => { const item = { id: `notification-${Date.now()}`, isRead: false, isArchived: false, createdAt: new Date().toISOString(), type: "info", category: "system", ...notification }; saveNotifications([item, ...notifications()]); return clone(item); };
export const deleteNotification = async (id) => { saveNotifications(notifications().filter((item) => item.id !== id)); return { success: true }; };
export const filterNotifications = async (filters = {}) => clone(filtered(filters));
