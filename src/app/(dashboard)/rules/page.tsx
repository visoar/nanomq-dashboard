"use client";
import { Pencil, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Empty, Modal, Notice, PageTitle, Panel } from "@/components/ui";
import { useI18n } from "@/context/language";
import { message, mutate } from "@/lib/api";
import {
  createRuleSchema,
  type Rule,
  ruleSchema,
  updateRuleSchema,
} from "@/lib/contracts";
import { useResource } from "@/lib/use-resource";

const schema = ruleSchema.array();
export default function Rules() {
  const { t, errorText } = useI18n();
  const {
    data,
    error: loadError,
    loading,
    reload,
  } = useResource("/rules", schema);
  const [editing, setEditing] = useState<Rule | "new" | null>(null);
  const [sql, setSql] = useState("");
  const [type, setType] = useState("repub");
  const [params, setParams] = useState("");
  const [replaceAction, setReplaceAction] = useState(false);
  const [pending, setPending] = useState<{
    path: string;
    method: string;
    body?: unknown;
    title: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function edit(rule: Rule | "new") {
    setEditing(rule);
    setSql(rule === "new" ? "" : rule.rawsql);
    setType(rule === "new" ? "repub" : rule.name || "repub");
    setParams("");
    setReplaceAction(rule === "new");
    setError("");
  }
  function prepare() {
    try {
      const input = {
        rawsql: sql,
        ...(editing !== "new" && editing ? { enabled: editing.enabled } : {}),
        ...(replaceAction
          ? { actions: [{ name: type, params: JSON.parse(params) }] }
          : {}),
      };
      const body =
        editing === "new"
          ? createRuleSchema.parse(input)
          : updateRuleSchema.parse(input);
      setPending({
        path:
          editing === "new" ? "/rules" : `/rules/rule:${(editing as Rule).id}`,
        method: editing === "new" ? "POST" : "PUT",
        body,
        title: "保存规则",
      });
      setError("");
    } catch (e) {
      setError(message(e));
    }
  }
  async function execute() {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      await mutate(pending.path, pending.body, pending.method);
      setPending(null);
      setEditing(null);
      reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title={t("规则引擎")}
        action={
          <div className="button-group">
            <button type="button" className="button" onClick={reload}>
              <RefreshCw size={15} />
              {t("刷新")}
            </button>
            <button
              type="button"
              className="button primary"
              disabled={loading || !!loadError}
              onClick={() => edit("new")}
            >
              <Plus size={15} />
              {t("创建规则")}
            </button>
          </div>
        }
      />
      {loadError && (
        <Notice error>
          {loadError.includes("111")
            ? t("当前 Broker 未启用规则引擎。")
            : errorText(loadError)}
        </Notice>
      )}
      <Panel>
        {loading ? (
          <Empty title={t("正在读取规则")} text="" />
        ) : data?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>SQL</th>
                  <th>{t("动作")}</th>
                  <th>{t("状态")}</th>
                  <th>{t("操作")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <code>rule:{rule.id}</code>
                    </td>
                    <td>
                      <code>{rule.rawsql}</code>
                    </td>
                    <td>{rule.name}</td>
                    <td>
                      <span
                        className={`badge ${rule.enabled ? "green" : "neutral"}`}
                      >
                        {rule.enabled ? t("已启用") : t("已停用")}
                      </span>
                    </td>
                    <td>
                      <div className="button-group">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={t("编辑规则 {id}", { id: rule.id })}
                          onClick={() => edit(rule)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={t(
                            rule.enabled ? "停用规则 {id}" : "启用规则 {id}",
                            { id: rule.id },
                          )}
                          onClick={() => {
                            setError("");
                            setPending({
                              path: `/rules/rule:${rule.id}`,
                              method: "PUT",
                              body: { enabled: !rule.enabled },
                              title: rule.enabled ? "停用规则" : "启用规则",
                            });
                          }}
                        >
                          <Power size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger-text"
                          aria-label={t("删除规则 {id}", { id: rule.id })}
                          onClick={() => {
                            setError("");
                            setPending({
                              path: `/rules/rule:${rule.id}`,
                              method: "DELETE",
                              title: "删除规则",
                            });
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={t("暂无规则")} text="" />
        )}
      </Panel>
      {editing && !pending && (
        <Modal
          title={editing === "new" ? t("创建规则") : t("编辑规则")}
          onClose={() => setEditing(null)}
        >
          {error && <Notice error>{errorText(error)}</Notice>}
          <label>
            SQL
            <textarea
              className="code-editor"
              aria-label="SQL"
              rows={4}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder={'SELECT * FROM "factory/#"'}
            />
          </label>
          {editing !== "new" && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={replaceAction}
                onChange={(e) => setReplaceAction(e.target.checked)}
              />
              {t("替换动作参数")}
            </label>
          )}
          {replaceAction && (
            <>
              <label>
                {t("动作")}
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {[
                    "repub",
                    "sqlite",
                    "mysql",
                    "postgresql",
                    "timescaledb",
                  ].map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label>
                {t("动作参数（JSON）")}
                <textarea
                  className="code-editor"
                  rows={8}
                  value={params}
                  onChange={(e) => setParams(e.target.value)}
                  placeholder={
                    type === "repub"
                      ? '{"topic":"output","address":"mqtt-tcp://broker:1883","proto_ver":4,"keepalive":60,"clientid":"rule-client"}'
                      : type === "sqlite"
                        ? '{"table":"messages"}'
                        : '{"host":"database","username":"user","password":"","table":"messages"}'
                  }
                />
              </label>
            </>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button"
              onClick={() => setEditing(null)}
            >
              {t("取消")}
            </button>
            <button type="button" className="button primary" onClick={prepare}>
              {t("审阅变更")}
            </button>
          </div>
        </Modal>
      )}
      {pending && (
        <Modal
          title={pending.title}
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          {error && <Notice error>{errorText(error)}</Notice>}
          <p>
            {pending.method === "DELETE"
              ? t("确认删除该规则？")
              : t("确认应用以下变更？")}
          </p>
          <pre>
            {pending.body
              ? JSON.stringify(pending.body, null, 2)
              : pending.path.split("/").at(-1)}
          </pre>
          <div className="modal-actions">
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              {t("取消")}
            </button>
            <button
              type="button"
              className={`button ${pending.method === "DELETE" ? "danger" : "primary"}`}
              disabled={busy}
              onClick={() => {
                void execute();
              }}
            >
              {busy ? t("提交中…") : t("确认")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
