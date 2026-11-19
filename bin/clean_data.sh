#!/bin/bash
# Reset the game: remove active players and restore prizes.jsonl from the given file
# Usage: bin/clean_data.sh [path/to/prizes.jsonl]   (default: ./prizes.jsonl)
set -e
cd "$(dirname "$0")/.."

SRC="${1:-prizes.jsonl}"
if [ ! -f "$SRC" ]; then
    echo "⚠️  Error: $SRC not found."
    exit 1
fi

echo "🧹 Removing active players data"
find data/active_players -name '*.json' -delete

echo "🎁 Restoring data/prizes.jsonl from $SRC"
cp "$SRC" data/prizes.jsonl
