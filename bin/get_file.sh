#!/bin/bash
# Show the saved record of a player
# Usage: bin/get_file.sh [VAT]   (no argument: choose from the list)
cd "$(dirname "$0")/../data/active_players" || exit 1

if ! command -v jq &> /dev/null; then
    echo "⚠️  Error: 'jq' is not installed."
    exit 1
fi

if [ -n "$1" ]; then
    # Same normalization as the game: uppercase, no spaces, dots and dashes,
    # no "IT" prefix before an 11-digit Italian VAT number
    FILE="$(printf '%s' "$1" | tr -d ' .-' | tr '[:lower:]' '[:upper:]' | sed -E 's/^IT([0-9]{11})$/\1/').json"
else
    mapfile -t FILES < <(ls -1 *.json 2>/dev/null)
    if [ ${#FILES[@]} -eq 0 ]; then
        echo "❌ No players have played yet."
        exit 1
    fi
    select FILE in "${FILES[@]}"; do [ -n "$FILE" ] && break; done
fi

if [ -f "$FILE" ]; then
    echo "📄 Content of: ${FILE%.json}"
    jq . "$FILE"
else
    echo "❌ VAT number '${FILE%.json}' not found."
fi
