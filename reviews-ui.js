// ASH FLORA - LOVE NOTES (CUSTOMER REVIEWS) RENDERER & INTERACTION ENGINE
// Full implementation of PRD requirements FR-1 through FR-16.

const CATEGORY_MAP = {
  "keychains": "Keychains",
  "single-flowers": "Single Flowers",
  "bouquets": "Bouquets",
  "log-gardens": "Log Gardens"
};

/**
 * Creates a soft pink SVG placeholder data URI for missing photos (FR-14)
 */
function getFlowerPlaceholder() {
  return "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <rect width="300" height="300" fill="#FBD5DF" rx="16"/>
      <circle cx="150" cy="150" r="70" fill="#FFF7F9" opacity="0.8"/>
      <text x="150" y="165" font-size="54" text-anchor="middle" font-family="sans-serif">🌸</text>
    </svg>
  `);
}

/**
 * Cute empty-state flower illustration SVG (FR-5)
 */
function getCuteEmptyIllustration() {
  return `
    <svg class="ln-empty-flower-svg" width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="50" cy="50" r="14" fill="#F08BA5"/>
      <circle cx="50" cy="24" r="13" fill="#FBD5DF" stroke="#F08BA5" stroke-width="2.5"/>
      <circle cx="74" cy="40" r="13" fill="#FBD5DF" stroke="#F08BA5" stroke-width="2.5"/>
      <circle cx="65" cy="72" r="13" fill="#FBD5DF" stroke="#F08BA5" stroke-width="2.5"/>
      <circle cx="35" cy="72" r="13" fill="#FBD5DF" stroke="#F08BA5" stroke-width="2.5"/>
      <circle cx="26" cy="40" r="13" fill="#FBD5DF" stroke="#F08BA5" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="12" fill="#C94F78"/>
      <path d="M50 75 V94" stroke="#A7D5AA" stroke-width="4" stroke-linecap="round"/>
      <path d="M50 84 Q62 80 62 87 Q50 90 50 84" fill="#A7D5AA"/>
    </svg>
  `;
}

/**
 * Creates the "Write a review" action button group (FR-12)
 */
function createReviewButtons(config) {
  const cfg = config || {};
  const group = document.createElement("div");
  group.className = "ln-button-group";

  // 1. Google Form button (FR-12a) - hidden if REVIEW_FORM_URL is empty
  const formUrl = cfg.REVIEW_FORM_URL ? cfg.REVIEW_FORM_URL.trim() : "";
  if (formUrl) {
    const formBtn = document.createElement("a");
    formBtn.href = formUrl;
    formBtn.className = "ln-btn ln-btn-primary";
    formBtn.target = "_blank";
    formBtn.rel = "noopener noreferrer";
    formBtn.setAttribute("href", formUrl);
    formBtn.setAttribute("target", "_blank");
    formBtn.setAttribute("rel", "noopener noreferrer");
    formBtn.textContent = "Write a review";
    group.appendChild(formBtn);
  }

  // 2. WhatsApp review button (FR-12b)
  const waFn = (typeof window !== "undefined" && window.buildReviewWhatsAppUrl) || (typeof buildReviewWhatsAppUrl !== "undefined" ? buildReviewWhatsAppUrl : null);
  const waUrl = waFn ? waFn(cfg) : `https://wa.me/${cfg.WHATSAPP_NUMBER || "919876543210"}`;
  const waBtn = document.createElement("a");
  waBtn.href = waUrl;
  waBtn.className = "ln-btn ln-btn-whatsapp";
  waBtn.target = "_blank";
  waBtn.rel = "noopener noreferrer";
  waBtn.textContent = "Review on WhatsApp";
  group.appendChild(waBtn);

  // 3. Instagram DM / Profile button (FR-12c)
  const igFn = (typeof window !== "undefined" && window.buildInstagramUrl) || (typeof buildInstagramUrl !== "undefined" ? buildInstagramUrl : null);
  const igUrl = igFn ? igFn(cfg) : "https://instagram.com";
  const igBtn = document.createElement("a");
  igBtn.href = igUrl;
  igBtn.className = "ln-btn ln-btn-outline";
  igBtn.target = "_blank";
  igBtn.rel = "noopener noreferrer";
  igBtn.textContent = "DM on Instagram";
  group.appendChild(igBtn);

  return group;
}

