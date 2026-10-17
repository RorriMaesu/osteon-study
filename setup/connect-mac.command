#!/bin/bash
# Permit only the Osteon origin and keep Ollama on loopback. No sudo needed.
study_origins="$(launchctl getenv OLLAMA_ORIGINS)"
case ",$study_origins," in
  *,https://rorrimaesu.github.io,*) ;;
  *) study_origins="${study_origins:+$study_origins,}https://rorrimaesu.github.io" ;;
esac
launchctl setenv OLLAMA_ORIGINS "$study_origins"
launchctl setenv OLLAMA_HOST '127.0.0.1:11434'
echo 'Quit Ollama using its menu, then reopen it. Return to Osteon and click Connect.'
echo 'These settings apply to this login session. To undo: launchctl unsetenv OLLAMA_ORIGINS'
read -r -p 'Press Return to close.'
