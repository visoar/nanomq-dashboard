import Link from "next/link";
export default function NotFound() {
  return (
    <main className="loading-screen" id="main">
      <h1>404 · 页面不存在</h1>
      <Link className="button primary" href="/">
        返回控制台
      </Link>
    </main>
  );
}
