import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

// sanitize-html uses htmlparser2 (pure JS, no DOM) — unlike dompurify+jsdom,
// this actually runs inside Cloudflare Workers/Pages' edge runtime.

/** Converts a title into a URL-safe, unique-ish slug (uniqueness enforced at the DB layer). */
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // keep letters (incl. Persian/Arabic), numbers, spaces, hyphens
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Renders Markdown to sanitized HTML — never trust raw markdown -> HTML without sanitizing. */
export function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { async: false }) as string;
  return sanitizeHtml(raw, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li", "blockquote",
      "code", "pre", "h1", "h2", "h3", "h4", "img", "video", "table", "thead",
      "tbody", "tr", "th", "td", "hr", "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
      video: ["src", "controls"],
      "*": ["class"],
    },
    // Prevent javascript:/data: URIs in links and images.
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}
