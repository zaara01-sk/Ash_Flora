// ASH FLORA — MASTER STORE ENGINE (PRD v2.0)
// Manages Catalogue, Variants, Motion, Cart Drawer, Checkout, Bill, and Integrations.

// Initialize Cart
const cart = new CartManager();
window.cartInstance = cart;

let currentProducts = [];
let activeCategory = "all";
let activeOccasion = "all";
let activeProductModal = null;

// ==========================================================================
// 1. FLOATING PETALS BACKGROUND (Section 16.5)
// ==========================================================================
function setupFloatingPetals() {
  const container = document.getElementById("petals-container");
  if (!container) return;

  const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isReduced) return;

  const isMobile = window.innerWidth <= 768;
  const petalCount = isMobile ? 4 : 6;
  container.innerHTML = "";

  const petalColors = ["#FBD5DF", "#F08BA5", "#FFF0F4", "#F7D4DF"];

  for (let i = 0; i < petalCount; i++) {
    const petal = document.createElement("div");
    petal.className = "floating-petal";

    const size = Math.floor(Math.random() * 16) + 16; // 16px to 32px
    const left = Math.random() * 100; // %
    const duration = Math.random() * 13 + 12; // 12s to 25s
    const delay = Math.random() * 10; // 0s to 10s
    const color = petalColors[Math.floor(Math.random() * petalColors.length)];

    petal.style.left = `${left}%`;
    petal.style.width = `${size}px`;
    petal.style.height = `${size * 1.3}px`;
    petal.style.animationDuration = `${duration}s`;
    petal.style.animationDelay = `-${delay}s`;

    petal.innerHTML = `
      <svg viewBox="0 0 30 40" width="100%" height="100%" fill="${color}">
        <path d="M15 0 C25 10 30 25 15 40 C0 25 5 10 15 0 Z"/>
      </svg>
    `;

    container.appendChild(petal);
  }

  // Pause when tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      container.classList.add("petals-paused");
    } else {
      container.classList.remove("petals-paused");
    }
  });
}

// ==========================================================================
// 2. PARALLAX HERO & TILT EFFECTS (Section 16.5)
// ==========================================================================
function setupHeroParallax() {
  const frame = document.querySelector(".hero-visual-frame");
  const img = document.querySelector(".hero-visual-img");
  if (!frame || !img) return;

  const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isReduced) return;

  if (window.innerWidth > 768) {
    frame.addEventListener("mousemove", (e) => {
      const rect = frame.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      img.style.transform = `scale(1.06) translate(${x * 18}px, ${y * 18}px)`;
    });
    frame.addEventListener("mouseleave", () => {
      img.style.transform = "scale(1) translate(0, 0)";
    });
  } else {
    window.addEventListener("scroll", () => {
      const scrollY = window.scrollY;
      if (scrollY < 600) {
        img.style.transform = `translateY(${scrollY * 0.08}px)`;
      }
    }, { passive: true });
  }
}

function applyCardTilt(card) {
  // Disabled aggressive 3D tilt to ensure clean, calm, effortless browsing
  return;
}

