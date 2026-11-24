# El árbol de accesibilidad frágil

Slides for the A11y Conf 2026 talk "El árbol de accesibilidad frágil: por qué el HTML semántico es clave para el rendimiento web". The slide content is in Spanish; code, comments and identifiers are in English.

## Accessibility is MANDATORY

The audience includes blind people and deaf people. An inaccessible slide is a bug that blocks release, never a polish item. A talk that defends semantic HTML must itself be an example of it.

Every change to the presentation must meet these requirements:

- **WCAG 2.2 AA as the minimum**, verified on every slide, not only on the template.
- **Semantic HTML first**: real headings, lists, `<figure>`/`<figcaption>`, `<table>`, `<pre><code>`. Use ARIA only when no native element exists.
- **Full keyboard operation**: advancing, going back, jumping to a slide and opening the notes all work without a mouse, with a visible focus indicator.
- **Screen reader support**: every slide change is announced (slide number, total and title), and the reading order matches the visual order.
- **No information carried only by visuals**: every image, diagram, chart and DOM/accessibility tree illustration has a text alternative that conveys the same information. Code is always real text, never an image.
- **No information carried only by audio**: anything said aloud that matters to follow the talk is in the presenter notes. Videos have captions.
- **Presenter notes toggled with a keyboard shortcut**: anyone in the audience can open the notes of the current slide to follow the talk by reading them, or with their screen reader. The notes are part of the accessible content, not a private speaker aid, so they are written as full sentences an attendee can follow.
- **Shortcuts are documented and safe**: every shortcut is listed in an always-reachable help panel, and single-character shortcuts can be turned off or remapped so they do not clash with screen reader keys (WCAG 2.1.4).
- **Readable by default**: AA contrast in every theme, no information conveyed by color alone, text that reflows when zoomed to 200%, and `prefers-reduced-motion` respected for every transition and animation.

Before treating any slide work as done, check it with the keyboard only, with a screen reader (VoiceOver at least), and with an automated audit (axe or Lighthouse). Record the result in the process log.

## Process log

Every step of the process and every decision is recorded in `docs/process-log.jsonl` so the project can be analyzed at any time. Append to it; never rewrite or delete past entries. If a decision is reversed, add a new entry that references the old one.

A `UserPromptSubmit` hook (`.claude/hooks/log-prompt.sh`) appends every user prompt verbatim as a `request` entry with `"source": "hook"`. Do not duplicate those entries by hand; add an entry for every decision (including discarded alternatives), requirement, action (commit, push, deploy), and verification result (accessibility checks, audits, tests).

One JSON object per line, with these fields:

| Field | Required | Description |
| --- | --- | --- |
| `ts` | yes | ISO 8601 timestamp with offset, e.g. `2026-11-23T16:34:35+01:00`. |
| `type` | yes | `request`, `finding`, `decision`, `requirement`, `action` or `verification`. A `finding` is a fact learned from analysis or research that later decisions build on. |
| `by` | yes | `user` or `claude`. |
| `summary` | yes | One sentence describing what happened. |
| `rationale` | no | Why, including the alternatives that were discarded. |
| `refs` | no | Array of related commits, files, URLs, earlier entry timestamps or `session:<id>`. |
| `source` | no | `hook` for entries written automatically; omitted for entries written by hand. |

Keep the file valid JSONL: check every line with `jq -c . docs/process-log.jsonl > /dev/null` after appending.

The log is local only: it is git-ignored because it holds the user's literal prompts and the repository is public. Never stage or commit it. Before each commit, still append the entries for the work being committed, including the commit itself.