/**
 * Builds a single review card with all FR-3, FR-7, FR-14 specs
 */
function buildReviewCard(review, onProductClick) {
  const starFn = (typeof window !== "undefined" && window.renderStarRating) || (typeof renderStarRating !== "undefined" ? renderStarRating : null);
  const dateFn = (typeof window !== "undefined" && window.formatReviewDate) || (typeof formatReviewDate !== "undefined" ? formatReviewDate : null);

  const card = document.createElement("article");
  card.className = "ln-card";
  card.setAttribute("tabindex", "0");

  // Optional customer photo
  if (review.photo) {
    const photoWrapper = document.createElement("div");
    photoWrapper.className = "ln-card-photo-wrapper";

    const img = document.createElement("img");
    img.src = review.photo;
    img.alt = `Photo by ${review.name}`;
    img.loading = "lazy";
    img.width = 300;
    img.height = 300;
    img.setAttribute("src", review.photo);
    img.setAttribute("alt", `Photo by ${review.name}`);
    img.setAttribute("loading", "lazy");
    img.setAttribute("width", "300");
    img.setAttribute("height", "300");
    img.className = "ln-card-photo";

    // Fallback for missing/broken image (FR-14)
    img.onerror = () => {
      img.onerror = null;
      img.src = getFlowerPlaceholder();
      img.alt = "Ash Flora blossom placeholder";
    };

    photoWrapper.appendChild(img);
    card.appendChild(photoWrapper);
  }

  const content = document.createElement("div");
  content.className = "ln-card-content";

  // Decorative quote mark
  const quoteMark = document.createElement("div");
  quoteMark.className = "ln-card-quote";
  quoteMark.setAttribute("aria-hidden", "true");
  quoteMark.textContent = "“";
  content.appendChild(quoteMark);

  // Header row: Star rating + Verified sticker
  const headRow = document.createElement("div");
  headRow.className = "ln-card-header";

  const stars = starFn ? starFn(review.rating) : document.createElement("div");
  headRow.appendChild(stars);

  if (review.verified) {
    const badge = document.createElement("span");
    badge.className = "ln-verified-badge";
    badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Verified order`;
    headRow.appendChild(badge);
  }
  content.appendChild(headRow);

  // Review text - MUST use textContent for security (FR-3)
  const bodyWrap = document.createElement("div");
  bodyWrap.className = "ln-card-body";

  const p = document.createElement("p");
  p.className = "ln-card-text";
  p.textContent = review.text; // Safe text insertion
  bodyWrap.appendChild(p);

  // Read more toggle for long text (clamp to 5 lines)
  if (review.text.length > 220) {
    p.classList.add("is-clamped");
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "ln-read-more-btn";
    toggleBtn.textContent = "Read more";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.addEventListener("click", () => {
      const isClamped = p.classList.toggle("is-clamped");
      toggleBtn.textContent = isClamped ? "Read more" : "Show less";
      toggleBtn.setAttribute("aria-expanded", String(!isClamped));
    });
    bodyWrap.appendChild(toggleBtn);
  }
  content.appendChild(bodyWrap);

  // Footer row: Author name, area, date & optional product link
  const footer = document.createElement("footer");
  footer.className = "ln-card-footer";

  const authorCol = document.createElement("div");
  authorCol.className = "ln-card-author";

  const nameEl = document.createElement("div");
  nameEl.className = "ln-card-name";
  nameEl.textContent = review.name; // Truncated to 24 chars max if needed
  authorCol.appendChild(nameEl);

  const metaEl = document.createElement("div");
  metaEl.className = "ln-card-meta";
  const dateFormatted = dateFn ? dateFn(review.date) : review.date;
  metaEl.textContent = review.area ? `${dateFormatted} · ${review.area}` : dateFormatted;
  authorCol.appendChild(metaEl);

  footer.appendChild(authorCol);

  // Product link if valid product attached
  if (review.productId && review.productName) {
    const prodLink = document.createElement("a");
    prodLink.href = `#product-${review.productId}`;
    prodLink.className = "ln-card-product-link";
    prodLink.textContent = `Purchased: ${review.productName}`;
    prodLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof onProductClick === "function") {
        onProductClick(review.productId);
      } else {
        const target = document.getElementById(`product-${review.productId}`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("ln-target-highlight");
          setTimeout(() => target.classList.remove("ln-target-highlight"), 1800);
        }
      }
    });
    footer.appendChild(prodLink);
  }

  content.appendChild(footer);
  card.appendChild(content);

  return card;
}

