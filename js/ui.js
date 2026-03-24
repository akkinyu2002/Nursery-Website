window.NurseryUI = (() => {
  let revealObserver = null;

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  function formatDate(value) {
    return new Date(value).toLocaleDateString("en-NP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function renderStars(rating) {
    const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return `
      <div class="rating-stars" aria-label="${value} out of 5 stars">
        ${Array.from({ length: 5 }, (_, index) => `<span class="${index < value ? "is-filled" : ""}">&#9733;</span>`).join("")}
      </div>
    `;
  }

  function renderHeader(activePage) {
    const root = document.querySelector("[data-site-header]");
    if (!root) return;

    const links = [
      { key: "home", label: "Home", href: "index.html" },
      { key: "shop", label: "Shop", href: "shop.html" },
      { key: "about", label: "About", href: "about.html" },
      { key: "services", label: "Services", href: "services.html" },
      { key: "contact", label: "Contact", href: "contact.html" },
      { key: "checkout", label: "Checkout", href: "checkout.html" },
    ];

    root.innerHTML = `
      <header class="site-header">
        <div class="container nav-shell">
          <a class="brand" href="index.html">
            <img class="brand__logo" src="${window.NurseryData.business.logo}" alt="${window.NurseryData.business.shortName}" loading="lazy">
            <span class="brand__copy">
              <strong>${window.NurseryData.business.shortName}</strong>
              <small>Healthy plants for home and garden</small>
            </span>
          </a>
          <nav class="nav-links">
            ${links
              .map(
                (link) =>
                  `<a class="${activePage === link.key ? "is-active" : ""}" href="${link.href}">${link.label}</a>`
              )
              .join("")}
          </nav>
          <div class="nav-actions">
            <a class="nav-phone" href="${window.NurseryData.business.phoneHref}">Call</a>
            <a class="cart-pill ${activePage === "cart" ? "is-active" : ""}" href="cart.html" aria-label="View cart">
              <span>Cart</span>
              <strong data-cart-count>0</strong>
            </a>
            <button class="menu-toggle" type="button" aria-expanded="false" data-menu-toggle>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
        <div class="mobile-nav" data-mobile-nav>
          ${links.map((link) => `<a href="${link.href}">${link.label}</a>`).join("")}
          <a class="btn btn--primary" href="shop.html">Shop Plants</a>
        </div>
      </header>
    `;
  }

  function renderFooter() {
    const root = document.querySelector("[data-site-footer]");
    if (!root) return;

    const hours = window.NurseryData.businessHours
      .map((item) => `<li><span>${item.day}</span><strong>${item.hours}</strong></li>`)
      .join("");

    root.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div class="footer-brand">
            <p class="eyebrow">Lumbini Nursery and Plant service</p>
            <h3>Healthy plants, practical service, and a greener local space.</h3>
            <p>${window.NurseryData.business.address}</p>
          </div>
          <div class="footer-group">
            <h4>Quick Links</h4>
            <ul class="footer-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="shop.html">Shop Plants</a></li>
              <li><a href="cart.html">Cart</a></li>
              <li><a href="checkout.html">Checkout</a></li>
              <li><a href="services.html">Garden Services</a></li>
              <li><a href="about.html">About the Nursery</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          <div class="footer-group footer-contact">
            <h4>Contact</h4>
            <ul class="footer-links">
              <li><a href="${window.NurseryData.business.phoneHref}">${window.NurseryData.business.phone}</a></li>
              <li><a href="${window.NurseryData.business.emailHref}">${window.NurseryData.business.email}</a></li>
              <li><a href="${window.NurseryData.business.mapHref}" target="_blank" rel="noreferrer">View on Google Maps</a></li>
            </ul>
          </div>
          <div class="footer-group footer-hours">
            <h4>Business Hours</h4>
            <ul class="hours-list">${hours}</ul>
          </div>
        </div>
        <div class="container footer-bottom">
          <p>Serving plant orders, delivery coordination, and garden support across Murgiya, Butwal, and nearby Rupandehi areas.</p>
          <p>&copy; ${new Date().getFullYear()} ${window.NurseryData.business.shortName}</p>
        </div>
      </footer>
    `;
  }

  function syncCartCount() {
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = window.NurseryStorage.getCartCount();
    });
  }

  function renderCategoryCard(category) {
    return `
      <article class="category-card reveal">
        <img src="${window.NurseryData.productImages[category.image]}" alt="${category.name}" loading="lazy">
        <div class="category-card__content">
          <p class="eyebrow">${category.accent}</p>
          <h3>${category.name}</h3>
          <a href="shop.html?category=${category.key}">Explore category</a>
        </div>
      </article>
    `;
  }

  function renderProductCard(product) {
    return `
      <article class="product-card reveal">
        <a class="product-card__media" href="product.html?slug=${product.slug}">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <span class="badge">${product.badge}</span>
        </a>
        <div class="product-card__body">
          <p class="product-card__meta">${product.category}</p>
          <h3><a href="product.html?slug=${product.slug}">${product.name}</a></h3>
          <p class="product-card__desc">${product.short}</p>
          <div class="product-card__tags">
            <span>${product.tag}</span>
            <span>${product.stock > 0 ? "In stock" : "Out of stock"}</span>
          </div>
          <div class="product-card__footer">
            <strong>${formatCurrency(product.price)}</strong>
            <button class="btn btn--primary btn--small" type="button" data-add-cart="${product.id}">Add to cart</button>
          </div>
        </div>
      </article>
    `;
  }

  function showToast(message) {
    let tray = document.querySelector(".toast-tray");
    if (!tray) {
      tray = document.createElement("div");
      tray.className = "toast-tray";
      document.body.appendChild(tray);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    tray.appendChild(toast);

    setTimeout(() => toast.remove(), 2800);
  }

  function observeReveals(scope = document) {
    const nodes = scope.querySelectorAll ? scope.querySelectorAll(".reveal") : [];
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
    }

    nodes.forEach((node) => {
      if (!node.classList.contains("is-visible")) {
        revealObserver.observe(node);
      }
    });
  }

  function bindGlobalUi() {
    document.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-menu-toggle]");
      if (toggle) {
        const nav = document.querySelector("[data-mobile-nav]");
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      }

      const addButton = event.target.closest("[data-add-cart]");
      if (addButton) {
        const product = window.NurseryData.getProductById(addButton.dataset.addCart);
        if (product) {
          window.NurseryStorage.addToCart(product, 1);
          syncCartCount();
          showToast(`${product.name} added to cart`);
        }
      }

      const faqTrigger = event.target.closest("[data-faq-trigger]");
      if (faqTrigger) {
        const item = faqTrigger.closest(".faq-item");
        item.classList.toggle("is-open");
      }
    });

    const topButton = document.querySelector("[data-scroll-top]");
    if (topButton) {
      window.addEventListener("scroll", () => {
        topButton.classList.toggle("is-visible", window.scrollY > 320);
      });
      topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    observeReveals(document);
  }

  return {
    formatCurrency,
    formatDate,
    renderStars,
    renderHeader,
    renderFooter,
    syncCartCount,
    renderCategoryCard,
    renderProductCard,
    bindGlobalUi,
    observeReveals,
    showToast,
  };
})();
