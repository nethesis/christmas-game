# xmas-game

Christmas game for Nethesis partners: pick a gift and win an exclusive prize.
PHP (Apache) port of `easter-game` (Node.js/Express).

## Requirements

- PHP >= 8.1 with `mod_php` or PHP-FPM
- Apache with `mod_rewrite` and `AllowOverride All` (or the rules of `public/.htaccess` in the vhost)
- Composer

## Installation

```bash
composer install --no-dev
cp .env.example .env   # then fill in the SMTP values
```

The `DocumentRoot` must point to `public/`:

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

Instead of the variables in the `.env` file you can use `SetEnv` in the vhost
(they take precedence over `.env`).

## Data

All data lives in `data/` (outside the docroot), which must be writable
by the Apache user (`www-data`):

| File | Content |
|------|---------|
| `data/players.jsonl` | Authorized partners, one line per partner: `{"piva": "...", "partner": "..."}`. The email is the one the player enters at login. VAT numbers are compared ignoring case, spaces, dots, dashes and the `IT` prefix of Italian VAT numbers |
| `data/prizes.jsonl` | Prizes: `{"id": 1, "name": "...", "probability": 10, "max": 5, "used": 0}`. Without `max`/`used` the prize is unlimited |
| `data/active_players/<piva>.json` (piva uppercase, without spaces, dots, dashes and `IT` prefix) | Result of each partner's play |

The `used` counter of the prizes is saved right away on every play; an exclusive lock
(`data/game.lock`) prevents double plays and prizes beyond `max` with concurrent requests.

```bash
sudo chown -R www-data: data
```

## API

| Endpoint | Body | Response |
|----------|------|----------|
| `POST /api/validate-vat` | `{"vatNumber"}` | `{"playerName"}` / 400, 403, 404 |
| `POST /api/record-prize` | `{"vatNumber", "playerName", "playerEmail"}` | `{"prize"}` / 400, 403, 404, 500 |

## Scripts

- `bin/clean_data.sh [prizes.jsonl]` (default `samples/prizes.jsonl`) — deletes all plays and restores `data/prizes.jsonl`
- `bin/get_file.sh [piva]` — shows the result of a partner's play

## Images

In `public/images/` (exported from Figma):

| File | Use |
|------|-----|
| `tree.svg` | Game scene: tree with 10 clickable gifts |
| `tree-opened.svg` | Scene after the click: opened gift and "Auguri da Nethesis!" |
| `prize-card-top.svg` | Blue top of the prize card; CSS draws the white area with the prize name, which grows with the name |
| `prize-card.svg` | Original prize card artwork, source of `prize-card-top.svg` |

The clickable areas of the gifts are defined in `public/js/game.js` (`GIFTS`) in coordinates
of the 1440×1050 image: if `tree.svg` changes, they must be realigned.

## Test data

`samples/players.jsonl` has 10 fake partners (VAT numbers from `00000000001` to `00000000010`).
`samples/prizes.jsonl` holds the test prizes and is not tracked by git (`.gitignore`): create it
before using the scripts.

```bash
cp samples/*.jsonl data/        # load the test data
bin/clean_data.sh               # delete all plays and reset the prizes (uses samples/prizes.jsonl)
```
