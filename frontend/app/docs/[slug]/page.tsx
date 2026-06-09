import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

import { docs, isDocSlug, readDoc, renderMarkdown } from "@/lib/markdown";

export function generateStaticParams() {
  return Object.keys(docs)
    .filter((slug) => slug !== "index")
    .map((slug) => ({ slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isDocSlug(slug) || slug === "index") {
    notFound();
  }

  const markdown = await readDoc(slug);
  const html = renderMarkdown(markdown);

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 hover:text-sky-700">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            ドキュメント
          </Link>
          <div className="flex flex-wrap gap-2">
            {Object.entries(docs)
              .filter(([docSlug]) => docSlug !== "index")
              .map(([docSlug, doc]) => (
                <Link
                  key={docSlug}
                  href={doc.href}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition ${
                    docSlug === slug
                      ? "border-sky-300 bg-sky-50 text-sky-800"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-sky-200 hover:text-sky-700"
                  }`}
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