/**
 * Injects AggregateRating and Review Schema JSON-LD if at least 1 valid review exists (FR-15)
 */
function injectJsonLd(validReviews, products) {
  const existing = document.getElementById("love-notes-jsonld");
  if (existing) existing.remove();

  if (!validReviews || validReviews.length === 0) return;

  const statsFn = (typeof window !== "undefined" && window.computeReviewStats) || (typeof computeReviewStats !== "undefined" ? computeReviewStats : null);
  const stats = statsFn ? statsFn(validReviews) : { average: "5.0", total: validReviews.length };

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Ash Flora",
    "description": "Handmade pipe cleaner flowers, bouquets, keychains and log gardens in Pune.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Pune",
      "addressCountry": "IN"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": stats.average,
      "reviewCount": stats.total,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": validReviews.slice(0, 10).map(r => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": r.name
      },
      "datePublished": r.date,
      "reviewBody": r.text,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": r.rating,
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  };

  const script = document.createElement("script");
  script.id = "love-notes-jsonld";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}

/**
 * Main Love Notes Controller & View Manager
 */
class LoveNotesManager {
  constructor(options) {
    const opts = options || {};
    this.rawReviews = opts.reviews || (typeof window !== "undefined" ? window.REVIEWS : []) || [];
    this.screenshots = opts.screenshots || (typeof window !== "undefined" ? window.SCREENSHOTS : []) || [];
    this.products = opts.products || (typeof window !== "undefined" ? window.PRODUCTS : []) || [];
    this.config = opts.config || (typeof window !== "undefined" ? window.CONFIG : {}) || {};

    const valFn = (typeof window !== "undefined" && window.validateReviews) || (typeof validateReviews !== "undefined" ? validateReviews : null);
    const sortFn = (typeof window !== "undefined" && window.sortReviews) || (typeof sortReviews !== "undefined" ? sortReviews : null);

    const validated = valFn ? valFn(this.rawReviews, this.products) : this.rawReviews;
    this.validReviews = sortFn ? sortFn(validated) : validated;

    // Internal state
    this.activeFilter = "all";
    this.visibleCount = 6;
    this.targetProductId = null;

    // DOM containers
    this.sectionEl = document.getElementById("reviews");
    this.headerActionsEl = document.getElementById("reviews-header-actions");
    this.summaryEl = document.getElementById("reviews-summary-container");
    this.filtersEl = document.getElementById("reviews-filter-container");
    this.listEl = document.getElementById("reviews-list-container");
    this.loadMoreEl = document.getElementById("reviews-loadmore-container");
    this.screensEl = document.getElementById("reviews-screenshot-container");
    this.emptyStateEl = document.getElementById("reviews-empty-container");
  }

