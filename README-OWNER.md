# 🌸 Ash Flora — Owner Guide (Zaara)

Welcome to your complete **Ash Flora** website! This guide explains how to manage your store, add new pipe cleaner creations, publish customer Love Notes, and process orders on WhatsApp with zero coding needed.

---

## 1. How Your Store Works

- **Hosting:** Free on GitHub Pages.
- **Catalogue:** Loaded dynamically from `data/products.json`.
- **Settings:** Loaded dynamically from `data/settings.json`.
- **Customer Reviews:** Stored safely in `reviews.js`.
- **Payment & Security:** No online payment gateway and no stored card details. Customers generate an official **Order Bill** with a unique invoice number (`AF-YYMMDD-XXXXXX`) and send it to you on WhatsApp. You confirm availability, share your UPI QR privately, or confirm cash.

---

## 2. Using the Owner Control Panel (`admin.html`)

You can manage your entire store from your phone or laptop by visiting `admin.html` (e.g., `https://zaara01-sk.github.io/Ash_Flora/admin.html` or locally).

### Setting up your GitHub Access Token (One-time setup)
To allow `admin.html` to publish photos and products directly to GitHub:

1. Open [github.com](https://github.com) on your browser and sign in.
2. Click your profile picture (top right) → **Settings**.
3. Scroll down the left sidebar to **Developer settings** → **Personal access tokens** → **Fine-grained tokens**.
4. Click **Generate new token**:
   - **Token name:** `Ash Flora Phone Admin`
   - **Expiration:** Choose 90 days or 1 year (set a reminder on your calendar to renew it).
   - **Repository access:** Choose **Only select repositories** → Select your repository (`Ash_Flora`).
   - **Permissions:** Click **Repository permissions** → Find **Contents** → Change to **Read and write**.
5. Click **Generate token** at the bottom and copy the string starting with `github_pat_...`.
6. Open `admin.html`, enter your repository name (e.g. `zaara01-sk/Ash_Flora`) and paste your token. Click **Connect & Verify Token**.
   *(Your token is saved only in your phone's private browser storage and never exposed in code).*

---

## 3. Adding a New Product

1. In `admin.html`, tap **+ Add New Product**.
2. **Step 1 (Basics):** Enter Title, Slug ID (e.g. `pink-sunflower`), Price in ₹, optional Sale Price, Category, and Description.
3. **Step 2 (Colours & Photos):**
   - Enter your colour label (e.g. `Pastel Pink`) and pick a swatch colour.
   - Tap **Choose file** to select a photo from your phone gallery or take a picture.
   - The admin automatically resizes photos to under 300 KB, converts them to WebP, and removes hidden camera/location data.
   - You can add up to **4 photos per colour**. (The first photo is the cover).
   - Tap **+ Add Colour** if you have the same design in other colours (e.g. Yellow, Lavender).
4. **Step 3 (Extras):** Add care details, lead time (days), badge (Bestseller/Limited), and whether to feature it on the homepage.
5. **Step 4 (Preview & Publish):** Check the live card preview, then tap **🚀 Publish to GitHub**.
   - Your photos and catalogue update automatically, and your live site updates in about **1 to 2 minutes**!

---

## 4. Deleting or Replacing Sample Products

When you are ready to launch your real products, delete or edit the sample products that have `[Sample]` in their title:
- `tulip-stem`: Fuzzy Tulip Stem [Sample]
- `bloombud-keyring`: BloomBud Blossom Keyring [Sample]
- `pastel-bouquet`: Pastel Dream Wrapped Bouquet [Sample]
- `moss-log-garden`: Enchanted Moss Log Garden [Sample]

You can either tap **Edit** in `admin.html` to replace their names, photos, and prices with your own creations, or switch on **Hide Product** to keep them in draft mode.

---

## 5. How to Handle Orders on WhatsApp

1. Customer chooses flowers, enters their Pune delivery area, agrees to the No Refund Policy, and generates their bill.
2. They click **📲 Send on WhatsApp**. You will receive an organized message like this:
   ```text
   🌸 ASH FLORA — ORDER BILL 🌸
   Invoice No: AF-261021-7KQ3MD
   Date: 21 Oct 2026, 4:15 PM
   BILLED TO: Riya Deshmukh (9876543210)
   Fulfilment: Pune Delivery (Kothrud)
   Address: Flat 402, Sunshine Heights, Paud Road
   ITEMS:
   1. Fuzzy Tulip Stem (Blush Pink) x 2 = ₹358
   Items Total: ₹358
   Delivery: To be confirmed by Ash Flora
   Policy: Strictly no refunds, returns or exchanges (Policy v1.0).
   Please confirm my order and share payment details.
   ```
3. **Your Reply:**
   - Confirm item availability and crafting lead time.
   - Calculate your Pune delivery fee (e.g. ₹50–₹100 depending on area) and give the total.
   - Privately send your **UPI QR image** or UPI ID in the WhatsApp chat.
   - *Never accept screenshots as payment proof until you see the money in your own UPI bank app!*
   - Once verified, reply: `Confirmed! 🌸 Crafting your blooms with love.`

---

## 6. How to Add Customer Love Notes (Reviews)

Reviews are loaded from `reviews.js`. To publish a new review:
1. When a happy customer praises your flowers on WhatsApp or Instagram, ask: *"May I share your first name and this lovely review on our website?"*
2. If they sent a photo, save it to `images/reviews/` (e.g. `riya-tulips.jpg`).
3. Open `reviews.js` and add an entry:
   ```javascript
   {
     id: 1,
     name: "Riya",
     area: "Kothrud",
     rating: 5,
     text: "The tulips look so real and the fuzzy texture is adorable! They brighten up my work desk every single day.",
     productId: "tulip-stem",
     category: "single-flowers",
     date: "2026-10-21",
     photo: "images/reviews/riya-tulips.jpg",
     verified: true
   },
   ```
4. If you have a screenshot of kind words from WhatsApp or Instagram (blur out phone numbers first), save it to `images/reviews/screens/` and add to `SCREENSHOTS`:
   ```javascript
   {
     src: "images/reviews/screens/screen-01.jpg",
     alt: "WhatsApp customer praise for tulip bouquet"
   },
   ```

---

## 7. Maintenance Schedule

- **Weekly:** Check `admin.html` to toggle items to *Sold Out* or *Back in Stock*, and update review notes.
- **Monthly:** Check that your GitHub token hasn't expired.
- **Yearly:** Renew your GitHub token and review prices in `data/settings.json`.
