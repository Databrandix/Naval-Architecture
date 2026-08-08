// Renders the Dean's-message / Head's-message paragraph column.
// Each paragraph is super-admin-authored HTML stored in
// Faculty.messageParagraphs (decision J1) — `<strong class="text-button-yellow">…</strong>`
// inline emphasis is preserved. The first paragraph gets an
// automatic drop-cap on its opening letter (decision J2) so the
// DB never has to encode that presentational artifact.
//
// Phase 19 CP19.5 — read-side sanitization on every dangerouslySetInnerHTML
// path. Write-side admin actions also sanitize; read-side here catches
// legacy content + survives any future write-side regression.

import { sanitizeHtml } from '@/lib/sanitize-html';

type Props = {
  paragraphs: readonly string[];
};

export default function MessageParagraphs({ paragraphs }: Props) {
  if (paragraphs.length === 0) {
    return (
      <p className="text-white/60 italic">
        Message content will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-5 text-[15px] md:text-[16px] leading-[1.85] text-white/90 text-justify">
      {paragraphs.map((p, i) =>
        i === 0 ? (
          <DropCapParagraph key={i} html={p} />
        ) : (
          <p key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(p) }} />
        ),
      )}
    </div>
  );
}

// First paragraph: extract the leading plain letter and wrap it in
// the drop-cap span, then render the remainder as HTML. If the
// paragraph starts with a tag (e.g. `<strong>…`) the drop-cap is
// skipped — the visual effect only applies to clean text openings,
// matching the original hand-coded JSX.
function DropCapParagraph({ html }: { html: string }) {
  // Sanitize once at the top — both branches consume the cleaned
  // string. `rest` is a substring of the sanitized input so it
  // can't reintroduce disallowed content.
  const clean = sanitizeHtml(html);
  const trimmed = clean.trimStart();
  const match = /^([A-Za-z])([\s\S]*)$/.exec(trimmed);
  if (!match) {
    return <p dangerouslySetInnerHTML={{ __html: clean }} />;
  }
  const [, firstChar, rest] = match;
  return (
    <p>
      <span className="float-left mr-2 text-5xl md:text-6xl font-display font-bold leading-none text-button-yellow">
        {firstChar}
      </span>
      <span dangerouslySetInnerHTML={{ __html: rest }} />
    </p>
  );
}
