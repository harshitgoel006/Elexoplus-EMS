import { useCallback, useEffect, useMemo, useState } from "react";
import {
    cancelLeaveApplication,
    getLeaveDashboard,
    updateLeaveApplicationStatus,
} from "../services/leaveService.js";

import useAuth from "../../auth/hooks/useAuth.js";
import { DEFAULT_LEAVE_USER, normalizeEmployeeId } from "../config/roles.js";
import { getLeavePermissions } from "../config/permissions/leavePermissions.js";

import {
    employeePeriodOptions,
    employeeStatusOptions,
    managementDayTypeOptions,
    managementLeaveTypeOptions,
    managementStatusTabs,
} from "../config/leaveOptions.js";

import {
    addLeaveBalancePercentages,
    filterEmployeeLeaves,
    filterManagementLeaves,
    getLeaveAnalytics,
    getUpcomingLeaves,
    paginate,
} from "../shared/utils/leave.js";

import { applyLeaveMessages } from "../config/applyLeaveForm.js";

export const useLeaveManagement = () => {
    const { user: loggedInUser } = useAuth();

    const role =
        loggedInUser?.role ?? DEFAULT_LEAVE_USER.role;

    const userId = normalizeEmployeeId(
        loggedInUser?.employeeCode
        ?? loggedInUser?.employeeId
        ?? loggedInUser?.id
    );
    const asmId =
        loggedInUser?.asmId ?? DEFAULT_LEAVE_USER.asmId;

    const [data, setData] = useState({
        managementCards: [],
        teamLeaves: [],
        summaryCards: [],
        leaveBalanceData: [],
        leaveHistory: [],
        leavePolicies: [],
        calendarData: {
            events: [],
            holidays: [],
        },
    });

    const [error, setError] = useState(null);

    const [teamPage, setTeamPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);

    const [teamFilters, setTeamFilters] = useState({
        status: "All",
        leaveType: "All",
        dayType: "All",
    });

    const [historyStatus, setHistoryStatus] =
        useState("All Status");

    const [historyPeriod, setHistoryPeriod] =
        useState("All Records");

    const [showAllUpcomingLeaves, setShowAllUpcomingLeaves] =
        useState(false);

    const permissions = useMemo(
        () => getLeavePermissions(role),
        [role]
    );

    const fetchDashboard = useCallback(async () => {
        try {
            const dashboard = await getLeaveDashboard({
                role,
                userId,
                asmId,
            });

            setData({
                managementCards:
                    dashboard.managementCards ?? [],
                teamLeaves:
                    dashboard.teamLeaves ?? [],
                summaryCards:
                    dashboard.summaryCards ?? [],
                leaveBalanceData:
                    dashboard.leaveBalanceData ?? [],
                leaveHistory:
                    dashboard.leaveHistory ?? [],
                leavePolicies:
                    dashboard.leavePolicies ?? [],
                calendarData:
                    dashboard.calendarData ?? {
                        events: [],
                        holidays: [],
                    },
            });

            setError(null);
        } catch (err) {
            setError(err);
        }
    }, [role, userId, asmId]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            fetchDashboard();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchDashboard]);

    const filteredTeamLeaves = useMemo(
        () =>
            filterManagementLeaves(
                data.teamLeaves,
                teamFilters
            ),
        [data.teamLeaves, teamFilters]
    );

    const teamPagination = useMemo(
        () =>
            paginate(filteredTeamLeaves, teamPage, 6),
        [filteredTeamLeaves, teamPage]
    );

    const filteredLeaveHistory = useMemo(
        () =>
            filterEmployeeLeaves(
                data.leaveHistory,
                historyStatus,
                historyPeriod
            ),
        [
            data.leaveHistory,
            historyStatus,
            historyPeriod,
        ]
    );

    const historyPagination = useMemo(
        () =>
            paginate(filteredLeaveHistory, historyPage, 5),
        [filteredLeaveHistory, historyPage]
    );

    const leaveBalanceData = useMemo(
        () =>
            addLeaveBalancePercentages(
                data.leaveBalanceData
            ),
        [data.leaveBalanceData]
    );

    const leaveAnalytics = useMemo(
        () =>
            getLeaveAnalytics(
                data.leaveBalanceData
            ),
        [data.leaveBalanceData]
    );

    const upcomingLeaves = useMemo(
        () =>
            getUpcomingLeaves(
                filteredLeaveHistory
            ),
        [filteredLeaveHistory]
    );

    const visibleUpcomingLeaves = useMemo(
        () =>
            showAllUpcomingLeaves
                ? upcomingLeaves
                : upcomingLeaves.slice(0, 3),
        [upcomingLeaves, showAllUpcomingLeaves]
    );

    const setTeamFilter = (key, value) => {
        setTeamFilters((prev) => ({
            ...prev,
            [key]: value,
        }));

        setTeamPage(1);
    };

    const updateHistoryStatus = (value) => {
        setHistoryStatus(value);
        setHistoryPage(1);
    };

    const updateHistoryPeriod = (value) => {
        setHistoryPeriod(value);
        setHistoryPage(1);
    };

    const changeStatus = async (
        leaveId,
        status
    ) => {
        try {
            await updateLeaveApplicationStatus(leaveId, status);
            await fetchDashboard();
        } catch (err) {
            setError(err);
            return null;
        }
    };

    const cancelLeave = async (leaveId) => {
        const confirmed = window.confirm(
            applyLeaveMessages.confirmCancel
        );

        if (!confirmed) return;

        try {
            await cancelLeaveApplication(leaveId);
            await fetchDashboard();
        } catch (err) {
            setError(err);
            return null;
        }
    };

    return {
        error,
        refetch: fetchDashboard,

        permissions,

        user: {
            ...loggedInUser,
            role,
            employeeId: userId,
            asmId,
        },

        options: {
            managementStatusTabs,
            managementLeaveTypeOptions,
            managementDayTypeOptions,
            employeeStatusOptions,
            employeePeriodOptions,
        },

        leaveStats: {
            managementCards:
                data.managementCards,
            summaryCards:
                data.summaryCards,
            // ApplyLeaveForm consumes this list. Keep it in the public hook
            // result instead of dropping it after the API dashboard loads.
            leavePolicies: data.leavePolicies,
            leaveBalanceData,
            leaveAnalytics,
            calendarData:
                data.calendarData,
        },

        teamLeaves: {
            filters: teamFilters,
            setFilter: setTeamFilter,
            filtered: filteredTeamLeaves,
            pagination: teamPagination,
            currentPage: teamPage,
            setCurrentPage: setTeamPage,
            changeStatus,

            calendarEvents:
                data.calendarData.events,

            holidays:
                data.calendarData.holidays,
        },

        selfLeaves: {
            status: historyStatus,
            period: historyPeriod,
            updateStatus:
                updateHistoryStatus,
            updatePeriod:
                updateHistoryPeriod,
            filtered:
                filteredLeaveHistory,
            pagination:
                historyPagination,
            currentPage:
                historyPage,
            setCurrentPage:
                setHistoryPage,
            upcomingLeaves,
            visibleUpcomingLeaves,
            showAllUpcomingLeaves,
            setShowAllUpcomingLeaves,
            cancelLeave,
        },
    };
};
