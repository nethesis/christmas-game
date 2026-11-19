<?php

declare(strict_types=1);

define('APP_ROOT', dirname(__DIR__));
define('DATA_DIR', APP_ROOT . '/data');
define('PLAYERS_JSONL_FILE', DATA_DIR . '/players.jsonl');
define('PRIZES_JSONL_FILE', DATA_DIR . '/prizes.jsonl');
define('ACTIVE_PLAYERS_DIR', DATA_DIR . '/active_players');
define('LOCK_FILE', DATA_DIR . '/game.lock');

require APP_ROOT . '/vendor/autoload.php';
require __DIR__ . '/storage.php';
require __DIR__ . '/players.php';
require __DIR__ . '/prizes.php';
require __DIR__ . '/email.php';

/**
 * Load KEY=VALUE pairs from .env into the environment.
 * Variables already set (e.g. via Apache SetEnv) take precedence.
 */
function loadEnv(string $file): void
{
    if (!is_file($file)) {
        return;
    }

    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = array_map('trim', explode('=', $line, 2));
        if (preg_match('/^(["\'])(.*)\1$/', $value, $m)) {
            $value = $m[2];
        }

        if (env($key) === null) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

function env(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    return ($value === false || $value === null || $value === '') ? $default : (string) $value;
}

loadEnv(APP_ROOT . '/.env');
date_default_timezone_set(env('TZ', 'Europe/Rome'));
