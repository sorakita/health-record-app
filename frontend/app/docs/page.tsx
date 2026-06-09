import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import { docs, readDoc, renderMarkdown } from "@/lib/markdown";

export default async function DocsIndexPage() {
  const markdown = await readDoc("index");
  const html = renderMarkdown(markdown);

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 hover:text-sky-700">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            TOP
          </Link>
          <div className="flex flex-wrap gap-2">
            {Object.entries(docs)
              .filter(([slug]) => slug !== "index")
              .map(([slug, doc]) => (
                <Link
                  key={slug}
                  href={doc.href}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-700 transition hover:border-sky-200 hover:text-sky-700"
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  {doc.title}
                </Link>
              ))}
          </div>
        </div>
        <article
          className="doc-body rounded-lg border border-zinc-200 bg-white p-6 shadow-soft sm:p-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  );
}
