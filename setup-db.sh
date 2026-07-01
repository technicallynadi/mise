#!/bin/bash
#
# Mise — database setup helper.
# Checks your local credentials, then prints the steps to create the schema
# (and optional sample data) in the Supabase SQL Editor.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🍳 Mise — database setup${NC}"
echo ""

# 1. Require local environment variables.
if [ ! -f .env.local ]; then
  echo -e "${RED}❌ .env.local not found.${NC}"
  echo "   Copy the example and fill in your keys:  cp .env.example .env.local"
  exit 1
fi

# shellcheck disable=SC1091
source .env.local

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo -e "${RED}❌ Missing Supabase credentials in .env.local.${NC}"
  echo "   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then re-run."
  exit 1
fi

if [ ! -f database/schema.sql ]; then
  echo -e "${RED}❌ database/schema.sql not found — run this from the project root.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Credentials found${NC} (project: ${SUPABASE_URL})"
echo ""

# 2. Print the manual steps (Supabase has no CLI DDL endpoint we can rely on).
echo -e "${YELLOW}Steps:${NC}"
echo "  1. Open the Supabase SQL Editor:  ${SUPABASE_URL}/project/_/sql"
echo "  2. Paste the contents of database/schema.sql and click Run."
echo "  3. (Optional) Paste database/safe-seed-data.sql for sample recipes."
echo "  4. Start the app:  npm run dev"
echo ""

# 3. Offer to print the SQL so it can be copied straight from the terminal.
read -r -p "Print the schema SQL now? (y/N) " reply
if [[ "${reply:-}" =~ ^[Yy]$ ]]; then
  echo ""
  echo -e "${GREEN}--- database/schema.sql ---${NC}"
  cat database/schema.sql
  echo ""
fi

if [ -f database/safe-seed-data.sql ]; then
  read -r -p "Print the sample-data SQL too? (y/N) " reply
  if [[ "${reply:-}" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}--- database/safe-seed-data.sql ---${NC}"
    cat database/safe-seed-data.sql
    echo ""
  fi
fi

echo -e "${GREEN}✨ Done. Once the SQL has run, start Mise with:  npm run dev${NC}"
