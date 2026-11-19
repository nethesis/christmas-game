document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const validateBtn = document.getElementById("validate-btn");
  const vatNumberInput = document.getElementById("vat-number");
  const playerNameSpan = document.getElementById("player-name");
  const playerEmailInput = document.getElementById("player-email");
  const loginSection = document.getElementById("login-section");
  const gameSection = document.getElementById("game-section");
  const resultSection = document.getElementById("result-section");
  const errorMessage = document.getElementById("error-message");
  const prizeNameSpan = document.getElementById("prize-name");
  const giftsContainer = document.getElementById("gifts-container");
  const title = document.getElementById("title");

  // Variables
  let currentVatNumber = "";
  let currentPlayerName = "";
  let gifts = [];

  // Load prizes from JSON file
  try {
    // Generate gifts
    generateGifts();
  } catch (error) {
    console.error("Failed to load prizes:", error);
  }

  // Event listeners
  validateBtn.addEventListener("click", () => {
    const vatNumber = vatNumberInput.value.trim();
    const playerEmail = playerEmailInput.value.trim();

    // Email validation
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!vatNumber || !playerEmail) {
      errorMessage.textContent =
        "Inserisci sia la Partita IVA che la tua Email.";
      return;
    }
    if (!emailPattern.test(playerEmail)) {
      errorMessage.textContent = "Inserisci un'email valida.";
      return;
    }

    validateVatNumber();
  });

  vatNumberInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      validateVatNumber();
    }
  });

  function generateGifts() {
    // Clear existing gifts
    giftsContainer.innerHTML = "";

    // Generate 24 gifts (6x4 layout)
    const maxGifts = 24;

    for (let i = 0; i < maxGifts; i++) {
      const giftDiv = document.createElement("div");
      giftDiv.className = "gift";
      giftDiv.setAttribute("data-gift-id", `gift-${i + 1}`);

      const giftImg = document.createElement("img");
      giftImg.src = "images/gift_closed.svg";
      giftImg.alt = "Pacco regalo";

      giftDiv.appendChild(giftImg);
      giftsContainer.appendChild(giftDiv);

      // Add click event
      giftDiv.addEventListener("click", async function () {
        if (!playerEmailInput.value.trim()) {
          alert("Inserisci la tua email prima di scegliere un regalo");
          playerEmailInput.focus();
          return;
        }

        try {
          giftDiv.classList.add("shaking");

          // Send record-game request
          const recordGameResponse = await fetch("api/record-prize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              vatNumber: currentVatNumber,
              playerName: currentPlayerName,
              playerEmail: playerEmailInput.value.trim(),
            }),
          });

          giftDiv.classList.remove("shaking");
          giftImg.src = "images/gift_opened.svg";

          if (!recordGameResponse.ok) {
            throw new Error("Errore nella registrazione del gioco");
          }

          const { prize } = await recordGameResponse.json();

          // Handle the gift selection UI
          await selectGift(giftDiv, prize);
        } catch (error) {
          console.error("Errore nella richiesta del regalo:", error);
          showError("Si è verificato un errore. Riprova più tardi.");
          giftImg.src = "images/gift_closed.svg";
        }
      });
    }

    // Update gifts variable
    gifts = document.querySelectorAll(".gift");
  }

  async function validateVatNumber() {
    const vatNumber = vatNumberInput.value.trim();

    if (!vatNumber) {
      showError("Inserisci la tua Partita IVA");
      return;
    }

    try {
      const response = await fetch("api/validate-vat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        return;
      }

      // Store current player info
      currentVatNumber = vatNumber;
      currentPlayerName = data.playerName || "Giocatore";

      // Update UI
      playerNameSpan.textContent = currentPlayerName;
      errorMessage.textContent = "";

      // Show game section
      loginSection.classList.remove("active-section");
      loginSection.classList.add("hidden-section");
      title.classList.add("hidden-section");
      gameSection.classList.remove("hidden-section");
      gameSection.classList.add("active-section");
    } catch (error) {
      console.error("Error:", error);
      showError("Si è verificato un errore di connessione. Riprova più tardi.");
    }
  }

  async function selectGift(giftElement, prize) {
    // Visual feedback on selection
    gifts.forEach((gift) => {
      gift.style.opacity = "0.5";
      gift.style.pointerEvents = "none";
    });

    giftElement.style.opacity = "1";

    // Show animation (you can enhance this)
    giftElement.style.transform = "scale(1.2)";
    giftElement.classList.add("opening");

    setTimeout(async () => {
      // Update UI for result immediately
      prizeNameSpan.textContent = prize;

      // Add additional text based on prize type
      const deliveryInfoElement = document.createElement("p");
      deliveryInfoElement.className = "delivery-info";

      // Insert the delivery info after the prize name
      const prizeRevealElement = document.querySelector(".prize-reveal");
      prizeRevealElement.appendChild(deliveryInfoElement);

      // Show confetti
      startConfetti();

      // Show result section
      gameSection.classList.remove("active-section");
      gameSection.classList.add("hidden-section");
      resultSection.classList.remove("hidden-section");
      resultSection.classList.add("active-section");
    }, 2000);
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.opacity = "1";
  }

  function startConfetti() {
    const confettiSettings = {
      target: "confetti-container",
      max: 150,
      size: 1.5,
    };
    const confetti = new ConfettiGenerator(confettiSettings);
    confetti.render();

    // Stop confetti after 5 seconds
    setTimeout(() => {
      confetti.clear();
    }, 5000);
  }
});
