const SUPABASE_URL = "https://msgcthdjhpjiuffcvuxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZ2N0aGRqaHBqaXVmZmN2dXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTc3NzYsImV4cCI6MjA4OTE5Mzc3Nn0.HFr-tYME8WhcQYcZ1o25bIj-7aHBu7IYN8a3hn66D0s";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const typeEl = document.getElementById("type");
const qrNameEl = document.getElementById("qrName");
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
const historySearchEl = document.getElementById("historySearch");
const historyFilterEl = document.getElementById("historyFilter");
const historyListEl = document.getElementById("historyList");
const qrContainer = document.getElementById("qrcode");
const qrWrapper = document.getElementById("qrWrapper");
const errorEl = document.getElementById("error");
const networkBadgeEl = document.getElementById("networkBadge");

const authEmailEl = document.getElementById("authEmail");
const authPasswordEl = document.getElementById("authPassword");
const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const importLocalBtn = document.getElementById("importLocalBtn");
const authLoggedOutEl = document.getElementById("authLoggedOut");
const authLoggedInEl = document.getElementById("authLoggedIn");
const userEmailEl = document.getElementById("userEmail");
const authMessageEl = document.getElementById("authMessage");

const HISTORY_KEY = "qr_studio_history_v10";

let qrCode = null;
let logoImage = null;
let currentUser = null;

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

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultName() {
  const type = typeEl.value;
  const map = {
    url: "Ny URL-kod",
    text: "Ny textkod",
    phone: "Nytt telefonnummer",
    email: "Ny e-postkod",
    sms: "Nytt SMS",
    whatsapp: "Ny WhatsApp-kod",
    vcard: "Nytt kontaktkort",
    wifi: "Nytt Wi-Fi"
  };
  return map[type] || "Ny QR-kod";
}

function escapeWifiValue(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:");
}

function escapeVCardValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
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
    sms: "SMS",
    whatsapp: "WhatsApp",
    vcard: "Kontaktkort",
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
  if (item.type === "sms") return item.fields.smsPhone || "";
  if (item.type === "whatsapp") return item.fields.waPhone || "";
  if (item.type === "vcard") return item.fields.fullName || "";
  if (item.type === "wifi") return item.fields.ssid || "";
  if (item.type === "phone") return item.fields.phone || "";
  return item.fields.content || "";
}

