<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

function createMailer(): PHPMailer
{
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = (string) env('SMTP_HOST');
    $mail->Port = (int) env('SMTP_PORT', '587');
    $mail->SMTPAuth = env('EMAIL_USER') !== null;
    $mail->Username = (string) env('EMAIL_USER');
    $mail->Password = (string) env('EMAIL_PASS');
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->Timeout = 30; // seconds, SMTP connection/command timeout
    $mail->isHTML(true);
    $mail->setFrom((string) env('MAIL_FROM'));

    return $mail;
}

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

// Send email to winner
function sendWinnerEmail(?string $email, string $name, string $prize): void
{
    if (!$email) {
        error_log('No email provided for winner, skipping email');
        return;
    }

    $name = e($name);
    $prize = e($prize);

    $mail = createMailer();
    $mail->addAddress($email);
    $mail->Subject = 'Congratulazioni! Hai vinto un regalo di Natale!';
    $mail->Body = <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h1 style="color: #c62828; text-align: center;">Buon Natale, {$name}!</h1>
          <p style="font-size: 16px; line-height: 1.5;">Congratulazioni! Hai appena vinto un fantastico regalo nel nostro gioco di Natale:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h2 style="color: #2e7d32; margin: 0;">{$prize}</h2>
          </div>
          <p style="font-size: 16px; line-height: 1.5;">Il nostro team commerciale ti contatterà presto con i dettagli su come riscattare il tuo regalo.</p>
          <p style="font-size: 16px; line-height: 1.5;">Grazie per aver partecipato al nostro gioco e Buone Feste!</p>
          <div style="text-align: center; margin-top: 30px; color: #757575; font-size: 14px;">
            <p>Questa è un'email automatica, si prega di non rispondere.</p>
          </div>
        </div>
        HTML;
    $mail->send();
}

// Send email to commercial department
function sendCommercialEmail(string $vatNumber, string $playerName, string $prize, string $playerEmail): void
{
    $subject = "Nuovo vincitore: $playerName ($vatNumber)";
    [$vatNumber, $playerName, $prize, $playerEmail] = array_map('e', [$vatNumber, $playerName, $prize, $playerEmail]);
    $date = date('d/m/Y, H:i:s');

    $mail = createMailer();
    $mail->addAddress((string) env('COMMERCIAL_EMAIL'));
    $mail->Subject = $subject;
    $mail->Body = <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h1 style="color: #c62828; text-align: center;">Nuovo vincitore del gioco di Natale</h1>
          <p style="font-size: 16px; line-height: 1.5;">Un nuovo cliente ha partecipato al gioco di Natale e ha vinto un regalo:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd; background-color: #f5f5f5;">Cliente</th>
              <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">{$playerName}</td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd; background-color: #f5f5f5;">Partita IVA</th>
              <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">{$vatNumber}</td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd; background-color: #f5f5f5;">Email</th>
              <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">{$playerEmail}</td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd; background-color: #f5f5f5;">Regalo</th>
              <td style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">{$prize}</td>
            </tr>
            <tr>
              <th style="padding: 10px; text-align: left; background-color: #f5f5f5;">Data e ora</th>
              <td style="padding: 10px; text-align: left;">{$date}</td>
            </tr>
          </table>
          <p style="font-size: 16px; line-height: 1.5;">Si prega di contattare il cliente per organizzare la consegna del regalo.</p>
        </div>
        HTML;
    $mail->send();
}
