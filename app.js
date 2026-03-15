const typeEl = document.getElementById("type");
const contentEl = document.getElementById("content");
const sizeEl = document.getElementById("size");
const sizeValueEl = document.getElementById("sizeValue");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const qrContainer = document.getElementById("qrcode");
const errorEl = document.getElementById("error");

let qrCodeInstance = null;

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function clearQr() {
  qrContainer.innerHTML = "";
}

function generateQr() {
  const type = typeEl.value;
  const content = contentEl.value.trim();
  const size = Number(sizeEl.value);

  errorEl.textContent = "";
  clearQr();

  if (!content) {
    errorEl.textContent = "Fyll i en länk eller text.";
    return;
  }

  if (type === "url" && !isValidUrl(content)) {
    errorEl.textContent = "Ange en giltig URL, till exempel https://example.com";
    return;
  }

  qrCodeInstance = new QRCode(qrContainer, {
    text: content,
    width: size,
    height: size,
    correctLevel: QRCode.CorrectLevel.H
  });
}

function downloadQr() {
  const img = qrContainer.querySelector("img");
  const canvas = qrContainer.querySelector("canvas");

  let source = null;

  if (img) {
    source = img.src;
  } else if (canvas) {
    source = canvas.toDataURL("image/png");
  }

  if (!source) {
    errorEl.textContent = "Generera en QR-kod först.";
    return;
  }

  const link = document.createElement("a");
  link.href = source;
  link.download = "qr-kod.png";
  link.click();
}

sizeEl.addEventListener("input", () => {
  sizeValueEl.textContent = sizeEl.value;
});

generateBtn.addEventListener("click", generateQr);
downloadBtn.addEventListener("click", downloadQr);
