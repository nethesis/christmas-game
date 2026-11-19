document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const loginForm = document.getElementById("login-form");
  const validateBtn = document.getElementById("validate-btn");
  const vatNumberInput = document.getElementById("vat-number");
  const playerNameSpan = document.getElementById("player-name");
  const playerEmailInput = document.getElementById("player-email");
  const loginSection = document.getElementById("login-section");
  const gameSection = document.getElementById("game-section");
  const resultSection = document.getElementById("result-section");
  const errorMessage = document.getElementById("error-message");
  const loginInfo = document.getElementById("login-info");
  const gameError = document.getElementById("game-error");
  const prizeNameSpan = document.getElementById("prize-name");
  const scene = document.getElementById("scene");
  const treeClosed = document.getElementById("tree-closed");
  const treeOpened = document.getElementById("tree-opened");
  const gameTitle = document.getElementById("game-title");
  const resultTitle = document.getElementById("result-title");
  const APP_TITLE = document.title;

  // Pauses between one screen and the next
  const LOGIN_DELAY_MS = 3000; // login accepted -> tree
  const PRIZE_DELAY_MS = 3500; // opened gift fully visible -> prize card
  const SCENE_FADE_MS = 800; // keep in sync with .scene-img transition in style.css
  const SNOW_DURATION_MS = 30000; // snowfall on the prize screen

  // Visible area of the 1440x1050 tree images (the rest is empty background)
  const CROP = { x: 230, y: 130, w: 1000, h: 900 };

  // Gift boxes in tree.svg, in image coordinates [x, y, width, height].
  // Ordered back to front, so overlapping front gifts get the click.
  const GIFTS = [
    [482, 606, 86, 102], // orange
    [886, 700, 80, 90], // cyan, red bow
    [428, 670, 94, 112], // green, red bow
    [503, 730, 87, 92], // dark blue
    [805, 738, 85, 107], // white, red bow
    [576, 740, 104, 122], // big blue
    [462, 780, 75, 80], // light blue
    [714, 790, 89, 100], // purple
    [552, 823, 80, 97], // red
    [675, 864, 83, 89], // dark green
  ];

  // Variables
  let currentVatNumber = "";
  let currentPlayerName = "";
  let playing = false;
  let validating = false;

  setupScene();
  preload(["images/tree-opened.svg", "images/prize-card.svg"]);

  // Event listeners
  // Native submit: handles the Enter key and doesn't fire during IME composition
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    validateVatNumber();
  });

  function preload(urls) {
    urls.forEach((url) => {
      new Image().src = url;
    });
  }

  function setupScene() {
    // Position the images so that only the CROP area is visible
    scene.style.aspectRatio = `${CROP.w} / ${CROP.h}`;
    scene.querySelectorAll(".scene-img").forEach((img) => {
      img.style.width = `${(1440 / CROP.w) * 100}%`;
      img.style.left = `${(-CROP.x / CROP.w) * 100}%`;
      img.style.top = `${(-CROP.y / CROP.h) * 100}%`;
    });

    GIFTS.forEach(([x, y, w, h], i) => {
      const gift = document.createElement("button");
      gift.type = "button";
      gift.className = "gift";
      gift.setAttribute("aria-label", `Pacco regalo ${i + 1}`);
      gift.style.left = `${((x - CROP.x) / CROP.w) * 100}%`;
      gift.style.top = `${((y - CROP.y) / CROP.h) * 100}%`;
      gift.style.width = `${(w / CROP.w) * 100}%`;
      gift.style.height = `${(h / CROP.h) * 100}%`;
      gift.addEventListener("click", () => openGift(gift));
      scene.appendChild(gift);
    });
  }

  async function openGift(gift) {
    if (playing) {
      return;
    }
    playing = true;
    gameError.textContent = "";
    scene.classList.add("busy");
    gift.classList.add("shaking");

    try {
      const response = await fetch("api/record-prize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vatNumber: currentVatNumber,
          playerName: currentPlayerName,
          playerEmail: playerEmailInput.value.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Errore nella registrazione del gioco");
      }

      const { prize } = await response.json();
      revealPrize(prize);
    } catch (error) {
      console.error("Errore nella richiesta del regalo:", error);
      gameError.textContent = "Si è verificato un errore. Riprova più tardi.";
      scene.classList.remove("busy");
      playing = false;
    } finally {
      gift.classList.remove("shaking");
    }
  }

  async function validateVatNumber() {
    if (validating) {
      return;
    }

    const vatNumber = vatNumberInput.value.trim();
    const playerEmail = playerEmailInput.value.trim();

    // Email validation
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    // The form uses novalidate: show our message and move focus to the first invalid field
    if (!vatNumber || !playerEmail) {
      showError("Inserisci sia la Partita IVA che la tua Email.");
      (vatNumber ? playerEmailInput : vatNumberInput).focus();
      return;
    }
    if (!emailPattern.test(playerEmail)) {
      showError("Inserisci un'email valida.");
      playerEmailInput.focus();
      return;
    }

    setLoginBusy(true);

    try {
      const response = await fetch("api/validate-vat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vatNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(
          data.error === "VAT Number not authorized to play"
            ? "Errore! Partita Iva inesistente"
            : data.error === "You have already played with this VAT Number"
            ? "Errore! Partita Iva già utilizzata"
            : "Errore nella verifica della Partita IVA"
        );
        setLoginBusy(false);
        return;
      }

      // Store current player info
      currentVatNumber = vatNumber;
      currentPlayerName = data.playerName || "Giocatore";

      // Update UI
      playerNameSpan.textContent = currentPlayerName;
      errorMessage.textContent = "";

      // Show game section after the pause
      loginInfo.textContent = `Benvenuto, ${currentPlayerName}! Il gioco sta per iniziare…`;
      setTimeout(() => showSection(gameSection, gameTitle, "Scegli il tuo regalo"), LOGIN_DELAY_MS);
    } catch (error) {
      console.error("Error:", error);
      showError("Si è verificato un errore di connessione. Riprova più tardi.");
      setLoginBusy(false);
    }
  }

  function setLoginBusy(busy) {
    validating = busy;
    validateBtn.disabled = busy;
    vatNumberInput.disabled = busy;
    playerEmailInput.disabled = busy;
  }

  function revealPrize(prize) {
    prizeNameSpan.textContent = prize;

    // Show the opened gift and the greetings, then the prize card.
    // The clicked gift disappears, so move focus to the opened scene (announces the greetings)
    scene.classList.add("opened");
    treeClosed.setAttribute("aria-hidden", "true");
    treeOpened.removeAttribute("aria-hidden");
    treeOpened.focus({ preventScroll: true });

    setTimeout(() => {
      showSection(resultSection, resultTitle, `Hai vinto: ${prize}`);
      startSnow();
    }, SCENE_FADE_MS + PRIZE_DELAY_MS);
  }

  // Show one screen, update the tab title and move focus to the new screen's heading,
  // so keyboard and screen reader users know the screen has changed
  function showSection(section, focusTarget, title) {
    [loginSection, gameSection, resultSection].forEach((s) => {
      s.classList.toggle("active-section", s === section);
      s.classList.toggle("hidden-section", s !== section);
    });
    document.title = title ? `${title} | ${APP_TITLE}` : APP_TITLE;
    focusTarget?.focus({ preventScroll: true });
  }

  function showError(message) {
    // Clear first, so screen readers announce the message again even if it's unchanged
    errorMessage.textContent = "";
    errorMessage.style.opacity = "1";
    setTimeout(() => {
      errorMessage.textContent = message;
    }, 100);
  }

  function startSnow() {
    // No snow at all for users who asked the system to reduce motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const snow = new Snowfall("snow-container");
    snow.start();

    // Stop new flakes after SNOW_DURATION_MS, or earlier with Esc;
    // the flakes on screen finish falling and the pile stays
    const stopSnow = () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeydown);
      snow.stop();
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") {
        stopSnow();
      }
    };
    const timer = setTimeout(stopSnow, SNOW_DURATION_MS);
    document.addEventListener("keydown", onKeydown);
  }
});
