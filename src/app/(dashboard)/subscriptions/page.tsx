"use client";
import { Download, GitBranch, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  download,
  Empty,
  Notice,
  PageTitle,
  Pagination,
  Panel,
} from "@/components/ui";
import { useDashboard } from "@/context/dashboard";
import { useI18n } from "@/context/language";
import { message, read } from "@/lib/api";
import { type TopicNode, topicNodeSchema } from "@/lib/contracts";
export default function Subscriptions() {
  const { t, errorText } = useI18n();
  const { data } = useDashboard();
  const [tab, setTab] = useState("subscriptions");
  const [search, setSearch] = useState("");
  const [qos, setQos] = useState("");
  const [page, setPage] = useState(1);
  const [tree, setTree] = useState<TopicNode[][] | null>(null);
  const [treeError, setTreeError] = useState("");
  const subscriptions = useMemo(
    () =>
      (data.subscriptions || [])
        .filter(
          (s) =>
            `${s.clientid} ${s.topic}`
              .toLowerCase()
              .includes(search.toLowerCase()) &&
            (!qos || s.qos === Number(qos)),
        )
        .sort((a, b) => a.topic.localeCompare(b.topic)),
    [data.subscriptions, search, qos],
  );
  const safePage = Math.min(
    page,
    Math.max(1, Math.ceil(subscriptions.length / 10)),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: Each poll invalidates the corresponding topic snapshot.
  useEffect(() => {
    if (tab !== "tree") return;
    const abort = new AbortController();
    void read("/topic-tree", topicNodeSchema.array().array(), abort.signal)
      .then((value) => {
        setTree(value);
        setTreeError("");
      })
      .catch((error) => {
        if (!abort.signal.aborted) setTreeError(message(error));
      });
    return () => abort.abort();
  }, [tab, data.updated]);
  return (
    <>
      <PageTitle
        title={t("主题与订阅")}
        action={
          <button
            type="button"
            className="button"
            onClick={() =>
              download(
                "nanomq-subscriptions.json",
                JSON.stringify(subscriptions, null, 2),
              )
            }
          >
            <Download size={15} />
            {t("导出订阅")}
          </button>
        }
      />
      <div className="summary-strip">
        <GitBranch size={19} />
        <strong>{data.subscriptions?.length ?? "—"}</strong>
        <span>{t("订阅")}</span>
        <span className="separator" />
        <strong>
          {data.subscriptions
            ? new Set(data.subscriptions.map((s) => s.topic)).size
            : "—"}
        </strong>
        <span>{t("主题过滤器")}</span>
      </div>
      <div className="tabs">
        <button
          type="button"
          className={tab === "subscriptions" ? "selected" : ""}
          onClick={() => setTab("subscriptions")}
        >
          {t("订阅列表")}
        </button>
        <button
          type="button"
          className={tab === "tree" ? "selected" : ""}
          onClick={() => setTab("tree")}
        >
          {t("主题层级")}
        </button>
      </div>
      {tab === "subscriptions" ? (
        <Panel>
          <div className="filter-bar">
            <div className="search-field">
              <Search size={16} />
              <input
                aria-label={t("搜索订阅")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t("搜索主题或客户端 ID…")}
              />
            </div>
            <select
              aria-label={t("QoS 筛选")}
              value={qos}
              onChange={(e) => {
                setQos(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("全部 QoS")}</option>
              {[0, 1, 2].map((n) => (
                <option key={n} value={n}>
                  QoS {n}
                </option>
              ))}
            </select>
          </div>
          {subscriptions.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("主题过滤器")}</th>
                    <th>{t("客户端 ID")}</th>
                    <th>QoS</th>
                    <th>{t("匹配方式")}</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions
                    .slice((safePage - 1) * 10, safePage * 10)
                    .map((s) => (
                      <tr key={`${s.clientid}-${s.topic}-${s.qos}`}>
                        <td>
                          <code className="topic-name">{s.topic}</code>
                        </td>
                        <td className="mono">{s.clientid}</td>
                        <td>
                          <span className="protocol">QoS {s.qos}</span>
                        </td>
                        <td>
                          {s.topic.startsWith("$share/")
                            ? t("共享订阅")
                            : /[+#]/.test(s.topic)
                              ? t("通配符")
                              : t("精确匹配")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title={t("没有匹配的订阅")} text="" />
          )}
          <Pagination
            page={safePage}
            size={10}
            count={subscriptions.length}
            onPage={setPage}
          />
        </Panel>
      ) : (
        <Panel title={t("主题层级")}>
          {treeError && <Notice error>{errorText(treeError)}</Notice>}
          {tree?.length ? (
            <div className="topic-levels">
              {tree
                .filter((level) => level.length)
                .map((level, index) => (
                  <div key={JSON.stringify(level)} className="topic-level">
                    <span className="eyebrow">
                      {t("层级 {level}", { level: index })}
                    </span>
                    {level.map((node) => (
                      <div className="topic-node" key={JSON.stringify(node)}>
                        <GitBranch size={16} />
                        <code>{node.topic || t("根主题")}</code>
                        <span className="topic-clients">
                          {node.clientid?.join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          ) : (
            <Empty title={t("暂无主题层级")} text="" />
          )}
        </Panel>
      )}
    </>
  );
}
