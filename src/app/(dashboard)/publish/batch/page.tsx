"use client";
import { Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Empty, Modal, Notice, PageTitle, Panel } from "@/components/ui";
import { message, mutate } from "@/lib/api";
import { type Publish, publishSchema } from "@/lib/contracts";

const resultSchema = z.object({
  data: z.array(z.object({ topic: z.string(), code: z.number() })),
});
export default function BatchPublish() {
  const [editor, setEditor] = useState("");
  const [input, setInput] = useState<Publish[] | null>(null);
  const [results, setResults] = useState<z.infer<typeof resultSchema>["data"]>(
    [],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function prepare() {
    try {
      setInput(publishSchema.array().min(1).max(100).parse(JSON.parse(editor)));
      setError("");
    } catch (e) {
      setError(message(e));
    }
  }
  async function send() {
    if (!input) return;
    setBusy(true);
    setError("");
    try {
      const result = resultSchema.parse(
        await mutate("/mqtt/publish_batch", input),
      );
      setResults(result.data);
      setInput(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="批量发布"
        action={
          <Link className="button" href="/publish">
            单条发布
          </Link>
        }
      />
      {error && <Notice error>{error}</Notice>}
      <Panel>
        <div className="config-content batch-editor">
          <label>
            消息数组（最多 100 条）
            <textarea
              className="code-editor"
              rows={14}
              value={editor}
              onChange={(e) => setEditor(e.target.value)}
              placeholder={
                '[\n  {"topic":"factory/01","payload":"hello","qos":0,"retain":false}\n]'
              }
              spellCheck={false}
            />
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="button primary"
              onClick={prepare}
              disabled={busy}
            >
              <Send size={16} />
              审阅并发布
            </button>
          </div>
        </div>
      </Panel>
      <Panel title="发布结果">
        {results.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>主题</th>
                  <th>结果</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={`${result.topic}:${String(index)}`}>
                    <td>
                      <code>{result.topic}</code>
                    </td>
                    <td>
                      <span
                        className={`badge ${result.code === 0 ? "green" : "neutral"}`}
                      >
                        {result.code === 0
                          ? "Broker 已接受"
                          : `失败 · ${result.code}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="暂无发布结果" text="" />
        )}
      </Panel>
      {input && (
        <Modal
          title={`发布 ${input.length} 条消息`}
          onClose={() => {
            if (!busy) setInput(null);
          }}
        >
          {input.some((item) => item.retain && item.payload === "") && (
            <Notice error>
              包含空负载的保留消息，发布将清除对应主题的保留消息。
            </Notice>
          )}
          <pre className="config-diff">{JSON.stringify(input, null, 2)}</pre>
          <div className="modal-actions">
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => setInput(null)}
            >
              取消
            </button>
            <button
              type="button"
              className="button primary"
              disabled={busy}
              onClick={() => {
                void send();
              }}
            >
              {busy ? "发布中…" : "确认发布"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
