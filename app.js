const typeEl = document.getElementById("type");
const dynamicFieldsEl = document.getElementById("dynamicFields");
const sizeEl = document.getElementById("size");
const sizeValueEl = document.getElementById("sizeValue");
const foregroundColorEl = document.getElementById("foregroundColor");
const backgroundColorEl = document.getElementById("backgroundColor");
const logoUploadEl = document.getElementById("logoUpload");
const logoSizeEl = document.getElementById("logoSize");
const logoSizeValueEl = document.getElementById("logoSizeValue");
const removeLogoBtn = document.getElementById("removeLogoBtn");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadSvgBtn = document.getElementById("downloadSvgBtn");
const shareBtn = document.getElementById("shareBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const historyListEl = document.getElementById("historyList");
const qrContainer = document.getElementById("qrcode");
const qrWrapper = document.getElementById("qrWrapper");
const errorEl = document.getElementById("error");
const networkBadgeEl = document.getElementById("networkBadge");

const HISTORY_KEY = "qr_studio_history_v6";

let qrCode = null;
let logoImage = null;

function getLogoSize() {
  return Number(logoSizeEl.value) / 100;
}

function createQrInstance() {
  qrCode = new QRCodeStyling({
    width: Number(sizeEl.value),
    height: Number(sizeEl.value),
    type: "canvas",
    data: " ",
    margin: 0,
    image: logoImage,
    qrOptions: {
      errorCorrectionLevel: "H"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 6,
      imageSize: getLogoSize()
    },
    dotsOptions: {
      color: foregroundColorEl.value,
      type: "rounded"
    },
    backgroundOptions: {
      color: backgroundColorEl.value
    },
    cornersSquareOptions: {
      type: "extra-rounded",
      color: foregroundColorEl.value
    },
    cornersDotOptions: {
      type: "dot",
      color: foregroundColorEl.value
    }
  });

  qrContainer.innerHTML = "";
  qrCode.append(qrContainer);
}

function escapeWifiValue(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:");
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function setHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function getTypeLabel(type) {
  const map = {
    url: "URL",
    text: "Text",
    phone: "Telefon",
    email: "E-post",
    wifi: "Wi-Fi"
  };
  return map[type] || type;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function previewText(item) {
  if (item.type === "email") return item.fields.email || "";
  if (item.type === "wifi") return item.fields.ssid || "";
  if (item.type === "phone") return item.fields.phone || "";
  return item.fields.content || "";
}

function renderHistory() {
  const items = getHistory();

  if (!items.length) {
    historyListEl.innerHTML = `<p class="empty-state">Ingen historik ännu.</p>`;
    return;
  }

  historyListEl.innerHTML = items
    .map((item, index) => {
      return `
        <div class="history-item">
          <span class="history-type">${getTypeLabel(item.type)}</span>
          <p class="history-text">${escapeHtml(previewText(item))}</p>
          <div class="history-actions">
            <button data-action="load" data-index="${index}">Använd igen</button>
            <button data-action="delete" data-index="${index}">Ta bort</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderFields() {
  const type = typeEl.value;

  if (type === "url") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="content">Länk</label>
        <input id="content" type="text" placeholder="https://example.com" />
      </div>
    `;
  } else if (type === "text") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="content">Text</label>
        <textarea id="content" placeholder="Skriv din text här"></textarea>
      </div>
    `;
  } else if (type === "phone") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="phone">Telefonnummer</label>
        <input id="phone" type="text" placeholder="+46701234567" />
      </div>
    `;
  } else if (type === "email") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="email">E-postadress</label>
        <input id="email" type="email" placeholder="namn@example.com" />
      </div>

      <div class="field-group">
        <label for="subject">Ämne</label>
        <input id="subject" type="text" placeholder="Hej!" />
      </div>

      <div class="field-group">
        <label for="message">Meddelande</label>
        <textarea id="message" placeholder="Skriv ett meddelande"></textarea>
      </div>
    `;
  } else if (type === "wifi") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="ssid">Wi-Fi-namn (SSID)</label>
        <input id="ssid" type="text" placeholder="MittWiFi" />
      </div>

      <div class="field-group">
        <label for="password">Lösenord</label>
        <input id="password" type="password" placeholder="Lösenord" />
      </div>

      <div class="field-group">
        <label for="encryption">Säkerhet</label>
        <select id="encryption">
          <option value="WPA">WPA/WPA2</option>
          <option value="WEP">WEP</option>
          <option value="nopass">Inget lösenord</option>
        </select>
      </div>

      <div class="checkbox-row">
        <input id="hiddenNetwork" type="checkbox" />
        <label for="hiddenNetwork">Dolt nätverk</label>
      </div>
    `;
  }

  attachLiveListeners();
}

function getCurrentFields() {
  const type = typeEl.value;

  if (type === "url" || type === "text") {
    return { content: document.getElementById("content")?.value || "" };
  }

  if (type === "phone") {
    return { phone: document.getElementById("phone")?.value || "" };
  }

  if (type === "email") {
    return {
      email: document.getElementById("email")?.value || "",
      subject: document.getElementById("subject")?.value || "",
      message: document.getElementById("message")?.value || ""
    };
  }

  if (type === "wifi") {
    return {
      ssid: document.getElementById("ssid")?.value || "",
      password: document.getElementById("password")?.value || "",
      encryption: document.getElementById("encryption")?.value || "WPA",
      hiddenNetwork: document.getElementById("hiddenNetwork")?.checked || false
    };
  }

  return {};
}

function buildQrData() {
  const type = typeEl.value;

  if (type === "url") {
    const content = document.getElementById("content").value.trim();
    if (!content) return { error: "" };
    if (!isValidUrl(content)) {
      return { error: "Ange en giltig URL, till exempel https://example.com" };
    }
    return { data: content };
  }

  if (type === "text") {
    const content = document.getElementById("content").value.trim();
    if (!content) return { error: "" };
    return { data: content };
  }

  if (type === "phone") {
    const phone = document.getElementById("phone").value.trim();
    if (!phone) return { error: "" };
    return { data: `tel:${phone}` };
  }

  if (type === "email") {
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!email) return { error: "" };
    if (!isValidEmail(email)) {
      return { error: "Ange en giltig e-postadress." };
    }

    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (message) params.set("body", message);

    return {
      data: params.toString()
        ? `mailto:${email}?${params.toString()}`
        : `mailto:${email}`
    };
  }

  if (type === "wifi") {
    const ssid = document.getElementById("ssid").value.trim();
    const password = document.getElementById("password").value;
    const encryption = document.getElementById("encryption").value;
    const hidden = document.getElementById("hiddenNetwork").checked;

    if (!ssid) return { error: "" };

    const safeSsid = escapeWifiValue(ssid);
    const safePassword = escapeWifiValue(password);

    let wifiString = `WIFI:T:${encryption};S:${safeSsid};`;

    if (encryption !== "nopass") {
      wifiString += `P:${safePassword};`;
    }

    if (hidden) {
      wifiString += `H:true;`;
    }

    wifiString += ";";

    return { data: wifiString };
  }

  return { error: "Okänd QR-typ." };
}

function updateQr() {
  errorEl.textContent = "";

  const result = buildQrData();
  const size = Number(sizeEl.value);
  const foregroundColor = foregroundColorEl.value;
  const backgroundColor = backgroundColorEl.value;

  qrWrapper.style.background = backgroundColor;

  if (!qrCode) {
    createQrInstance();
  }

  qrCode.update({
    width: size,
    height: size,
    data: result.data || " ",
    image: logoImage,
    dotsOptions: {
      color: foregroundColor,
      type: "rounded"
    },
    backgroundOptions: {
      color: backgroundColor
    },
    cornersSquareOptions: {
      type: "extra-rounded",
      color: foregroundColor
    },
    cornersDotOptions: {
      type: "dot",
      color: foregroundColor
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 6,
      imageSize: getLogoSize()
    }
  });

  if (!result.data && result.error) {
    errorEl.textContent = result.error;
  }
}

async function downloadQr(extension) {
  const result = buildQrData();

  if (!result.data) {
    errorEl.textContent = "Skapa en QR-kod först.";
    return;
  }

  try {
    await qrCode.download({
      name: "qr-kod",
      extension
    });
  } catch {
    errorEl.textContent = `Kunde inte ladda ner ${extension.toUpperCase()}.`;
  }
}

function getCanvasDataUrl() {
  const canvas = qrContainer.querySelector("canvas");
  if (!canvas) return null;
  return canvas.toDataURL("image/png");
}

async function shareQr() {
  const result = buildQrData();

  if (!result.data) {
    errorEl.textContent = "Skapa en QR-kod först.";
    return;
  }

  const source = getCanvasDataUrl();

  if (!source) {
    errorEl.textContent = "Kunde inte skapa bild för delning.";
    return;
  }

  try {
    const response = await fetch(source);
    const blob = await response.blob();
    const file = new File([blob], "qr-kod.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "QR Studio",
        text: "Här är min QR-kod",
        files: [file]
      });
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: "QR Studio",
        text: "Här är min QR-kod"
      });
      return;
    }

    errorEl.textContent = "Delning stöds inte här.";
  } catch {
    errorEl.textContent = "Kunde inte dela QR-koden.";
  }
}

