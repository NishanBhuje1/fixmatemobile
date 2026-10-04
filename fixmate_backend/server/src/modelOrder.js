// Newest-first ordering for "Apple iPhone" models.
// Grouped by generation (newest first), then Pro Max → Pro → Plus → base → Mini → E.
// Other brands keep plain alphabetical order.

const IPHONE_BRAND = "Apple iPhone";

// Models whose name doesn't start with a generation number, placed by release date.
const SPECIAL_GENERATIONS = {
  "SE (3rd Gen)": 13.5, // 2022
  "SE (2nd Gen)": 11.5, // 2020
  "XS Max": 10.5, // 2018
  XS: 10.5,
  XR: 10.5,
  X: 10, // 2017
};

const TIERS = ["pro max", "pro", "plus", "xs max", "xs", "", "xr", "x", "mini", "e"];

function iphoneSortKey(model) {
  const name = model.replace(/^iPhone\s+/i, "").trim();

  if (name in SPECIAL_GENERATIONS) {
    return { generation: SPECIAL_GENERATIONS[name], tier: TIERS.indexOf(name.toLowerCase()) };
  }

  // e.g. "16 Pro Max", "6s Plus", "16E"
  const m = name.match(/^(\d+)(s?)(e?)\s*(.*)$/i);
  if (!m) return { generation: -1, tier: 0 }; // unknown naming → bottom of the list

  const generation = Number(m[1]) + (m[2] ? 0.5 : 0);
  const tierName = m[3] ? "e" : m[4].trim().toLowerCase();
  const tier = TIERS.indexOf(tierName);
  return { generation, tier: tier === -1 ? TIERS.length : tier };
}

export function compareModels(brand, a, b) {
  if (brand !== IPHONE_BRAND) return a.localeCompare(b);

  const ka = iphoneSortKey(a);
  const kb = iphoneSortKey(b);
  return kb.generation - ka.generation || ka.tier - kb.tier || a.localeCompare(b);
}
