document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  window.NurseryUI.renderHeader(page);
  window.NurseryUI.renderFooter();
  window.NurseryUI.syncCartCount();

  if (page === "home") initHomePage();
  if (page === "shop") initShopPage();
  if (page === "product") initProductPage();
  if (page === "cart") initCartPage();
  if (page === "checkout") initCheckoutPage();
  if (page === "about") initAboutPage();
  if (page === "services") initServicesPage();
  if (page === "contact") initContactPage();

  window.NurseryUI.bindGlobalUi();
});

function initHomePage() {
  const categoriesRoot = document.querySelector("[data-home-categories]");
  const productsRoot = document.querySelector("[data-home-products]");
  const servicesRoot = document.querySelector("[data-home-services]");
  const testimonialRoot = document.querySelector("[data-home-testimonials]");
  const faqRoot = document.querySelector("[data-home-faq]");

  if (categoriesRoot) {
    categoriesRoot.innerHTML = window.NurseryData.categories
      .filter((category) => category.key !== "all")
      .slice(0, 6)
      .map(window.NurseryUI.renderCategoryCard)
      .join("");
  }

  if (productsRoot) {
    productsRoot.innerHTML = window.NurseryData.getFeaturedProducts(6)
      .map(window.NurseryUI.renderProductCard)
      .join("");
  }

  if (servicesRoot) {
    servicesRoot.innerHTML = window.NurseryData.services
      .map(
        (service) => `
          <article class="service-card reveal">
            <p class="eyebrow">Nursery Service</p>
            <h3>${service.title}</h3>
            <p>${service.summary}</p>
            <a href="contact.html">${service.cta}</a>
          </article>
        `
      )
      .join("");
  }

  if (testimonialRoot) {
    testimonialRoot.innerHTML = window.NurseryData.testimonials
      .map(
        (item) => `
          <article class="testimonial-card reveal">
            <p>${item.text}</p>
            <div>
              <strong>${item.name}</strong>
              <span>${item.role}</span>
            </div>
          </article>
        `
      )
      .join("");
  }

  if (faqRoot) {
    faqRoot.innerHTML = window.NurseryData.faqs
      .map(
        (item) => `
          <article class="faq-item reveal">
            <button type="button" data-faq-trigger>
              <span>${item.question}</span>
              <strong>+</strong>
            </button>
            <div class="faq-answer"><p>${item.answer}</p></div>
          </article>
        `
      )
      .join("");
  }
}

