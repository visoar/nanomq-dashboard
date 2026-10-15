"use client";
import { FileUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Modal, Notice, PageTitle, Panel } from "@/components/ui";
import { message, mutate } from "@/lib/api";
export default function ConfigurationFile() {
  const [content, setContent] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save() {
    setBusy(true);
    setError("");
    try {
      await mutate("/config_update", { configuration: content });
      setSaved(true);
      setConfirming(false);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="替换配置文件"
        action={
          <Link className="button" href="/configuration">
            返回配置
          </Link>
        }
      />
      <Notice error>
        将覆盖 Broker 的完整配置文件。请先在服务器备份，保留 HTTP
        服务与认证配置；重启后生效。
      </Notice>
      {error && !confirming && <Notice error>{error}</Notice>}
      {saved && (
        <Notice>配置文件已写入。可返回 Broker 配置页面执行重启。</Notice>
      )}
      <Panel>
        <div className="config-content batch-editor">
          <label>
            完整 HOCON 配置
            <textarea
              className="code-editor"
              rows={22}
              spellCheck={false}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSaved(false);
              }}
            />
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="button primary"
              disabled={!content.trim() || busy}
              onClick={() => {
                setConfirming(true);
                setError("");
              }}
            >
              <FileUp size={16} />
              审阅并写入
            </button>
          </div>
        </div>
      </Panel>
      {confirming && (
        <Modal
          title="确认替换配置文件"
          onClose={() => {
            if (!busy) setConfirming(false);
          }}
        >
          {error && <Notice error>{error}</Notice>}
          <pre className="config-diff">{content}</pre>
          <div className="modal-actions">
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="button danger"
              disabled={busy}
              onClick={() => {
                void save();
              }}
            >
              {busy ? "写入中…" : "覆盖配置文件"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
