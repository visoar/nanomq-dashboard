"use client";
import {
  Download,
  FileJson,
  RefreshCw,
  RotateCw,
  Save,
  Square,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { download, Modal, Notice, PageTitle, Panel } from "@/components/ui";
import { useCapability, useDashboard } from "@/context/dashboard";
import { message, mutate, read } from "@/lib/api";
import { type ReloadConfig, reloadSchema } from "@/lib/contracts";

const sections = [
  { key: "reload", label: "热更新参数" },
  { key: "basic", label: "基础设置" },
  { key: "tls", label: "TLS 安全" },
  { key: "websocket", label: "WebSocket" },
  { key: "http_server", label: "HTTP 服务" },
  { key: "auth", label: "密码认证" },
  { key: "auth_http", label: "HTTP 认证" },
  { key: "sqlite", label: "SQLite 持久化" },
  { key: "bridge", label: "桥接配置（只读）" },
  { key: "all", label: "完整配置（只读）" },
];
const hotFields: {
  key: Exclude<keyof ReloadConfig, "allow_anonymous">;
  label: string;
  unit: string;
  step?: string;
}[] = [
  {
    key: "property_size",
    label: "MQTT 属性容量",
    unit: "",
  },
  {
    key: "max_packet_size",
    label: "最大报文大小",
    unit: "KiB",
  },
  {
    key: "client_max_packet_size",
    label: "客户端最大报文",
    unit: "KiB",
  },
  {
    key: "msq_len",
    label: "重传队列长度",
    unit: "条",
  },
  {
    key: "qos_duration",
    label: "QoS 定时器间隔",
    unit: "秒",
  },
  {
    key: "keepalive_backoff",
    label: "Keep Alive 回退系数",
    unit: "",
    step: "any",
  },
];
export default function Configuration() {
  const { refresh, session } = useDashboard();
  const canReload = useCapability("POST", "/reload");
  const [section, setSection] = useState("reload");
  const [hot, setHot] = useState<ReloadConfig | null>(null);
  const [original, setOriginal] = useState("");
  const [editor, setEditor] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reload, setReload] = useState(0);
  const [pending, setPending] = useState<Record<string, unknown> | null>(null);
  const [action, setAction] = useState<"stop" | "restart" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const path =
    section === "reload"
      ? "/reload"
      : section === "all"
        ? "/configuration"
        : `/configuration/${section}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: reload explicitly invalidates the server configuration.
  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      setFeedback("");
      setHot(null);
      setEditor("");
      setOriginal("");
      try {
        const value = await read(
          path,
          z.record(z.string(), z.unknown()),
          abort.signal,
        );
        if (abort.signal.aborted) return;
        const serialized = JSON.stringify(value, null, 2);
        setOriginal(serialized);
        if (section === "reload") {
          const parsed = reloadSchema.parse(value);
          setHot(parsed);
          setOriginal(JSON.stringify(parsed, null, 2));
        } else setEditor(serialized);
      } catch (e) {
        if (!abort.signal.aborted) setError(message(e));
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => abort.abort();
  }, [path, section, reload]);
  const dirty =
    !!original &&
    (section === "reload" ? JSON.stringify(hot, null, 2) : editor) !== original;
  function switchSection(key: string) {
    if (dirty && !window.confirm("当前有未保存的修改，确认放弃？")) return;
    setSection(key);
  }
  function prepareSave() {
    setError("");
    try {
      const value =
        section === "reload"
          ? reloadSchema.parse(hot)
          : z.record(z.string(), z.unknown()).parse(JSON.parse(editor));
      if (section !== "reload" && !(section in value))
        throw new Error(`配置必须包含 ${section} 字段`);
      setPending(value);
    } catch (e) {
      setError(message(e));
    }
  }
  async function save() {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      await mutate(path, { data: pending });
      const value = await read(path, z.record(z.string(), z.unknown()));
      const normalized =
        section === "reload" ? reloadSchema.parse(value) : value;
      const serialized = JSON.stringify(normalized, null, 2);
      const matches = JSON.stringify(normalized) === JSON.stringify(pending);
      setOriginal(serialized);
      if (section === "reload") setHot(normalized as ReloadConfig);
      else setEditor(serialized);
      setFeedback(
        matches
          ? "配置已提交，并重新读取 Broker 当前值。"
          : "Broker 已接受请求。读回值与提交值不同，请检查当前配置；部分字段可能不支持更新。",
      );
      setPending(null);
      await refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function control() {
    if (!action || confirmation !== action) return;
    setBusy(true);
    setError("");
    try {
      await mutate(`/ctrl/${action}`);
      setFeedback(`Broker 已接受 ${action} 请求。后续状态将由轮询更新。`);
      setAction(null);
      setConfirmation("");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const readOnly = section === "bridge" || section === "all";
  return (
    <>
      <PageTitle
        title="Broker 配置"
        action={
          <button
            type="button"
            className="button"
            disabled={!original || loading}
            onClick={() =>
              download(
                `nanomq-${section}.json`,
                section === "reload" ? JSON.stringify(hot, null, 2) : editor,
              )
            }
          >
            <Download size={15} />
            导出配置
          </button>
        }
      />
      <div className="configuration-layout">
        <div className="config-nav">
          <Link className="button" href="/configuration/file">
            替换配置文件
          </Link>
          {sections.map((s) => (
            <button
              type="button"
              key={s.key}
              className={section === s.key ? "selected" : ""}
              onClick={() => switchSection(s.key)}
            >
              {s.key === "reload" ? <Zap size={16} /> : <FileJson size={16} />}
              {s.label}
            </button>
          ))}
        </div>
        <div>
          <Panel
            title={sections.find((s) => s.key === section)?.label}
            action={
              <button
                type="button"
                className="icon-button"
                aria-label="重新读取配置"
                disabled={busy || loading}
                onClick={() => {
                  if (!dirty || window.confirm("放弃未保存修改并重新读取？")) {
                    setLoading(true);
                    setReload((v) => v + 1);
                  }
                }}
              >
                <RefreshCw size={16} className={loading ? "spin" : ""} />
              </button>
            }
          >
            <div className="config-content">
              {error && <Notice error>{error}</Notice>}
              {feedback && <Notice>{feedback}</Notice>}
              {loading ? (
                <p className="muted">正在读取 Broker 配置…</p>
              ) : (
                original && (
                  <>
                    {section === "reload" && hot ? (
                      <>
                        <div className="hot-fields">
                          {hotFields.map((f) => (
                            <label key={f.key}>
                              <span>
                                {f.label}
                                <small>{f.unit}</small>
                              </span>
                              <input
                                type="number"
                                step={f.step || "1"}
                                value={
                                  Number.isNaN(hot[f.key]) ? "" : hot[f.key]
                                }
                                onChange={(e) =>
                                  setHot({
                                    ...hot,
                                    [f.key]:
                                      e.target.value === ""
                                        ? NaN
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                          ))}
                        </div>
                        <label className="checkbox-label anonymous">
                          <input
                            type="checkbox"
                            checked={hot.allow_anonymous}
                            onChange={(e) =>
                              setHot({
                                ...hot,
                                allow_anonymous: e.target.checked,
                              })
                            }
                          />
                          <span>
                            允许匿名 MQTT 连接
                            <small>
                              关闭前请确保设备已配置有效的认证信息。
                            </small>
                          </span>
                        </label>
                      </>
                    ) : (
                      <>
                        <Notice>
                          {readOnly ? "此视图只读。" : "请保留当前章节名称。"}{" "}
                          配置可能包含密码和证书，请妥善保管导出文件。
                        </Notice>
                        <label className="sr-only" htmlFor="config-json">
                          配置 JSON
                        </label>
                        <textarea
                          id="config-json"
                          className="code-editor config-editor"
                          value={editor}
                          readOnly={readOnly}
                          onChange={(e) => setEditor(e.target.value)}
                          spellCheck={false}
                          rows={20}
                        />
                      </>
                    )}
                    {!readOnly && (
                      <div className="config-save">
                        <span className={dirty ? "dirty-note" : "muted"}>
                          {dirty ? "● 有未保存的修改" : "所有修改已保存"}
                        </span>
                        <button
                          type="button"
                          className="button primary"
                          disabled={
                            !dirty ||
                            busy ||
                            (section === "reload" && !canReload)
                          }
                          onClick={prepareSave}
                        >
                          <Save size={15} />
                          审阅并保存
                        </button>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </Panel>
          <Panel title="Broker 控制">
            <div className="broker-control">
              <div>
                <strong>重启或停止 Broker</strong>
                <p>
                  操作对象：<code>{session?.baseURL}</code>
                </p>
              </div>
              <div className="button-group">
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setAction("restart");
                    setError("");
                    setConfirmation("");
                  }}
                >
                  <RotateCw size={15} />
                  重启
                </button>
                <button
                  type="button"
                  className="button danger-outline"
                  onClick={() => {
                    setAction("stop");
                    setError("");
                    setConfirmation("");
                  }}
                >
                  <Square size={14} />
                  停止
                </button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
      {pending && (
        <Modal
          title="审阅配置变更"
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          {error && <Notice error>{error}</Notice>}
          <p>
            将以下配置提交到 <code>{path}</code>：
          </p>
          <pre className="config-diff">{JSON.stringify(pending, null, 2)}</pre>
          <div className="modal-actions">
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              继续编辑
            </button>
            <button
              type="button"
              className="button primary"
              disabled={busy}
              onClick={() => {
                void save();
              }}
            >
              {busy ? "正在保存…" : "确认提交"}
            </button>
          </div>
        </Modal>
      )}
      {action && (
        <Modal
          title={action === "stop" ? "停止 Broker" : "重启 Broker"}
          onClose={() => {
            if (!busy) setAction(null);
          }}
        >
          {error && <Notice error>{error}</Notice>}
          <Notice error>
            将中断 <code>{session?.baseURL}</code>{" "}
            上的连接。停止后需从服务器重新启动 Broker。
          </Notice>
          <label>
            输入 {action} 以确认
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              取消
            </button>
            <button
              type="button"
              className="button danger"
              disabled={busy || confirmation !== action}
              onClick={() => {
                void control();
              }}
            >
              {busy ? "正在提交…" : "确认操作"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