function initShopPage() {
  const params = new URLSearchParams(window.location.search);
  const productsRoot = document.querySelector("[data-shop-grid]");
  const chipsRoot = document.querySelector("[data-shop-filters]");
  const resultCount = document.querySelector("[data-result-count]");
  const searchInput = document.querySelector("[data-shop-search]");
  const sortSelect = document.querySelector("[data-shop-sort]");
  if (!productsRoot || !chipsRoot || !resultCount || !searchInput || !sortSelect) return;

  const categoryKeys = new Set(window.NurseryData.categories.map((category) => category.key));

  function getCategoryFromHash(hashValue = window.location.hash) {
    const match = hashValue.match(/^#shop-section-([a-z-]+)$/);
    return match && categoryKeys.has(match[1]) ? match[1] : null;
  }

  const initialCategory = window.NurseryData.categories.some((category) => category.key === params.get("category"))
    ? params.get("category")
    : getCategoryFromHash() || "all";

  const state = {
    category: initialCategory,
    search: "",
    sort: "popularity",
  };

  function sortProducts(list) {
    const copy = list.slice();
    if (state.sort === "price-low") copy.sort((a, b) => a.price - b.price);
    if (state.sort === "price-high") copy.sort((a, b) => b.price - a.price);
    if (state.sort === "newest") copy.sort((a, b) => a.newestRank - b.newestRank);
    if (state.sort === "popularity") copy.sort((a, b) => b.popularity - a.popularity);
    return copy;
  }

  function renderFilters() {
    chipsRoot.innerHTML = window.NurseryData.categories
      .map(
        (category) => `
          <button class="chip ${state.category === category.key ? "is-active" : ""}" type="button" data-category="${category.key}">
            ${category.short}
          </button>
        `
      )
      .join("");
  }

  function scrollToShopTarget(targetId, behavior = "smooth") {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior, block: "start" });
    }
  }

  function getMatchingProducts() {
    return sortProducts(
      window.NurseryData.products.filter((product) => {
        const categoryMatch = state.category === "all" || product.categoryKey === state.category;
        const query = state.search.trim().toLowerCase();
        const searchMatch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.tag.toLowerCase().includes(query);
        return categoryMatch && searchMatch;
      })
    );
  }

  function getVisibleSections(products) {
    const baseCategories =
      state.category === "all"
        ? window.NurseryData.categories.filter((category) => category.key !== "all")
        : [window.NurseryData.getCategoryByKey(state.category)];

    return baseCategories
      .map((category) => ({
        category,
        items: products.filter((product) => product.categoryKey === category.key),
      }))
      .filter((section) => section.items.length);
  }

  function renderGrid() {
    const filtered = getMatchingProducts();
    const visibleSections = getVisibleSections(filtered);

    resultCount.textContent = `${filtered.length} products`;

    productsRoot.innerHTML = visibleSections.length
      ? visibleSections
          .map(
            ({ category, items }) => `
              <section class="shop-category-section reveal" id="shop-section-${category.key}">
                <div class="section-head section-head--shop">
                  <div>
                    <p class="eyebrow">${category.accent}</p>
                    <h2>${category.name}</h2>
                    <p>${category.blurb || `Browse ${category.name.toLowerCase()} from the nursery collection.`}</p>
                  </div>
                  <a class="text-link" href="#shop-catalog-top">Back to top</a>
                </div>
                <div class="product-grid">
                  ${items.map(window.NurseryUI.renderProductCard).join("")}
                </div>
              </section>
            `
          )
          .join("")
      : `<div class="empty-panel"><h3>No products matched your search</h3><p>Try another category or a simpler keyword like rose, palm, or indoor.</p></div>`;

    window.NurseryUI.observeReveals(productsRoot);
  }

  function syncShopUrl(nextHash = "") {
    const nextUrl = new URL(window.location.href);
    if (state.category === "all") {
      nextUrl.searchParams.delete("category");
    } else {
      nextUrl.searchParams.set("category", state.category);
    }
    nextUrl.hash = nextHash;
    history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}`);
  }

  function setFilter(categoryKey, options = {}) {
    state.category = categoryKeys.has(categoryKey) ? categoryKey : "all";
    syncShopUrl();
    renderFilters();
    renderGrid();

    if (options.scroll !== false) {
      requestAnimationFrame(() => {
        scrollToShopTarget(state.category === "all" ? "shop-catalog-top" : `shop-section-${state.category}`);
      });
    }
  }

  renderFilters();
  renderGrid();

  if (window.location.hash) {
    syncShopUrl();
  }

  chipsRoot.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-category]");
    if (!chip) return;
    setFilter(chip.dataset.category);
  });

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderGrid();
  });

  sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderGrid();
  });
}

function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const product = window.NurseryData.getProductBySlug(params.get("slug"));
  const root = document.querySelector("[data-product-view]");

  if (!root) return;

  if (!product) {
    root.innerHTML = `<div class="empty-panel"><h2>Product not found</h2><p>The plant you are looking for may have moved. Please browse the shop for the latest stock.</p><a class="btn btn--primary" href="shop.html">Back to shop</a></div>`;
    return;
  }

  let activeImage = product.gallery[0];

  const render = () => {
    root.innerHTML = `
      <section class="product-detail">
        <div class="product-gallery reveal">
          <img class="product-gallery__main" src="${activeImage}" alt="${product.name}">
          <div class="product-gallery__thumbs">
            ${product.gallery
              .map(
                (image) => `
                  <button class="${image === activeImage ? "is-active" : ""}" type="button" data-gallery-image="${image}">
                    <img src="${image}" alt="${product.name}">
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="product-detail__content reveal">
          <p class="eyebrow">${product.category}</p>
          <h1>${product.name}</h1>
          <div class="product-detail__price">
            <strong>${window.NurseryUI.formatCurrency(product.price)}</strong>
            <span>${product.stock > 0 ? "Available now" : "Check availability by phone"}</span>
          </div>
          <p class="lead">${product.short}</p>
          <p>${product.long}</p>
          <div class="care-grid">
            <div><span>Sunlight</span><strong>${product.care.sunlight}</strong></div>
            <div><span>Watering</span><strong>${product.care.watering}</strong></div>
            <div><span>Maintenance</span><strong>${product.care.maintenance}</strong></div>
            <div><span>Growth</span><strong>${product.care.growth}</strong></div>
          </div>
          <div class="quantity-row">
            <label for="qty">Quantity</label>
            <div class="qty-control">
              <button type="button" data-qty-minus>-</button>
              <input id="qty" type="number" min="1" max="${product.stock}" value="1" data-product-qty>
              <button type="button" data-qty-plus>+</button>
            </div>
          </div>
          <div class="product-cta">
            <button class="btn btn--primary" type="button" data-product-add="${product.id}">Add to cart</button>
            <button class="btn btn--ghost" type="button" data-product-order="${product.id}">Order now</button>
          </div>
          <div class="delivery-note">${product.delivery}</div>
        </div>
      </section>
      <section class="section">
        <div class="section-head">
          <div><p class="eyebrow">Related picks</p><h2>You may also like</h2></div>
          <a class="text-link" href="shop.html">Browse all plants</a>
        </div>
        <div class="product-grid">
          ${window.NurseryData.getRelatedProducts(product, 4).map(window.NurseryUI.renderProductCard).join("")}
        </div>
      </section>
    `;

    window.NurseryUI.observeReveals(root);

    root.querySelectorAll("[data-gallery-image]").forEach((button) => {
      button.addEventListener("click", () => {
        activeImage = button.dataset.galleryImage;
        render();
      });
    });

    const qtyInput = root.querySelector("[data-product-qty]");
    root.querySelector("[data-qty-minus]").addEventListener("click", () => {
      qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    });
    root.querySelector("[data-qty-plus]").addEventListener("click", () => {
      qtyInput.value = Math.min(product.stock, Number(qtyInput.value) + 1);
    });
    root.querySelector("[data-product-add]").addEventListener("click", () => {
      window.NurseryStorage.addToCart(product, Number(qtyInput.value));
      window.NurseryUI.syncCartCount();
      window.NurseryUI.showToast(`${product.name} added to cart`);
    });
    root.querySelector("[data-product-order]").addEventListener("click", () => {
      window.NurseryStorage.addToCart(product, Number(qtyInput.value));
      window.NurseryUI.syncCartCount();
      window.location.href = "checkout.html";
    });
  };

  render();
}

