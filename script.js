// script.js — versão corrigida pro GitHub Pages

let html5QrCode;
let isScanning = false;

const scanBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const nextBtn = document.getElementById("next-btn");
const hintText = document.getElementById("hint-text");
const overlay = document.getElementById("result-overlay");
const overlayMsg = document.getElementById("overlay-message");
const overlayClose = document.getElementById("overlay-close");

function qrCodeSuccessCallback(decodedText, decodedResult) {
  stopCameraScan();

  // Mostra mensagem engraçada
  overlayMsg.innerHTML = `
    <h2>🎉 Mandou bem!</h2>
    <p>Você achou a pista certa: <b>${decodedText}</b></p>
    <p>Continue, o amor te guia 💚</p>
  `;
  overlay.style.display = "flex";
}

function qrCodeErrorCallback(errorMessage) {
  // erros de leitura (podem ser ignorados)
}

function startCameraScan() {
  if (isScanning) return;

  const regionElem = document.getElementById("qr-region");
  if (!regionElem) {
    alert("Erro interno: área do QR não encontrada.");
    return;
  }

  html5QrCode = new Html5Qrcode("qr-region");
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  Html5Qrcode.getCameras()
    .then((devices) => {
      if (!devices || devices.length === 0) {
        hintText.textContent = "Nenhuma câmera detectada 😕";
        return;
      }

      const cameraId = devices[0].id;
      html5QrCode
        .start(cameraId, config, qrCodeSuccessCallback, qrCodeErrorCallback)
        .then(() => {
          isScanning = true;
          scanBtn.disabled = true;
          stopBtn.disabled = false;
          hintText.textContent = "📸 Aponte para o QR Code...";
        })
        .catch((err) => {
          console.error("Erro ao iniciar câmera:", err);
          hintText.textContent = "Erro ao acessar câmera 😔";
        });
    })
    .catch((err) => {
      console.error("Erro ao listar câmeras:", err);
      hintText.textContent = "Não consegui acessar as câmeras.";
    });
}

function stopCameraScan() {
  if (isScanning && html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      isScanning = false;
      scanBtn.disabled = false;
      stopBtn.disabled = true;
      hintText.textContent = "Scanner parado.";
    });
  }
}

scanBtn.addEventListener("click", startCameraScan);
stopBtn.addEventListener("click", stopCameraScan);

overlayClose.addEventListener("click", () => {
  overlay.style.display = "none";
  nextBtn.style.display = "inline-block"; // libera botão de próxima fase
});
