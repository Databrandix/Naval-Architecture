import sanitize from 'sanitize-html';

// Phase 19 CP19.5 — HTML sanitization for admin-authored content
// rendered via dangerouslySetInnerHTML on public pages.
//
// Phase 19 CP19.6.HOTFIX2 — switched from isomorphic-dompurify
// (jsdom-based) to sanitize-html (pure JS, htmlparser2-based).
// Same allowlist, same call-site signatures, no jsdom transitive
// chain — resolves a CJS/ESM interop crash on Vercel's serverless
// Node runtime for dynamically rendered routes.
//
// Allowlist follows the observed admin-authoring pattern across
// 11+ phases: prose with inline formatting, links, and lists.
// Inline images and tables are intentionally excluded — admins
// use ImageUploader (separate URL column on the entity) and have
// never been observed using tables in body content.
//
// Examples (illustrative, not exploit):
//   Input:  "<p>Visit our <a href='https://su.edu.bd'>site</a></p>"
//   Output: same (allowed tags + scheme preserved)
//
//   Input:  "<h1>Big heading</h1><p>Body</p>"
//   Output: "Big heading<p>Body</p>"  — h1 stripped, text kept
//                                        (sanitize-html default:
//                                        non-`nonTextTags` tags
//                                        unwrap their content)
//
//   Input:  "<p style='color:red' onclick='x()'>Hello</p>"
//   Output: "<p>Hello</p>"  — unlisted attrs removed
//
//   Input:  "<a target='_blank' href='https://x'>x</a>"
//   Output: "<a target=\"_blank\" href=\"https://x\"
//                rel=\"noopener noreferrer\">x</a>"
//                — rel auto-stamped via transformTags below
//
//   Input:  "<script>x()</script>after"
//   Output: "after"  — script is in default nonTextTags so its
//                       CONTENT is also removed
//
//   Input:  "<a href='javascript:alert(1)'>x</a>"
//   Output: "<a>x</a>"  — href stripped (scheme not in allowedSchemes)

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'a',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'span',
  'code',
];

// Per Decision B from CP19.5.1: href + safe scheme/relative,
// title for accessibility, target + rel for new-tab links.
// Other tags get no attributes (sanitize-html drops anything
// not explicitly allowed).
const ALLOWED_ATTRIBUTES: sanitize.IOptions['allowedAttributes'] = {
  a: ['href', 'title', 'target', 'rel'],
};

const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

// sanitize-html allows relative URLs by default (no scheme).
// Hash-only fragments (#section) also pass through.
// allowProtocolRelative: false closes the `//evil.com/x` vector.
const OPTIONS: sanitize.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedSchemes: ALLOWED_SCHEMES,
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  // Disallowed tags have their wrapping tag removed but their
  // CONTENT preserved as text, EXCEPT for the tags in
  // `nonTextTags` whose content is also dropped. The default
  // `nonTextTags` list (script, style, textarea, option,
  // noscript) is what we want — it kills the actual XSS sinks
  // while letting prose content from accidentally-disallowed
  // tags (e.g., `<h1>`) flow through as plain text.
  disallowedTagsMode: 'discard',
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        return {
          tagName: 'a',
          attribs: { ...attribs, rel: 'noopener noreferrer' },
        };
      }
      return { tagName, attribs };
    },
  },
};

// Sanitize a string of HTML against the project allowlist.
// Returns a clean string suitable for dangerouslySetInnerHTML.
// `null` / `undefined` / non-string input returns "" — admin
// server actions can pass optional fields without a separate
// null check.
export function sanitizeHtml(input: string | null | undefined): string {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return '';
  if (input.length === 0) return '';
  return sanitize(input, OPTIONS);
}

// Convenience for the many `string[]` paragraph fields.
export function sanitizeHtmlArray(
  input: readonly (string | null | undefined)[] | null | undefined,
): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((p) => sanitizeHtml(p));
}
