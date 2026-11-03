#!/bin/bash
# One-time connection helper. No sudo, package installation, or extra service.
set -eu
printf '\nOSTEON - LOCAL AI CONNECTION\n'
printf 'Install Ollama from https://ollama.com/download/mac first.\n'
printf 'This adds the Osteon GitHub Pages origin for this login session.\n'
printf 'It preserves existing origins and keeps Ollama on this computer.\n'
printf 'Ollama must restart; finish other Ollama conversations first.\n'
read -r -p 'Type SETUP to continue, or press Return to cancel: ' study_reply
[ "$study_reply" = 'SETUP' ] || exit 0
if [ ! -d /Applications/Ollama.app ] && [ ! -d "$HOME/Applications/Ollama.app" ]; then
  printf 'Ollama was not found in Applications. Install it, then run this again.\n'
  exit 1
fi
study_origins="$(launchctl getenv OLLAMA_ORIGINS || true)"
study_old_host="$(launchctl getenv OLLAMA_HOST || true)"
study_backup="$HOME/Library/Application Support/Osteon/setup"
mkdir -p "$study_backup"
# A plain text backup is never executed as shell code.
printf '%s\n' "$study_origins" > "$study_backup/origins-before-$(date +%Y%m%d-%H%M%S).txt"
printf '%s\n' "$study_old_host" > "$study_backup/host-before-$(date +%Y%m%d-%H%M%S).txt"
case ",$study_origins," in
  *,https://rorrimaesu.github.io,*) ;;
  *) study_origins="${study_origins:+$study_origins,}https://rorrimaesu.github.io" ;;
esac
launchctl setenv OLLAMA_ORIGINS "$study_origins"
launchctl setenv OLLAMA_HOST '127.0.0.1:11434'
# Ask the application to quit normally. Do not force-kill unrelated processes.
osascript -e 'tell application "Ollama" to quit' || true
sleep 2
open -a Ollama
printf 'Ollama was asked to reopen. Check the connection in Osteon.\n'
printf 'These permissions last for this login session. Rerun after logout if needed.\n'
printf 'Backups are in Library/Application Support/Osteon/setup.\n'
open 'https://rorrimaesu.github.io/osteon-study/?ai-setup=mac#atlas'
read -r -p 'Press Return to close.'
