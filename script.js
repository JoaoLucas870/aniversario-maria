let html5QrCode;
let isScanning = false;

const scanBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const nextBtn = document.getElementById("next-btn");
const hintText = document.getElementById("hint-text");
const overlay = document.getElementById("result-overlay");
const overlayMsg = document.getElementById("overlay-message");
const overlayClose = document.getElementById("overlay-close");
const manualInput = document.getElementById("manual-code");
const manualConfirm = document.getElementById("manual-confirm");

const correctCode = "fase2liberada"; // texto do QR

// ✅ Quando ler o QR corretamente
function qrCodeSuccessCallback(decodedText) {
  stopCameraScan();

  if (decodedText.trim().toLowerCase() === correctCode) {
    overlayMsg.innerHTML = `
      <h2>💜 Mandou bem!</h2>
      <p>Você achou a pista certa: <b>${decodedText}</b></p>
      <p>Continue, o amor te guia 💘</p>
    `;
    nextBtn.style.display = "inline-block";
  } else {
    overlayMsg.innerHTML = `
      <h2>❌ Ops!</h2>
      <p>Esse código não é o certo 😅</p>
    `;
  }
  overlay.style.display = "flex";
}

function startCameraScan() {
  if (isScanning) return;
  const regionElem = document.getElementById("qr-region");
  html5QrCode = new Html5Qrcode("qr-region");
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  Html5Qrcode.getCameras().then((devices) => {
    if (!devices.length) {
      hintText.textContent = "Nenhuma câmera detectada 😕";
      return;
    }
    const cameraId = devices.find((d) => /back|rear/i.test(d.label))?.id || devices[0].id;
    html5QrCode
      .start(cameraId, config, qrCodeSuccessCallback)
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
  });
}

function stopCameraScan() {
  if (isScanning && html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      isScanning = false;
      scanBtn.disabled = false;
      stopBtn.disabled = true;
      hintText.textContent = "Scanner parado 💜";
    });
  }
}

manualConfirm.addEventListener("click", () => {
  const val = manualInput.value.trim().toLowerCase();
  if (val === correctCode) {
    overlayMsg.innerHTML = `
      <h2>💜 Boa!</h2>
      <p>Código correto: <b>${val}</b></p>
      <p>Você pode seguir para a próxima fase 💌</p>
    `;
    nextBtn.style.display = "inline-block";
  } else {
    overlayMsg.innerHTML = `<h2>❌ Errou!</h2><p>Tenta de novo 💜</p>`;
  }
  overlay.style.display = "flex";
});

overlayClose.addEventListener("click", () => {
  overlay.style.display = "none";
});

nextBtn.addEventListener("click", () => {
  window.location.href = "fase2.html";
});

scanBtn.addEventListener("click", startCameraScan);
stopBtn.addEventListener("click", stopCameraScan);
