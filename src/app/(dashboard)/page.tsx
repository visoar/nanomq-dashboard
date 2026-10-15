"use client";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Cpu,
  GitBranch,
  HardDrive,
  Send,
  Users,
} from "lucide-react";
import Link from "next/link";
import { LineChart } from "@/components/chart";
import { ClientTable } from "@/components/client-table";
import {
  bytes,
  Empty,
  number,
  PageTitle,
  Panel,
  Status,
} from "@/components/ui";
import { useDashboard } from "@/context/dashboard";
export default function Overview() {
  const { data, history } = useDashboard();
  const broker = data.brokers?.[0];
  const node = data.nodes?.[0];
  const metrics = data.metrics;
  const cards = [
    {
      label: "在线客户端",
      value: number(data.errors.nodes ? undefined : node?.connections),
      icon: Users,
      tint: "blue",
    },
    {
      label: "活跃订阅",
      value: number(
        data.errors.subscriptions ? undefined : data.subscriptions?.length,
      ),
      icon: GitBranch,
      tint: "violet",
    },
    {
      label: "CPU 使用率",
      value:
        metrics.cpu_usage === undefined ? "—" : `${number(metrics.cpu_usage)}%`,
      icon: Cpu,
      tint: "green",
    },
    {
      label: "内存占用",
      value: bytes(metrics.memory_usage),
      icon: HardDrive,
      tint: "amber",
    },
  ];
  return (
    <>
      <PageTitle
        title="运行总览"
        action={
          <Link className="button primary" href="/publish">
            <Send size={15} />
            发布消息
            <ArrowUpRight size={15} />
          </Link>
        }
      />
      <div className="broker-strip">
        <div className="broker-strip-icon">
          <Activity size={22} />
        </div>
        <div>
          <strong>{broker?.sysdescr || "NanoMQ Broker"}</strong>
          <span>{broker ? `v${broker.version}` : "等待连接"}</span>
        </div>
        <div className="broker-strip-right">
          <div>
            <small>运行时间</small>
            <strong className="mono">{broker?.uptime || "—"}</strong>
          </div>
          <Status
            state={
              data.errors.brokers
                ? "disconnected"
                : broker?.node_status || "等待数据"
            }
          />
        </div>
      </div>
      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-card-top">
              <span>{c.label}</span>
              <span className={`stat-icon ${c.tint}`}>
                <c.icon size={18} />
              </span>
            </div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="overview-middle">
        <Panel
          title="连接活动"
          action={
            <Link className="text-button" href="/monitoring">
              查看监控
              <ArrowRight size={13} />
            </Link>
          }
        >
          <LineChart
            samples={history.map((s) => ({ ...s, metrics: s.metrics }))}
            series={[
              { key: "connections_count", label: "在线连接", color: "#3a6ff7" },
              { key: "subscribers_count", label: "订阅", color: "#8b6ce7" },
            ]}
            label="连接与订阅历史曲线"
          />
        </Panel>
        <Panel title="消息计数" className="message-panel">
          <div className="message-total">
            <small>累计接收</small>
            <strong>{number(metrics.messages_received)}</strong>
          </div>
          <div className="message-counts">
            <div>
              <i className="blue-dot" />
              <span>已发送</span>
              <strong>{number(metrics.messages_sent)}</strong>
            </div>
            <div>
              <i className="amber-dot" />
              <span>已丢弃</span>
              <strong>{number(metrics.messages_dropped)}</strong>
            </div>
          </div>
        </Panel>
      </div>
      <Panel
        title="客户端快照"
        action={
          <Link className="text-button" href="/clients">
            全部客户端
            <ArrowRight size={13} />
          </Link>
        }
      >
        {data.clients ? (
          <ClientTable
            clients={[...data.clients]
              .sort((a, b) => a.client_id.localeCompare(b.client_id))
              .slice(0, 5)}
          />
        ) : (
          <Empty title="正在获取客户端" />
        )}
      </Panel>
    </>
  );
}
