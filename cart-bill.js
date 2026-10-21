// ASH FLORA — CART, CHECKOUT & BILL ENGINE
// Implements Sections 15.6, 15.7, 15.8, 18.1, 18.2

const CART_STORAGE_KEY = "ash_flora_cart_v2";
const LAST_BILL_KEY = "ash_flora_last_bill";

// Invoice characters excluding 0, O, 1, I
const INVOICE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generate unique Invoice Number: AF-YYMMDD-XXXXXX
 * Using crypto.getRandomValues and Indian local time (UTC+5:30)
 */
function generateInvoiceNumber() {
  const now = new Date();
  // Adjust to Indian Standard Time (UTC + 5.5 hours)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));

  const yy = String(istDate.getFullYear()).slice(-2);
  const mm = String(istDate.getMonth() + 1).padStart(2, "0");
  const dd = String(istDate.getDate()).padStart(2, "0");
  const yymmdd = `${yy}${mm}${dd}`;

  let randomPart = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 6; i++) {
      randomPart += INVOICE_CHARS[bytes[i] % INVOICE_CHARS.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const idx = Math.floor(Math.random() * INVOICE_CHARS.length);
      randomPart += INVOICE_CHARS[idx];
    }
  }

  return `AF-${yymmdd}-${randomPart}`;
}

/**
 * Cart Manager class
 */
class CartManager {
  constructor() {
    this.items = [];
    this.giftWrap = false;
    this.priceChangeNotices = [];
    this.unavailableNotices = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.items = Array.isArray(parsed.items) ? parsed.items : [];
        this.giftWrap = Boolean(parsed.giftWrap);
      }
    } catch (e) {
      this.items = [];
      this.giftWrap = false;
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
        version: 2,
        items: this.items,
        giftWrap: this.giftWrap
      }));
    } catch (e) {
      console.warn("[Cart] Could not save to localStorage:", e);
    }
    this.notifyUpdate();
  }

  notifyUpdate() {
    if (typeof window !== "undefined" && typeof window.updateCartUI === "function") {
      window.updateCartUI();
    }
  }

  /**
   * Re-checks cart items against the current catalogue (CART-3)
   */
  syncWithCatalogue(products) {
    if (!Array.isArray(products) || products.length === 0) return;

    this.priceChangeNotices = [];
    this.unavailableNotices = [];
    const productsMap = new Map();
    products.forEach(p => productsMap.set(p.id, p));

    this.items.forEach(item => {
      const liveProduct = productsMap.get(item.productId);
      if (!liveProduct || liveProduct.hidden) {
        item.unavailable = true;
        item.unavailableReason = "Product is no longer available";
        this.unavailableNotices.push(`"${item.name}" is no longer available.`);
        return;
      }

      const liveVariant = (liveProduct.variants || []).find(v => v.id === item.variantId);
      if (!liveVariant) {
        item.unavailable = true;
        item.unavailableReason = "Variant no longer available";
        this.unavailableNotices.push(`"${item.name} (${item.variantLabel})" is no longer available.`);
        return;
      }

      const isSoldOut = (liveVariant.status === "sold-out") || (liveProduct.status === "sold-out");
      if (isSoldOut) {
        item.unavailable = true;
        item.unavailableReason = "Item is sold out";
        this.unavailableNotices.push(`"${item.name} (${item.variantLabel})" is currently sold out.`);
        return;
      }

      item.unavailable = false;

      // Price check: variant price override takes priority, else salePrice or regular price
      const livePrice = Number(liveVariant.price || liveProduct.salePrice || liveProduct.price);
      if (item.price !== livePrice) {
        const oldPrice = item.price;
        item.price = livePrice;
        this.priceChangeNotices.push(`Price for "${item.name} (${item.variantLabel})" updated from ₹${oldPrice} to ₹${livePrice}.`);
      }
    });

    this.saveToStorage();
  }

  addItem(product, variant, note = "", quantity = 1) {
    if (!product || !variant) return;

    const qty = Math.max(1, Math.min(20, Number(quantity) || 1));
    const effectivePrice = Number(variant.price || product.salePrice || product.price);
    const coverImage = (variant.images && variant.images[0]) || (product.images && product.images[0]) || "";

    // Check if matching line already exists (CART-2)
    const existingIndex = this.items.findIndex(
      it => it.productId === product.id && it.variantId === variant.id
    );

    if (existingIndex !== -1) {
      const existing = this.items[existingIndex];
      existing.quantity = Math.min(20, existing.quantity + qty);
      if (note && note.trim()) {
        existing.note = note.trim().slice(0, 100);
      }
    } else {
      this.items.push({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantLabel: variant.label,
        price: effectivePrice,
        image: coverImage,
        quantity: qty,
        note: note ? note.trim().slice(0, 100) : "",
        unavailable: false
      });
    }

    this.saveToStorage();
  }

  updateQuantity(productId, variantId, newQty) {
    const item = this.items.find(it => it.productId === productId && it.variantId === variantId);
    if (!item) return;

    const q = Number(newQty);
    if (q <= 0) {
      this.removeItem(productId, variantId);
    } else {
      item.quantity = Math.min(20, Math.max(1, q));
      this.saveToStorage();
    }
  }

  updateNote(productId, variantId, note) {
    const item = this.items.find(it => it.productId === productId && it.variantId === variantId);
    if (item) {
      item.note = String(note || "").slice(0, 100);
      this.saveToStorage();
    }
  }

  removeItem(productId, variantId) {
    this.items = this.items.filter(it => !(it.productId === productId && it.variantId === variantId));
    this.saveToStorage();
  }

  setGiftWrap(enabled) {
    this.giftWrap = Boolean(enabled);
    this.saveToStorage();
  }

  clear() {
    this.items = [];
    this.giftWrap = false;
    this.saveToStorage();
  }

  getItemCount() {
    return this.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  }

  getSubtotal() {
    return this.items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  }

  hasUnavailableItems() {
    return this.items.some(it => it.unavailable);
  }
}

