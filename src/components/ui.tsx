"use client";
import { AlertCircle, Inbox, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  title = "暂无数据",
  text = "",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <Inbox size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      <AlertCircle size={17} />
      <div>{children}</div>
    </div>
  );
}
export function PageTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}
export function Status({ state }: { state: string }) {
  return (
    <span
      className={`badge ${state === "connected" || state === "Running" ? "green" : "neutral"}`}
    >
      <i />
      {(
        {
          connected: "在线",
          disconnected: "离线",
          idle: "空闲",
          Running: "运行中",
        } as Record<string, string>
      )[state] || state}
    </span>
  );
}
export function number(value: number | undefined | null) {
  return value === undefined || value === null
    ? "—"
    : new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
}
export function bytes(value: number | undefined) {
  if (value === undefined) return "—";
  const unit = value >= 1048576 ? "MiB" : value >= 1024 ? "KiB" : "B";
  const divisor = unit === "MiB" ? 1048576 : unit === "KiB" ? 1024 : 1;
  return `${number(value / divisor)} ${unit}`;
}
export function download(
  filename: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} aria-labelledby={titleId}>
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="关闭"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Pagination({
  page,
  count,
  size,
  onPage,
}: {
  page: number;
  count: number;
  size: number;
  onPage: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(count / size));
  return (
    <div className="pagination">
      <span>
        共 {number(count)} 条 · 第 {page} / {pages} 页
      </span>
      <div>
        <button
          type="button"
          className="button small"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          上一页
        </button>
        <button
          type="button"
          className="button small"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
