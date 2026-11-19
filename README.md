# xmas-game

Gioco di Natale per i partner Nethesis: scegli un pacco e vinci un regalo esclusivo.
Porting in PHP (Apache) di `easter-game` (Node.js/Express).

## Requisiti

- PHP >= 8.1 con `mod_php` o PHP-FPM
- Apache con `mod_rewrite` e `AllowOverride All` (o le regole di `public/.htaccess` nel vhost)
- Composer

## Installazione

```bash
composer install --no-dev
cp .env.example .env   # e compilare i valori SMTP
```

Il `DocumentRoot` deve puntare a `public/`:

```apache
<VirtualHost *:443>
    ServerName xmas.nethesis.it
    DocumentRoot /var/www/xmas-game/public
    <Directory /var/www/xmas-game/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

In alternativa alle variabili nel file `.env` si possono usare `SetEnv` nel vhost
(hanno la precedenza sul `.env`).

## Dati

Tutti i dati stanno in `data/` (fuori dalla docroot), che deve essere scrivibile
dall'utente di Apache (`www-data`):

| File | Contenuto |
|------|-----------|
| `data/players.jsonl` | Partner autorizzati, una riga per partner: `{"piva": "...", "partner": "...", "email": "..."}` |
| `data/prizes.jsonl` | Premi: `{"id": 1, "name": "...", "probability": 10, "max": 5, "used": 0}`. Senza `max`/`used` il premio è illimitato |
| `data/active_players/<piva>.json` | Esito della giocata di ogni partner |

Il contatore `used` dei premi viene salvato subito a ogni giocata; un lock esclusivo
(`data/game.lock`) impedisce giocate doppie e premi oltre il `max` con richieste concorrenti.

```bash
sudo chown -R www-data: data
```

## API

| Endpoint | Body | Risposta |
|----------|------|----------|
| `POST /api/validate-vat` | `{"vatNumber"}` | `{"playerName"}` / 400, 403, 404 |
| `POST /api/record-prize` | `{"vatNumber", "playerName", "playerEmail"}` | `{"prize"}` / 400, 403, 404, 500 |

## Script

- `bin/clean_data.sh [prizes.jsonl]` (default `samples/prizes.jsonl`) — azzera le giocate e ripristina `data/prizes.jsonl`
- `bin/get_file.sh [piva]` — mostra l'esito della giocata di un partner

## Immagini

In `public/images/` (esportate da Figma):

| File | Uso |
|------|-----|
| `tree.svg` | Scena di gioco: albero con 10 pacchi cliccabili |
| `tree-opened.svg` | Scena dopo il click: pacco aperto e "Auguri da Nethesis!" |
| `confetti-bg.svg` | Sfondo della schermata del premio |
| `prize-card.svg` | Card del premio; il nome va nella fascia bianca in basso |

Le aree cliccabili dei pacchi sono definite in `public/js/game.js` (`GIFTS`) in coordinate
dell'immagine 1440×1050: se si cambia `tree.svg` vanno riallineate.

## Dati di prova

In `samples/` ci sono 10 partner fittizi (P.IVA da `00000000001` a `00000000010`) e 5 premi:

```bash
cp samples/*.jsonl data/        # carica i dati di prova
bin/clean_data.sh               # azzera giocate e premi (usa samples/prizes.jsonl)
```
