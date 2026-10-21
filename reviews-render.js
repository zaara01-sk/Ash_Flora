// ASH FLORA - LOVE NOTES (CUSTOMER REVIEWS) ENGINE
// Implements validation, sorting, calculation, rendering, filters, and interactions.

/**
 * Validates a single review entry based on PRD FR-2 & Edge Cases:
 * - rating must be an integer from 1 to 5
 * - text must be non-empty and <= 600 characters
 * - name must be non-empty
 * - date must be formatted YYYY-MM-DD
 * - duplicate id: keep first, warn on rest
 * - future dates: show but warn
 * - very long names: truncate with ellipsis at 24 chars
 */
function validateReviews(rawList, productsList) {
  const reviewsArr = rawList || [];
  const prodsArr = productsList || [];

  if (!Array.isArray(reviewsArr)) {
    console.warn("[Love Notes] Provided reviews is not an array:", reviewsArr);
    return [];
  }

  const seenIds = new Set();
  const validList = [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const productsMap = new Map();
  if (Array.isArray(prodsArr)) {
    prodsArr.forEach(p => {
      if (p && p.id) productsMap.set(p.id, p);
    });
  }

  reviewsArr.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      console.warn(`[Love Notes] Skipping review at index ${index}: not an object`, item);
      return;
    }

    // 1. ID check and duplicate handling
    const rawId = item.id !== undefined && item.id !== null ? item.id : index + 1;
    if (seenIds.has(rawId)) {
      console.warn(`[Love Notes] Skipping review with duplicate id "${rawId}":`, item);
      return;
    }

    // 2. Rating validation: whole integer between 1 and 5
    const rating = Number(item.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      console.warn(`[Love Notes] Skipping review "${rawId}": rating must be an integer from 1 to 5. Received:`, item.rating);
      return;
    }

    // 3. Name validation: non-empty string
    const rawName = typeof item.name === "string" ? item.name.trim() : "";
    if (!rawName) {
      console.warn(`[Love Notes] Skipping review "${rawId}": name cannot be empty.`, item);
      return;
    }
    // Truncate name at 24 chars if longer
    const name = rawName.length > 24 ? rawName.slice(0, 24) + "…" : rawName;

    // 4. Text validation: non-empty, max 600 characters
    const text = typeof item.text === "string" ? item.text.trim() : "";
    if (!text || text.length > 600) {
      console.warn(`[Love Notes] Skipping review "${rawId}": text must be between 1 and 600 characters. Length: ${text.length}`);
      return;
    }

    // 5. Date validation: strict YYYY-MM-DD
    const dateStr = typeof item.date === "string" ? item.date.trim() : "";
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!dateRegex.test(dateStr)) {
      console.warn(`[Love Notes] Skipping review "${rawId}": date must be strictly formatted YYYY-MM-DD. Received:`, item.date);
      return;
    }
    // Future date check: still shown, but warn
    if (dateStr > todayStr) {
      console.warn(`[Love Notes] Review "${rawId}" has a future date (${dateStr}). Displaying with warning.`);
    }

    // 6. Product association: unknown productId allowed, product link omitted if invalid
    let matchedProduct = null;
    if (item.productId && productsMap.has(item.productId)) {
      matchedProduct = productsMap.get(item.productId);
    }

    // 7. Category determination (review.category fallback to product.category)
    let category = item.category;
    if (!category && matchedProduct && matchedProduct.category) {
      category = matchedProduct.category;
    }

    seenIds.add(rawId);

    validList.push({
      id: rawId,
      name,
      area: typeof item.area === "string" ? item.area.trim() : "",
      rating,
      text,
      productId: item.productId || "",
      productName: matchedProduct ? matchedProduct.name : "",
      category: category || "",
      date: dateStr,
      photo: typeof item.photo === "string" ? item.photo.trim() : "",
      verified: Boolean(item.verified)
    });
  });

  return validList;
}

/**
 * FR-8: Sorting: newest date first, ties broken by higher id.
 */
function sortReviews(reviewsList) {
  return [...reviewsList].sort((a, b) => {
    if (b.date !== a.date) {
      return b.date.localeCompare(a.date);
    }
    const idA = typeof a.id === "number" ? a.id : Number(a.id) || 0;
    const idB = typeof b.id === "number" ? b.id : Number(b.id) || 0;
    return idB - idA;
  });
}

/**
 * Formats a YYYY-MM-DD date to "12 Oct 2026" (en-IN).
 */
function formatReviewDate(dateStr) {
  try {
    const parts = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return dateObj.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Calculates review stats: average rating to 1 decimal, total count, star breakdown 5-to-1.
 */
function computeReviewStats(reviewsList) {
  const total = reviewsList ? reviewsList.length : 0;
  if (total === 0) {
    return {
      total: 0,
      average: "0.0",
      numericAverage: 0,
      counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviewsList.forEach(r => {
    sum += r.rating;
    if (counts[r.rating] !== undefined) {
      counts[r.rating] += 1;
    }
  });

  const avgNum = sum / total;
  const average = avgNum.toFixed(1);

  const percentages = {
    5: Math.round((counts[5] / total) * 100),
    4: Math.round((counts[4] / total) * 100),
    3: Math.round((counts[3] / total) * 100),
    2: Math.round((counts[2] / total) * 100),
    1: Math.round((counts[1] / total) * 100)
  };

  return {
    total,
    average,
    numericAverage: avgNum,
    counts,
    percentages
  };
}

/**
 * Generates a star row with proper accessibility.
 */
function renderStarRating(rating, max) {
  const maxStars = max || 5;
  const container = document.createElement("div");
  container.className = "ln-star-row";
  container.setAttribute("role", "img");
  container.setAttribute("aria-label", `Rated ${rating} out of ${maxStars} stars`);

  for (let i = 1; i <= maxStars; i++) {
    const star = document.createElement("span");
    star.className = "ln-star" + (i <= rating ? " filled" : " empty");
    star.setAttribute("aria-hidden", "true");
    star.textContent = "★";
    container.appendChild(star);
  }
  return container;
}

/**
 * Build prefilled WhatsApp message for review submission (FR-12b)
 */
function buildReviewWhatsAppUrl(config) {
  const cfg = config || {};
  const number = cfg.WHATSAPP_NUMBER || "919876543210";
  const message =
    "Hi Ash Flora! Here is my review.\n" +
    "Product: ___\n" +
    "Rating (1-5): ___\n" +
    "My review: ___\n" +
    "(I'm happy for it to appear on your website. I'll attach a photo if I can.)";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Build Instagram profile / DM link (FR-12c)
 */
function buildInstagramUrl(config) {
  const cfg = config || {};
  if (cfg.INSTAGRAM_HANDLE) {
    return `https://instagram.com/${cfg.INSTAGRAM_HANDLE}`;
  }
  return "https://instagram.com";
}

// Global browser registration
if (typeof window !== "undefined") {
  window.validateReviews = validateReviews;
  window.sortReviews = sortReviews;
  window.formatReviewDate = formatReviewDate;
  window.computeReviewStats = computeReviewStats;
  window.renderStarRating = renderStarRating;
  window.buildReviewWhatsAppUrl = buildReviewWhatsAppUrl;
  window.buildInstagramUrl = buildInstagramUrl;
}

// CommonJS module export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validateReviews,
    sortReviews,
    formatReviewDate,
    computeReviewStats,
    renderStarRating,
    buildReviewWhatsAppUrl,
    buildInstagramUrl
  };
}
