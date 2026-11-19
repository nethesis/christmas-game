<?php

declare(strict_types=1);

function isLimitedPrize(array $prize): bool
{
    return isset($prize['max'], $prize['used'])
        && is_numeric($prize['max']) && is_numeric($prize['used']);
}

/**
 * Draw a prize from prizes.jsonl, weighted by "probability".
 * Prizes without max/used are unlimited; others are available while used < max.
 * The "used" counter is persisted immediately. Must be called inside withLock().
 */
function calculatePrize(): ?array
{
    $prizes = readJsonl(PRIZES_JSONL_FILE);

    $available = array_filter(
        $prizes,
        fn ($p) => (!array_key_exists('max', $p) && !array_key_exists('used', $p))
            || (isLimitedPrize($p) && $p['used'] < $p['max'])
    );

    $total = array_sum(array_map(fn ($p) => (float) ($p['probability'] ?? 0), $available));
    if ($total <= 0) {
        return null;
    }

    $random = random_int(0, PHP_INT_MAX) / PHP_INT_MAX * $total;
    $cumulative = 0.0;

    foreach ($available as $index => $prize) {
        $cumulative += (float) ($prize['probability'] ?? 0);
        if ($random <= $cumulative) {
            if (isLimitedPrize($prize)) {
                $prizes[$index]['used'] = $prize['used'] + 1;
                writeJsonl(PRIZES_JSONL_FILE, $prizes);
            }
            return $prize;
        }
    }

    return null;
}