// ==========================================================================
// 3. TOAST NOTIFICATIONS & PETAL BURST (Section 16.4 & 16.5)
// ==========================================================================
function showToast(message, duration = 3000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function triggerPetalBurst() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "petal-burst-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const particles = [];
  const colors = ["#FBD5DF", "#F08BA5", "#C94F78", "#FFF0F4"];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: Math.random() * 12 + 8,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1
    });
  }

  const startTime = performance.now();
  function animate(now) {
    const elapsed = now - startTime;
    if (elapsed > 1100) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity
      p.rotation += p.rotSpeed;
      p.alpha = Math.max(0, 1 - (elapsed / 1100));

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size / 2, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// ==========================================================================
// 4. CATALOGUE RENDERING & PRODUCT CARD (Section 15.3, 15.4, 15.5)
// ==========================================================================
function updateCategoryTileCounts(products) {
  const counts = {
    "keychains": 0,
    "single-flowers": 0,
    "bouquets": 0,
    "log-gardens": 0,
    "pots": 0
  };

  products.forEach(p => {
    if (counts[p.category] !== undefined && !p.hidden) {
      counts[p.category] += 1;
    }
  });

  document.querySelectorAll("[data-category-count]").forEach(el => {
    const cat = el.getAttribute("data-category-count");
    if (counts[cat] !== undefined) {
      el.textContent = `${counts[cat]} items`;
    }
  });
}

function renderFeaturedRow(products) {
  const container = document.getElementById("featured-grid");
  const section = document.getElementById("featured-section");
  if (!container || !section) return;

  const featured = products
    .filter(p => p.featured && !p.hidden)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  if (featured.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
  container.innerHTML = "";
  featured.forEach(product => {
    container.appendChild(createProductCard(product));
  });
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card reveal-on-scroll";
  card.id = `product-${product.id}`;
  card.setAttribute("data-product-id", product.id);

  // Badge (Bestseller, Limited, New)
  const badge = product.effectiveBadge;
  if (badge) {
    const badgeEl = document.createElement("span");
    badgeEl.className = "product-badge-flag";
    if (badge === "New") badgeEl.classList.add("new-badge");
    if (badge === "Limited") badgeEl.classList.add("limited-badge");
    badgeEl.textContent = badge;
    card.appendChild(badgeEl);
  }

  // Active variant (first available or first variant)
  let activeVariant = product.variants.find(v => v.status !== "sold-out") || product.variants[0];

  // Image wrap
  const imgWrap = document.createElement("div");
  imgWrap.className = "product-img-wrap";

  const img = document.createElement("img");
  img.src = (activeVariant.images && activeVariant.images[0]) || "";
  img.alt = `Handmade pipe cleaner ${product.name} in ${activeVariant.label}`;
  img.loading = "lazy";
  img.width = 300;
  img.height = 300;
  img.className = "product-img";

  img.onerror = () => {
    img.onerror = null;
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="#FBD5DF" rx="16"/>
        <text x="150" y="165" font-size="50" text-anchor="middle">🌸</text>
      </svg>
    `);
  };

  imgWrap.appendChild(img);
  imgWrap.addEventListener("click", () => openProductModal(product, activeVariant));
  card.appendChild(imgWrap);

  // Header: Name and Price
  const header = document.createElement("div");
  header.className = "product-header";

  const title = document.createElement("h3");
  title.className = "product-name";
  title.textContent = product.name;
  title.addEventListener("click", () => openProductModal(product, activeVariant));

  const priceBox = document.createElement("div");
  priceBox.className = "product-price-box";

  const priceVal = Number(activeVariant.price || product.salePrice || product.price);
  const regularVal = Number(product.price);

  if (product.salePrice && product.salePrice < regularVal && !activeVariant.price) {
    priceBox.innerHTML = `
      <span class="product-original-price">₹${regularVal}</span>
      <span class="product-price">₹${priceVal}</span>
    `;
  } else {
    priceBox.innerHTML = `<span class="product-price">₹${priceVal}</span>`;
  }

  header.appendChild(title);
  header.appendChild(priceBox);
  card.appendChild(header);

  // Swatches Row (if multiple variants)
  if (product.variants.length > 1) {
    const swatchesRow = document.createElement("div");
    swatchesRow.className = "product-swatches-row";

    product.variants.forEach(variant => {
      const swBtn = document.createElement("button");
      swBtn.type = "button";
      swBtn.className = "swatch-btn" + (variant.id === activeVariant.id ? " is-active" : "");
      if (variant.status === "sold-out") swBtn.classList.add("is-sold-out");
      swBtn.style.backgroundColor = variant.swatch || "#FBD5DF";
      swBtn.setAttribute("aria-label", `Colour ${variant.label}`);

      swBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        activeVariant = variant;
        img.src = (variant.images && variant.images[0]) || "";
        img.alt = `Handmade pipe cleaner ${product.name} in ${variant.label}`;
        swatchesRow.querySelectorAll(".swatch-btn").forEach(b => b.classList.remove("is-active"));
        swBtn.classList.add("is-active");

        // Update price display if variant overrides price
        const vPrice = Number(variant.price || product.salePrice || product.price);
        priceBox.querySelector(".product-price").textContent = `₹${vPrice}`;

        // Update add to cart button status
        updateButtonStatus(btnCart, activeVariant, product);
      });

      swatchesRow.appendChild(swBtn);
    });

    card.appendChild(swatchesRow);
  }

  // Review Rating Badge slot (FR-11)
  const badgeSlot = document.createElement("div");
  badgeSlot.className = "product-review-badge";
  card.appendChild(badgeSlot);

  // Description
  const desc = document.createElement("p");
  desc.className = "product-desc";
  desc.textContent = product.description;
  card.appendChild(desc);

  // Status tag
  const statusEl = document.createElement("div");
  statusEl.className = "product-status-tag";
  if (product.status === "made-to-order" && product.leadTimeDays) {
    statusEl.textContent = `✨ Made just for you · Ready in ${product.leadTimeDays} days`;
  } else if (activeVariant.status === "sold-out" || product.status === "sold-out") {
    statusEl.textContent = `Sold out`;
    statusEl.style.color = "var(--color-alert)";
  }
  card.appendChild(statusEl);

  // Actions
  const actions = document.createElement("div");
  actions.className = "product-card-actions";

  const btnCart = document.createElement("button");
  btnCart.type = "button";
  btnCart.className = "btn-add-cart";
  updateButtonStatus(btnCart, activeVariant, product);

  btnCart.addEventListener("click", () => {
    if (activeVariant.status === "sold-out" || product.status === "sold-out") {
      // Open WhatsApp custom request (CAT-6)
      const num = window.CONFIG?.WHATSAPP_NUMBER || "919876543210";
      const text = `Hi Ash Flora! I saw that ${product.name} (${activeVariant.label}) is sold out. Could you custom make one for me?`;
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
      return;
    }

    cart.addItem(product, activeVariant, "", 1);
    showToast(`Added "${product.name} (${activeVariant.label})" to cart! 🌸`);

    // Bounce cart bubble
    const bubble = document.querySelector(".cart-nav-btn");
    if (bubble) {
      bubble.classList.remove("bounce-animation");
      void bubble.offsetWidth;
      bubble.classList.add("bounce-animation");
    }
  });

  actions.appendChild(btnCart);
  card.appendChild(actions);

  applyCardTilt(card);
  return card;
}

function updateButtonStatus(btn, variant, product) {
  const isSoldOut = (variant.status === "sold-out") || (product.status === "sold-out");
  if (isSoldOut) {
    btn.textContent = "Sold out · Ask for custom";
    btn.classList.add("is-sold-out");
  } else {
    btn.textContent = "Add to cart";
    btn.classList.remove("is-sold-out");
  }
}

function renderCatalogue(products) {
  const container = document.getElementById("products-grid");
  if (!container) return;

  container.innerHTML = "";

  const filtered = products.filter(p => {
    if (p.hidden) return false;
    const catMatch = activeCategory === "all" || p.category === activeCategory;
    const occMatch = activeOccasion === "all" || (Array.isArray(p.occasions) && p.occasions.includes(activeOccasion));
    return catMatch && occMatch;
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
        <p style="font-size: 1.1rem; color: var(--color-muted-ink); margin-bottom: 1rem;">No blooms match this selection yet.</p>
        <button type="button" class="btn btn-secondary" onclick="resetFilters()">View All Blooms</button>
      </div>
    `;
    return;
  }

  filtered.forEach(p => container.appendChild(createProductCard(p)));

  // Re-attach review badges (FR-11, CAT-10)
  if (window.loveNotesInstance) {
    window.loveNotesInstance.renderProductBadges();
  }
}

window.resetFilters = function() {
  activeCategory = "all";
  activeOccasion = "all";
  document.querySelectorAll(".category-tab-btn").forEach(b => b.classList.toggle("is-active", b.getAttribute("data-category") === "all"));
  document.querySelectorAll(".occasion-chip").forEach(b => b.classList.toggle("is-active", b.getAttribute("data-occasion") === "all"));
  renderCatalogue(currentProducts);
};

// ==========================================================================
// 5. PRODUCT DETAIL VIEW MODAL (CAT-5)
// ==========================================================================
function openProductModal(product, initialVariant) {
  closeProductModal();

  let activeVariant = initialVariant || product.variants[0];
  let activeImageIndex = 0;
  let quantity = 1;

  const backdrop = document.createElement("div");
  backdrop.id = "product-detail-modal";
  backdrop.className = "modal-backdrop";

  const modal = document.createElement("div");
  modal.className = "modal-card";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "modal-close-btn";
  closeBtn.setAttribute("aria-label", "Close product view");
  closeBtn.textContent = "✕";
  closeBtn.onclick = closeProductModal;
  modal.appendChild(closeBtn);

  const layout = document.createElement("div");
  layout.className = "detail-layout";

  // Gallery (up to 4 images)
  const gallery = document.createElement("div");
  gallery.className = "detail-gallery";

  const mainWrap = document.createElement("div");
  mainWrap.className = "detail-main-img-wrap";

  const mainImg = document.createElement("img");
  mainImg.className = "detail-main-img";
  mainImg.src = activeVariant.images[0] || "";
  mainImg.alt = product.name;
  mainWrap.appendChild(mainImg);
  gallery.appendChild(mainWrap);

  // Thumbs row
  const thumbsRow = document.createElement("div");
  thumbsRow.className = "detail-thumbs-row";

  function renderGalleryThumbs() {
    thumbsRow.innerHTML = "";
    activeVariant.images.forEach((imgSrc, idx) => {
      const thBtn = document.createElement("button");
      thBtn.type = "button";
      thBtn.className = "detail-thumb-btn" + (idx === activeImageIndex ? " is-active" : "");
      thBtn.innerHTML = `<img src="${imgSrc}" class="detail-thumb-img" alt="Thumbnail ${idx + 1}">`;
      thBtn.onclick = () => {
        activeImageIndex = idx;
        mainImg.src = imgSrc;
        thumbsRow.querySelectorAll(".detail-thumb-btn").forEach(b => b.classList.remove("is-active"));
        thBtn.classList.add("is-active");
      };
      thumbsRow.appendChild(thBtn);
    });
  }
  renderGalleryThumbs();
  gallery.appendChild(thumbsRow);
  layout.appendChild(gallery);

  // Info Column
  const info = document.createElement("div");
  info.className = "detail-info";

  const title = document.createElement("h2");
  title.className = "detail-name";
  title.textContent = product.name;
  info.appendChild(title);

  // Price box
  const priceBox = document.createElement("div");
  priceBox.className = "detail-price-box";
  const effectivePrice = Number(activeVariant.price || product.salePrice || product.price);
  priceBox.innerHTML = `<span class="product-price" style="font-size: 1.4rem;">₹${effectivePrice}</span>`;
  info.appendChild(priceBox);

  // Policy line
  const policyLine = document.createElement("div");
  policyLine.className = "detail-policy-line";
  policyLine.textContent = "Handmade and final sale: no refunds or returns.";
  info.appendChild(policyLine);

  // Description
  const desc = document.createElement("p");
  desc.style.fontSize = "0.95rem";
  desc.style.color = "var(--color-ink)";
  desc.textContent = product.description;
  info.appendChild(desc);

  // Swatches
  if (product.variants.length > 1) {
    const swLabel = document.createElement("div");
    swLabel.style.fontSize = "0.85rem";
    swLabel.style.fontWeight = "700";
    swLabel.textContent = `Colour: ${activeVariant.label}`;
    info.appendChild(swLabel);

    const swRow = document.createElement("div");
    swRow.className = "product-swatches-row";
    product.variants.forEach(variant => {
      const swBtn = document.createElement("button");
      swBtn.type = "button";
      swBtn.className = "swatch-btn" + (variant.id === activeVariant.id ? " is-active" : "");
      if (variant.status === "sold-out") swBtn.classList.add("is-sold-out");
      swBtn.style.backgroundColor = variant.swatch || "#FBD5DF";
      swBtn.onclick = () => {
        activeVariant = variant;
        activeImageIndex = 0;
        mainImg.src = variant.images[0] || "";
        renderGalleryThumbs();
        swLabel.textContent = `Colour: ${variant.label}`;
        swRow.querySelectorAll(".swatch-btn").forEach(b => b.classList.remove("is-active"));
        swBtn.classList.add("is-active");
        updateButtonStatus(addBtn, activeVariant, product);
      };
      swRow.appendChild(swBtn);
    });
    info.appendChild(swRow);
  }

  // Details Bullets
  if (Array.isArray(product.details) && product.details.length > 0) {
    const bullets = document.createElement("ul");
    bullets.className = "detail-bullets";
    product.details.forEach(line => {
      const li = document.createElement("li");
      li.textContent = line;
      bullets.appendChild(li);
    });
    info.appendChild(bullets);
  }

  // Note Input field (max 100 chars)
  const noteWrap = document.createElement("div");
  noteWrap.innerHTML = `
    <label style="font-size: 0.8rem; font-weight: 700; color: var(--color-ink);">Special Note (optional, max 100 chars):</label>
    <input type="text" class="cart-item-note-input" maxlength="100" placeholder="e.g. 2 pink, 1 yellow, or gift tag text" id="detail-note-input">
  `;
  info.appendChild(noteWrap);

  // Stepper & Add to Cart Action
  const actionRow = document.createElement("div");
  actionRow.style.display = "flex";
  actionRow.style.gap = "0.75rem";
  actionRow.style.alignItems = "center";
  actionRow.style.marginTop = "0.75rem";

  const stepper = document.createElement("div");
  stepper.className = "stepper-control";
  stepper.innerHTML = `
    <button type="button" class="stepper-btn" id="modal-qty-minus">−</button>
    <span class="stepper-value" id="modal-qty-val">1</span>
    <button type="button" class="stepper-btn" id="modal-qty-plus">+</button>
  `;
  actionRow.appendChild(stepper);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn btn-primary";
  addBtn.style.flexGrow = "1";
  updateButtonStatus(addBtn, activeVariant, product);

  addBtn.onclick = () => {
    if (activeVariant.status === "sold-out" || product.status === "sold-out") {
      const num = window.CONFIG?.WHATSAPP_NUMBER || "919876543210";
      const text = `Hi Ash Flora! I'd like to ask for a custom order for: ${product.name} (${activeVariant.label}).`;
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
      return;
    }

    const note = document.getElementById("detail-note-input")?.value || "";
    cart.addItem(product, activeVariant, note, quantity);
    showToast(`Added ${quantity} × "${product.name} (${activeVariant.label})" to cart! 🌸`);
    closeProductModal();
  };
  actionRow.appendChild(addBtn);

  // Share button (Section 17.2)
  const shareBtn = document.createElement("button");
  shareBtn.type = "button";
  shareBtn.className = "btn btn-outline";
  shareBtn.setAttribute("aria-label", "Share product link");
  shareBtn.innerHTML = `🔗`;
  shareBtn.onclick = () => {
    const url = `${window.location.origin}${window.location.pathname}#product/${product.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("Product link copied to clipboard! 📋");
      });
    }
  };
  actionRow.appendChild(shareBtn);

  info.appendChild(actionRow);
  layout.appendChild(info);
  modal.appendChild(layout);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  activeProductModal = backdrop;

  // Stepper handlers
  modal.querySelector("#modal-qty-minus").onclick = () => {
    if (quantity > 1) {
      quantity--;
      modal.querySelector("#modal-qty-val").textContent = quantity;
    }
  };
  modal.querySelector("#modal-qty-plus").onclick = () => {
    if (quantity < 20) {
      quantity++;
      modal.querySelector("#modal-qty-val").textContent = quantity;
    }
  };

  backdrop.onclick = (e) => {
    if (e.target === backdrop) closeProductModal();
  };
}

function closeProductModal() {
  if (activeProductModal) {
    activeProductModal.remove();
    activeProductModal = null;
  }
}

// ==========================================================================
// 6. CART DRAWER & CHECKOUT UI (Section 15.6)
// ==========================================================================
function setupCartDrawer() {
  const backdrop = document.getElementById("cart-drawer-backdrop");
  const drawer = document.getElementById("cart-drawer");
  const openBtns = document.querySelectorAll(".cart-open-btn");
  const closeBtn = document.getElementById("cart-close-btn");

  function openCart() {
    backdrop.classList.add("is-open");
    drawer.classList.add("is-open");
    updateCartUI();
  }

  function closeCart() {
    backdrop.classList.remove("is-open");
    drawer.classList.remove("is-open");
  }

  openBtns.forEach(btn => btn.addEventListener("click", openCart));
  if (closeBtn) closeBtn.addEventListener("click", closeCart);
  if (backdrop) backdrop.addEventListener("click", closeCart);

  window.openCart = openCart;
  window.closeCart = closeCart;
}

function updateCartUI() {
  const count = cart.getItemCount();
  const subtotal = cart.getSubtotal();
  const config = window.CONFIG || {};

  // Update Nav Bubbles
  document.querySelectorAll(".cart-count-badge").forEach(el => {
    el.textContent = count;
  });

  // Mobile Sticky Bottom Bar (Section 17.1)
  const bottomBar = document.getElementById("mobile-bottom-bar");
  if (bottomBar) {
    if (count > 0) {
      bottomBar.classList.add("is-visible");
      document.body.classList.add("has-bottom-bar");
      document.getElementById("mobile-bar-total").textContent = formatRupees(subtotal + (cart.giftWrap ? (config.giftWrapPrice || 0) : 0));
    } else {
      bottomBar.classList.remove("is-visible");
      document.body.classList.remove("has-bottom-bar");
    }
  }

  const list = document.getElementById("cart-items-list");
  if (!list) return;

  if (cart.items.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <span style="font-size: 3rem;">🌸</span>
        <p style="font-size: 1.1rem; font-weight: 700; color: var(--color-ink); margin: 0.5rem 0;">Your flower cart is empty</p>
        <p style="font-size: 0.85rem; color: var(--color-muted-ink); margin-bottom: 1.5rem;">Explore our hand-twisted blooms in Pune and add your favourites!</p>
        <button type="button" class="btn btn-primary" onclick="closeCart(); location.href='#shop';">Shop Blooms</button>
      </div>
    `;
    document.getElementById("cart-footer").style.display = "none";
    return;
  }

  document.getElementById("cart-footer").style.display = "flex";
  list.innerHTML = "";

  // Show notices if any
  if (cart.priceChangeNotices.length > 0 || cart.unavailableNotices.length > 0) {
    const noticeBox = document.createElement("div");
    noticeBox.className = "cart-notice-box";
    const allNotices = [...cart.priceChangeNotices, ...cart.unavailableNotices];
    noticeBox.innerHTML = `<strong>Notice:</strong><br>${allNotices.join("<br>")}`;
    list.appendChild(noticeBox);
  }

  cart.items.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item-row" + (item.unavailable ? " is-unavailable" : "");

    row.innerHTML = `
      <img src="${item.image}" class="cart-item-img" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-variant">${item.variantLabel} · ${formatRupees(item.price)} each</div>
        ${item.unavailable ? `<div style="color: var(--color-alert); font-size: 0.78rem; font-weight: 700; margin: 0.2rem 0;">⚠️ ${item.unavailableReason}</div>` : ""}
        ${!item.unavailable ? `<input type="text" class="cart-item-note-input" placeholder="Line note (e.g. colour mix)" value="${item.note || ""}" maxlength="100" data-note-pid="${item.productId}" data-note-vid="${item.variantId}">` : ""}
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
          ${!item.unavailable ? `
            <div class="stepper-control" style="transform: scale(0.85); transform-origin: left;">
              <button type="button" class="stepper-btn cart-minus" data-pid="${item.productId}" data-vid="${item.variantId}" aria-label="Decrease quantity">−</button>
              <span class="stepper-value">${item.quantity}</span>
              <button type="button" class="stepper-btn cart-plus" data-pid="${item.productId}" data-vid="${item.variantId}" aria-label="Increase quantity">+</button>
            </div>
          ` : `<span style="font-size: 0.8rem; color: var(--color-muted-ink); font-weight: 600;">Qty: ${item.quantity}</span>`}
          <button type="button" class="cart-remove-pill cart-remove-btn" data-pid="${item.productId}" data-vid="${item.variantId}">
            <span>✕ Remove</span>
          </button>
        </div>
      </div>
      <button type="button" class="cart-item-cancel-btn cart-remove-btn" data-pid="${item.productId}" data-vid="${item.variantId}" aria-label="Remove item">✕</button>
    `;

    list.appendChild(row);
  });

  // Attach event handlers
  list.querySelectorAll(".cart-minus").forEach(btn => {
    btn.onclick = () => {
      const it = cart.items.find(i => i.productId === btn.dataset.pid && i.variantId === btn.dataset.vid);
      if (it) cart.updateQuantity(it.productId, it.variantId, it.quantity - 1);
    };
  });
  list.querySelectorAll(".cart-plus").forEach(btn => {
    btn.onclick = () => {
      const it = cart.items.find(i => i.productId === btn.dataset.pid && i.variantId === btn.dataset.vid);
      if (it) cart.updateQuantity(it.productId, it.variantId, it.quantity + 1);
    };
  });
  list.querySelectorAll(".cart-remove-btn").forEach(btn => {
    btn.onclick = () => {
      cart.removeItem(btn.dataset.pid, btn.dataset.vid);
    };
  });
  list.querySelectorAll(".cart-item-note-input").forEach(input => {
    input.onchange = () => {
      cart.updateNote(input.dataset.notePid, input.dataset.noteVid, input.value);
    };
  });

  // Summary lines
  const hasAvailable = cart.items.some(it => !it.unavailable);
  const giftWrapContainer = document.getElementById("cart-giftwrap-container");
  const giftWrapCb = document.getElementById("cart-giftwrap-checkbox");

  // Only offer gift wrap if there is at least one available flower to wrap
  if (giftWrapContainer) {
    giftWrapContainer.style.display = hasAvailable ? "block" : "none";
  }
  if (!hasAvailable && cart.giftWrap) {
    cart.setGiftWrap(false);
  }

  const giftWrapCost = (cart.giftWrap && hasAvailable) ? (config.giftWrapPrice || 0) : 0;
  const total = subtotal + giftWrapCost;

  document.getElementById("cart-subtotal").textContent = formatRupees(subtotal);
  document.getElementById("cart-giftwrap-line").style.display = (cart.giftWrap && hasAvailable) ? "flex" : "none";
  document.getElementById("cart-giftwrap-val").textContent = formatRupees(giftWrapCost);
  document.getElementById("cart-total").textContent = formatRupees(total);

  if (giftWrapCb) {
    giftWrapCb.checked = Boolean(cart.giftWrap && hasAvailable);
    giftWrapCb.disabled = !hasAvailable;
    giftWrapCb.onchange = () => cart.setGiftWrap(giftWrapCb.checked);
  }

  // Handle ordersOpen check (Section 19.3)
  const ordersOpen = config.ordersOpen !== false;
  const checkoutBtn = document.getElementById("cart-checkout-btn");
  const closedNotice = document.getElementById("cart-orders-closed-msg");

  if (checkoutBtn && closedNotice) {
    if (!ordersOpen) {
      checkoutBtn.disabled = true;
      closedNotice.style.display = "block";
      closedNotice.textContent = config.closedMessage || "Orders are currently paused.";
    } else if (cart.hasUnavailableItems()) {
      checkoutBtn.disabled = true;
      closedNotice.style.display = "block";
      closedNotice.textContent = "Please remove unavailable or sold out items to proceed.";
    } else {
      checkoutBtn.disabled = false;
      closedNotice.style.display = "none";
    }
  }
}

