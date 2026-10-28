#!/usr/bin/env bash
# Configura no Netlify as variáveis do login do painel (ADMIN_USERS e SESSION_SECRET).
# Uso: bash scripts/netlify-panel-env.sh usuario1 usuario2 ...  (pede a senha de cada um)
set -euo pipefail

SITE_ID="71b61ccc-c674-4fc9-bfcf-573d663d2424"
CONTEXTS=(production deploy-preview branch-deploy)

if [ "$#" -eq 0 ]; then
  echo "Uso: bash scripts/netlify-panel-env.sh usuario1 [usuario2 ...]" >&2
  exit 1
fi

entries=()
for username in "$@"; do
  echo "Senha de ${username}:"
  entries+=("$(node scripts/hash-password.mjs "$username" | tail -1)")
done

admin_users=$(IFS=,; echo "${entries[*]}")
session_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

NETLIFY_SITE_ID="$SITE_ID" netlify env:set ADMIN_USERS "$admin_users" --secret --context "${CONTEXTS[@]}"
NETLIFY_SITE_ID="$SITE_ID" netlify env:set SESSION_SECRET "$session_secret" --secret --context "${CONTEXTS[@]}"
echo "Pronto. Faça um novo deploy (ou o merge na main) para as variáveis valerem."
