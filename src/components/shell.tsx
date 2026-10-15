"use client";
import {
  Activity,
  ArrowUpRight,
  Box,
  Cable,
  ChevronRight,
  CircleHelp,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Radio,
  RefreshCw,
  Send,
  Settings2,
  Sun,
  Users,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { useDashboard } from "@/context/dashboard";
import { useI18n } from "@/context/language";
import { message } from "@/lib/api";
import { LanguageSwitch } from "./language-switch";
import { Notice } from "./ui";

const links = [
  { href: "/", label: "运行总览", icon: LayoutDashboard },
  { href: "/clients", label: "客户端", icon: Users },
  { href: "/subscriptions", label: "主题与订阅", icon: GitBranch },
  { href: "/publish", label: "消息工作台", icon: Send },
  { href: "/monitoring", label: "实时监控", icon: Activity },
  { href: "/bridges", label: "MQTT 桥接", icon: Cable },
  { href: "/rules", label: "规则引擎", icon: Workflow },
  { href: "/configuration", label: "Broker 配置", icon: Settings2 },
];
export function Shell({ children }: { children: ReactNode }) {
  const { t, errorText } = useI18n();
  const { session, data, refresh, refreshing, logout } = useDashboard();
  const router = useRouter();
  const path = usePathname();
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  useEffect(() => {
    if (session === null) router.replace("/signin");
  }, [session, router]);
  useEffect(() => {
    const value = localStorage.getItem("nanomq-theme") === "dark";
    document.documentElement.dataset.theme = value ? "dark" : "light";
    const t = setTimeout(() => setDark(value), 0);
    return () => clearTimeout(t);
  }, []);
  function theme() {
    const value = !dark;
    setDark(value);
    localStorage.setItem("nanomq-theme", value ? "dark" : "light");
    document.documentElement.dataset.theme = value ? "dark" : "light";
  }
  if (!session)
    return (
      <div className="loading-screen">
        <Activity className="spin" />
        {t("正在加载控制台…")}
      </div>
    );
  const healthy = data.brokers !== null && !data.errors.brokers;
  const connectionStatus = healthy
    ? t("Broker 已连接")
    : data.updated
      ? t("连接异常")
      : t("正在连接");
  const active = links.find(
    (l) => l.href === path || (l.href !== "/" && path.startsWith(`${l.href}/`)),
  );
  return (
    <div className="app-shell">
      {mobile && (
        <button
          type="button"
          className="scrim"
          aria-label={t("关闭导航")}
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`sidebar ${mobile ? "open" : ""}`}
        aria-label={t("主导航")}
      >
        <Link className="brand" href="/" onClick={() => setMobile(false)}>
          <span className="brand-symbol">
            <Activity size={22} />
          </span>
          <span>
            NanoMQ<span className="brand-sub">DASHBOARD</span>
          </span>
        </Link>
        <button
          type="button"
          className="mobile-close icon-button"
          aria-label={t("关闭导航")}
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <div className="workspace">
          <span className="workspace-icon">
            <Box size={18} />
          </span>
          <div>
            <strong>MQTT Broker</strong>
          </div>
          <span className="version-pill">v4</span>
        </div>

        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobile(false)}
              className={`nav-link ${path === href ? "active" : ""}`}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{t(label)}</span>
              {path === href && <ChevronRight size={15} />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a
            className="help-link"
            href="https://github.com/visoar/nanomq-dashboard/issues"
            target="_blank"
            rel="noreferrer"
          >
            <CircleHelp size={17} />
            {t("帮助与反馈")}
            <ArrowUpRight size={14} />
          </a>
          <div className="profile">
            <span className="avatar">{session.username[0]?.toUpperCase()}</span>
            <div>
              <strong>{session.username}</strong>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label={t("断开连接")}
              onClick={() => {
                void logout().catch((e) => setLogoutError(message(e)));
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              type="button"
              className="icon-button mobile-menu"
              aria-label={t("打开导航")}
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span>{t("工作空间")}</span>
            <ChevronRight size={13} />
            <strong>{active ? t(active.label) : ""}</strong>
          </div>
          <div className="topbar-actions">
            <span
              className={`connection ${healthy ? "online" : "offline"}`}
              title={connectionStatus}
            >
              <i />
              {connectionStatus}
            </span>
            <span className="topbar-divider" />
            <LanguageSwitch />
            <button
              type="button"
              className="icon-button"
              aria-label={t("切换主题")}
              onClick={theme}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a
              href="https://github.com/visoar/nanomq-dashboard"
              className="icon-button"
              aria-label={t("GitHub 仓库")}
              target="_blank"
              rel="noreferrer"
            >
              <ArrowUpRight size={18} />
            </a>
          </div>
        </header>
        <main id="main">
          <div className="connection-toolbar">
            <span className="mono">
              <Radio size={14} />
              {session.baseURL}
            </span>
            <button
              type="button"
              className="text-button"
              disabled={refreshing}
              onClick={() => {
                void refresh();
              }}
            >
              <RefreshCw size={13} className={refreshing ? "spin" : ""} />
              {refreshing ? t("正在同步") : t("立即刷新")}
            </button>
          </div>
          {logoutError && <Notice error>{errorText(logoutError)}</Notice>}
          {Object.keys(data.errors).filter(
            (k) => k !== "metrics" && k !== "prometheus",
          ).length > 0 && (
            <Notice error>
              {t("部分数据刷新失败，以下页面可能保留上次成功的数据。")}
              {Object.entries(data.errors)
                .filter(([k]) => k !== "metrics" && k !== "prometheus")
                .map(([k, v]) => (
                  <div key={k}>
                    {t(k)}: {errorText(v)}
                  </div>
                ))}
            </Notice>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