// ==========================================================================
// 7. CHECKOUT FORM & BILL GENERATION (Section 15.6, 15.7, 18.1, 18.2)
// ==========================================================================
function setupCheckout() {
  const checkoutBtn = document.getElementById("cart-checkout-btn");
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutClose = document.getElementById("checkout-close-btn");
  const checkoutForm = document.getElementById("checkout-form");
  const fulfilmentSelect = document.getElementById("checkout-fulfilment");
  const deliveryGroup = document.getElementById("delivery-fields-group");

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      closeCart();
      checkoutModal.style.display = "flex";
    });
  }

  if (checkoutClose) {
    checkoutClose.addEventListener("click", () => {
      checkoutModal.style.display = "none";
    });
  }

  if (fulfilmentSelect) {
    fulfilmentSelect.addEventListener("change", () => {
      deliveryGroup.style.display = fulfilmentSelect.value === "delivery" ? "block" : "none";
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("checkout-name").value.trim();
      const mobile = document.getElementById("checkout-mobile").value.trim();
      const fulfilment = fulfilmentSelect.value;
      const area = document.getElementById("checkout-area")?.value.trim() || "";
      const address = document.getElementById("checkout-address")?.value.trim() || "";
      const preferredDate = document.getElementById("checkout-date")?.value.trim() || "";
      const paymentPref = document.querySelector('input[name="paymentPreference"]:checked')?.value || "UPI";
      const orderNotes = document.getElementById("checkout-notes")?.value.trim() || "";
      const giftNote = document.getElementById("checkout-giftnote")?.value.trim() || "";
      const policyAgreed = document.getElementById("checkout-policy-checkbox").checked;

      // Validation
      if (!name) {
        showToast("Please enter your full name");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        showToast("Please enter a valid 10-digit Indian mobile number");
        return;
      }
      if (fulfilment === "delivery") {
        if (!area) {
          showToast("Please specify your area in Pune");
          return;
        }
        if (!address) {
          showToast("Please enter your delivery address");
          return;
        }
      }
      if (!policyAgreed) {
        showToast("Please agree to the No Refund Policy to proceed");
        return;
      }

      const invoiceNo = generateInvoiceNumber();
      const config = window.CONFIG || {};
      const giftWrapPrice = cart.giftWrap ? (config.giftWrapPrice || 0) : 0;
      const subtotal = cart.getSubtotal();
      const total = subtotal + giftWrapPrice;

      const billData = {
        invoiceNo,
        dateTime: formatIndianDateTime(),
        customer: {
          fullName: name,
          mobile,
          fulfilment,
          area,
          address,
          preferredDate,
          paymentPreference: paymentPref,
          orderNotes,
          giftNote
        },
        items: [...cart.items],
        subtotal,
        giftWrapPrice,
        total
      };

      // Save as last bill in localStorage (Section 15.7)
      try {
        localStorage.setItem(LAST_BILL_KEY, JSON.stringify(billData));
      } catch (err) {}

      checkoutModal.style.display = "none";
      displayBillModal(billData);
      triggerPetalBurst();
    });
  }
}

