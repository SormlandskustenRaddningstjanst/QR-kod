const typeEl = document.getElementById("type");
const dynamicFieldsEl = document.getElementById("dynamicFields");
const sizeEl = document.getElementById("size");
const sizeValueEl = document.getElementById("sizeValue");
const foregroundColorEl = document.getElementById("foregroundColor");
const backgroundColorEl = document.getElementById("backgroundColor");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const qrContainer = document.getElementById("qrcode");
const qrWrapper = document.getElementById("qrWrapper");
const errorEl = document.getElementById("error");

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

function renderFields() {
  const type = typeEl.value;

  if (type === "url") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="content">Länk</label>
        <input id="content" type="text" placeholder="https://example.com" />
      </div>
    `;
    return;
  }

  if (type === "text") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="content">Text</label>
        <textarea id="content" placeholder="Skriv din text här"></textarea>
      </div>
    `;
    return;
  }

  if (type === "phone") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="phone">Telefonnummer</label>
        <input id="phone" type="text" placeholder="+46701234567" />
        <p class="helper">Tips: använd landskod för bästa kompatibilitet.</p>
      </div>
    `;
    return;
  }

  if (type === "email") {
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
    return;
  }

  if (type === "wifi") {
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
}

function buildQrData() {
  const type = typeEl.value;

  if (type === "url") {
    const content = document.getElementById("content").value.trim();

    if (!content) {
      return { error: "Fyll i en länk." };
    }

    if (!isValidUrl(content)) {
      return { error: "Ange en giltig URL, till exempel https://example.com" };
    }

    return { data: content };
  }

  if (type === "text") {
    const content = document.getElementById("content").value.trim();

    if (!content) {
      return { error: "Fyll i text." };
    }

    return { data: content };
  }

  if (type === "phone") {
    const phone = document.getElementById("phone").value.trim();

    if (!phone) {
      return { error: "Fyll i ett telefonnummer." };
    }

    return { data: `tel:${phone}` };
  }

  if (type === "email") {
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!email) {
      return { error: "Fyll i en e-postadress." };
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
      return { error: "Fyll i Wi-Fi-namn." };
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
  clearQr();

  const result = buildQrData();

  if (result.error) {
    errorEl.textContent = result.error;
    return;
  }

  qrWrapper.style.background = backgroundColor;

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

typeEl.addEventListener("change", () => {
  renderFields();
  errorEl.textContent = "";
  clearQr();
});

generateBtn.addEventListener("click", generateQr);
downloadBtn.addEventListener("click", downloadQr);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
    generateQr();
  }
});

renderFields();