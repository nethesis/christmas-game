<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

if ($origin = env('CORS_ORIGIN')) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Vary: Origin');
}

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send the response to the browser and close the connection,
 * so that slow work (e.g. emails) can continue after it.
 */
function respondAndContinue(int $status, array $body): void
{
    ignore_user_abort(true);
    set_time_limit(120);

    $json = json_encode($body, JSON_UNESCAPED_UNICODE);
    http_response_code($status);

    if (function_exists('fastcgi_finish_request')) {
        // PHP-FPM
        echo $json;
        fastcgi_finish_request();
        return;
    }

    // mod_php: no compression (it would buffer the output until the script ends),
    // explicit length and connection close so the browser doesn't wait
    if (function_exists('apache_setenv')) {
        apache_setenv('no-gzip', '1');
    }
    ini_set('zlib.output_compression', '0');
    header('Content-Encoding: none');
    header('Content-Length: ' . strlen($json));
    header('Connection: close');

    echo $json;
    while (ob_get_level() > 0) {
        ob_end_flush();
    }
    flush();
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($method !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

$input = json_decode((string) file_get_contents('php://input'), true);
$input = is_array($input) ? $input : [];
$str = fn (string $key) => is_scalar($input[$key] ?? null) ? trim((string) $input[$key]) : '';

$action = $_GET['action'] ?? '';
error_log("POST /api/$action");

try {
    switch ($action) {
        case 'validate-vat':
            $vatNumber = $str('vatNumber');
            if ($vatNumber === '') {
                respond(400, ['error' => 'VAT Number is required']);
            }

            $player = findPlayerByVatNumber($vatNumber);
            if (!$player) {
                respond(404, ['error' => 'VAT Number not authorized to play']);
            }
            if ($player['hasPlayed']) {
                respond(403, ['error' => 'You have already played with this VAT Number']);
            }

            respond(200, ['playerName' => $player['name']]);

        case 'record-prize':
            $vatNumber = $str('vatNumber');
            $playerName = $str('playerName');
            $playerEmail = $str('playerEmail');

            if ($vatNumber === '' || $playerName === '' || $playerEmail === '') {
                respond(400, ['error' => 'Incomplete input data']);
            }
            if (!filter_var($playerEmail, FILTER_VALIDATE_EMAIL)) {
                respond(400, ['error' => 'Invalid email']);
            }

            // Check, draw and save atomically: no double plays, no prize over max
            $result = withLock(function () use ($vatNumber, $playerName, $playerEmail) {
                $player = findPlayerByVatNumber($vatNumber);
                if (!$player || $player['name'] !== $playerName) {
                    return [404, 'Invalid input data'];
                }
                if ($player['hasPlayed']) {
                    return [403, 'You have already played'];
                }

                $prize = calculatePrize();
                if (!$prize) {
                    error_log('No prize available');
                    return [500, 'Internal server error'];
                }

                $player['hasPlayed'] = true;
                $player['prize'] = $prize['name'];
                $player['playedAt'] = (new DateTimeImmutable('now', new DateTimeZone('UTC')))
                    ->format('Y-m-d\TH:i:s.v\Z');
                $player['email'] = $playerEmail;

                return [200, savePlayer($player)];
            });

            [$status, $player] = $result;
            if ($status !== 200) {
                respond($status, ['error' => $player]);
            }

            // The game is recorded: answer now, send the emails afterwards
            respondAndContinue(200, ['prize' => $player['prize']]);

            try {
                sendWinnerEmail($player['email'], $playerName, $player['prize']);
            } catch (Throwable $e) {
                error_log("Error sending winner email ($vatNumber): " . $e->getMessage());
            }
            try {
                sendCommercialEmail($vatNumber, $playerName, $player['prize'], $playerEmail);
            } catch (Throwable $e) {
                error_log("Error sending commercial email ($vatNumber): " . $e->getMessage());
            }
            exit;

        default:
            respond(404, ['error' => 'Not found']);
    }
} catch (Throwable $e) {
    error_log("Error handling $action: " . $e->getMessage());
    respond(500, ['error' => 'Internal server error']);
}
