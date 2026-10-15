"use client";
import { Download, Pause, Play } from "lucide-react";
import { LineChart } from "@/components/chart";
import {
  bytes,
  download,
  Notice,
  number,
  PageTitle,
  Panel,
} from "@/components/ui";
import { useDashboard } from "@/context/dashboard";
import { rate } from "@/lib/contracts";
export default function Monitoring() {
  const { data, history, paused, setPaused } = useDashboard();
  const last = history.at(-1);
  const prev = history.at(-2);
  const rx = rate(
    prev?.metrics.messages_received,
    last?.metrics.messages_received,
    prev && last ? (last.time - prev.time) / 1000 : 0,
  );
  const tx = rate(
    prev?.metrics.messages_sent,
    last?.metrics.messages_sent,
    prev && last ? (last.time - prev.time) / 1000 : 0,
  );
  return (
    <>
      <PageTitle
        title="实时监控"
        action={
          <div className="button-group">
            <button
              type="button"
              className="button"
              onClick={() =>
                download(
                  "nanomq-samples.json",
                  JSON.stringify(history, null, 2),
                )
              }
            >
              <Download size={15} />
              导出采样
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
              {paused ? "继续采样" : "暂停采样"}
            </button>
          </div>
        }
      />
      {(data.errors.metrics || data.errors.prometheus) && (
        <Notice error>
          {data.errors.metrics && <div>metrics: {data.errors.metrics}</div>}
          {data.errors.prometheus && (
            <div>prometheus: {data.errors.prometheus}</div>
          )}
          不可用的指标显示 —，不会生成替代数据。
        </Notice>
      )}
      <div className="stat-grid">
        {[
          { label: "接收速率", value: number(rx), unit: "msg/s" },
          { label: "发送速率", value: number(tx), unit: "msg/s" },
          {
            label: "CPU 使用率",
            value: number(data.metrics.cpu_usage),
            unit: "%",
          },
          {
            label: "进程内存",
            value: bytes(data.metrics.memory_usage),
            unit: "",
          },
        ].map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-card-top">{c.label}</div>
            <div className="stat-value">
              {c.value}
              <small>{c.unit}</small>
            </div>
          </div>
        ))}
      </div>
      <Panel title="累计消息">
        <LineChart
          samples={history}
          series={[
            { key: "messages_received", label: "接收消息", color: "#3a6ff7" },
            { key: "messages_sent", label: "发送消息", color: "#20a181" },
            { key: "messages_dropped", label: "丢弃消息", color: "#d39934" },
          ]}
          label="累计消息趋势"
        />
      </Panel>
      <div className="two-columns">
        <Panel title="CPU 使用率">
          <LineChart
            samples={history}
            series={[{ key: "cpu_usage", label: "CPU %", color: "#8b6ce7" }]}
            label="CPU 使用率趋势"
            percent
          />
        </Panel>
        <Panel title="在线连接">
          <LineChart
            samples={history}
            series={[
              { key: "connections_count", label: "连接数", color: "#3a6ff7" },
            ]}
            label="在线连接趋势"
          />
        </Panel>
      </div>
      <Panel title="原始指标">
        <div className="metric-list">
          {Object.entries(data.metrics).map(([key, value]) => (
            <div key={key}>
              <code>{key}</code>
              <strong className="mono">{number(value)}</strong>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