function formatDate(timestamp) {
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

function getFilteredHistory() {
  const search = historySearchEl.value.trim().toLowerCase();
  const filter = historyFilterEl.value;
  const items = getHistory();

  const filtered = items.filter((item) => {
    const matchesType = filter === "all" || item.type === filter;

    const haystack = [
      item.name || "",
      getTypeLabel(item.type),
      previewText(item)
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !search || haystack.includes(search);

    return matchesType && matchesSearch;
  });

  filtered.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  return filtered;
}

function renderHistory() {
  const items = getFilteredHistory();

  if (!items.length) {
    historyListEl.innerHTML = `<p class="empty-state">Ingen historik matchar din sökning.</p>`;
    return;
  }

  historyListEl.innerHTML = items
    .map((item) => {
      return `
        <div class="history-item ${item.isFavorite ? "is-favorite" : ""}">
          <div class="history-item-top">
            <div>
              <span class="history-type">${getTypeLabel(item.type)}</span>
              <h3 class="history-name">${escapeHtml(item.name || "Ny QR-kod")}</h3>
            </div>
            <button class="history-star" data-action="favorite" data-id="${item.id}" type="button">
              ${item.isFavorite ? "★" : "☆"}
            </button>
          </div>

          <p class="history-text">${escapeHtml(previewText(item))}</p>
          <p class="history-date">Sparad: ${escapeHtml(formatDate(item.createdAt))}</p>

          <div class="history-actions">
            <button data-action="load" data-id="${item.id}" type="button">Använd igen</button>
            <button data-action="duplicate" data-id="${item.id}" type="button">Duplicera</button>
            <button data-action="delete" data-id="${item.id}" type="button">Ta bort</button>
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
  } else if (type === "sms") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="smsPhone">Telefonnummer</label>
        <input id="smsPhone" type="text" placeholder="+46701234567" />
      </div>

      <div class="field-group">
        <label for="smsMessage">Meddelande</label>
        <textarea id="smsMessage" placeholder="Hej!"></textarea>
      </div>
    `;
  } else if (type === "whatsapp") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="waPhone">Telefonnummer</label>
        <input id="waPhone" type="text" placeholder="46701234567" />
        <p class="helper">Ange helst landskod utan mellanslag, till exempel 46701234567.</p>
      </div>

      <div class="field-group">
        <label for="waMessage">Meddelande</label>
        <textarea id="waMessage" placeholder="Hej!"></textarea>
      </div>
    `;
  } else if (type === "vcard") {
    dynamicFieldsEl.innerHTML = `
      <div class="field-group">
        <label for="fullName">Fullständigt namn</label>
        <input id="fullName" type="text" placeholder="Anna Andersson" />
      </div>

      <div class="field-group">
        <label for="company">Företag</label>
        <input id="company" type="text" placeholder="Mitt Företag AB" />
      </div>

      <div class="field-group">
        <label for="title">Titel</label>
        <input id="title" type="text" placeholder="Marknadschef" />
      </div>

      <div class="field-group">
        <label for="vcardPhone">Telefon</label>
        <input id="vcardPhone" type="text" placeholder="+46701234567" />
      </div>

      <div class="field-group">
        <label for="vcardEmail">E-post</label>
        <input id="vcardEmail" type="email" placeholder="anna@example.com" />
      </div>

      <div class="field-group">
        <label for="website">Webbplats</label>
        <input id="website" type="text" placeholder="https://example.com" />
      </div>

      <div class="field-group">
        <label for="address">Adress</label>
        <textarea id="address" placeholder="Storgatan 1, 111 22 Stockholm"></textarea>
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

  if (type === "sms") {
    return {
      smsPhone: document.getElementById("smsPhone")?.value || "",
      smsMessage: document.getElementById("smsMessage")?.value || ""
    };
  }

  if (type === "whatsapp") {
    return {
      waPhone: document.getElementById("waPhone")?.value || "",
      waMessage: document.getElementById("waMessage")?.value || ""
    };
  }

  if (type === "vcard") {
    return {
      fullName: document.getElementById("fullName")?.value || "",
      company: document.getElementById("company")?.value || "",
      title: document.getElementById("title")?.value || "",
      vcardPhone: document.getElementById("vcardPhone")?.value || "",
      vcardEmail: document.getElementById("vcardEmail")?.value || "",
      website: document.getElementById("website")?.value || "",
      address: document.getElementById("address")?.value || ""
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

  if (type === "sms") {
    const phone = document.getElementById("smsPhone").value.trim();
    const message = document.getElementById("smsMessage").value.trim();

    if (!phone) return { error: "Fyll i ett telefonnummer för SMS." };

    return { data: `SMSTO:${phone}:${message}` };
  }

  if (type === "whatsapp") {
    const phone = normalizePhone(document.getElementById("waPhone").value.trim());
    const message = document.getElementById("waMessage").value.trim();

    if (!phone) return { error: "Fyll i ett telefonnummer för WhatsApp." };

    const url = new URL(`https://wa.me/${phone.replace(/^\+/, "")}`);
    if (message) url.searchParams.set("text", message);

    return { data: url.toString() };
  }

  if (type === "vcard") {
    const fullName = document.getElementById("fullName").value.trim();
    const company = document.getElementById("company").value.trim();
    const title = document.getElementById("title").value.trim();
    const phone = document.getElementById("vcardPhone").value.trim();
    const email = document.getElementById("vcardEmail").value.trim();
    const website = document.getElementById("website").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!fullName) return { error: "Fyll i namn för kontaktkortet." };
    if (email && !isValidEmail(email)) {
      return { error: "Ange en giltig e-postadress i kontaktkortet." };
    }
    if (website && !isValidUrl(website)) {
      return { error: "Ange en giltig webbplats i kontaktkortet." };
    }

    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${escapeVCardValue(fullName)}`
    ];

    if (company) lines.push(`ORG:${escapeVCardValue(company)}`);
    if (title) lines.push(`TITLE:${escapeVCardValue(title)}`);
    if (phone) lines.push(`TEL:${escapeVCardValue(phone)}`);
    if (email) lines.push(`EMAIL:${escapeVCardValue(email)}`);
    if (website) lines.push(`URL:${escapeVCardValue(website)}`);
    if (address) lines.push(`ADR:;;${escapeVCardValue(address)};;;;`);
    lines.push("END:VCARD");

    return { data: lines.join("\n") };
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
    if (encryption !== "nopass") wifiString += `P:${safePassword};`;
    if (hidden) wifiString += `H:true;`;
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

  if (!qrCode) createQrInstance();

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

function buildHistoryItem() {
  const result = buildQrData();

  if (!result.data) {
    errorEl.textContent = "Fyll i giltig information innan du sparar.";
    return null;
  }

  return {
    id: generateId(),
    name: qrNameEl.value.trim() || getDefaultName(),
    type: typeEl.value,
    fields: getCurrentFields(),
    settings: {
      size: Number(sizeEl.value),
      foregroundColor: foregroundColorEl.value,
      backgroundColor: backgroundColorEl.value,
      logoSize: Number(logoSizeEl.value)
    },
    createdAt: Date.now(),
    isFavorite: false
  };
}

function normalizeCloudItems(data) {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    fields: item.fields || {},
    settings: item.settings || {},
    isFavorite: item.is_favorite || false,
    createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
  }));
}

function findHistoryItemById(id) {
  return getHistory().find((item) => item.id === id);
}

function applyItemToForm(item) {
  qrNameEl.value = item.name || "";
  typeEl.value = item.type;
  renderFields();

  sizeEl.value = item.settings.size || 220;
  sizeValueEl.textContent = sizeEl.value;
  foregroundColorEl.value = item.settings.foregroundColor || "#111111";
  backgroundColorEl.value = item.settings.backgroundColor || "#ffffff";
  logoSizeEl.value = item.settings.logoSize || 25;
  logoSizeValueEl.textContent = logoSizeEl.value;

  if (item.type === "url" || item.type === "text") {
    document.getElementById("content").value = item.fields.content || "";
  } else if (item.type === "phone") {
    document.getElementById("phone").value = item.fields.phone || "";
  } else if (item.type === "email") {
    document.getElementById("email").value = item.fields.email || "";
    document.getElementById("subject").value = item.fields.subject || "";
    document.getElementById("message").value = item.fields.message || "";
  } else if (item.type === "sms") {
    document.getElementById("smsPhone").value = item.fields.smsPhone || "";
    document.getElementById("smsMessage").value = item.fields.smsMessage || "";
  } else if (item.type === "whatsapp") {
    document.getElementById("waPhone").value = item.fields.waPhone || "";
    document.getElementById("waMessage").value = item.fields.waMessage || "";
  } else if (item.type === "vcard") {
    document.getElementById("fullName").value = item.fields.fullName || "";
    document.getElementById("company").value = item.fields.company || "";
    document.getElementById("title").value = item.fields.title || "";
    document.getElementById("vcardPhone").value = item.fields.vcardPhone || "";
    document.getElementById("vcardEmail").value = item.fields.vcardEmail || "";
    document.getElementById("website").value = item.fields.website || "";
    document.getElementById("address").value = item.fields.address || "";
  } else if (item.type === "wifi") {
    document.getElementById("ssid").value = item.fields.ssid || "";
    document.getElementById("password").value = item.fields.password || "";
    document.getElementById("encryption").value = item.fields.encryption || "WPA";
    document.getElementById("hiddenNetwork").checked = !!item.fields.hiddenNetwork;
  }

  updateQr();
}

function saveCurrentToLocal() {
  const item = buildHistoryItem();
  if (!item) return;

  const history = getHistory();
  history.unshift(item);
  setHistory(history.slice(0, 50));
  renderHistory();
  errorEl.textContent = "";
}

async function loadCloudHistory() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    authMessageEl.textContent = "Kunde inte läsa sparade QR-koder.";
    return;
  }

  setHistory(normalizeCloudItems(data || []));
  renderHistory();
}

function makeImportFingerprint(item) {
  return JSON.stringify({
    name: item.name || "",
    type: item.type || "",
    fields: item.fields || {},
    settings: item.settings || {}
  });
}

async function importLocalHistoryToCloud() {
  if (!currentUser) {
    authMessageEl.textContent = "Logga in först.";
    return;
  }

  const localItems = getHistory();
  if (!localItems.length) {
    authMessageEl.textContent = "Ingen lokal historik att importera.";
    return;
  }

  authMessageEl.textContent = "Importerar lokal historik...";

  const { data: existingData, error: existingError } = await supabase
    .from("qr_codes")
    .select("name, type, fields, settings")
    .order("created_at", { ascending: false });

  if (existingError) {
    authMessageEl.textContent = "Kunde inte läsa molnhistorik före import.";
    return;
  }

  const existingFingerprints = new Set(
    (existingData || []).map((item) =>
      makeImportFingerprint({
        name: item.name,
        type: item.type,
        fields: item.fields,
        settings: item.settings
      })
    )
  );

  const rowsToInsert = localItems
    .filter((item) => {
      const fingerprint = makeImportFingerprint(item);
      return !existingFingerprints.has(fingerprint);
    })
    .map((item) => ({
      user_id: currentUser.id,
      name: item.name || getDefaultName(),
      type: item.type,
      fields: item.fields || {},
      settings: item.settings || {},
      is_favorite: !!item.isFavorite
    }));

  if (!rowsToInsert.length) {
    authMessageEl.textContent = "All lokal historik finns redan i kontot.";
    await loadCloudHistory();
    return;
  }

  const { error } = await supabase.from("qr_codes").insert(rowsToInsert);

  if (error) {
    authMessageEl.textContent = "Kunde inte importera lokal historik.";
    return;
  }

  authMessageEl.textContent = `${rowsToInsert.length} poster importerades till ditt konto.`;
  await loadCloudHistory();
}

async function saveCurrent() {
  if (!currentUser) {
    saveCurrentToLocal();
    return;
  }

  const item = buildHistoryItem();
  if (!item) return;

  const payload = {
    user_id: currentUser.id,
    name: item.name,
    type: item.type,
    fields: item.fields,
    settings: item.settings,
    is_favorite: item.isFavorite
  };

  const { error } = await supabase.from("qr_codes").insert(payload);

  if (error) {
    authMessageEl.textContent = "Kunde inte spara i molnet.";
    return;
  }

  authMessageEl.textContent = "Sparad i ditt konto.";
  await loadCloudHistory();
}

async function deleteItem(id) {
  if (!currentUser) {
    setHistory(getHistory().filter((item) => item.id !== id));
    renderHistory();
    return;
  }

  const { error } = await supabase.from("qr_codes").delete().eq("id", id);

  if (error) {
    authMessageEl.textContent = "Kunde inte ta bort QR-koden.";
    return;
  }

  await loadCloudHistory();
}

async function toggleFavorite(id) {
  const item = findHistoryItemById(id);
  if (!item) return;

  if (!currentUser) {
    const history = getHistory().map((entry) =>
      entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
    );
    setHistory(history);
    renderHistory();
    return;
  }

  const { error } = await supabase
    .from("qr_codes")
    .update({ is_favorite: !item.isFavorite, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    authMessageEl.textContent = "Kunde inte uppdatera favorit.";
    return;
  }

  await loadCloudHistory();
}

async function duplicateItem(id) {
  const item = findHistoryItemById(id);
  if (!item) return;

  const duplicated = {
    ...item,
    id: generateId(),
    name: `${item.name || getDefaultName()} (kopia)`,
    createdAt: Date.now(),
    isFavorite: false
  };

  if (!currentUser) {
    const history = getHistory();
    history.unshift(duplicated);
    setHistory(history.slice(0, 50));
    renderHistory();
    return;
  }

  const payload = {
    user_id: currentUser.id,
    name: duplicated.name,
    type: duplicated.type,
    fields: duplicated.fields,
    settings: duplicated.settings,
    is_favorite: false
  };

  const { error } = await supabase.from("qr_codes").insert(payload);

  if (error) {
    authMessageEl.textContent = "Kunde inte duplicera QR-koden.";
    return;
  }

  await loadCloudHistory();
}

function loadHistoryItem(id) {
  const item = findHistoryItemById(id);
  if (!item) return;
  applyItemToForm(item);
}

function clearHistory() {
  if (currentUser) {
    authMessageEl.textContent = "Ta bort poster en och en när du är inloggad.";
    return;
  }

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

async function refreshAuthState() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    authMessageEl.textContent = "Kunde inte läsa session.";
    return;
  }

  currentUser = data.session?.user || null;

  if (currentUser) {
    authLoggedOutEl.hidden = true;
    authLoggedInEl.hidden = false;
    userEmailEl.textContent = currentUser.email || "";
    await loadCloudHistory();
  } else {
    authLoggedOutEl.hidden = false;
    authLoggedInEl.hidden = true;
    userEmailEl.textContent = "";
    renderHistory();
  }
}

async function signUp() {
  const email = authEmailEl.value.trim();
  const password = authPasswordEl.value;

  if (!email || !password) {
    authMessageEl.textContent = "Fyll i e-post och lösenord.";
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  authMessageEl.textContent = error
    ? error.message
    : "Konto skapat. Kontrollera din e-post om bekräftelse krävs.";
}

async function signIn() {
  const email = authEmailEl.value.trim();
  const password = authPasswordEl.value;

  if (!email || !password) {
    authMessageEl.textContent = "Fyll i e-post och lösenord.";
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    authMessageEl.textContent = error.message;
    return;
  }

  authMessageEl.textContent = "Inloggad.";
  await refreshAuthState();
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  authMessageEl.textContent = error ? error.message : "Utloggad.";
  await refreshAuthState();
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

signUpBtn.addEventListener("click", signUp);
signInBtn.addEventListener("click", signIn);
signOutBtn.addEventListener("click", signOut);
importLocalBtn.addEventListener("click", importLocalHistoryToCloud);

saveBtn.addEventListener("click", saveCurrent);
downloadBtn.addEventListener("click", () => downloadQr("png"));
downloadSvgBtn.addEventListener("click", () => downloadQr("svg"));
shareBtn.addEventListener("click", shareQr);
clearHistoryBtn.addEventListener("click", clearHistory);

historySearchEl.addEventListener("input", renderHistory);
historyFilterEl.addEventListener("change", renderHistory);

historyListEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!id) return;

  if (action === "load") loadHistoryItem(id);
  if (action === "duplicate") await duplicateItem(id);
  if (action === "delete") await deleteItem(id);
  if (action === "favorite") await toggleFavorite(id);
});

window.addEventListener("online", updateNetworkBadge);
window.addEventListener("offline", updateNetworkBadge);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
    updateQr();
  }
});

supabase.auth.onAuthStateChange(async () => {
  await refreshAuthState();
});

logoSizeValueEl.textContent = logoSizeEl.value;
renderFields();
renderHistory();
createQrInstance();
updateQr();
updateNetworkBadge();
registerServiceWorker();
refreshAuthState();