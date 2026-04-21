#!/usr/bin/env bash
# check-release-verification.sh
# Called by .githooks/pre-push when pushing a vX.Y.Z tag.
# Fails if .release-verification/<tag>.md is missing or incomplete.

set -euo pipefail

TAG="$1"
VERIFY_FILE=".release-verification/${TAG}.md"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}[release-gate] Checking verification artifact for ${TAG}...${NC}"

if [ ! -f "$VERIFY_FILE" ]; then
  echo -e "${RED}[release-gate] BLOCKED: ${VERIFY_FILE} does not exist.${NC}"
  echo ""
  echo "  A release cannot be pushed without a verification artifact."
  echo "  Before pushing this tag:"
  echo "    1. Run the verification subagent (see docs/agents/verification-subagent-prompt.md)"
  echo "    2. Commit the output to ${VERIFY_FILE}"
  echo "    3. Re-push the tag"
  echo ""
  echo "  See RELEASE_PROCESS.md § 3.9 for the full checklist."
  echo ""
  exit 1
fi

# Count screenshot references (markdown images or file paths ending in .png/.jpg/.webp)
SCREENSHOT_COUNT=$(grep -cE '\.(png|jpg|jpeg|webp)' "$VERIFY_FILE" 2>/dev/null || echo 0)
MINIMUM_SCREENSHOTS=24

if [ "$SCREENSHOT_COUNT" -lt "$MINIMUM_SCREENSHOTS" ]; then
  echo -e "${RED}[release-gate] BLOCKED: ${VERIFY_FILE} only references ${SCREENSHOT_COUNT} screenshots (need ${MINIMUM_SCREENSHOTS}).${NC}"
  echo ""
  echo "  Minimum: 6 routes × 4 theme/lang combos (light-LTR, light-RTL, dark-LTR, dark-RTL)"
  echo "  See RELEASE_PROCESS.md § 3.9 for the required routes."
  echo ""
  exit 1
fi

# Check for console-clean confirmation
if ! grep -qi "console.*zero\|zero.*error\|no.*error\|clean.*console\|console.*clean" "$VERIFY_FILE" 2>/dev/null; then
  echo -e "${YELLOW}[release-gate] WARNING: ${VERIFY_FILE} does not confirm zero console errors.${NC}"
  echo "  Add a line like: 'console: zero errors on all routes' to the verification file."
  echo "  Proceeding — but please confirm this manually."
  echo ""
fi

echo -e "${GREEN}[release-gate] Verification artifact OK (${SCREENSHOT_COUNT} screenshots found). Allowing push.${NC}"
echo ""
exit 0