function displayBillModal(billData) {
  const modal = document.getElementById("order-bill-modal");
  const content = document.getElementById("bill-card-content");
  if (!modal || !content) return;

  const config = window.CONFIG || {};

  content.innerHTML = `
    <div class="bill-header">
      <h2 style="font-family: var(--font-heading); color: var(--color-deep-rose); font-size: 1.8rem; margin-bottom: 0.25rem;">🌸 Ash Flora</h2>
      <p style="font-size: 0.9rem; color: var(--color-muted-ink); font-weight: 600;">Handmade in Pune · WhatsApp: ${config.WHATSAPP_NUMBER || ""} · Instagram: @${config.INSTAGRAM_HANDLE || ""}</p>
      <div class="bill-invoice-pill">
        <span>Invoice No:</span>
        <strong id="bill-inv-num">${billData.invoiceNo}</strong>
        <button type="button" class="bill-copy-btn" id="copy-inv-btn">Copy</button>
      </div>
      <p style="font-size: 0.8rem; color: var(--color-muted-ink);">${billData.dateTime}</p>
    </div>

    <div class="bill-billed-to-box">
      <div style="font-weight: 800; font-size: 0.85rem; color: var(--color-deep-rose); margin-bottom: 0.35rem;">BILLED TO:</div>
      <div style="font-weight: 800; font-size: 1.1rem; color: var(--color-ink);">${billData.customer.fullName}</div>
      <div style="font-size: 0.9rem; color: var(--color-muted-ink);">Contact: <strong>${billData.customer.mobile}</strong></div>
      <div style="font-size: 0.9rem; color: var(--color-muted-ink);">Fulfilment: <strong>${billData.customer.fulfilment === "pickup" ? "Pickup in Pune" : "Pune Delivery (" + billData.customer.area + ")"}</strong></div>
      ${billData.customer.address ? `<div style="font-size: 0.85rem; color: var(--color-muted-ink); margin-top: 0.2rem;">Address: ${billData.customer.address}</div>` : ""}
      ${billData.customer.preferredDate ? `<div style="font-size: 0.85rem; color: var(--color-muted-ink);">Preferred Date: ${billData.customer.preferredDate}</div>` : ""}
      <div style="font-size: 0.85rem; color: var(--color-muted-ink); margin-top: 0.2rem;">Payment Preference: <strong>${billData.customer.paymentPreference}</strong></div>
    </div>

    <table class="bill-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th>Qty</th>
          <th>Unit</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${billData.items.map((it, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong>${it.name}</strong><br>
              <span style="font-size: 0.8rem; color: var(--color-muted-ink);">${it.variantLabel}</span>
              ${it.note ? `<br><span style="font-size: 0.75rem; color: var(--color-deep-rose);">Note: "${it.note}"</span>` : ""}
            </td>
            <td>${it.quantity}</td>
            <td>${formatRupees(it.price)}</td>
            <td style="text-align: right; font-weight: 700;">${formatRupees(it.price * it.quantity)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div style="border-top: 1.5px dashed var(--color-blush); padding-top: 0.75rem; font-size: 0.95rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
        <span>Items Subtotal:</span>
        <strong>${formatRupees(billData.subtotal)}</strong>
      </div>
      ${billData.giftWrapPrice > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
          <span>Gift Wrap & Ribbon:</span>
          <strong>${formatRupees(billData.giftWrapPrice)}</strong>
        </div>
      ` : ""}
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem; color: var(--color-deep-rose); font-weight: 600;">
        <span>Delivery Charge:</span>
        <em>To be confirmed by Ash Flora</em>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 800; color: var(--color-deep-rose); border-top: 2px solid var(--color-blush); padding-top: 0.5rem; margin-top: 0.5rem;">
        <span>Estimated Total:</span>
        <span>${formatRupees(billData.total)} (+ delivery)</span>
      </div>
    </div>

    ${billData.customer.giftNote ? `
      <div style="background: #FFF7F9; border-radius: 8px; padding: 0.6rem 0.85rem; margin: 1rem 0; font-size: 0.85rem;">
        <strong>Gift Note:</strong> "${billData.customer.giftNote}"
      </div>
    ` : ""}

    <div class="bill-policy-box">
      <div class="bill-policy-title">No Refund Policy v1.0</div>
      <div class="bill-policy-text">
        Strictly no refunds, returns or exchanges. All items are handmade.<br>
        Damaged in transit? Message us within 24 hours with photos and your invoice number.
      </div>
    </div>

    <div class="bill-footer-disclaimer">
      This is an order summary, not a payment receipt or tax invoice. Payment is pending.<br>
      Please send this bill to Ash Flora on WhatsApp to confirm your order. We will confirm availability and share payment details.
    </div>

    <div class="bill-actions-grid">
      <button type="button" class="btn btn-whatsapp" id="bill-send-wa-btn">📲 Send on WhatsApp</button>
      <button type="button" class="btn btn-secondary" id="bill-share-img-btn">🖼️ Share Image</button>
      <button type="button" class="btn btn-outline" id="bill-pdf-btn">📄 Download PDF</button>
      <button type="button" class="btn btn-outline" id="bill-copy-text-btn">📋 Copy Text</button>
      <button type="button" class="btn btn-outline" id="bill-new-order-btn">🔄 Start New Order</button>
    </div>
  `;

  modal.style.display = "flex";

  // Actions wiring
  document.getElementById("copy-inv-btn").onclick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(billData.invoiceNo);
      showToast("Invoice number copied! 📋");
    }
  };

  const waText = buildWhatsAppBillText(billData, config);

  // Send WhatsApp (Primary action)
  document.getElementById("bill-send-wa-btn").onclick = () => {
    const num = config.WHATSAPP_NUMBER || "919876543210";
    const waUrl = `https://wa.me/${num}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, "_blank");
  };

  // Share as Image (Canvas + Web Share or download)
  document.getElementById("bill-share-img-btn").onclick = async () => {
    try {
      const canvas = renderBillToCanvas(billData, config);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `AshFlora-Bill-${billData.invoiceNo}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Ash Flora Order Bill ${billData.invoiceNo}`,
            text: `Order bill from Ash Flora (${billData.invoiceNo})`
          });
        } else {
          // Download fallback
          const a = document.createElement("a");
          a.download = `AshFlora-Bill-${billData.invoiceNo}.png`;
          a.href = URL.createObjectURL(blob);
          a.click();
          showToast("Bill PNG downloaded! 🖼️");
        }
      });
    } catch (e) {
      showToast("Could not generate image share.");
    }
  };

  // Download PDF
  document.getElementById("bill-pdf-btn").onclick = () => {
    window.print();
  };

  // Copy Bill text
  document.getElementById("bill-copy-text-btn").onclick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(waText).then(() => {
        showToast("Order bill copied to clipboard! 📋");
      });
    }
  };

  // Start New Order (never clears automatically, prompts first)
  document.getElementById("bill-new-order-btn").onclick = () => {
    if (confirm("Start a new order? This will clear your current cart.")) {
      cart.clear();
      modal.style.display = "none";
      location.href = "#shop";
      showToast("Cart cleared for a new order. Happy browsing! 🌸");
    }
  };

  document.getElementById("bill-modal-close-btn").onclick = () => {
    modal.style.display = "none";
  };
}

