"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ApiError, message, read, request } from "@/lib/api";
import {
  type Broker,
  type BrokerNode,
  brokerSchema,
  type Client,
  clientSchema,
  type Endpoint,
  endpointSchema,
  type Metrics,
  nodeSchema,
  parseMetrics,
  parsePrometheus,
  type SessionInfo,
  type Subscription,
  subscriptionSchema,
  supports,
} from "@/lib/contracts";

export type Sample = { time: number; metrics: Metrics };
type Snapshot = {
  brokers: Broker[] | null;
  nodes: BrokerNode[] | null;
  clients: Client[] | null;
  subscriptions: Subscription[] | null;
  metrics: Metrics;
  endpoints: Endpoint[];
  errors: Record<string, string>;
  updated: number | null;
};
const empty: Snapshot = {
  brokers: null,
  nodes: null,
  clients: null,
  subscriptions: null,
  metrics: {},
  endpoints: [],
  errors: {},
  updated: null,
};
type DashboardState = {
  session: SessionInfo | null | undefined;
  defaultURL: string;
  data: Snapshot;
  history: Sample[];
  refreshing: boolean;
  paused: boolean;
  setPaused: (value: boolean) => void;
  refresh: () => Promise<void>;
  reconnect: () => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<DashboardState | null>(null);
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>();
  const [defaultURL, setDefaultURL] = useState("http://127.0.0.1:8081");
  const [data, setData] = useState<Snapshot>(empty);
  const [history, setHistory] = useState<Sample[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [paused, setPaused] = useState(false);
  const running = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const reconnect = useCallback(async () => {
    controller.current?.abort();
    epoch.current++;
    setData(empty);
    setHistory([]);
    setPaused(false);
    const result = await request<{
      session: SessionInfo | null;
      defaultBaseURL: string;
    }>("/api/session");
    setDefaultURL(result.defaultBaseURL);
    setSession(result.session);
  }, []);
  useEffect(() => {
    // Remove plaintext credentials saved by v1; users reconnect once after upgrading.
    localStorage.removeItem("nanomq-auth");
    localStorage.removeItem("nanomq-config");
    let active = true;
    void request<{ session: SessionInfo | null; defaultBaseURL: string }>(
      "/api/session",
    )
      .then((result) => {
        if (active) {
          setDefaultURL(result.defaultBaseURL);
          setSession(result.session);
        }
      })
      .catch(() => {
        if (active) setSession(null);
      });
    return () => {
      active = false;
    };
  }, []);
  const refresh = useCallback(async () => {
    if (!session || running.current) return;
    running.current = true;
    setRefreshing(true);
    const currentEpoch = epoch.current;
    const abort = new AbortController();
    controller.current = abort;
    const signal = abort.signal;
    try {
      const tasks = [
        read("/brokers", brokerSchema.array().min(1), signal),
        read("/nodes", nodeSchema.array().min(1), signal),
        read("/clients", clientSchema.array(), signal),
        read("/subscriptions", subscriptionSchema.array(), signal),
        read("", endpointSchema.array(), signal),
        request("/api/nanomq/metrics", { signal }).then(parseMetrics),
        request<string>("/api/nanomq/prometheus", { signal }).then(
          parsePrometheus,
        ),
      ] as const;
      const results = await Promise.allSettled(tasks);
      if (signal.aborted || currentEpoch !== epoch.current) return;
      if (
        results.some(
          (r) =>
            r.status === "rejected" &&
            r.reason instanceof ApiError &&
            r.reason.status === 401,
        )
      ) {
        setSession(null);
        setData(empty);
        setHistory([]);
        return;
      }
      const keys = [
        "brokers",
        "nodes",
        "clients",
        "subscriptions",
        "endpoints",
        "metrics",
        "prometheus",
      ];
      const errors: Record<string, string> = {};
      results.forEach((r, i) => {
        if (r.status === "rejected") errors[keys[i]] = message(r.reason);
      });
      const [brokers, nodes, clients, subscriptions, endpoints, raw, prom] =
        results;
      const metrics = {
        ...(raw.status === "fulfilled" ? raw.value : {}),
        ...(prom.status === "fulfilled" ? prom.value : {}),
      };
      const time = Date.now();
      setData((prev) => ({
        brokers: brokers.status === "fulfilled" ? brokers.value : prev.brokers,
        nodes: nodes.status === "fulfilled" ? nodes.value : prev.nodes,
        clients: clients.status === "fulfilled" ? clients.value : prev.clients,
        subscriptions:
          subscriptions.status === "fulfilled"
            ? subscriptions.value
            : prev.subscriptions,
        endpoints:
          endpoints.status === "fulfilled" ? endpoints.value : prev.endpoints,
        metrics,
        errors,
        updated: time,
      }));
      setHistory((prev) => [...prev.slice(-119), { time, metrics }]);
    } finally {
      running.current = false;
      setRefreshing(false);
    }
  }, [session]);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    const interval = setInterval(() => {
      if (!paused && document.visibilityState === "visible") void refresh();
    }, 5000);
    const visible = () => {
      if (!paused && document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
      controller.current?.abort();
    };
  }, [session, paused, refresh]);
  const logout = useCallback(async () => {
    await request("/api/session", { method: "DELETE" });
    epoch.current++;
    controller.current?.abort();
    setSession(null);
    setData(empty);
    setHistory([]);
    setPaused(false);
  }, []);
  return (
    <Context.Provider
      value={{
        session,
        defaultURL,
        data,
        history,
        refreshing,
        paused,
        setPaused,
        refresh,
        reconnect,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDashboard() {
  const state = useContext(Context);
  if (!state) throw new Error("DashboardProvider is missing");
  return state;
}
export function useCapability(method: string, path: string) {
  const { data } = useDashboard();
  return supports(data.endpoints, method, path);
}
