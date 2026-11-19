<?php

declare(strict_types=1);

function activePlayerFile(string $vatNumber): string
{
    // VAT numbers come from players.jsonl, but never trust them as a path
    $safe = preg_replace('/[^A-Za-z0-9_-]/', '_', $vatNumber);
    return ACTIVE_PLAYERS_DIR . "/$safe.json";
}

/**
 * Find a player by VAT number.
 * Returns the saved active player if they already have a record,
 * otherwise a fresh record built from players.jsonl, or null if not authorized.
 */
function findPlayerByVatNumber(string $vatNumber): ?array
{
    foreach (readJsonl(PLAYERS_JSONL_FILE) as $player) {
        if ((string) ($player['piva'] ?? '') !== $vatNumber) {
            continue;
        }

        $file = activePlayerFile($vatNumber);
        if (is_file($file)) {
            $active = json_decode((string) file_get_contents($file), true);
            if (is_array($active)) {
                return $active;
            }
            error_log("Error reading player file ($file)");
        }

        return [
            'vatNumber' => (string) $player['piva'],
            'name' => trim((string) ($player['partner'] ?? '')),
            'email' => $player['email'] ?? null,
            'hasPlayed' => false,
            'prize' => null,
            'playedAt' => null,
        ];
    }

    return null;
}

function savePlayer(array $player): array
{
    if (!is_dir(ACTIVE_PLAYERS_DIR) && !mkdir(ACTIVE_PLAYERS_DIR, 0775, true)) {
        throw new RuntimeException('Unable to create active players directory');
    }

    writeFileAtomic(
        activePlayerFile($player['vatNumber']),
        json_encode($player, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );

    return $player;
}