function saveCurrentToHistory() {
  const result = buildQrData();

  if (!result.data) {
    errorEl.textContent = "Fyll i giltig information innan du sparar.";
    return;
  }

  const history = getHistory();
  history.unshift({
    type: typeEl.value,
    fields: getCurrentFields(),
    settings: {
      size: Number(sizeEl.value),
      foregroundColor: foregroundColorEl.value,
      backgroundColor: backgroundColorEl.value,
      logoSize: Number(logoSizeEl.value)
    },
    createdAt: Date.now()
  });

  setHistory(history.slice(0, 10));
  renderHistory();
  errorEl.textContent = "";
}

function loadHistoryItem(index) {
  const history = getHistory();
  const item = history[index];
  if (!item) return;

  typeEl.value = item.type;
  renderFields();

  sizeEl.value = item.settings.size;
  sizeValueEl.textContent = item.settings.size;
  foregroundColorEl.value = item.settings.foregroundColor;
  backgroundColorEl.value = item.settings.backgroundColor;

  if (item.settings.logoSize) {
    logoSizeEl.value = item.settings.logoSize;
    logoSizeValueEl.textContent = item.settings.logoSize;
  }

  if (item.type === "url" || item.type === "text") {
    document.getElementById("content").value = item.fields.content || "";
  } else if (item.type === "phone") {
    document.getElementById("phone").value = item.fields.phone || "";
  } else if (item.type === "email") {
    document.getElementById("email").value = item.fields.email || "";
    document.getElementById("subject").value = item.fields.subject || "";
    document.getElementById("message").value = item.fields.message || "";
  } else if (item.type === "wifi") {
    document.getElementById("ssid").value = item.fields.ssid || "";
    document.getElementById("password").value = item.fields.password || "";
    document.getElementById("encryption").value =
      item.fields.encryption || "WPA";
    document.getElementById("hiddenNetwork").checked =
      !!item.fields.hiddenNetwork;
  }

  updateQr();
}

