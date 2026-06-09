import fs from "node:fs/promises";
import path from "node:path";

export type DocSlug = "index" | "requirements" | "basic-design" | "detail-design";

export const docs: Record<DocSlug, { title: string; file: string; href: string }> = {
  index: {
    title: "ドキュメント",
    file: "index.md",
    href: "/docs"
  },
  requirements: {
    title: "要件定義書",
    file: "requirements.md",
    href: "/docs/requirements"
  },
  "basic-design": {
    title: "基本設計書",
    file: "basic-design.md",
    href: "/docs/basic-design"
  },
  "detail-design": {
    title: "詳細設計書",
    file: "detail-design.md",
    href: "/docs/detail-design"
  }
};

const docsRoot = path.resolve(process.cwd(), "..", "docs");

export function isDocSlug(value: string): value is DocSlug {
  return Object.keys(docs).includes(value);
}

export async function readDoc(slug: DocSlug): Promise<string> {
  const doc = docs[slug];
  return fs.readFile(path.join(docsRoot, doc.file), "utf8");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeHref(value: string): string {
  if (value.startsWith("/") || value.startsWith("#") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return "#";
}

function renderInline(raw: string): string {
  let html = escapeHtml(raw);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_match, label: string, href: string) => {
    return `<a href="${safeHref(href)}">${label}</a>`;
  });
  return html;
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  const paragraph: string[] = [];
  const codeLines: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }
    html.push(`<p>${paragraph.map(renderInline).join(" ")}</p>`);
    paragraph.length = 0;
  };

  const closeList = () => {
    if (listType !== null) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  const openList = (type: "ul" | "ol") => {
    if (listType === type) {
      return;
    }
    closeList();
    html.push(`<${type}>`);
    listType = type;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines.length = 0;
        inCode = false;
      } else {
        flushParagraph();
        closeList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (trimmed === "") {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^- /.test(trimmed)) {
      flushParagraph();
      openList("ul");
      html.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      openList("ol");
      html.push(`<li>${renderInline(ordered[1])}</li>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  flushParagraph();
  closeList();
  return html.join("\n");
}