// ==========================================================================
// 8. INITIALIZATION & ROUTING (Section 17.2, 20.2)
// ==========================================================================
async function initStore() {
  setupFloatingPetals();
  setupHeroParallax();
  setupCartDrawer();
  setupCheckout();

  // Load Settings
  if (typeof loadSettings === "function") {
    await loadSettings();
  }

  // Load Catalogue
  if (typeof loadCatalogue === "function") {
    const res = await loadCatalogue();
    currentProducts = res.products || [];
    cart.syncWithCatalogue(currentProducts);
    updateCategoryTileCounts(currentProducts);
    renderFeaturedRow(currentProducts);
    renderCatalogue(currentProducts);
  }

  // Initialize Love Notes review manager (Phase 4)
  if (typeof LoveNotesManager !== "undefined") {
    const loveNotes = new LoveNotesManager({
      reviews: window.REVIEWS || [],
      screenshots: window.SCREENSHOTS || [],
      products: currentProducts,
      config: window.CONFIG || {}
    });
    loveNotes.init();
    window.loveNotesInstance = loveNotes;
  }

  // Category Tabs handlers
  document.querySelectorAll(".category-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".category-tab-btn").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeCategory = btn.getAttribute("data-category");
      renderCatalogue(currentProducts);
    });
  });

  // Occasions Chips handlers
  document.querySelectorAll(".occasion-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".occasion-chip").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeOccasion = btn.getAttribute("data-occasion");
      renderCatalogue(currentProducts);
    });
  });

  // FAQ Accordion
  document.querySelectorAll(".faq-question-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      item.classList.toggle("is-open");
    });
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("is-open");
    });
    navMenu.querySelectorAll(".nav-link").forEach(l => {
      l.addEventListener("click", () => navMenu.classList.remove("is-open"));
    });
  }

  // Handle URL Hash navigation & Deep links (#product/<id> per 17.2)
  function handleHash() {
    const hash = window.location.hash;
    if (hash.startsWith("#product/")) {
      const pid = hash.replace("#product/", "");
      const prod = currentProducts.find(p => p.id === pid);
      if (prod) {
        openProductModal(prod);
      }
    } else if (["#keychains", "#single-flowers", "#bouquets", "#log-gardens", "#pots"].includes(hash)) {
      const cat = hash.replace("#", "");
      activeCategory = cat;
      const tab = document.querySelector(`.category-tab-btn[data-category="${cat}"]`);
      if (tab) {
        document.querySelectorAll(".category-tab-btn").forEach(b => b.classList.remove("is-active"));
        tab.classList.add("is-active");
      }
      renderCatalogue(currentProducts);
      const shopSec = document.getElementById("shop");
      if (shopSec) {
        shopSec.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  window.addEventListener("hashchange", handleHash);
  if (window.location.hash) {
    setTimeout(handleHash, 300);
  }

  // Reopen last bill button (if any)
  const lastBillRaw = localStorage.getItem(LAST_BILL_KEY);
  const reopenBtn = document.getElementById("reopen-last-bill-btn");
  if (reopenBtn) {
    if (lastBillRaw) {
      reopenBtn.style.display = "inline-flex";
      reopenBtn.onclick = () => {
        try {
          displayBillModal(JSON.parse(lastBillRaw));
        } catch (e) {}
      };
    } else {
      reopenBtn.style.display = "none";
    }
  }

  // Custom order form
  const customForm = document.getElementById("custom-order-form");
  if (customForm) {
    customForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const desc = document.getElementById("custom-desc").value.trim();
      const num = window.CONFIG?.WHATSAPP_NUMBER || "919876543210";
      const text = `Hi Ash Flora! I would like to inquire about a custom handcrafted order:\n\n"${desc}"\n\n(I understand there is a 50% non-refundable advance required).`;
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
    });
  }

  updateCartUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStore);
} else {
  initStore();
}
