import Link from "next/link";
import { Activity, ArrowRight, BookOpen, CalendarDays } from "lucide-react";

const docLinks = [
  { href: "/docs/requirements", label: "要件定義書" },
  { href: "/docs/basic-design", label: "基本設計書" },
  { href: "/docs/detail-design", label: "詳細設計書" }
];

export default function TopPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-10">
        <nav className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <Activity className="h-5 w-5 text-sky-600" aria-hidden />
            体調管理・生活記録
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-sky-200 hover:text-sky-700"
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              ドキュメント
            </Link>
          </div>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_460px]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
              <CalendarDays className="h-4 w-4" aria-hidden />
              睡眠・服薬・気分・行動を日付ごとに記録
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-zinc-950 sm:text-5xl">
              毎日の体調と生活リズムを、ひとつの画面で見返せる記録アプリ
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600">
              月次一覧、睡眠タイムライン、服薬マーク、気分スコア、日常行動をまとめて管理します。
              認証なしの単一利用者向け構成です。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-sky-700"
              >
                アプリを開く
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {docLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:border-sky-200 hover:text-sky-700"
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-900">2026-06-12</p>
                <p className="text-xs text-zinc-500">睡眠 9時間 / 服薬 2回 / 気分 +1</p>
              </div>
              <span className="rounded-md bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">+1</span>
            </div>
            <div className="grid grid-cols-9 gap-1 text-center text-xs font-semibold text-zinc-400">
              {Array.from({ length: 9 }, (_, index) => (
                <span key={index}>{index}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-9 gap-1">
              {Array.from({ length: 9 }, (_, index) => (
                <div
                  key={index}
                  className={`h-12 rounded-sm border ${
                    index > 0 && index < 7
                      ? "border-sky-400 bg-sky-500"
                      : "border-zinc-200 bg-zinc-50"
                  }`}
                />
              ))}
            </div>
            <div className="mt-5 grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2">
                <span className="font-semibold text-zinc-700">服薬</span>
                <span className="font-black text-rose-600">× ×</span>
              </div>
              <div className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-700">
                朝散歩、買い物、夜は早めに休む
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
