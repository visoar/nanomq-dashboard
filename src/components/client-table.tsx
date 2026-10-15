"use client";
import type { Client } from "@/lib/contracts";
import { Empty, number, Status } from "./ui";
export function ClientTable({
  clients,
  onSelect,
}: {
  clients: Client[];
  onSelect?: (client: Client) => void;
}) {
  if (!clients.length)
    return (
      <Empty
        title="没有匹配的客户端"
        text="连接 MQTT 设备，或调整搜索与筛选条件。"
      />
    );
  const hasMessageCounts = clients.some(
    (client) => client.recv_msg !== undefined,
  );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>客户端 ID</th>
            <th>用户名</th>
            <th>连接状态</th>
            <th>协议</th>
            <th>Keep Alive</th>
            {hasMessageCounts && <th>接收消息</th>}
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.client_id}>
              <td>
                {onSelect ? (
                  <button
                    type="button"
                    className="table-link mono"
                    onClick={() => onSelect(c)}
                  >
                    {c.client_id}
                  </button>
                ) : (
                  <span className="mono strong">{c.client_id}</span>
                )}
              </td>
              <td>{c.username || <span className="muted">匿名</span>}</td>
              <td>
                <Status state={c.conn_state} />
              </td>
              <td>
                <span className="protocol">
                  {c.proto_name}{" "}
                  {c.proto_ver === 4
                    ? "3.1.1"
                    : c.proto_ver === 3
                      ? "3.1"
                      : c.proto_ver === 5
                        ? "5.0"
                        : c.proto_ver}
                </span>
              </td>
              <td className="mono">{c.keepalive}s</td>
              {hasMessageCounts && (
                <td className="mono">{number(c.recv_msg)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
