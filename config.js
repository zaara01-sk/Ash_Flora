// ASH FLORA — DEFAULT CONFIGURATION & SETTINGS LOADER
// Provides safe fallbacks when data/settings.json is loading or offline.

const DEFAULT_CONFIG = {
  SHOP_NAME: "Ash Flora",
  TAGLINE: "Handmade Pipe Cleaner Blooms in Pune",
  CITY: "Pune",
  WHATSAPP_NUMBER: "919876543210",
  INSTAGRAM_HANDLE: "ashflora.pune",
  REVIEW_FORM_URL: "",
  announcement: "🌸 Handmade pipe cleaner blooms in Pune · Local delivery & pickup available",
  ordersOpen: true,
  closedMessage: "We are temporarily pausing new orders to fulfill ongoing handcrafted requests. The shop is still browsable!",
  giftWrapPrice: 49,
  occasions: [
    "Birthday",
    "Anniversary",
    "Valentine's",
    "Raksha Bandhan",
    "Diwali",
    "Wedding",
    "Home decor"
  ],
  policyVersion: "v1.0",
  policyText: "Strictly no refunds, no returns, no exchanges. Every Ash Flora piece is handmade for you, so all sales are final. This applies to change of mind, colour or size preference, and ordering the wrong item. Please check photos, colours and details before you order. Handmade items can differ slightly from photos, and screens show colours differently.\n\nCustom orders: The 50% advance is non-refundable. A custom order cannot be cancelled once we have started making it.\n\nCancellations: A ready-made order can be cancelled only before the owner replies Confirmed on WhatsApp.\n\nDamaged or wrong item: If your order arrives damaged or different from what you ordered, message us on WhatsApp within 24 hours with clear photos or an unboxing video and your invoice number. We will repair or replace the item at our discretion. We do not give refunds in cash or by UPI.",
  damageClauseEnabled: true,
  deliveryNote: "We deliver within Pune only. Delivery charge is confirmed on WhatsApp."
};

let currentConfig = { ...DEFAULT_CONFIG };

async function loadSettings() {
  try {
    const res = await fetch("data/settings.json", { cache: "no-cache" });
    if (res.ok) {
      const data = await res.json();
      currentConfig = {
        ...DEFAULT_CONFIG,
        ...data,
        // Map camelCase to uppercase aliases for backwards compatibility
        WHATSAPP_NUMBER: data.whatsappNumber || DEFAULT_CONFIG.WHATSAPP_NUMBER,
        INSTAGRAM_HANDLE: data.instagramHandle || DEFAULT_CONFIG.INSTAGRAM_HANDLE,
        REVIEW_FORM_URL: data.reviewFormUrl !== undefined ? data.reviewFormUrl : DEFAULT_CONFIG.REVIEW_FORM_URL
      };
      if (typeof window !== "undefined") {
        window.CONFIG = currentConfig;
      }
      return currentConfig;
    }
  } catch (err) {
    console.warn("[Ash Flora] Could not load data/settings.json, using default settings:", err);
  }
  return currentConfig;
}

if (typeof window !== "undefined") {
  window.CONFIG = currentConfig;
  window.loadSettings = loadSettings;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_CONFIG, loadSettings };
}
