// ASH FLORA — CATALOGUE LOADER & VALIDATION ENGINE
// Implements CAT-1 through CAT-10, caching, and fallback handling.

const ALLOWED_CATEGORIES = new Set([
  "keychains",
  "single-flowers",
  "bouquets",
  "log-gardens",
  "pots"
]);

const CACHE_KEY = "ash_flora_products_cache_v2";

/**
 * Validates a single product according to CAT-2
 * Returns { valid: boolean, reason?: string, product?: Object }
 */
function validateProduct(p, seenIds, now = new Date()) {
  if (!p || typeof p !== "object") {
    return { valid: false, reason: "Product item is not an object" };
  }

  // 1. ID check
  if (!p.id || typeof p.id !== "string" || !/^[a-z0-9-]+$/.test(p.id)) {
    return { valid: false, reason: `Invalid or missing slug id "${p.id}". Must use lowercase letters, numbers and hyphens.` };
  }
  if (seenIds.has(p.id)) {
    return { valid: false, reason: `Duplicate product id "${p.id}" detected.` };
  }

  // 2. Name check
  if (!p.name || typeof p.name !== "string" || p.name.trim().length === 0 || p.name.length > 60) {
    return { valid: false, reason: `Product "${p.id}" has missing or invalid name (must be 1-60 characters).` };
  }

  // 3. Category check
  if (!p.category || !ALLOWED_CATEGORIES.has(p.category)) {
    return { valid: false, reason: `Product "${p.id}" has unknown category "${p.category}". Must be one of: ${Array.from(ALLOWED_CATEGORIES).join(", ")}.` };
  }

  // 4. Price check
  const price = Number(p.price);
  if (!Number.isFinite(price) || price < 1) {
    return { valid: false, reason: `Product "${p.id}" has invalid price "${p.price}". Must be whole rupees >= 1.` };
  }

  // 5. Optional Sale price check (must be lower than regular price)
  let salePrice = null;
  if (p.salePrice !== undefined && p.salePrice !== null && p.salePrice !== "") {
    salePrice = Number(p.salePrice);
    if (!Number.isFinite(salePrice) || salePrice >= price || salePrice < 1) {
      return { valid: false, reason: `Product "${p.id}" salePrice (${p.salePrice}) must be strictly lower than regular price (${price}).` };
    }
  }

  // 6. Description check
  const desc = typeof p.description === "string" ? p.description : "";
  if (desc.length > 400) {
    return { valid: false, reason: `Product "${p.id}" description exceeds 400 characters (${desc.length}).` };
  }

  // 7. Variants check (at least 1, each 1 to 4 images)
  if (!Array.isArray(p.variants) || p.variants.length === 0) {
    return { valid: false, reason: `Product "${p.id}" must have at least 1 variant.` };
  }

  for (let i = 0; i < p.variants.length; i++) {
    const v = p.variants[i];
    if (!v || typeof v !== "object") {
      return { valid: false, reason: `Product "${p.id}" variant at index ${i} is not an object.` };
    }
    if (!v.id || typeof v.id !== "string") {
      return { valid: false, reason: `Product "${p.id}" variant at index ${i} is missing an id slug.` };
    }
    if (!v.label || typeof v.label !== "string") {
      return { valid: false, reason: `Product "${p.id}" variant "${v.id}" is missing a label.` };
    }
    if (!Array.isArray(v.images) || v.images.length === 0 || v.images.length > 4) {
      return { valid: false, reason: `Product "${p.id}" variant "${v.id}" must have between 1 and 4 images (found ${Array.isArray(v.images) ? v.images.length : 0}).` };
    }
  }

  // Calculate automatic 'New' badge (CAT-8: within 14 days of createdAt)
  let isNew = false;
  if (p.createdAt) {
    const createdDate = new Date(p.createdAt);
    if (!isNaN(createdDate.getTime())) {
      const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 14) {
        isNew = true;
      }
    }
  }

  seenIds.add(p.id);

  return {
    valid: true,
    product: {
      ...p,
      price,
      salePrice,
      isNew,
      effectiveBadge: p.badge || (isNew ? "New" : null)
    }
  };
}

/**
 * Validates array of products and filters out invalid or hidden items
 */
function validateCatalogue(rawList, includeHidden = false) {
  if (!Array.isArray(rawList)) {
    console.warn("[Ash Flora Catalogue] Raw catalogue is not an array:", rawList);
    return { validProducts: [], errors: ["Catalogue data is not an array."] };
  }

  const seenIds = new Set();
  const validProducts = [];
  const errors = [];
  const now = new Date();

  rawList.forEach((item, index) => {
    const res = validateProduct(item, seenIds, now);
    if (!res.valid) {
      const msg = `[CAT-2 Skipped] Item index ${index} (${item?.id || "unknown"}): ${res.reason}`;
      console.warn(msg);
      errors.push(msg);
    } else {
      if (!includeHidden && res.product.hidden) {
        // Safe way to delete / hide product
        return;
      }
      validProducts.push(res.product);
    }
  });

  return { validProducts, errors };
}

/**
 * Loads products from data/products.json with localStorage cache fallback (CAT-1, CAT-3)
 */
async function loadCatalogue() {
  try {
    const res = await fetch("data/products.json", { cache: "no-cache" });
    if (res.ok) {
      const rawData = await res.json();
      const { validProducts } = validateCatalogue(rawData);

      // Save valid products in localStorage cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(rawData));
      } catch (e) {
        // quota exceeded or private mode
      }

      if (typeof window !== "undefined") {
        window.PRODUCTS = validProducts;
      }
      return { products: validProducts, source: "network", error: null };
    }
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  } catch (err) {
    console.warn("[Ash Flora Catalogue] Failed to fetch data/products.json:", err);

    // Fallback to localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const rawCached = JSON.parse(cached);
        const { validProducts } = validateCatalogue(rawCached);
        if (typeof window !== "undefined") {
          window.PRODUCTS = validProducts;
        }
        return { products: validProducts, source: "cache", error: err.message };
      }
    } catch (cacheErr) {
      console.warn("[Ash Flora Catalogue] Cache fallback failed:", cacheErr);
    }

    return { products: [], source: "none", error: err.message };
  }
}

// Global browser registration
if (typeof window !== "undefined") {
  window.validateProduct = validateProduct;
  window.validateCatalogue = validateCatalogue;
  window.loadCatalogue = loadCatalogue;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ALLOWED_CATEGORIES,
    validateProduct,
    validateCatalogue,
    loadCatalogue
  };
}
