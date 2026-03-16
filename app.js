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

const HISTORY_KEY = "qr_studio_history_v8";

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
              <h3 class="history-name