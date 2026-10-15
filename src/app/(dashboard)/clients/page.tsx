"use client";
import { Download, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ClientTable } from "@/components/client-table";
import {
  download,
  Modal,
  PageTitle,
  Pagination,
  Panel,
  Status,
} from "@/components/ui";
import { useDashboard } from "@/context/dashboard";
import { useI18n } from "@/context/language";
import type { Client } from "@/lib/contracts";
export default function Clients() {
  const { t } = useI18n();
  const { data } = useDashboard();
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [protocol, setProtocol] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Client | null>(null);
  const clients = useMemo(
    () =>
      (data.clients || [])
        .filter(
          (c) =>
            `${c.client_id} ${c.username}`
              .toLowerCase()
              .includes(search.toLowerCase()) &&
            (!state || c.conn_state === state) &&
            (!protocol || c.proto_ver === Number(protocol)),
        )
        .sort((a, b) => a.client_id.localeCompare(b.client_id)),
    [data.clients, search, state, protocol],
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(clients.length / 10)));
  return (
    <>
      <PageTitle
        title={t("客户端")}
        action={
          <button
            type="button"
            className="button"
            onClick={() =>
              download("nanomq-clients.json", JSON.stringify(clients, null, 2))
            }
          >
            <Download size={15} />
            {t("导出列表")}
          </button>
        }
      />
      <div className="summary-strip">
        <Users size={19} />
        <strong>
          {data.clients?.filter((c) => c.conn_state === "connected").length ??
            "—"}
        </strong>
        <span>{t("在线客户端")}</span>
        <span className="separator" />
        <strong>{data.clients?.length ?? "—"}</strong>
        <span>{t("已知会话")}</span>
      </div>
      <Panel>
        <div className="filter-bar">
          <div className="search-field">
            <Search size={16} />
            <input
              aria-label={t("搜索客户端")}
              placeholder={t("搜索客户端 ID 或用户名…")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label={t("连接状态")}
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("全部状态")}</option>
            <option value="connected">{t("在线")}</option>
            <option value="idle">{t("空闲")}</option>
            <option value="disconnected">{t("离线")}</option>
          </select>
          <select
            aria-label={t("协议版本")}
            value={protocol}
            onChange={(e) => {
              setProtocol(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("全部协议")}</option>
            <option value="5">MQTT 5.0</option>
            <option value="4">MQTT 3.1.1</option>
            <option value="3">MQTT 3.1</option>
          </select>
        </div>
        <ClientTable
          clients={clients.slice((safePage - 1) * 10, safePage * 10)}
          onSelect={setSelected}
        />
        <Pagination
          page={safePage}
          size={10}
          count={clients.length}
          onPage={setPage}
        />
      </Panel>
      {selected && (
        <Modal title={t("客户端详情")} onClose={() => setSelected(null)}>
          <div className="detail-grid">
            <span>{t("客户端 ID")}</span>
            <code>{selected.client_id}</code>
            <span>{t("连接状态")}</span>
            <Status state={selected.conn_state} />
            <span>{t("用户名")}</span>
            <strong>{selected.username || t("匿名")}</strong>
            <span>{t("全新会话")}</span>
            <strong>{selected.clean_start ? t("是") : t("否")}</strong>
            <span>Keep Alive</span>
            <strong>
              {t("{seconds} 秒", { seconds: selected.keepalive })}
            </strong>
            {selected.will_topic && (
              <>
                <span>{t("遗嘱主题")}</span>
                <code>{selected.will_topic}</code>
              </>
            )}
          </div>
          <h3 className="section-label">{t("此客户端的订阅")}</h3>
          {data.subscriptions
            ?.filter((s) => s.clientid === selected.client_id)
            .map((s) => (
              <div className="subscription-row" key={`${s.topic}-${s.qos}`}>
                <code>{s.topic}</code>
                <span className="protocol">QoS {s.qos}</span>
              </div>
            ))}
          {!data.subscriptions?.some(
            (s) => s.clientid === selected.client_id,
          ) && <p className="muted">{t("暂无订阅记录。")}</p>}
          <p className="subtle-note">
            {t("当前 NanoMQ API 未提供断开客户端接口。")}
          </p>
        </Modal>
      )}
    </>
  );
}
