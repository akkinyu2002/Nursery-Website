window.NurseryStorage = (() => {
  const KEYS = {
    cart: "lumbini-cart",
    orders: "lumbini-orders",
    auth: "lumbini-admin-auth",
    lastOrder: "lumbini-last-order",
    adminSettings: "lumbini-admin-settings",
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function initOrders() {
    const existing = read(KEYS.orders, null);
    if (existing) return existing;
    return write(KEYS.orders, window.NurseryData.seedOrders.slice());
  }

  function initAdminSettings() {
    const existing = read(KEYS.adminSettings, null);
    if (existing && existing.username && existing.password) {
      return existing;
    }

    return write(KEYS.adminSettings, {
      username: window.NurseryData.adminCredentials.username,
      password: window.NurseryData.adminCredentials.password,
      usesDefaultPassword: true,
      passwordChangedAt: null,
    });
  }

  function getAdminSettings() {
    return initAdminSettings();
  }

  function getAdminPublicState() {
    const settings = getAdminSettings();
    return {
      username: settings.username,
      usesDefaultPassword: settings.usesDefaultPassword,
      passwordChangedAt: settings.passwordChangedAt,
    };
  }

  function getCart() {
    return read(KEYS.cart, []);
  }

  function saveCart(items) {
    return write(KEYS.cart, items);
  }

  function addToCart(product, quantity) {
    const cart = getCart();
    const qty = Math.max(1, Number(quantity) || 1);
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, product.stock);
    } else {
      cart.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        stock: product.stock,
        image: product.image,
        category: product.category,
        tag: product.tag,
        quantity: Math.min(qty, product.stock),
      });
    }

    return saveCart(cart);
  }

  function updateCartItem(id, quantity) {
    const cart = getCart();
    const item = cart.find((entry) => entry.id === id);
    if (!item) return cart;

    const nextQty = Math.max(1, Number(quantity) || 1);
    item.quantity = Math.min(nextQty, item.stock);
    return saveCart(cart);
  }

  function removeCartItem(id) {
    return saveCart(getCart().filter((item) => item.id !== id));
  }

  function clearCart() {
    return saveCart([]);
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function getCartSubtotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function getOrders(options) {
    const orders = initOrders();
    if (options && options.includeArchived) return orders;
    return orders.filter((order) => !order.archived);
  }

  function generateOrderId() {
    const now = new Date();
    const stamp = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const random = Math.floor(100 + Math.random() * 900);
    return `LNP-${stamp}${random}`;
  }

  function saveOrder(order) {
    const orders = initOrders();
    orders.unshift(order);
    write(KEYS.orders, orders);
    write(KEYS.lastOrder, order);
    return order;
  }

  function placeOrder(formData) {
    const cart = getCart();
    const area = window.NurseryData.deliveryAreas.find((item) => item.value === formData.deliveryArea) || window.NurseryData.deliveryAreas[0];
    const subtotal = getCartSubtotal();
    const deliveryFee = area.fee;
    const order = {
      id: generateOrderId(),
      customerName: formData.customerName,
      phone: formData.phone,
      address: formData.address,
      deliveryArea: formData.deliveryArea,
      orderNotes: formData.orderNotes || "",
      paymentMethod: formData.paymentMethod,
      status: "Pending",
      archived: false,
      createdAt: new Date().toISOString(),
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    saveOrder(order);
    clearCart();
    return order;
  }

  function getLastOrder() {
    return read(KEYS.lastOrder, null);
  }

  function updateOrderStatus(orderId, status) {
    const orders = initOrders().map((order) => (order.id === orderId ? { ...order, status } : order));
    return write(KEYS.orders, orders);
  }

  function archiveOrder(orderId) {
    const orders = initOrders().map((order) => (order.id === orderId ? { ...order, archived: true } : order));
    return write(KEYS.orders, orders);
  }

  function deleteOrder(orderId) {
    return write(KEYS.orders, initOrders().filter((order) => order.id !== orderId));
  }

  function login(username, password) {
    const settings = getAdminSettings();
    const valid = username === settings.username && password === settings.password;

    if (valid) {
      write(KEYS.auth, {
        loggedIn: true,
        username: settings.username,
        usesDefaultPassword: settings.usesDefaultPassword,
        at: new Date().toISOString(),
      });
    }

    return valid;
  }

  function changeAdminPassword(currentPassword, nextPassword, confirmPassword) {
    const settings = getAdminSettings();
    const current = String(currentPassword || "");
    const next = String(nextPassword || "").trim();
    const confirm = String(confirmPassword || "").trim();

    if (current !== settings.password) {
      return { ok: false, message: "Current password is incorrect." };
    }

    if (next.length < 6) {
      return { ok: false, message: "New password must be at least 6 characters long." };
    }

    if (next !== confirm) {
      return { ok: false, message: "New password and confirm password do not match." };
    }

    if (next === settings.password) {
      return { ok: false, message: "Choose a different password from the current one." };
    }

    const updatedSettings = {
      ...settings,
      password: next,
      usesDefaultPassword: false,
      passwordChangedAt: new Date().toISOString(),
    };

    write(KEYS.adminSettings, updatedSettings);

    const auth = read(KEYS.auth, null);
    if (auth && auth.loggedIn) {
      write(KEYS.auth, {
        ...auth,
        username: updatedSettings.username,
        usesDefaultPassword: false,
      });
    }

    return {
      ok: true,
      message: "Password updated. The demo password is no longer active.",
    };
  }

  function logout() {
    localStorage.removeItem(KEYS.auth);
  }

  function isAdminLoggedIn() {
    const auth = read(KEYS.auth, null);
    return Boolean(auth && auth.loggedIn);
  }

  return {
    getCart,
    saveCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    getCartCount,
    getCartSubtotal,
    getOrders,
    placeOrder,
    getLastOrder,
    updateOrderStatus,
    archiveOrder,
    deleteOrder,
    login,
    getAdminPublicState,
    changeAdminPassword,
    logout,
    isAdminLoggedIn,
  };
})();