function initCartPage() {
  const root = document.querySelector("[data-cart-view]");
  if (!root) return;

  function render() {
    const cart = window.NurseryStorage.getCart();
    const subtotal = window.NurseryStorage.getCartSubtotal();

    if (!cart.length) {
      root.innerHTML = `
        <div class="empty-panel">
          <h2>Your cart is empty</h2>
          <p>Start with indoor plants, flowering favorites, or a complete pot-and-plant setup.</p>
          <a class="btn btn--primary" href="shop.html">Shop Plants</a>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      <section class="cart-layout">
        <div class="cart-items">
          ${cart
            .map(
              (item) => `
                <article class="cart-item">
                  <img src="${item.image}" alt="${item.name}">
                  <div class="cart-item__content">
                    <p>${item.category}</p>
                    <h3><a href="product.html?slug=${item.slug}">${item.name}</a></h3>
                    <span>${item.tag}</span>
                  </div>
                  <div class="qty-control qty-control--compact">
                    <button type="button" data-cart-minus="${item.id}">-</button>
                    <input type="number" min="1" max="${item.stock}" value="${item.quantity}" data-cart-qty="${item.id}">
                    <button type="button" data-cart-plus="${item.id}">+</button>
                  </div>
                  <strong>${window.NurseryUI.formatCurrency(item.price * item.quantity)}</strong>
                  <button class="text-link text-link--danger" type="button" data-cart-remove="${item.id}">Remove</button>
                </article>
              `
            )
            .join("")}
        </div>
        <aside class="summary-card">
          <p class="eyebrow">Cart Summary</p>
          <h3>Ready for checkout</h3>
          <div class="summary-row"><span>Subtotal</span><strong>${window.NurseryUI.formatCurrency(subtotal)}</strong></div>
          <div class="summary-row"><span>Delivery</span><strong>Calculated at checkout</strong></div>
          <div class="summary-row summary-row--total"><span>Total</span><strong>${window.NurseryUI.formatCurrency(subtotal)}</strong></div>
          <a class="btn btn--primary btn--full" href="checkout.html">Proceed to checkout</a>
          <a class="btn btn--ghost btn--full" href="shop.html">Continue shopping</a>
        </aside>
      </section>
    `;

    root.querySelectorAll("[data-cart-minus]").forEach((button) => {
      button.addEventListener("click", () => adjustQuantity(button.dataset.cartMinus, -1));
    });
    root.querySelectorAll("[data-cart-plus]").forEach((button) => {
      button.addEventListener("click", () => adjustQuantity(button.dataset.cartPlus, 1));
    });
    root.querySelectorAll("[data-cart-qty]").forEach((input) => {
      input.addEventListener("change", () => {
        window.NurseryStorage.updateCartItem(input.dataset.cartQty, Number(input.value));
        render();
        window.NurseryUI.syncCartCount();
      });
    });
    root.querySelectorAll("[data-cart-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        window.NurseryStorage.removeCartItem(button.dataset.cartRemove);
        render();
        window.NurseryUI.syncCartCount();
      });
    });
  }

  function adjustQuantity(id, delta) {
    const item = window.NurseryStorage.getCart().find((entry) => entry.id === id);
    if (!item) return;
    const next = item.quantity + delta;
    if (next <= 0) {
      window.NurseryStorage.removeCartItem(id);
    } else {
      window.NurseryStorage.updateCartItem(id, next);
    }
    render();
    window.NurseryUI.syncCartCount();
  }

  render();
}

