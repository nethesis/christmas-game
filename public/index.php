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
    <title>Scarta il regalo</title>
    <link rel="stylesheet" href="<?= asset('css/style.css') ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap" rel="stylesheet">
    <link rel="icon" href="images/favicon.ico" type="image/x-icon">
</head>
<body>
    <div class="container">
        <header class="top-banner">
            <img src="images/nethesis.svg" alt="Nethesis Logo" class="logo" width="1200" height="286">
        </header>

        <main class="screens">
        <section id="login-section" class="active-section">
            <div class="login-box">
                <div class="title">
                    <h1 id="login-title">Scarta il regalo</h1>
                </div>

                <form id="login-form" class="form-container" method="post" novalidate>
                    <div class="form-group">
                        <label for="vat-number">Partita IVA</label>
                        <input type="text" id="vat-number" name="vatNumber" placeholder="es. 01234567890" required autofocus aria-describedby="login-title"
                               autocorrect="off" autocapitalize="none" spellcheck="false">
                    </div>
                    <div class="form-group">
                        <label for="player-email">Email</label>
                        <input type="email" id="player-email" name="playerEmail" placeholder="es. nome@azienda.it" required
                               autocomplete="email" autocorrect="off" autocapitalize="none" spellcheck="false">
                    </div>
                    <button type="submit" id="validate-btn" class="btn">Verifica e gioca</button>
                    <div id="error-message" class="error-message" aria-live="polite"></div>
                    <div id="login-info" class="info-message" aria-live="polite"></div>
                </form>
            </div>
        </section>

        <section id="game-section" class="hidden-section">
            <div class="game-box">
                <h1 id="game-title" tabindex="-1" aria-describedby="game-hint">Benvenuto, <span id="player-name">Giocatore</span>!</h1>
                <p id="game-hint">Clicca su un pacco sotto l'albero per scoprire il tuo regalo</p>
                <div class="scene" id="scene">
                    <img src="images/tree.svg" alt="Albero di Natale con i pacchi regalo" class="scene-img" id="tree-closed" width="1440" height="1050">
                    <img src="images/tree-opened.svg" alt="Pacco regalo aperto. Auguri da Nethesis!" class="scene-img scene-opened" id="tree-opened" width="1440" height="1050" tabindex="-1" aria-hidden="true">
                    <!-- Clickable gift areas are inserted here by game.js -->
                </div>
                <div id="game-error" class="error-message" aria-live="polite"></div>
            </div>
        </section>

        <section id="result-section" class="hidden-section">
            <div class="result-container">
                <h1 id="result-title" tabindex="-1" aria-describedby="prize-text">Ecco il tuo regalo!</h1>
                <div class="prize-card">
                    <div class="prize-card-box">
                        <img src="images/prize-card-top.svg" alt="" class="prize-card-img" width="863" height="430">
                        <div class="prize-card-text" id="prize-text">
                            <span class="prize-label">Hai vinto</span>
                            <span id="prize-name" class="prize-name">Un regalo</span>
                        </div>
                    </div>
                </div>
                <p>Abbiamo inviato i dettagli alla tua email. Il nostro team ti contatterà presto!</p>
                <div class="thank-you">
                    <p>Grazie per aver partecipato al nostro gioco di Natale! Buone feste!</p>
                </div>
            </div>
        </section>
        </main>
    </div>

    <div id="snow-container" aria-hidden="true"></div>

    <script src="<?= asset('js/snow.js') ?>"></script>
    <script src="<?= asset('js/game.js') ?>"></script>
</body>
</html>
