import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api.service";
import { useAuth } from "@/hooks/useAuth";
import { env } from "@/config/env";
import { isDemoSession } from "@/demo/session";

// Socket events contain no business data. REST rechecks permissions and recovers
// missed events on every connection; existing polling remains a fallback.
export function useNotificationRealtime() {
  const client = useQueryClient();
  const scope = useAuth().user?.organization_id;
  useEffect(() => {
    if (!scope || isDemoSession()) return;
    const base = new URL(env.apiBaseUrl, window.location.origin);
    const socket = io(base.origin, {
      path: "/socket.io", autoConnect: false, withCredentials: true,
      auth: done => done({ token: apiService.getAuthToken(), portal: "customer" }),
      reconnectionDelay: 1000, reconnectionDelayMax: 15000,
    });
    const refresh = () => {
      for (const key of ["customer-notifications", "customer-calibration-requests", "customer-transactions", "gauge-acceptances", "gauge-acceptance-certificate", "calibration-planning", "gauge", "gauges", "gauges-all", "gauge-history", "monthly-calibration-dashboard", "daily-calibration-dashboard"]) void client.invalidateQueries({ queryKey: [key] });
    };
    socket.on("connect", refresh);
    socket.on("notifications:changed", refresh);
    let previous: string | null = null;
    let lastAttempt = 0;
    const sync = () => {
      const token = apiService.getAuthToken();
      if (token !== previous) {
        previous = token;
        socket.disconnect();
        if (token) { lastAttempt = Date.now(); socket.connect(); }
      } else if (token && !socket.connected && !socket.active && Date.now() - lastAttempt >= 30_000) {
        // Server-side scope checks can close a namespace during a temporary
        // outage. Retry conservatively; transport reconnects use Socket.IO.
        lastAttempt = Date.now(); socket.connect();
      }
    };
    sync();
    const timer = window.setInterval(sync, 5000);
    return () => { window.clearInterval(timer); socket.removeAllListeners(); socket.disconnect(); };
  }, [client, scope]);
}
