// ASH FLORA - PRODUCTS & STORE CONFIGURATION
// Static configuration and product catalog for Ash Flora (Pune).

const CONFIG = {
  SHOP_NAME: "Ash Flora",
  TAGLINE: "Handmade Pipe Cleaner Blooms in Pune",
  CITY: "Pune",
  // WhatsApp business number in international format without '+' or spaces (e.g., "919876543210")
  WHATSAPP_NUMBER: "919876543210",

  // FR-16: Google Form URL for customer review submissions.
  // Paste your published Google Form link here (e.g., "https://forms.gle/xyz123").
  // If left empty (""), the "Write a review" Google Form button is automatically hidden.
  REVIEW_FORM_URL: "",

  // FR-16: Instagram handle for Ash Flora without '@' (e.g., "ashflora.pune").
  // Used to build the direct profile / DM link for customers who wish to review on Instagram.
  // If left empty (""), falls back to the default Instagram profile link.
  INSTAGRAM_HANDLE: "",

  // Instagram profile URL helper
  get INSTAGRAM_URL() {
    return this.INSTAGRAM_HANDLE
      ? `https://instagram.com/${this.INSTAGRAM_HANDLE}`
      : "https://instagram.com";
  }
};

// Store catalog items
const PRODUCTS = [
  {
    id: "tulip-01",
    name: "Ethereal Velvet Tulips",
    category: "single-flowers",
    categoryLabel: "Single Flowers",
    price: 199,
    image: "images/products/tulip-01.jpg",
    description: "Soft, fuzzy handcrafted pipe cleaner tulips in pastel blush and ivory tones. Lasts forever."
  },
  {
    id: "keychain-01",
    name: "BloomBud Blossom Keyring",
    category: "keychains",
    categoryLabel: "Keychains",
    price: 149,
    image: "images/products/keychain-01.jpg",
    description: "Adorable miniature flower bud keychain that adds handcrafted charm to your keys or bag."
  },
  {
    id: "bouquet-01",
    name: "Pastel Dream Wrapped Bouquet",
    category: "bouquets",
    categoryLabel: "Bouquets",
    price: 499,
    image: "images/products/bouquet-01.jpg",
    description: "A signature multi-flower bouquet hand-tied with satin ribbons, perfect for gifting in Pune."
  },
  {
    id: "log-garden-01",
    name: "Enchanted Moss Log Garden",
    category: "log-gardens",
    categoryLabel: "Log Gardens",
    price: 399,
    image: "images/products/log-garden-01.jpg",
    description: "Miniature woodland fantasy featuring colourful fuzzy blooms rooted in a faux moss wooden log."
  },
  {
    id: "sunflower-01",
    name: "Golden Sunshine Stem",
    category: "single-flowers",
    categoryLabel: "Single Flowers",
    price: 249,
    image: "images/products/sunflower-01.jpg",
    description: "Cheerful handcrafted sunflower with sculpted fuzzy petals to brighten any desk or windowsill."
  },
  {
    id: "lavender-01",
    name: "Calm Lavender Sprigs",
    category: "bouquets",
    categoryLabel: "Bouquets",
    price: 299,
    image: "images/products/lavender-01.jpg",
    description: "Delicate purple lavender bunch crafted with plush pipe cleaners. Never wilts, always joyful."
  }
];

// Helper to build WhatsApp ordering link for a specific product
function buildProductWhatsAppUrl(product, config) {
  const cfg = config || CONFIG;
  const number = (cfg && cfg.WHATSAPP_NUMBER) || "919876543210";
  const text = `Hi Ash Flora! I'd like to order: ${product.name} (₹${product.price}). Are you currently taking orders in Pune?`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

// Global browser registration
if (typeof window !== "undefined") {
  window.CONFIG = CONFIG;
  window.PRODUCTS = PRODUCTS;
  window.buildProductWhatsAppUrl = buildProductWhatsAppUrl;
}

// CommonJS module export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { CONFIG, PRODUCTS, buildProductWhatsAppUrl };
}