/**
 * Format currency in Indian Rupees with en-IN numbering
 */
function formatRupees(amount) {
  const num = Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

/**
 * Format current date & time for Indian context
 */
function formatIndianDateTime(date = new Date()) {
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Builds the plain text version of the Bill for WhatsApp and clipboard
 */
function buildWhatsAppBillText(billData, config) {
  const cfg = config || (typeof window !== "undefined" ? window.CONFIG : {}) || {};
  const lines = [];

  lines.push(`🌸 *ASH FLORA — ORDER BILL* 🌸`);
  lines.push(`Invoice No: *${billData.invoiceNo}*`);
  lines.push(`Date: ${billData.dateTime}`);
  lines.push(`----------------------------------`);
  lines.push(`*BILLED TO:*`);
  lines.push(`Name: *${billData.customer.fullName}*`);
  lines.push(`Phone: *${billData.customer.mobile}*`);
  lines.push(`Fulfilment: *${billData.customer.fulfilment === "pickup" ? "Pickup" : "Pune Delivery"}*`);

  if (billData.customer.fulfilment === "delivery") {
    lines.push(`Area: ${billData.customer.area}`);
    lines.push(`Address: ${billData.customer.address}`);
  }
  if (billData.customer.preferredDate) {
    lines.push(`Preferred Date: ${billData.customer.preferredDate}`);
  }

  lines.push(`Payment: *${billData.customer.paymentPreference}*`);
  lines.push(`----------------------------------`);
  lines.push(`*ITEMS ORDERED:*`);

  billData.items.forEach((it, idx) => {
    let itemLine = `${idx + 1}. *${it.name}* (${it.variantLabel})`;
    itemLine += ` x ${it.quantity} = ${formatRupees(it.price * it.quantity)}`;
    lines.push(itemLine);
    if (it.note) {
      lines.push(`   Note: "${it.note}"`);
    }
  });

  lines.push(`----------------------------------`);
  lines.push(`Items Total: *${formatRupees(billData.subtotal)}*`);
  if (billData.giftWrapPrice > 0) {
    lines.push(`Gift Wrap: *${formatRupees(billData.giftWrapPrice)}*`);
  }
  lines.push(`Delivery: *To be confirmed by Ash Flora*`);
  lines.push(`Estimated Total: *${formatRupees(billData.total)}* (+ delivery)`);

  if (billData.customer.giftNote) {
    lines.push(`----------------------------------`);
    lines.push(`*Gift Note:* "${billData.customer.giftNote}"`);
  }

  lines.push(`----------------------------------`);
  lines.push(`*Policy:* Strictly no refunds, returns or exchanges (Policy v1.0).`);
  lines.push(`This is an order summary, not a tax receipt.`);
  lines.push(`Please confirm my order and share payment details.`);

  return lines.join("\n");
}

/**
 * Builds the HTML canvas image for Web Share API / PNG download
 */
function renderBillToCanvas(billData, config) {
  const canvas = document.createElement("canvas");
  const scale = 2; // Crisp retina render
  const width = 640;
  // Estimate height based on item count
  const baseHeight = 780;
  const itemsHeight = billData.items.length * 52;
  const height = baseHeight + itemsHeight;

  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#FFF7F9";
  ctx.fillRect(0, 0, width, height);

  // Card box
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#FBD5DF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(20, 20, width - 40, height - 40, 20);
  ctx.fill();
  ctx.stroke();

  // Header
  ctx.fillStyle = "#C94F78";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🌸 Ash Flora — Order Bill", width / 2, 65);

  ctx.fillStyle = "#7C5869";
  ctx.font = "14px sans-serif";
  ctx.fillText("Handmade in Pune · WhatsApp: " + (config.WHATSAPP_NUMBER || ""), width / 2, 90);

  // Invoice pill
  ctx.fillStyle = "#FBD5DF";
  ctx.beginPath();
  ctx.roundRect(width / 2 - 130, 105, 260, 36, 18);
  ctx.fill();

  ctx.fillStyle = "#4A2C3A";
  ctx.font = "bold 15px monospace";
  ctx.fillText(billData.invoiceNo, width / 2, 128);

  ctx.fillStyle = "#7C5869";
  ctx.font = "12px sans-serif";
  ctx.fillText(billData.dateTime, width / 2, 160);

  // Billed To Box
  let y = 185;
  ctx.fillStyle = "#FFF0F4";
  ctx.strokeStyle = "#FBD5DF";
  ctx.beginPath();
  ctx.roundRect(40, y, width - 80, 100, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#C94F78";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("BILLED TO:", 55, y + 24);

  ctx.fillStyle = "#4A2C3A";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(billData.customer.fullName, 55, y + 48);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#7C5869";
  ctx.fillText("Phone: " + billData.customer.mobile, 55, y + 70);

  const fulfilmentStr = billData.customer.fulfilment === "pickup"
    ? "Pickup in Pune"
    : `Pune Delivery: ${billData.customer.area || ""}`;
  ctx.fillText(fulfilmentStr, 55, y + 90);

  // Items Header
  y += 125;
  ctx.fillStyle = "#C94F78";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("ITEMS", 40, y);
  ctx.textAlign = "right";
  ctx.fillText("TOTAL", width - 40, y);

  // Divider
  ctx.strokeStyle = "#FBD5DF";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, y + 8);
  ctx.lineTo(width - 40, y + 8);
  ctx.stroke();

  // Item lines
  y += 28;
  billData.items.forEach((it, idx) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#4A2C3A";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`${idx + 1}. ${it.name}`, 40, y);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#7C5869";
    const sub = `${it.variantLabel} · Qty: ${it.quantity} @ ${formatRupees(it.price)}`;
    ctx.fillText(sub, 55, y + 16);

    ctx.textAlign = "right";
    ctx.fillStyle = "#4A2C3A";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(formatRupees(it.price * it.quantity), width - 40, y + 10);

    y += 42;
  });

  // Summary box
  y += 10;
  ctx.strokeStyle = "#FBD5DF";
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(width - 40, y);
  ctx.stroke();

  y += 24;
  ctx.textAlign = "left";
  ctx.fillStyle = "#7C5869";
  ctx.font = "14px sans-serif";
  ctx.fillText("Items Subtotal", 40, y);
  ctx.textAlign = "right";
  ctx.fillText(formatRupees(billData.subtotal), width - 40, y);

  if (billData.giftWrapPrice > 0) {
    y += 22;
    ctx.textAlign = "left";
    ctx.fillText("Gift Wrap", 40, y);
    ctx.textAlign = "right";
    ctx.fillText(formatRupees(billData.giftWrapPrice), width - 40, y);
  }

  y += 22;
  ctx.textAlign = "left";
  ctx.fillText("Delivery Charge", 40, y);
  ctx.textAlign = "right";
  ctx.fillText("To be confirmed by Ash Flora", width - 40, y);

  y += 28;
  ctx.textAlign = "left";
  ctx.fillStyle = "#C94F78";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("Estimated Total", 40, y);
  ctx.textAlign = "right";
  ctx.fillText(formatRupees(billData.total), width - 40, y);

  // Policy Box
  y += 35;
  ctx.fillStyle = "#FFF0F4";
  ctx.strokeStyle = "#F08BA5";
  ctx.beginPath();
  ctx.roundRect(40, y, width - 80, 60, 10);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#C94F78";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("No Refund Policy v1.0", width / 2, y + 20);

  ctx.fillStyle = "#4A2C3A";
  ctx.font = "11px sans-serif";
  ctx.fillText("Strictly no refunds, returns or exchanges. All items are handmade.", width / 2, y + 36);
  ctx.fillText("Damaged in transit? Message us within 24 hours with photos & invoice no.", width / 2, y + 50);

  // Disclaimer
  y += 85;
  ctx.fillStyle = "#7C5869";
  ctx.font = "11px sans-serif";
  ctx.fillText("Order summary only · Not a tax invoice · Send on WhatsApp to confirm", width / 2, y);

  return canvas;
}

// Global browser registration
if (typeof window !== "undefined") {
  window.generateInvoiceNumber = generateInvoiceNumber;
  window.CartManager = CartManager;
  window.formatRupees = formatRupees;
  window.formatIndianDateTime = formatIndianDateTime;
  window.buildWhatsAppBillText = buildWhatsAppBillText;
  window.renderBillToCanvas = renderBillToCanvas;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    generateInvoiceNumber,
    CartManager,
    formatRupees,
    formatIndianDateTime,
    buildWhatsAppBillText,
    renderBillToCanvas
  };
}
