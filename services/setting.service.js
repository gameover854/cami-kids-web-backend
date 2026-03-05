const fs = require("fs/promises");
const path = require("path");

const SETTINGS_DIR = path.join(__dirname, "..", "data");
const SETTINGS_FILE = path.join(SETTINGS_DIR, "settings.json");

const defaultSettings = {
  store_name: "Cami Kids",
  support_email: "support@cami.local",
  support_phone: "",
  timezone: "Asia/Ho_Chi_Minh",
  auto_cancel_hours: 24,
  low_stock_threshold: 5,
  allow_guest_checkout: false,
};

async function ensureSettingsFile() {
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), "utf8");
  }
}

async function getSettings() {
  await ensureSettingsFile();
  const raw = await fs.readFile(SETTINGS_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return { ...defaultSettings, ...parsed };
}

async function updateSettings(partialSettings) {
  const current = await getSettings();
  const merged = { ...current, ...partialSettings };
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

module.exports = {
  getSettings,
  updateSettings,
};