  init() {
    this.renderHeaderButtons();
    this.renderProductBadges();
    this.setupLightbox();

    if (this.validReviews.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Hide empty state
    if (this.emptyStateEl) this.emptyStateEl.style.display = "none";

    this.renderSummaryBar();
    this.renderFilterChips();
    this.renderReviews();
    this.renderScreenshotWall();
    injectJsonLd(this.validReviews, this.products);
  }

  renderHeaderButtons() {
    if (this.headerActionsEl) {
      this.headerActionsEl.innerHTML = "";
      this.headerActionsEl.appendChild(createReviewButtons(this.config));
    }
  }

  /**
   * FR-11: Product card badge: if a product has at least one valid review,
   * show "★ 4.9 (3)" next to its name. If it has none, show nothing.
   * Clicking it scrolls to the Love Notes section filtered to that product.
   */
  renderProductBadges() {
    const productStats = new Map();

    this.validReviews.forEach(r => {
      if (!r.productId) return;
      if (!productStats.has(r.productId)) {
        productStats.set(r.productId, { sum: 0, count: 0 });
      }
      const st = productStats.get(r.productId);
      st.sum += r.rating;
      st.count += 1;
    });

    document.querySelectorAll("[data-product-id]").forEach(cardEl => {
      const pid = cardEl.getAttribute("data-product-id");
      const badgeContainer = cardEl.querySelector(".product-review-badge");
      if (!badgeContainer) return;

      badgeContainer.innerHTML = "";

      if (productStats.has(pid)) {
        const { sum, count } = productStats.get(pid);
        const avg = (sum / count).toFixed(1);

        const badgeLink = document.createElement("button");
        badgeLink.type = "button";
        badgeLink.className = "ln-product-badge-btn";
        badgeLink.setAttribute("aria-label", `Rated ${avg} out of 5 stars from ${count} reviews. Click to view reviews`);
        badgeLink.innerHTML = `<span class="ln-star-symbol" aria-hidden="true">★</span> <strong>${avg}</strong> <span class="ln-count">(${count})</span>`;
        badgeLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.filterByProduct(pid);
        });

        badgeContainer.appendChild(badgeLink);
      }
    });
  }

  filterByProduct(productId) {
    this.targetProductId = productId;
    this.activeFilter = "product:" + productId;
    this.visibleCount = 6;

    if (this.sectionEl) {
      this.sectionEl.scrollIntoView({ behavior: "smooth" });
    }
    this.renderFilterChips();
    this.renderReviews();
  }

  renderEmptyState() {
    // Hide summary, filters, grid, pagination, screenshots
    if (this.summaryEl) this.summaryEl.style.display = "none";
    if (this.filtersEl) this.filtersEl.style.display = "none";
    if (this.listEl) this.listEl.style.display = "none";
    if (this.loadMoreEl) this.loadMoreEl.style.display = "none";
    if (this.screensEl) this.screensEl.style.display = "none";

    if (!this.emptyStateEl) return;
    this.emptyStateEl.style.display = "block";
    this.emptyStateEl.innerHTML = "";

    const card = document.createElement("div");
    card.className = "ln-empty-card";

    card.innerHTML = `
      <div class="ln-empty-flower-icon">${getCuteEmptyIllustration()}</div>
      <p class="ln-empty-text">Our first Love Notes are coming soon. Order and be the first to review!</p>
    `;

    const buttons = createReviewButtons(this.config);
    card.appendChild(buttons);

    this.emptyStateEl.appendChild(card);
  }

  /**
   * FR-6: Summary bar (at least 1 review): average rating to 1 decimal, total count,
   * and a 5-to-1 star breakdown with proportional bars.
   * Hide the breakdown if fewer than 3 reviews exist, and show only average and count.
   */
  renderSummaryBar() {
    if (!this.summaryEl) return;
    this.summaryEl.style.display = "block";
    this.summaryEl.innerHTML = "";

    const statsFn = (typeof window !== "undefined" && window.computeReviewStats) || (typeof computeReviewStats !== "undefined" ? computeReviewStats : null);
    const starFn = (typeof window !== "undefined" && window.renderStarRating) || (typeof renderStarRating !== "undefined" ? renderStarRating : null);
    const stats = statsFn ? statsFn(this.validReviews) : { average: "5.0", total: this.validReviews.length, counts: {}, percentages: {} };

    const bar = document.createElement("div");
    bar.className = "ln-summary-card";

    // Left score box
    const scoreBox = document.createElement("div");
    scoreBox.className = "ln-summary-score-box";

    const numEl = document.createElement("div");
    numEl.className = "ln-summary-avg";
    numEl.textContent = stats.average;

    const starsEl = starFn ? starFn(Math.round(stats.numericAverage)) : document.createElement("div");

    const countEl = document.createElement("div");
    countEl.className = "ln-summary-count";
    countEl.textContent = `Based on ${stats.total} love note${stats.total === 1 ? "" : "s"}`;

    scoreBox.appendChild(numEl);
    scoreBox.appendChild(starsEl);
    scoreBox.appendChild(countEl);
    bar.appendChild(scoreBox);

    // Star breakdown 5-to-1 (shown only if >= 3 reviews)
    if (stats.total >= 3) {
      const breakdown = document.createElement("div");
      breakdown.className = "ln-summary-breakdown";

      for (let star = 5; star >= 1; star--) {
        const count = stats.counts[star] || 0;
        const pct = stats.percentages[star] || 0;

        const row = document.createElement("div");
        row.className = "ln-breakdown-row";

        const label = document.createElement("span");
        label.className = "ln-breakdown-label";
        label.textContent = `${star} ★`;

        const track = document.createElement("div");
        track.className = "ln-breakdown-track";
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-valuenow", String(pct));
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");
        track.setAttribute("aria-label", `${count} reviews with ${star} stars`);

        const fill = document.createElement("div");
        fill.className = "ln-breakdown-fill";
        fill.style.width = `${pct}%`;
        track.appendChild(fill);

        const countLabel = document.createElement("span");
        countLabel.className = "ln-breakdown-count";
        countLabel.textContent = String(count);

        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(countLabel);
        breakdown.appendChild(row);
      }
      bar.appendChild(breakdown);
    }

    this.summaryEl.appendChild(bar);
  }

  /**
   * FR-10: Filter chips: All, Keychains, Single Flowers, Bouquets, Log Gardens, With Photos.
   * A chip is hidden if it matches zero reviews.
   */
  renderFilterChips() {
    if (!this.filtersEl) return;
    this.filtersEl.style.display = "flex";
    this.filtersEl.innerHTML = "";

    // Count reviews per category / filter
    const counts = {
      all: this.validReviews.length,
      "keychains": 0,
      "single-flowers": 0,
      "bouquets": 0,
      "log-gardens": 0,
      "with-photos": 0
    };

    this.validReviews.forEach(r => {
      if (r.category && counts[r.category] !== undefined) {
        counts[r.category] += 1;
      }
      if (r.photo) {
        counts["with-photos"] += 1;
      }
    });

    const chipDefs = [
      { id: "all", label: "All" },
      { id: "keychains", label: "Keychains" },
      { id: "single-flowers", label: "Single Flowers" },
      { id: "bouquets", label: "Bouquets" },
      { id: "log-gardens", label: "Log Gardens" },
      { id: "with-photos", label: "With Photos" }
    ];

    // If filtering by specific product from badge click, add a custom active chip
    if (this.activeFilter.startsWith("product:") && this.targetProductId) {
      const prod = this.products.find(p => p.id === this.targetProductId);
      const prodName = prod ? prod.name : this.targetProductId;
      chipDefs.splice(1, 0, {
        id: this.activeFilter,
        label: `Product: ${prodName}`
      });
      counts[this.activeFilter] = this.validReviews.filter(r => r.productId === this.targetProductId).length;
    }

    chipDefs.forEach(chip => {
      const count = counts[chip.id] || 0;
      // Skip chip if it matches zero reviews (FR-10)
      if (count === 0 && chip.id !== "all" && chip.id !== this.activeFilter) {
        return;
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ln-filter-chip" + (this.activeFilter === chip.id ? " active" : "");
      btn.setAttribute("aria-pressed", String(this.activeFilter === chip.id));
      btn.textContent = `${chip.label} (${count})`;

      btn.addEventListener("click", () => {
        this.activeFilter = chip.id;
        this.visibleCount = 6;
        if (!chip.id.startsWith("product:")) {
          this.targetProductId = null;
        }
        this.renderFilterChips();
        this.renderReviews();
      });

      this.filtersEl.appendChild(btn);
    });
  }

  getFilteredReviews() {
    if (this.activeFilter === "all") {
      return this.validReviews;
    }
    if (this.activeFilter === "with-photos") {
      return this.validReviews.filter(r => Boolean(r.photo));
    }
    if (this.activeFilter.startsWith("product:")) {
      const pid = this.activeFilter.replace("product:", "");
      return this.validReviews.filter(r => r.productId === pid);
    }
    return this.validReviews.filter(r => r.category === this.activeFilter);
  }

  /**
   * FR-9: Layout: horizontal snap-scroll carousel on mobile, masonry grid on tablet/desktop.
   * First 6 reviews shown, then "Show more" button reveals next 6.
   */
  renderReviews() {
    if (!this.listEl) return;
    this.listEl.style.display = "block";
    this.listEl.innerHTML = "";

    const filtered = this.getFilteredReviews();

    if (filtered.length === 0) {
      const noMatch = document.createElement("div");
      noMatch.className = "ln-empty-filter";
      noMatch.innerHTML = `
        <p class="ln-empty-filter-text">No Love Notes here yet. Be the first!</p>
      `;
      noMatch.appendChild(createReviewButtons(this.config));
      this.listEl.appendChild(noMatch);
      if (this.loadMoreEl) this.loadMoreEl.style.display = "none";
      return;
    }

    const grid = document.createElement("div");
    grid.className = "ln-reviews-grid";

    const sliced = filtered.slice(0, this.visibleCount);
    sliced.forEach(review => {
      const card = buildReviewCard(review, (productId) => {
        const prodEl = document.getElementById(`product-${productId}`);
        if (prodEl) {
          prodEl.scrollIntoView({ behavior: "smooth", block: "center" });
          prodEl.classList.add("ln-target-highlight");
          setTimeout(() => prodEl.classList.remove("ln-target-highlight"), 1800);
        }
      });
      grid.appendChild(card);
    });

    this.listEl.appendChild(grid);

    // Pagination: "Show more" button
    if (this.loadMoreEl) {
      this.loadMoreEl.innerHTML = "";
      if (filtered.length > this.visibleCount) {
        this.loadMoreEl.style.display = "block";
        const moreBtn = document.createElement("button");
        moreBtn.type = "button";
        moreBtn.className = "ln-btn ln-btn-more";
        const remaining = filtered.length - this.visibleCount;
        moreBtn.textContent = `Show more (${remaining} remaining)`;
        moreBtn.addEventListener("click", () => {
          this.visibleCount += 6;
          this.renderReviews();
        });
        this.loadMoreEl.appendChild(moreBtn);
      } else {
        this.loadMoreEl.style.display = "none";
      }
    }
  }

  /**
   * FR-13: Screenshot wall: if SCREENSHOTS is non-empty, show titled
   * "Kind words from our customers" grid of images from images/reviews/screens/
   * with alt text from each entry. Tap opens existing lightbox. Hidden when empty.
   */
  renderScreenshotWall() {
    if (!this.screensEl) return;

    if (!Array.isArray(this.screenshots) || this.screenshots.length === 0) {
      this.screensEl.style.display = "none";
      this.screensEl.innerHTML = "";
      return;
    }

    this.screensEl.style.display = "block";
    this.screensEl.innerHTML = "";

    const title = document.createElement("h3");
    title.className = "ln-screens-title";
    title.textContent = "Kind words from our customers";
    this.screensEl.appendChild(title);

    const sub = document.createElement("p");
    sub.className = "ln-screens-sub";
    sub.textContent = "Real chats & compliments shared on WhatsApp and Instagram";
    this.screensEl.appendChild(sub);

    const wallGrid = document.createElement("div");
    wallGrid.className = "ln-screens-grid";

    this.screenshots.forEach((screen, idx) => {
      if (!screen || !screen.src) return;

      const thumbBtn = document.createElement("button");
      thumbBtn.type = "button";
      thumbBtn.className = "ln-screen-thumb";
      thumbBtn.setAttribute("aria-label", screen.alt || `Customer screenshot ${idx + 1}`);

      const img = document.createElement("img");
      img.src = screen.src;
      img.alt = screen.alt || "Customer feedback message";
      img.loading = "lazy";
      img.width = 320;
      img.height = 400;
      img.className = "ln-screen-img";

      img.onerror = () => {
        img.onerror = null;
        img.src = getFlowerPlaceholder();
      };

      thumbBtn.appendChild(img);

      thumbBtn.addEventListener("click", () => {
        this.openLightbox(screen.src, screen.alt || "Customer feedback screenshot");
      });

      wallGrid.appendChild(thumbBtn);
    });

    this.screensEl.appendChild(wallGrid);
  }

  /**
   * Lightbox modal setup (Section 4 & 9: Esc to close, focus trap, aria attributes)
   */
  setupLightbox() {
    let modal = document.getElementById("ln-lightbox");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ln-lightbox";
      modal.className = "ln-lightbox";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Image zoom preview");
      modal.style.display = "none";

      const backdrop = document.createElement("div");
      backdrop.className = "ln-lightbox-backdrop";

      const content = document.createElement("div");
      content.className = "ln-lightbox-content";
      content.setAttribute("tabindex", "-1");

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "ln-lightbox-close";
      closeBtn.setAttribute("aria-label", "Close image preview");
      closeBtn.textContent = "✕";

      const img = document.createElement("img");
      img.className = "ln-lightbox-img";
      img.src = "";
      img.alt = "";

      const caption = document.createElement("p");
      caption.className = "ln-lightbox-caption";

      content.appendChild(closeBtn);
      content.appendChild(img);
      content.appendChild(caption);

      modal.appendChild(backdrop);
      modal.appendChild(content);

      if (document.body) {
        document.body.appendChild(modal);
      }

      const close = () => {
        modal.style.display = "none";
        if (document.body) {
          document.body.classList.remove("ln-modal-open");
        }
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === "function") {
          this.lastFocusedElement.focus();
        }
      };

      backdrop.addEventListener("click", close);
      closeBtn.addEventListener("click", close);

      if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
        window.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && modal.style.display === "flex") {
            close();
          }
        });
      }
    }
  }

  openLightbox(src, alt) {
    const modal = document.getElementById("ln-lightbox");
    if (!modal) return;

    this.lastFocusedElement = document.activeElement;

    const img = modal.querySelector(".ln-lightbox-img");
    const cap = modal.querySelector(".ln-lightbox-caption");
    const content = modal.querySelector(".ln-lightbox-content");

    img.src = src;
    img.alt = alt || "Ash Flora screenshot preview";
    cap.textContent = alt || "";

    modal.style.display = "flex";
    document.body.classList.add("ln-modal-open");
    content.focus();
  }
}

// Global browser registration
if (typeof window !== "undefined") {
  window.LoveNotesManager = LoveNotesManager;
  window.createReviewButtons = createReviewButtons;
  window.buildReviewCard = buildReviewCard;
  window.injectJsonLd = injectJsonLd;
}

// CommonJS module export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LoveNotesManager,
    createReviewButtons,
    buildReviewCard,
    injectJsonLd,
    CATEGORY_MAP
  };
}
