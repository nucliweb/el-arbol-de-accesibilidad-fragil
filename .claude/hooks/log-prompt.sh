#!/usr/bin/env bash
# Appends every user prompt to docs/process-log.jsonl as a "request" entry.
# Must never block the prompt or print to stdout (stdout is added to Claude's context).

log_file="${CLAUDE_PROJECT_DIR:-.}/docs/process-log.jsonl"
input="$(cat)"

command -v jq > /dev/null 2>&1 || exit 0

# macOS date has no %:z, so convert +0100 to +01:00.
ts="$(date +%Y-%m-%dT%H:%M:%S%z | sed -E 's/([0-9]{2})([0-9]{2})$/\1:\2/')"

entry="$(printf '%s' "$input" | jq -c --arg ts "$ts" '{
  ts: $ts,
  type: "request",
  by: "user",
  source: "hook",
  summary: .prompt,
  refs: ["session:" + .session_id]
}' 2> /dev/null)" || exit 0

[ -n "$entry" ] && printf '%s\n' "$entry" >> "$log_file"
exit 0
