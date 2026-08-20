"use client";

import Link from "next/link";
import type { ReactNode } from "react";

function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // code `...`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${nodes.length}`}
          className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[12px]"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // link [label](href)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isInternal = isInternalHref(href);
      const cls = "font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700";
      nodes.push(
        isInternal ? (
          <Link key={`${keyPrefix}-link-${nodes.length}`} href={href} className={cls}>
            {label}
          </Link>
        ) : (
          <a
            key={`${keyPrefix}-link-${nodes.length}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cls}
          >
            {label}
          </a>
        ),
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // bold **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${nodes.length}`} className="font-bold">
          {boldMatch[1]}
        </strong>,
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // italic *text*
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      nodes.push(
        <em key={`${keyPrefix}-i-${nodes.length}`}>{italicMatch[1]}</em>,
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // plain character
    nodes.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return nodes;
}

export default function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let inList: ReactNode[] | null = null;
  let listKey = 0;

  const flushList = (key: string) => {
    if (inList) {
      blocks.push(
        <ul key={key} className="mt-1 space-y-0.5 pl-4">
          {inList}
        </ul>,
      );
      inList = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed === "") {
      flushList(`list-${index}`);
      return;
    }

    const header = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (header) {
      flushList(`list-${index}`);
      const level = header[1].length;
      const content = renderInline(header[2], `h${index}`);
      blocks.push(
        <p
          key={`h${index}`}
          className={`mt-1 font-bold ${level >= 2 ? "text-sm" : "text-base"}`}
        >
          {content}
        </p>,
      );
      return;
    }

    const listItem = trimmed.match(/^([-*]|\d+[.)])\s+(.+)$/);
    if (listItem) {
      if (!inList) inList = [];
      inList.push(
        <li key={`li-${listKey++}`} className="leading-relaxed">
          {renderInline(listItem[2], `li${index}`)}
        </li>,
      );
      return;
    }

    flushList(`list-${index}`);
    blocks.push(
      <p key={`p${index}`} className="leading-relaxed">
        {renderInline(trimmed, `p${index}`)}
      </p>,
    );
  });

  flushList(`list-end`);

  return <div className="space-y-1">{blocks}</div>;
}