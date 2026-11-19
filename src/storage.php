<?php

declare(strict_types=1);

/**
 * Read a JSONL file into an array of associative arrays.
 * Malformed lines are logged and skipped.
 */
function readJsonl(string $file): array
{
    if (!is_file($file)) {
        error_log("JSONL file not found: $file");
        return [];
    }

    $rows = [];
    foreach (file($file, FILE_IGNORE_NEW_LINES) as $i => $line) {
        if (trim($line) === '') {
            continue;
        }
        $row = json_decode($line, true);
        if (!is_array($row)) {
            error_log(sprintf('Error parsing %s line %d', basename($file), $i + 1));
            continue;
        }
        $rows[] = $row;
    }

    return $rows;
}

/** Atomically write data to a file (write to temp file, then rename). */
function writeFileAtomic(string $file, string $content): void
{
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, $content) === false || !rename($tmp, $file)) {
        @unlink($tmp);
        throw new RuntimeException("Unable to write $file");
    }
}

function writeJsonl(string $file, array $rows): void
{
    $lines = array_map(fn ($r) => json_encode($r, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $rows);
    writeFileAtomic($file, implode("\n", $lines));
}

/**
 * Run $callback while holding an exclusive lock, so that concurrent
 * requests cannot play twice with the same VAT or exceed prize limits.
 */
function withLock(callable $callback): mixed
{
    $fp = fopen(LOCK_FILE, 'c');
    if ($fp === false || !flock($fp, LOCK_EX)) {
        throw new RuntimeException('Unable to acquire game lock');
    }

    try {
        return $callback();
    } finally {
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}
