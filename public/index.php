<?php
// Serve the page uncached and add the file modification time to CSS/JS URLs,
// so browsers always load the latest version after an update.
header('Cache-Control: no-cache');

function asset(string $path): string
{
    $mtime = @filemtime(__DIR__ . '/' . $path);
    return htmlspecialchars($mtime ? "$path?v=$mtime" : $path);
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scarta il Regalo</title>
    <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="icon" href="images/favicon.ico" type="image/x-icon">
</head>
<body>
    <div class="container">
        <div class="top-banner">
            <img src="images/nethesis.svg" alt="Nethesis Logo" class="logo">
        </div>

        <section id="login-section" class="active-section">
            <div class="login-box">
                <div class="title">
                    <h1 id="login-title">Scarta il Regalo</h1>
                </div>

                <form id="login-form" class="form-container" method="post" novalidate>
                    <div class="form-group">
                        <label for="vat-number">Partita IVA:</label>
                        <input type="text" id="vat-number" name="vatNumber" placeholder="Inserisci la tua Partita IVA" required autofocus aria-describedby="login-title"
                               autocorrect="off" autocapitalize="none" spellcheck="false">
                    </div>
                    <div class="form-group">
                        <label for="player-email">La tua Email:</label>
                        <input type="email" id="player-email" name="playerEmail" placeholder="La tua email" required
                               autocomplete="email" autocorrect="off" autocapitalize="none" spellcheck="false">
                    </div>
                    <button type="submit" id="validate-btn" class="btn">Verifica e Gioca</button>
                    <div id="error-message" class="error-message" aria-live="polite"></div>
                    <div id="login-info" class="info-message" aria-live="polite"></div>
                </form>
            </div>
        </section>

        <section id="game-section" class="hidden-section">
            <div class="game-box">
                <h2>Benvenuto, <span id="player-name">Giocatore</span>!</h2>
                <p>Clicca su un pacco sotto l'albero per scoprire il tuo regalo</p>
                <div class="scene" id="scene">
                    <img src="images/tree.svg" alt="Albero di Natale con i pacchi regalo" class="scene-img">
                    <img src="images/tree-opened.svg" alt="Pacco regalo aperto. Auguri da Nethesis!" class="scene-img scene-opened">
                    <!-- Clickable gift areas are inserted here by game.js -->
                </div>
                <div id="game-error" class="error-message" aria-live="polite"></div>
            </div>
        </section>

        <section id="result-section" class="hidden-section">
            <div class="result-container">
                <h2>Ecco il tuo regalo!</h2>
                <div class="prize-card">
                    <img src="images/prize-card.svg" alt="" class="prize-card-img">
                    <div class="prize-card-text">
                        <span class="prize-label">Hai vinto</span>
                        <span id="prize-name" class="prize-name">Un regalo</span>
                    </div>
                </div>
                <p>Abbiamo inviato i dettagli alla tua email. Il nostro team ti contatterà presto!</p>
                <div class="thank-you">
                    <p>Grazie per aver partecipato al nostro gioco di Natale! Buone Feste!</p>
                </div>
            </div>
        </section>
    </div>

    <div id="snow-container"></div>

    <script src="<?= asset('js/snow.js') ?>"></script>
    <script src="<?= asset('js/game.js') ?>"></script>
</body>
</html>
