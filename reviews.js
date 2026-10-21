// ASH FLORA - LOVE NOTES DATA
// Add ONE object per real, approved review. Newest first is not required.
const REVIEWS = [
  // {
  //   id: 1,                        // unique number, increase by 1 each time
  //   name: "Riya",                 // first name only
  //   area: "Kothrud",              // optional
  //   rating: 5,                    // whole number 1 to 5
  //   text: "The tulips look so real and the fuzzy texture is adorable!",
  //   productId: "tulip-01",        // optional, must match an id in products.js
  //   category: "single-flowers",   // optional: keychains | single-flowers | bouquets | log-gardens
  //   date: "2026-10-12",           // YYYY-MM-DD
  //   photo: "images/reviews/riya-tulips.jpg", // optional
  //   verified: true                // true ONLY if she paid and received an order
  // },
];

// Screenshots of real WhatsApp/Instagram messages (hide names/numbers first).
const SCREENSHOTS = [
  // { src: "images/reviews/screens/screen-01.jpg", alt: "Customer message praising a bouquet" },
];

// Browser global export (works for direct double-click file:// and GitHub Pages)
if (typeof window !== "undefined") {
  window.REVIEWS = REVIEWS;
  window.SCREENSHOTS = SCREENSHOTS;
}

// Module export for Node.js / testing environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { REVIEWS, SCREENSHOTS };
}
