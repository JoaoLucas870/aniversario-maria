/* script.js - controle do scanner para as fases
   Uso:
   - cada HTML de fase scanner deve ter no <body>:
     data-expected="faseX"  (texto exato do QR que libera a próxima)
     data-next="faseY.html" (página para onde ir ao clicar Próximo no modal)
     data-hint="texto da dica exibida enquanto escaneia"
   - Ex.: <body data-expected="fase2" data-next="fase3.html" data-hint="Procure na geladeira">
*/

let html5QrCode = null;
let isScanning = false;
let cooldown = false;

const SCAN_CONFIG = { fps: 10, qrbox: () => {
  // calcula tamanho quadrado do qr
  const w = Math.min(window.innerWidth * 0.86, 300);
  return { width: w, height: w };
} };

// pega elementos (podem não existir em página final)
const startBtn = document.getElementById('start-scan');
const stopBtn  = document.getElementById('stop-scan');
const hintDiv  = document.getElementById('hint-text');
const qrRegion = document.getElementById('qr-region');
const overlay  = document.getElementById('result-overlay');
const overlayMsg= document.getElementById('overlay-message');
const overlayClose = document.getElementById('overlay-close');
const manualInput = document.getElementById('manual-code');
const manualConfirm = document.getElementById('manual-confirm');
const nextBtnInline = document.getElementById('next-btn');

// informações esperadas vindas do body
const body = document.body;
const expectedCode = (body && body.dataset && body.dataset.expected) ? body.dataset.expected.trim().toLowerCase() : null;
const nextPage = (body && body.dataset && body.dataset.next) ? body.dataset.next.trim() : null;
const hintText = (body && body.dataset && body.dataset.hint) ? body.dataset.hint.trim() : 'Aponte a câmera para o QR Code';

// função para mostrar o modal
function showModal(title, html, showNext=false) {
  if (!overlay) return;
  overlayMsg.innerHTML = `<h2>${title}</h2>${html}`;
  overlay.style.display = 'flex';
  // mostrar botão Próximo inline se existir
  if (nextBtnInline) nextBtnInline.style.display = showNext ? 'inline-block' : 'none';
}

// esconde modal
function closeModal() {
  if (!overlay) return;
  overlay.style.display = 'none';
}

// callback de sucesso no scanner
function onScanSuccess(decodedText, decodedResult) {
  if (cooldown) return;
  const text = String(decodedText || '').trim().toLowerCase();

  // compara com o esperado; se nenhum expected definido, apenas mostra o código
  if (expectedCode) {
    if (text === expectedCode) {
      cooldown = true;
      stopScan().then(()=> {
        showModal('🎉 Você acertou!', `<p>Você escaneou: <b>${decodedText}</b></p><p>Você está indo muito bem, continue 💜</p>`, true);
        setTimeout(()=> cooldown = false, 1000);
      });
    } else {
      // código diferente
      cooldown = true;
      showModal('❌ Esse não é o QR certo', `<p>Você escaneou: <b>${decodedText}</b></p><p>Tente o próximo local da pista ✨</p>`, false);
      setTimeout(()=> cooldown = false, 900);
    }
  } else {
    // sem expected configurado (página não scanner) mostra apenas
    showModal('📌 Código lido', `<p>${decodedText}</p>`, false);
  }
}

// erros ignoráveis
function onScanError(err) {
  // console.debug('scan error', err);
}

// start scanner
async function startScan() {
  if (isScanning) return;
  if (!qrRegion) return;

  // atualiza dica
  if (hintDiv) hintDiv.textContent = hintText;

  html5QrCode = new Html5Qrcode(qrRegion.id, { verbose: false });

  try {
    const devices = await Html5Qrcode.getCameras();
    if (!devices || devices.length === 0) {
      if (hintDiv) hintDiv.textContent = 'Nenhuma câmera detectada';
      return;
    }
    // preferir câmera traseira quando houver
    const cam = devices.find(d => /back|rear|trás/i.test(d.label)) || devices[0];
    const cameraId = cam.id;

    await html5QrCode.start(
      cameraId,
      SCAN_CONFIG,
      onScanSuccess,
      onScanError
    );
    isScanning = true;
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (hintDiv) hintDiv.textContent = '📸 Aponte para o QR Code...';
  } catch (e) {
    console.error('Erro iniciando câmera', e);
    if (hintDiv) hintDiv.textContent = 'Erro ao acessar a câmera (verifique permissões/https)';
  }
}

// stop scanner
async function stopScan() {
  if (!isScanning || !html5QrCode) return Promise.resolve();
  try {
    await html5QrCode.stop();
    html5QrCode.clear();
  } catch (e) {
    console.warn('Erro ao parar scanner', e);
  } finally {
    isScanning = false;
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (hintDiv) hintDiv.textContent = 'Scanner parado';
  }
  return Promise.resolve();
}

// fallback: confirmar manualmente o código
function manualConfirmHandler() {
  if (!manualInput) return;
  const val = manualInput.value.trim().toLowerCase();
  if (!val) return;
  if (expectedCode && val === expectedCode) {
    showModal('🎉 Código correto', `<p>Boa! Você digitou: <b>${manualInput.value}</b></p><p>Continue 💜</p>`, true);
    if (nextBtnInline) nextBtnInline.style.display = 'inline-block';
  } else {
    showModal('❌ Código inválido', `<p>O código "${manualInput.value}" não é o esperado.</p>`, false);
  }
}

// conexões de eventos (se os elementos existirem)
if (startBtn) startBtn.addEventListener('click', startScan);
if (stopBtn) stopBtn.addEventListener('click', () => stopScan());
if (overlayClose) overlayClose.addEventListener('click', closeModal);
if (manualConfirm) manualConfirm.addEventListener('click', manualConfirmHandler);
if (nextBtnInline) nextBtnInline.addEventListener('click', () => {
  if (nextPage) window.location.href = nextPage;
});

// se houver botão "Próximo" fora do modal (ex: na página final), ele também usa id next-btn
const topNextBtn = document.getElementById('next-top');
if (topNextBtn) topNextBtn.addEventListener('click', () => {
  if (nextPage) window.location.href = nextPage;
});
