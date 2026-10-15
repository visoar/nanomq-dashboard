"use client";
import { Code2, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Empty, Modal, Notice, PageTitle, Panel } from "@/components/ui";
import { useCapability } from "@/context/dashboard";
import { useI18n } from "@/context/language";
import { message, mutate } from "@/lib/api";
import { type Publish, publishSchema } from "@/lib/contracts";

type Receipt = {
  id: string;
  time: number;
  topic: string;
  qos: number;
  success: boolean;
  detail: string;
};
export default function PublishPage() {
  const { t, locale, errorText } = useI18n();
  const canPublish = useCapability("POST", "/mqtt/publish");
  const [topic, setTopic] = useState("");
  const [payload, setPayload] = useState("");
  const [qos, setQos] = useState(0);
  const [retain, setRetain] = useState(false);
  const [encoding, setEncoding] = useState("plain");
  const [properties, setProperties] = useState("");
  const [clientid, setClientid] = useState("");
  const [format, setFormat] = useState("text");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pending, setPending] = useState<Publish | null>(null);
  async function send(input: Publish) {
    setBusy(true);
    setError("");
    try {
      await mutate("/mqtt/publish", input);
      setReceipts((prev) =>
        [
          {
            id: crypto.randomUUID(),
            time: Date.now(),
            topic: input.topic,
            qos: input.qos,
            success: true,
            detail: "Broker 已接受发布请求",
          },
          ...prev,
        ].slice(0, 30),
      );
      setPending(null);
    } catch (e) {
      setError(message(e));
      setReceipts((prev) =>
        [
          {
            id: crypto.randomUUID(),
            time: Date.now(),
            topic: input.topic,
            qos: input.qos,
            success: false,
            detail: message(e),
          },
          ...prev,
        ].slice(0, 30),
      );
      setPending(null);
    } finally {
      setBusy(false);
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (format === "json") JSON.parse(payload);
      const input = publishSchema.parse({
        topic,
        payload,
        qos,
        retain,
        encoding: encoding === "base64" ? "base64" : "plain",
        decoding: encoding === "decode-base64" ? "base64" : "plain",
        ...(clientid ? { clientid } : {}),
        ...(properties ? { properties: JSON.parse(properties) } : {}),
      });
      if (retain && payload === "") setPending(input);
      else void send(input);
    } catch (e) {
      setError(message(e));
    }
  }
  function prettify() {
    try {
      setPayload(JSON.stringify(JSON.parse(payload), null, 2));
      setError("");
    } catch {
      setError("消息内容不是有效的 JSON。");
    }
  }
  return (
    <>
      <PageTitle
        title={t("消息工作台")}
        action={
          <Link className="button" href="/publish/batch">
            {t("批量发布")}
          </Link>
        }
      />
      <div className="publish-layout">
        <Panel title={t("发布消息")}>
          <form onSubmit={submit} className="publish-form">
            {error && <Notice error>{errorText(error)}</Notice>}
            <label>
              {t("主题")}
              <span className="required">*</span>
              <input
                aria-label={t("主题")}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="factory/line-01/telemetry"
                required
              />
            </label>
            <div className="form-row">
              <label>
                QoS
                <select
                  value={qos}
                  onChange={(e) => setQos(Number(e.target.value))}
                >
                  <option value={0}>{t("0 · 最多一次")}</option>
                  <option value={1}>{t("1 · 至少一次")}</option>
                  <option value={2}>{t("2 · 恰好一次")}</option>
                </select>
              </label>
              <label>
                {t("编码")}
                <select
                  aria-label={t("编码")}
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value)}
                >
                  <option value="plain">{t("纯文本")}</option>
                  <option value="base64">{t("Base64 编码")}</option>
                  <option value="decode-base64">
                    {t("Base64 解码（二进制负载）")}
                  </option>
                </select>
              </label>
            </div>
            <div className="payload-label">
              <label htmlFor="payload">{t("消息内容")}</label>
              <div className="segmented">
                <button
                  type="button"
                  className={format === "text" ? "selected" : ""}
                  onClick={() => setFormat("text")}
                >
                  {t("文本")}
                </button>
                <button
                  type="button"
                  className={format === "json" ? "selected" : ""}
                  onClick={() => setFormat("json")}
                >
                  JSON
                </button>
              </div>
            </div>
            <textarea
              id="payload"
              className="code-editor"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder={'{\n  "temperature": 24.5,\n  "unit": "celsius"\n}'}
              spellCheck={false}
              rows={10}
            />
            <div className="payload-footer">
              <span>
                {new TextEncoder().encode(payload).length} bytes · UTF-8
              </span>
              <button type="button" className="text-button" onClick={prettify}>
                <Code2 size={14} />
                {t("格式化 JSON")}
              </button>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={retain}
                onChange={(e) => setRetain(e.target.checked)}
              />
              <span>
                {t("保留消息")}
                <small>{t("Broker 将保存该主题的最新消息")}</small>
              </span>
            </label>
            <details>
              <summary>{t("高级选项 · Client ID 与 MQTT 5 属性")}</summary>
              <label>
                {t("HTTP 发布客户端 ID")}
                <input
                  value={clientid}
                  onChange={(e) => setClientid(e.target.value)}
                  placeholder={t("默认 NanoMQ-HTTP-Client")}
                />
              </label>
              <label>
                {t("MQTT 5 properties（JSON 对象）")}
                <textarea
                  className="code-editor"
                  aria-label={t("MQTT 5 properties（JSON 对象）")}
                  value={properties}
                  onChange={(e) => setProperties(e.target.value)}
                  placeholder={'{"content_type":"application/json"}'}
                  rows={3}
                />
              </label>
            </details>
            <div className="form-bottom">
              <button
                type="submit"
                className="button primary"
                disabled={busy || !canPublish}
              >
                <Send size={16} />
                {busy ? t("发布中…") : t("发布消息")}
              </button>
            </div>
          </form>
        </Panel>
        <div>
          <Panel
            title={t("发布记录")}
            action={
              <button
                type="button"
                className="icon-button"
                aria-label={t("清空发布记录")}
                onClick={() => setReceipts([])}
              >
                <Trash2 size={16} />
              </button>
            }
          >
            {receipts.length ? (
              <div className="receipts">
                {receipts.map((r) => (
                  <div className="receipt" key={r.id}>
                    <span
                      className={`receipt-dot ${r.success ? "success" : "failure"}`}
                    />
                    <div>
                      <code>{r.topic}</code>
                      <p>{r.success ? t(r.detail) : errorText(r.detail)}</p>
                      <small>
                        {new Date(r.time).toLocaleTimeString(locale, {
                          hour12: false,
                        })}{" "}
                        · QoS {r.qos}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title={t("等待第一条消息")}
                text={t("发布后，可在这里查看 Broker 的响应。")}
              />
            )}
          </Panel>
        </div>
      </div>
      {pending && (
        <Modal
          title={t("清除保留消息")}
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          <Notice error>
            {t("空负载配合 Retain 会清除主题 {topic} 的保留消息。", {
              topic: pending.topic,
            })}
          </Notice>
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
              className="button danger"
              disabled={busy}
              onClick={() => {
                void send(pending);
              }}
            >
              {busy ? t("发布中…") : t("确认清除并发布")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
