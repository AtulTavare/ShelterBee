#!/usr/bin/env bash
set -euo pipefail

# MCP setup for Supabase using OpenCode MCP client
# Writes config to the user's MCP config directory and guides authentication.

CONFIG_DIR="$HOME/.config/opencode"
CONFIG_FILE="$CONFIG_DIR/opencode.json"

mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_FILE" <<'JSON'
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?project_ref=cnjjqgejthcceknqqrxv",
      "enabled": true
    }
  }
}
JSON

echo "Wrote MCP config to $CONFIG_FILE"
echo "Run: opencode mcp auth supabase to authenticate"
