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
import { useI18n } from "@/context/language";
import { rate } from "@/lib/contracts";
export default function Monitoring() {
  const { t, errorText } = useI18n();
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
        title={t("实时监控")}
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
              {t("导出采样")}
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
              {paused ? t("继续采样") : t("暂停采样")}
            </button>
          </div>
        }
      />
      {(data.errors.metrics || data.errors.prometheus) && (
        <Notice error>
          {data.errors.metrics && (
            <div>metrics: {errorText(data.errors.metrics)}</div>
          )}
          {data.errors.prometheus && (
            <div>prometheus: {errorText(data.errors.prometheus)}</div>
          )}
          {t("不可用的指标显示 —，不会生成替代数据。")}
        </Notice>
      )}
      <div className="stat-grid">
        {[
          { label: t("接收速率"), value: number(rx), unit: "msg/s" },
          { label: t("发送速率"), value: number(tx), unit: "msg/s" },
          {
            label: t("CPU 使用率"),
            value: number(data.metrics.cpu_usage),
            unit: "%",
          },
          {
            label: t("进程内存"),
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
      <Panel title={t("累计消息")}>
        <LineChart
          samples={history}
          series={[
            {
              key: "messages_received",
              label: t("接收消息"),
              color: "#3a6ff7",
            },
            { key: "messages_sent", label: t("发送消息"), color: "#20a181" },
            { key: "messages_dropped", label: t("丢弃消息"), color: "#d39934" },
          ]}
          label={t("累计消息趋势")}
        />
      </Panel>
      <div className="two-columns">
        <Panel title={t("CPU 使用率")}>
          <LineChart
            samples={history}
            series={[{ key: "cpu_usage", label: "CPU %", color: "#8b6ce7" }]}
            label={t("CPU 使用率趋势")}
            percent
          />
        </Panel>
        <Panel title={t("在线连接")}>
          <LineChart
            samples={history}
            series={[
              {
                key: "connections_count",
                label: t("连接数"),
                color: "#3a6ff7",
              },
            ]}
            label={t("在线连接趋势")}
          />
        </Panel>
      </div>
      <Panel title={t("原始指标")}>
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
