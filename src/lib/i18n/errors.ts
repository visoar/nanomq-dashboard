import { zhCN } from "zod/locales";
import type { $ZodRawIssue } from "zod/v4/core";
import { type Locale, translate } from "./index";

const chineseErrors: Record<string, string> = {
  "Cannot reach NanoMQ. Check the broker URL, HTTP API and network.":
    "无法连接 NanoMQ，请检查 Broker 地址、HTTP API 与网络。",
  "NanoMQ authentication failed": "NanoMQ 认证失败，请检查凭据。",
  "Invalid Prometheus response": "Prometheus 响应无效。",
  "NanoMQ returned invalid JSON": "NanoMQ 返回的 JSON 无效。",
  "Invalid NanoMQ response": "NanoMQ 响应无效。",
  "Missing NanoMQ response code": "NanoMQ 响应缺少状态码。",
  "Request body is too large": "请求内容过大。",
  "JSON body required": "请求必须包含 JSON 内容。",
  "Invalid JSON body": "请求的 JSON 内容无效。",
  "Invalid JSON input": "输入的 JSON 无效。",
  "NANOMQ_SESSION_SECRET must contain at least 32 characters":
    "NANOMQ_SESSION_SECRET 必须至少包含 32 个字符。",
  "Invalid broker URL": "Broker 地址无效。",
  "Invalid URL": "地址无效。",
  "Broker URL is not in NANOMQ_ALLOWED_URLS":
    "Broker 地址不在 NANOMQ_ALLOWED_URLS 允许列表中。",
  "Credentials are too large for a browser session":
    "凭据超出浏览器会话的容量限制。",
  "Same-origin request required": "只允许同源请求。",
  "Session expired. Reconnect to NanoMQ.": "会话已过期，请重新连接 NanoMQ。",
  "Invalid API path": "API 路径无效。",
  "API operation is not supported by this dashboard":
    "控制台不支持此 API 操作。",
  "Request exceeds 1 MiB": "请求内容超过 1 MiB。",
  "Configuration cannot be empty": "配置不能为空。",
  "Invalid MQTT topic filter": "MQTT 主题过滤器无效。",
  "Invalid MQTT UTF-8 string": "MQTT UTF-8 字符串无效。",
  "Invalid response topic": "响应主题无效。",
  "Invalid publish topic": "发布主题无效，不能包含通配符或空字符。",
  "Use Base64 decoding for binary payloads": "二进制负载请使用 Base64 解码。",
  "Payload must be valid Base64": "消息内容必须是有效的 Base64。",
  "Required string": "请填写必需的字符串。",
  "Invalid MQTT parameter": "MQTT 参数无效。",
  "Expected number": "请输入数字。",
  "Expected string": "请输入字符串。",
  "Invalid input": "输入无效。",
  "Failed to fetch": "网络请求失败，请检查连接。",
  "Load failed": "网络请求失败，请检查连接。",
  "Request failed": "请求失败。",
};
const patterns: [RegExp, (value: string) => string][] = [
  [/^NanoMQ returned HTTP (\d+)$/, (v) => `NanoMQ 返回 HTTP ${v}`],
  [
    /^NanoMQ rejected the request \(code (\d+)\)$/,
    (v) => `NanoMQ 拒绝请求（错误码 ${v}）`,
  ],
  [/^Missing configuration section: (.+)$/, (v) => `缺少配置章节：${v}`],
  [
    /^Unsupported configuration section: (.+)$/,
    (v) => `不支持的配置章节：${v}`,
  ],
  [/^Invalid configuration section: (.+)$/, (v) => `配置章节无效：${v}`],
];
const chineseIssue = zhCN().localeError;

export function errorMessage(locale: Locale, message: string): string {
  if (message.startsWith("[")) {
    try {
      const issues: unknown = JSON.parse(message);
      if (
        Array.isArray(issues) &&
        issues.length &&
        issues.every(
          (issue) =>
            issue &&
            typeof issue.message === "string" &&
            Array.isArray(issue.path),
        )
      ) {
        return issues
          .map((issue) => {
            const localized =
              locale === "zh-CN"
                ? (chineseErrors[issue.message] ??
                  (issue.code === "custom"
                    ? issue.message
                    : chineseIssue(issue as $ZodRawIssue)))
                : issue.message;
            const path = issue.path.map(String).join(".");
            return `${path ? `${path}: ` : ""}${typeof localized === "string" ? localized : issue.message}`;
          })
          .join("; ");
      }
    } catch {
      // Preserve unknown broker diagnostics verbatim.
    }
  }
  if (locale === "zh-CN") {
    if (chineseErrors[message]) return chineseErrors[message];
    for (const [pattern, format] of patterns) {
      const match = message.match(pattern);
      if (match) return format(match[1]);
    }
  }
  return translate(locale, message);
}