function initCheckoutPage() {
  const root = document.querySelector("[data-checkout-view]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const successOrder = params.get("success") ? window.NurseryStorage.getLastOrder() : null;

  if (successOrder) {
    root.innerHTML = `
      <div class="success-panel reveal">
        <p class="eyebrow">Order confirmed</p>
        <h1>Thank you for your order</h1>
        <p>Your request has been saved for the nursery team. A confirmation follow-up can be made on your phone number shortly.</p>
        <div class="summary-card summary-card--compact">
          <div class="summary-row"><span>Order ID</span><strong>${successOrder.id}</strong></div>
          <div class="summary-row"><span>Total</span><strong>${window.NurseryUI.formatCurrency(successOrder.total)}</strong></div>
          <div class="summary-row"><span>Payment</span><strong>${successOrder.paymentMethod}</strong></div>
          <div class="summary-row"><span>Status</span><strong>${successOrder.status}</strong></div>
        </div>
        <div class="inline-actions">
          <a class="btn btn--primary" href="shop.html">Continue shopping</a>
          <a class="btn btn--ghost" href="admin-dashboard.html">View in admin</a>
        </div>
      </div>
    `;
    return;
  }

  const cart = window.NurseryStorage.getCart();
  if (!cart.length) {
    root.innerHTML = `
      <div class="empty-panel">
        <h2>No items ready for checkout</h2>
        <p>Add some healthy plants or accessories to your cart first.</p>
        <a class="btn btn--primary" href="shop.html">Browse the shop</a>
      </div>
    `;
    return;
  }

  const areaOptions = window.NurseryData.deliveryAreas
    .map((area) => `<option value="${area.value}">${area.label}</option>`)
    .join("");

  root.innerHTML = `
    <section class="checkout-layout">
      <form class="checkout-form" data-checkout-form>
        <div class="section-head">
          <div><p class="eyebrow">Checkout</p><h1>Place your nursery order</h1></div>
        </div>
        <div class="field-grid">
          <label><span>Full name</span><input required name="customerName" placeholder="Your full name"></label>
          <label><span>Phone number</span><input required name="phone" placeholder="+977 98..."></label>
          <label class="field-span-2"><span>Delivery address</span><textarea required name="address" rows="3" placeholder="Ward, area, landmark, and municipality"></textarea></label>
          <label><span>Delivery area</span><select required name="deliveryArea" data-delivery-area>${areaOptions}</select></label>
          <label><span>Payment method</span>
            <select required name="paymentMethod">
              <option>Cash on Delivery</option>
              <option>Phone Call Confirmation</option>
              <option>eSewa Placeholder</option>
            </select>
          </label>
          <label class="field-span-2"><span>Order notes</span><textarea name="orderNotes" rows="4" placeholder="Any preferred time, pot choice, or special handling request"></textarea></label>
        </div>
        <button class="btn btn--primary" type="submit">Place order</button>
      </form>
      <aside class="summary-card" data-checkout-summary></aside>
    </section>
  `;

  const summaryRoot = root.querySelector("[data-checkout-summary]");
  const areaSelect = root.querySelector("[data-delivery-area]");

  function renderSummary() {
    const subtotal = window.NurseryStorage.getCartSubtotal();
    const area = window.NurseryData.deliveryAreas.find((item) => item.value === areaSelect.value) || window.NurseryData.deliveryAreas[0];
    const total = subtotal + area.fee;
    summaryRoot.innerHTML = `
      <p class="eyebrow">Order Summary</p>
      <h3>${cart.length} item${cart.length > 1 ? "s" : ""} in your cart</h3>
      <div class="summary-items">
        ${cart
          .map(
            (item) => `
              <div class="summary-row">
                <span>${item.name} x ${item.quantity}</span>
                <strong>${window.NurseryUI.formatCurrency(item.price * item.quantity)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="summary-row"><span>Subtotal</span><strong>${window.NurseryUI.formatCurrency(subtotal)}</strong></div>
      <div class="summary-row"><span>Delivery</span><strong>${window.NurseryUI.formatCurrency(area.fee)}</strong></div>
      <div class="summary-row summary-row--total"><span>Total</span><strong>${window.NurseryUI.formatCurrency(total)}</strong></div>
    `;
  }

  areaSelect.addEventListener("change", renderSummary);
  renderSummary();

  root.querySelector("[data-checkout-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
    window.NurseryStorage.placeOrder(formData);
    window.NurseryUI.syncCartCount();
    window.location.href = "checkout.html?success=1";
  });
}

function initAboutPage() {
  const root = document.querySelector("[data-about-values]");
  if (!root) return;
  root.innerHTML = window.NurseryData.highlights
    .map(
      (item) => `
        <article class="info-card reveal">
          <h3>${item.title}</h3>
          <p>${item.text}</p>
        </article>
      `
    )
    .join("");
}

function initServicesPage() {
  const root = document.querySelector("[data-services-grid]");
  if (!root) return;
  root.innerHTML = window.NurseryData.services
    .map(
      (service) => `
        <article class="service-card service-card--large reveal">
          <p class="eyebrow">Specialized Support</p>
          <h3>${service.title}</h3>
          <p>${service.summary}</p>
          <a class="text-link" href="contact.html">${service.cta}</a>
        </article>
      `
    )
    .join("");
}

function initContactPage() {
  const frame = document.querySelector("[data-map-frame]");
  if (frame) frame.src = window.NurseryData.business.mapEmbed;

  const form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.reset();
      window.NurseryUI.showToast("Your message has been noted for follow-up.");
    });
  }
}
