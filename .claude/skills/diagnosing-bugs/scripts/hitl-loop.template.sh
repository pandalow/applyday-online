#!/usr/bin/env bash
# Human-in-the-loop reproduction loop.
# Copy this file, edit the steps below, and run it.
# The agent runs the script; the user follows prompts in their terminal.
#
# Usage:
#   bash hitl-loop.template.sh
#
# Two helpers:
#   step "<instruction>"          → show instruction, wait for Enter
#   capture VAR "<question>"      → show question, read response into VAR
#
# At the end, captured values are printed as KEY=VALUE for the agent to parse.
#
# `capture` prints its value back to the terminal, where the agent reads it,
# so capture only sanitized statuses and identifiers, never raw messages or PII.
# Leave signing in to the user as a `step`.
#
# ERROR_STATUS accepts a fixed vocabulary, optionally followed by a validated
# opaque identifier (`status` or `status:id`). Invalid input is replaced with
# the fixed marker REDACTED; never echo arbitrary pasted text.
# ERRORED accepts only `y` or `n`. Every capture disables terminal echo before
# reading, and shell tracing stays disabled while raw values exist, so even
# invalid pasted text stays out of the transcript.

set +x
set -euo pipefail

sanitize_error_status() {
  local raw="$1"
  if [[ "$raw" =~ ^(none|error|timeout|failed|thrown|ok|unknown)(:[A-Za-z0-9._-]{1,64})?$ ]]; then
    printf '%s' "$raw"
    return
  fi
  printf 'REDACTED'
}

sanitize_yes_no() {
  case "$1" in
    y|n) printf '%s' "$1" ;;
    *) printf 'REDACTED' ;;
  esac
}

step() {
  printf '\n>>> %s\n' "$1"
  read -r -p "    [Enter when done] " _
}

capture() {
  local var="$1" question="$2" answer
  printf '\n>>> %s\n' "$question"
  read -r -s -p "    > " answer
  printf '\n'
  printf -v "$var" '%s' "$answer"
}

# --- edit below ---------------------------------------------------------

step "Open the app at http://localhost:3000 and sign in."

capture ERRORED "Click the 'Export' button. Did it throw an error? (y/n)"

capture ERROR_STATUS "Enter a status from {none,error,timeout,failed,thrown,ok,unknown}, optionally :opaque-id (A-Za-z0-9._-):"

# --- edit above ---------------------------------------------------------

SANITIZED_ERRORED="$(sanitize_yes_no "${ERRORED:-}")"
SANITIZED_ERROR_STATUS="$(sanitize_error_status "${ERROR_STATUS:-}")"
unset ERRORED ERROR_STATUS

printf '\n--- Captured ---\n'
printf 'ERRORED=%s\n' "$SANITIZED_ERRORED"
printf 'ERROR_STATUS=%s\n' "$SANITIZED_ERROR_STATUS"
