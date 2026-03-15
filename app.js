const typeEl = document.getElementById("type");
const dynamicFieldsEl = document.getElementById("dynamicFields");
const sizeEl = document.getElementById("size");
const sizeValueEl = document.getElementById("sizeValue");
const foregroundColorEl = document.getElementById("foregroundColor");
const backgroundColorEl = document.getElementById("backgroundColor");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const historyListEl = document.getElementById("historyList");
const qrContainer = document.getElementById("qrcode");
const qrWrapper = document.getElementById("qrWrapper");
const errorEl = document.getElementById("error");

const HISTORY_KEY = "qr_studio_history_v1";

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

function clearQr() {
  qrContainer.innerHTML = "";
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

function previewText(item) {
  if (item.type === "email") {
    return item.fields.email || "";
  }

  if (item.type === "wifi") {
    return item.fields.ssid || "";
  }

  if (item.type === "phone") {
    return item.fields.phone || "";
  }

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
          <div class="history-top">
            <div>
              <span class="history-type">${getTypeLabel(item.type)}</span>
              <p class="history-text">${escapeHtml(previewText(item))}</p>
            </div>
          </div>
          <div class="history-actions">
            <button data-action="load" data-index="${index}">Använd igen</button>
            <button data-action="delete" data-index="${index}">Ta bort</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
        <p class="helper">Tips: använd landskod för bästa kompatibilitet.</p>
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
    return {
      content: document.getElementById("content")?.value || ""
    };
  }

  if (type === "phone") {
    return {
      phone: document.getElementById("phone")?.value || ""
    };
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

    if (!content) {
      return { error: "" };
    }

    if (!isValidUrl(content)) {
      return { error: "Ange en giltig URL, till exempel https://example.com" };
    }

    return { data: content };
  }

  if (type === "text") {
    const content = document.getElementById("content").value.trim();

    if (!content) {
      return { error: "" };
    }

    return { data: content };
  }

  if (type === "phone") {
    const phone = document.getElementById("phone").value.trim();

    if (!phone) {
      return { error: "" };
    }

    return { data: `tel:${phone}` };
  }

  if (type === "email") {
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!email) {
      return { error: "" };
    }

    if (!isValidEmail(email)) {
      return { error: "Ange en giltig e-postadress." };
    }

    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (message) params.set("body", message);

    const mailto = params.toString()
      ? `mailto:${email}?${params.toString()}`
      : `mailto:${email}`;

    return { data: mailto };
  }

  if (type === "wifi") {
    const ssid = document.getElementById("ssid").value.trim();
    const password = document.getElementById("password").value;
    const encryption = document.getElementById("encryption").value;
    const hidden = document.getElementById("hiddenNetwork").checked;

    if (!ssid) {
      return { error: "" };
    }

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

function generateQr() {
  const size = Number(sizeEl.value);
  const foregroundColor = foregroundColorEl.value;
  const backgroundColor = backgroundColorEl.value;

  errorEl.textContent = "";

  const result = buildQrData();

  clearQr();
  qrWrapper.style.background = backgroundColor;

  if (!result.data) {
    if (result.error) {
      errorEl.textContent = result.error;
    }
    return;
  }

  new QRCode(qrContainer, {
    text: result.data,
    width: size,
    height: size,
    colorDark: foregroundColor,
    colorLight: backgroundColor,
    correctLevel: QRCode.CorrectLevel.H
  });
}

function downloadQr() {
  const img = qrContainer.querySelector("img");
  const canvas = qrContainer.querySelector("canvas");

  let source = null;

  if (canvas) {
    source = canvas.toDataURL("image/png");
  } else if (img) {
    source = img.src;
  }

  if (!source) {
    errorEl.textContent = "Skapa en QR-kod först.";
    return;
  }

  const link = document.createElement("a");
  link.href = source;
  link.download = "qr-kod.png";
  link.click();
}

function saveCurrentToHistory() {
  const result = buildQrData();

  if (!result.data) {
    errorEl.textContent = "Fyll i giltig information innan du sparar.";
    return;
  }

  const item = {
    type: typeEl.value,
    fields: getCurrentFields(),
    settings: {
      size: Number(sizeEl.value),
      foregroundColor: foregroundColorEl.value,
      backgroundColor: backgroundColorEl.value
    },
    createdAt: Date.now()
  };

  const history = getHistory();

  history.unshift(item);

  const trimmed = history.slice(0, 10);
  setHistory(trimmed);
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

  if (item.type === "url" || item.type === "text") {
    document.getElementById("content").value = item.fields.content || "";
  }

  if (item.type === "phone") {
    document.getElementById("phone").value = item.fields.phone || "";
  }

  if (item.type === "email") {
    document.getElementById("email").value = item.fields.email || "";
    document.getElementById("subject").value = item.fields.subject || "";
    document.getElementById("message").value = item.fields.message || "";
  }

  if (item.type === "wifi") {
    document.getElementById("ssid").value = item.fields.ssid || "";
    document.getElementById("password").value = item.fields.password || "";
    document.getElementById("encryption").value = item.fields.encryption || "WPA";
    document.getElementById("hiddenNetwork").checked = !!item.fields.hiddenNetwork;
  }

  generateQr();
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
    input.addEventListener("input", generateQr);
    input.addEventListener("change", generateQr);
  });
}

sizeEl.addEventListener("input", () => {
  sizeValueEl.textContent = sizeEl.value;
  generateQr();
});

foregroundColorEl.addEventListener("input", generateQr);
backgroundColorEl.addEventListener("input", generateQr);

typeEl.addEventListener("change", () => {
  errorEl.textContent = "";
  clearQr();
  renderFields();
  generateQr();
});

saveBtn.addEventListener("click", saveCurrentToHistory);
downloadBtn.addEventListener("click", downloadQr);
clearHistoryBtn.addEventListener("click", clearHistory);

historyListEl.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const index = Number(button.dataset.index);

  if (action === "load") {
    loadHistoryItem(index);
  }

  if (action === "delete") {
    deleteHistoryItem(index);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
    generateQr();
  }
});

renderFields();
renderHistory();
generateQr();