"use client";
import { GitBranch, Pencil, Power, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Empty, Modal, Notice, PageTitle, Panel } from "@/components/ui";
import { message, mutate } from "@/lib/api";
import {
  type Bridge,
  bridgeConfigSchema,
  bridgeSubscriptionSchema,
} from "@/lib/contracts";
import { useResource } from "@/lib/use-resource";

type Operation = { bridge: Bridge; path: string; title: string; body: unknown };
export default function Bridges() {
  const {
    data,
    loading,
    error: loadError,
    reload,
  } = useResource("/configuration/bridge", bridgeConfigSchema);
  const [managing, setManaging] = useState<Bridge | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Operation | null>(null);
  function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!managing) return;
    try {
      const form = new FormData(event.currentTarget);
      const input = bridgeSubscriptionSchema.parse({
        remote_topic: form.get("remote"),
        local_topic: form.get("local"),
        qos: Number(form.get("qos")),
      });
      setError("");
      setPending({
        bridge: managing,
        title: "添加桥接订阅",
        path: `/bridges/sub/${encodeURIComponent(managing.name)}`,
        body: {
          data: {
            subscription: [input],
          },
        },
      });
    } catch (error) {
      setError(message(error));
    }
  }
  async function execute() {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      await mutate(pending.path, pending.body);
      setPending(null);
      setManaging(null);
      reload();
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="MQTT 桥接"
        action={
          <button type="button" className="button" onClick={reload}>
            <RefreshCw size={15} />
            刷新
          </button>
        }
      />
      {loadError && <Notice error>{loadError}</Notice>}
      <Panel>
        {loading ? (
          <Empty title="正在读取桥接" text="" />
        ) : data?.bridge.nodes.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>名称</th>
                  <th>远端 Broker</th>
                  <th>状态</th>
                  <th>转发 / 订阅</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.bridge.nodes.map((bridge) => (
                  <tr key={bridge.name}>
                    <td>
                      <code>{bridge.name}</code>
                    </td>
                    <td>
                      <code>{String(bridge.connector.server || "—")}</code>
                    </td>
                    <td>
                      <span
                        className={`badge ${bridge.enable ? "green" : "neutral"}`}
                      >
                        {bridge.enable ? "已启用" : "已停用"}
                      </span>
                    </td>
                    <td>
                      {bridge.forwards?.length ?? 0} /{" "}
                      {bridge.subscription?.length ?? 0}
                    </td>
                    <td>
                      <div className="button-group">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`管理桥接订阅 ${bridge.name}`}
                          onClick={() => {
                            setManaging(bridge);
                            setError("");
                          }}
                        >
                          <GitBranch size={15} />
                        </button>
                        <Link
                          className="icon-button"
                          aria-label={`编辑桥接配置 ${bridge.name}`}
                          href="/configuration/file"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`${bridge.enable ? "停用" : "启用"}桥接 ${bridge.name}`}
                          onClick={() => {
                            setError("");
                            setPending({
                              bridge,
                              title: `${bridge.enable ? "停用" : "启用"}桥接`,
                              path: `/bridges/switch/${encodeURIComponent(bridge.name)}`,
                              body: { data: { bridge_switch: !bridge.enable } },
                            });
                          }}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="尚未配置桥接"
            text="请在 Broker 配置文件中添加 bridges.mqtt 节点。"
          />
        )}
      </Panel>
      {managing && !pending && (
        <Modal
          title={`桥接订阅 ${managing.name}`}
          onClose={() => setManaging(null)}
        >
          {error && <Notice error>{error}</Notice>}
          {managing.subscription?.map((item) => (
            <div className="subscription-row" key={String(item.remote_topic)}>
              <div>
                <code>{String(item.remote_topic)}</code>
                <p>
                  → <code>{String(item.local_topic)}</code>
                </p>
              </div>
              <button
                type="button"
                className="icon-button danger-text"
                aria-label={`取消桥接订阅 ${String(item.remote_topic)}`}
                onClick={() => {
                  setError("");
                  setPending({
                    bridge: managing,
                    title: "取消桥接订阅",
                    path: `/bridges/unsub/${encodeURIComponent(managing.name)}`,
                    body: {
                      data: { unsubscription: [{ topic: item.remote_topic }] },
                    },
                  });
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <form onSubmit={subscribe} className="bridge-subscribe-form">
            <label>
              远端主题
              <input name="remote" required />
            </label>
            <label>
              本地主题
              <input name="local" required />
            </label>
            <label>
              QoS
              <select name="qos" defaultValue="0">
                {[0, 1, 2].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button type="submit" className="button primary">
                添加桥接订阅
              </button>
            </div>
          </form>
        </Modal>
      )}
      {pending && (
        <Modal
          title={`${pending.title} ${pending.bridge.name}`}
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          {error && <Notice error>{error}</Notice>}
          <p>确认更新桥接连接？</p>
          <pre>{JSON.stringify(pending.body, null, 2)}</pre>
          <div className="modal-actions">
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              取消
            </button>
            <button
              type="button"
              className="button primary"
              disabled={busy}
              onClick={() => {
                void execute();
              }}
            >
              {busy ? "提交中…" : "确认"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
