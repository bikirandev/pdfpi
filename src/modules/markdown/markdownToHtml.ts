import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/**
 * Allowed HTML tags and attributes after markdown → HTML conversion.
 *
 * Scripts, event handlers, and other dangerous constructs are stripped by
 * sanitize-html.  `data:` and `javascript:` URIs are rejected for `href`
 * and `src` attributes.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // Document structure
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr", "div", "span",
    // Text formatting
    "strong", "b", "em", "i", "u", "s", "del", "ins", "mark",
    "small", "sub", "sup", "abbr",
    // Lists
    "ul", "ol", "li",
    // Links and media
    "a", "img",
    // Code
    "code", "pre", "kbd", "samp",
    // Tables
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    // Quotes
    "blockquote", "cite",
    // Details/summary
    "details", "summary",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    td: ["align", "colspan", "rowspan"],
    th: ["align", "colspan", "rowspan", "scope"],
    code: ["class"],       // for syntax-highlight class names
    pre: ["class"],
    span: ["class"],
    div: ["class"],
    h1: ["id"], h2: ["id"], h3: ["id"], h4: ["id"], h5: ["id"], h6: ["id"],
    details: ["open"],
  },
  // Reject javascript: and data: URIs in href / src
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],   // allow data URIs in images only
  },
  // Force external links to open in a new tab safely
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
  },
};

/**
 * Converts a Markdown string to a complete, self-contained HTML document
 * ready to be rendered by Puppeteer.
 *
 * The pipeline is:
 *   markdown  →  marked (HTML)  →  sanitize-html (safe HTML)  →  styled template
 *
 * @param markdown  Raw Markdown text supplied by the caller.
 * @param title     Document title used in the `<title>` tag.
 * @returns A complete HTML string with embedded CSS.
 */
export function markdownToHtml(markdown: string, title: string): string {
  // Parse markdown → raw HTML
  const rawHtml = marked.parse(markdown, { async: false }) as string;

  // Sanitize the HTML to strip scripts, event handlers, and unsafe URIs
  const safeHtml = sanitizeHtml(rawHtml, SANITIZE_OPTIONS);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Typography ── */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
                   sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      font-size: 16px;
      line-height: 1.65;
      color: #24292f;
      background: #ffffff;
      padding: 40px 48px;
      max-width: 860px;
      margin: 0 auto;
    }

    /* ── Headings ── */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: .5em;
      font-weight: 600;
      line-height: 1.25;
      color: #1f2328;
    }
    h1 { font-size: 2em;   border-bottom: 1px solid #d0d7de; padding-bottom: .3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: .3em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    h5 { font-size: .875em; }
    h6 { font-size: .85em; color: #57606a; }

    /* ── Paragraph & inline ── */
    p { margin-bottom: 1em; }
    strong, b { font-weight: 600; }
    em, i     { font-style: italic; }
    del, s    { text-decoration: line-through; }
    mark      { background: #fff8c5; padding: 0 2px; border-radius: 2px; }
    small     { font-size: .85em; }
    sub       { vertical-align: sub; font-size: .75em; }
    sup       { vertical-align: super; font-size: .75em; }
    abbr      { text-decoration: underline dotted; cursor: help; }

    /* ── Links ── */
    a { color: #0969da; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* ── Lists ── */
    ul, ol { margin: .5em 0 1em 1.5em; }
    li { margin-bottom: .25em; }
    li > p { margin-bottom: .25em; }

    /* ── Code ── */
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: .875em;
      background: #f6f8fa;
      border: 1px solid #d0d7de;
      border-radius: 4px;
      padding: .15em .4em;
    }
    pre {
      background: #f6f8fa;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      padding: 1em 1.25em;
      overflow-x: auto;
      margin: 1em 0;
      line-height: 1.45;
    }
    pre code {
      background: transparent;
      border: none;
      padding: 0;
      font-size: .85em;
    }

    /* ── Blockquote ── */
    blockquote {
      margin: 1em 0;
      padding: .5em 1em;
      border-left: 4px solid #d0d7de;
      color: #57606a;
    }
    blockquote p { margin-bottom: 0; }

    /* ── Horizontal rule ── */
    hr {
      border: none;
      border-top: 1px solid #d0d7de;
      margin: 1.5em 0;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      font-size: .9em;
    }
    th, td {
      border: 1px solid #d0d7de;
      padding: .5em .75em;
      text-align: left;
    }
    thead th {
      background: #f6f8fa;
      font-weight: 600;
    }
    tbody tr:nth-child(even) { background: #f6f8fa; }

    /* ── Images ── */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      display: block;
      margin: 1em 0;
    }

    /* ── Details / Summary ── */
    details { margin: 1em 0; }
    summary { cursor: pointer; font-weight: 600; }

    /* ── Print tweaks ── */
    @media print {
      body { padding: 0; }
      a[href]::after { content: " (" attr(href) ")"; font-size: .75em; color: #57606a; }
      pre, blockquote { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
${safeHtml}
</body>
</html>`;
}

/** Escapes `<`, `>`, `&`, `"`, and `'` for safe HTML attribute / text use. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
