"use client";
import { Activity, ArrowRight, LockKeyhole, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { LanguageSwitch } from "@/components/language-switch";
import { Notice } from "@/components/ui";
import { useDashboard } from "@/context/dashboard";
import { useI18n } from "@/context/language";
import { message, request } from "@/lib/api";
export default function SignIn() {
  const { t, errorText, locale } = useI18n();
  const { session, defaultURL, reconnect } = useDashboard();
  const router = useRouter();
  const [baseURL, setBaseURL] = useState("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [authType, setAuthType] = useState("basic");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);
  async function connect(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/api/session", {
        method: "POST",
        body: JSON.stringify(
          authType === "basic"
            ? { baseURL: baseURL || defaultURL, authType, username, password }
            : { baseURL: baseURL || defaultURL, authType, token },
        ),
      });
      await reconnect();
      router.replace("/");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="signin" id="main">
      <section className="signin-story">
        <div className="brand">
          <span className="brand-symbol">
            <Activity size={25} />
          </span>
          <span>
            NanoMQ<span className="brand-sub">DASHBOARD</span>
          </span>
        </div>
        <div className="signin-intro">
          <h1>
            {t("每一次连接，")}
            <br />
            {t("都清晰可见。")}
          </h1>

          <div className="signal-art" aria-hidden="true">
            <div />
            <div />
            <div />
            <Radio size={44} />
          </div>
        </div>
      </section>
      <section className="signin-form-section">
        <div className="signin-language">
          <LanguageSwitch />
        </div>
        <form className="signin-form" onSubmit={connect}>
          <span className="form-icon">
            <LockKeyhole size={24} />
          </span>

          <h2>{t("连接 NanoMQ")}</h2>

          {error && <Notice error>{errorText(error)}</Notice>}
          <label>
            {t("Broker HTTP 地址")}
            <input
              type="url"
              value={baseURL || defaultURL}
              onChange={(e) => setBaseURL(e.target.value)}
              required
              autoComplete="url"
            />
          </label>
          <label>
            {t("认证方式")}
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
            >
              <option value="basic">{t("Basic 认证")}</option>
              <option value="jwt">{t("JWT 令牌")}</option>
            </select>
          </label>
          {authType === "basic" ? (
            <>
              <label>
                {t("用户名")}
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>
              <label>
                {t("密码")}
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </>
          ) : (
            <label>
              {t("JWT 令牌")}
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                spellCheck={false}
              />
            </label>
          )}
          <button
            type="submit"
            className="button primary full"
            disabled={busy || session === undefined}
          >
            {busy ? t("正在验证连接…") : t("连接 Broker")}
            <ArrowRight size={17} />
          </button>

          <a
            className="signin-docs"
            href={`https://nanomq.io/docs/${locale === "zh-CN" ? "zh" : "en"}/latest/config-description/http-server.html`}
            target="_blank"
            rel="noreferrer"
          >
            {t("连接前，请确认 Broker 已启用 HTTP API ↗")}
          </a>
        </form>
      </section>
    </main>
  );
}