function deleteHistoryItem(index) {
  const history = getHistory();
  history.splice(index, 1);
  setHistory(history);
  renderHistory();
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

function attachLiveListeners() {
  const inputs = dynamicFieldsEl.querySelectorAll("input, textarea, select");

  inputs.forEach((input) => {
    input.addEventListener("input", updateQr);
    input.addEventListener("change", updateQr);
  });
}

function updateNetworkBadge() {
  if (navigator.onLine) {
    networkBadgeEl.textContent = "Online";
    networkBadgeEl.className = "network-badge online";
  } else {
    networkBadgeEl.textContent = "Offline";
    networkBadgeEl.className = "network-badge offline";
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

logoUploadEl.addEventListener("change", () => {
  const file = logoUploadEl.files?.[0];

  if (!file) {
    logoImage = null;
    updateQr();
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    logoImage = event.target.result;
    updateQr();
  };

  reader.readAsDataURL(file);
});

removeLogoBtn.addEventListener("click", () => {
  logoImage = null;
  logoUploadEl.value = "";
  updateQr();
});

logoSizeEl.addEventListener("input", () => {
  logoSizeValueEl.textContent = logoSizeEl.value;
  updateQr();
});

sizeEl.addEventListener("input", () => {
  sizeValueEl.textContent = sizeEl.value;
  updateQr();
});

foregroundColorEl.addEventListener("input", updateQr);
backgroundColorEl.addEventListener("input", updateQr);

typeEl.addEventListener("change", () => {
  errorEl.textContent = "";
  renderFields();
  updateQr();
});

saveBtn.addEventListener("click", saveCurrentToHistory);
downloadBtn.addEventListener("click", () => downloadQr("png"));
downloadSvgBtn.addEventListener("click", () => downloadQr("svg"));
shareBtn.addEventListener("click", shareQr);
clearHistoryBtn.addEventListener("click", clearHistory);

historyListEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const index = Number(button.dataset.index);

  if (action === "load") loadHistoryItem(index);
  if (action === "delete") deleteHistoryItem(index);
});

window.addEventListener("online", updateNetworkBadge);
window.addEventListener("offline", updateNetworkBadge);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
    updateQr();
  }
});

logoSizeValueEl.textContent = logoSizeEl.value;
renderFields();
renderHistory();
createQrInstance();
updateQr();
updateNetworkBadge();
registerServiceWorker();