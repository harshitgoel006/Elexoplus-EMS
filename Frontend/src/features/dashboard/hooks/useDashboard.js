import { useCallback, useEffect, useState } from "react";
import { getDashboardData } from "../services/dashboardService";
import { mockStore } from "../../../mocks/appMockStore";

const useDashboard = (role) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setDashboard(await getDashboardData(role));
      setError(null);
    } catch (requestError) {
      setDashboard(null);
      setError(requestError.response?.data?.message || "Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    // Defer the state-changing refresh until after this effect completes.
    void Promise.resolve().then(refresh);
  }, [refresh]);

  // Dashboard is a read model of the central frontend mock store. Re-read it
  // after any business action so cards/tasks never retain a stale snapshot.
  useEffect(() => mockStore.subscribe(() => { void refresh(); }), [refresh]);

  return { dashboard, loading, error, refresh };
};

export default useDashboard;
