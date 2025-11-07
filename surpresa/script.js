/* script.js - scanner, fluxo entre fases, mensagens e fallback manual */

document.addEventListener("DOMContentLoaded", () => {
  // identifica a fase atual pelo nome do arquivo (ex: fase1.html)
  const path = window.location.pathname;
  const file = path.split("/").pop() || "index.html";
  const match = file.match(/fase(\d+)\.html/i);
  const faseNum = match ? parseInt(match[1], 10) : null;
  const ultimaFase = 10;

  // elementos que devem existir no HTML (ver template abaixo)
  const scanBtn = document.getElementById("start-scan");
  const stopBtn = document.getElementById("stop-scan");
  const qrRegion = document.getElementById("qr-region");
  const hintText = document.getElementById("hint-text");
  const manualInput = document.getElementById("manual-code");
  const manualBtn = document.getElementById("manual-confirm");
  const nextBtn = document.getElementById("next-btn");
  const overlay = document.getElementById("result-overlay");
  const overlayMsg = document.getElementById("overlay-message");
  const overlayClose = document.getElementById("overlay-close");

  // se for a página final (fase10), não inicializa scanner
  if (!faseNum || faseNum >= ultimaFase) {
    // apenas guarda/mostra progresso
    localStorage.setItem("ultimaFase", file);
    return;
  }

  // próximo arquivo
  const nextFile = `fase${faseNum + 1}.html`;

  // configurações do scanner
  let html5QrCode = null;
  let isScanning = false;

  // mostra dica padrão (pode customizar por fase)
  const dicas = {
    1: "Dica: começa pela sala onde a gente come pipoca 🍿",
    2: "Dica: procura onde tem plantas ou luz natural 🌱",
    3: "Dica: dá uma olhada perto do calendário de parede 📅",
    4: "Dica: olha onde a música costuma tocar 🎧",
    5: "Dica: verifica perto do lugar favorito dela pra sentar 🛋️",
    6: "Dica: está perto de algo que brilha ✨",
    7: "Dica: olha onde costumamos tomar café ☕",
    8: "Dica: procura onde guardamos as chaves 🔑",
    9: "Dica: o lugar mais fofo da casa esconde a pista 🥰"
  };
  hintText.textContent = dicas[faseNum] || "Dica: fique ligado no ambiente ✨";

  // funções utilitárias
  function startCameraScan() {
    if (isScanning) return;
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode(/* element id */ "qr-region", /* verbose= */ false);
    }
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    Html5Qrcode.getCameras().then((devices) => {
      if (!devices || devices.length === 0) {
        hintText.textContent = "Nenhuma câmera encontrada. Use o código manual.";
        return;
      }
      const cameraId = devices[0].id;
      html5QrCode.start(
        cameraId,
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      ).then(() => {
        isScanning = true;
        scanBtn.disabled = true;
        stopBtn.disabled = false;
        hintText.style.opacity = 1;
      }).catch((err) => {
        hintText.textContent = "Erro ao acessar a câmera. Use o código manual.";
        console.error("start error:", err);
      });
    }).catch((err) => {
      hintText.textContent = "Erro ao listar câmeras. Use o código manual.";
      console.error("getCameras error:", err);
    });
  }

  function stopCameraScan() {
    if (!isScanning || !html5QrCode) return;
    html5QrCode.stop().then(() => {
      isScanning = false;
      scanBtn.disabled = false;
      stopBtn.disabled = true;
      // limpa região de vídeo
      html5QrCode.clear();
    }).catch((err) => {
      console.warn("Erro ao parar câmera:", err);
    });
  }

  // callback quando QR é detectado com sucesso
  function qrCodeSuccessCallback(decodedText, decodedResult) {
    // decodedText é a string do QR code
    stopCameraScan();
    // salva progresso
    localStorage.setItem("ultimaFase", file);

    // mensagem engraçada e instrução
    const funnyMessages = [
      "Aeeee, detetive! 🎉 Você acertou.",
      "Você tem o nariz de exploradora, hein? 👃✨",
      "Parabéns, acha que é fácil? Achou! 😎",
      "Mandou bem! Tá quase no final, continua! 💚"
    ];
    const randomMsg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

    // mostra overlay com a mensagem e o conteúdo do QR (opcional)
    overlayMsg.innerHTML = `
      <strong>${randomMsg}</strong>
      <p>Conteúdo do QR: <em>${escapeHtml(decodedText)}</em></p>
      <p>Clique em continuar quando estiver pronta.</p>
    `;
    overlay.style.display = "flex";

    // libera botão "Próximo"
    nextBtn.style.display = "inline-block";
    nextBtn.onclick = () => {
      window.location.href = nextFile;
    };
  }

  // callback de erro de leitura (opcional)
  function qrCodeErrorCallback(err) {
    // silêncio — não polui a interface; logs só no console
    // console.log("Leitura falhou:", err);
  }

  // escape simples para evitar inserção indesejada
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // manual confirm (caso use código impresso)
  manualBtn.addEventListener("click", () => {
    const val = manualInput.value.trim();
    if (!val) {
      hintText.textContent = "Digita o código que está no papel pra validar.";
      return;
    }
    // aqui você pode validar o conteúdo esperado (ex: "FASE1-OK")
    // por enquanto, aceita qualquer coisa como válido:
    overlayMsg.innerHTML = `
      <strong>Você digitou: ${escapeHtml(val)} ✅</strong>
      <p>Boa! Mensagem: ${escapeHtml(randomManualMessage())}</p>
      <p>Aperte continuar pra seguir.</p>
    `;
    overlay.style.display = "flex";
    nextBtn.style.display = "inline-block";
    nextBtn.onclick = () => window.location.href = nextFile;
    localStorage.setItem("ultimaFase", file);
  });

  function randomManualMessage() {
    const arr = [
      "Ótima escolha, parceira de crime! 😏",
      "Você digitou certo — avançando! 🚀",
      "Valeu! Continue assim que tá perfeito 💚"
    ];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // botões de interface
  scanBtn.addEventListener("click", startCameraScan);
  stopBtn.addEventListener("click", () => {
    stopCameraScan();
    hintText.textContent = "Scanner parado. Você pode usar o código manual.";
  });

  overlayClose.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  // salva progresso ao entrar
  localStorage.setItem("ultimaFase", file);
});
