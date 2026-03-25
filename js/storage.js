window.NurseryStorage = (() => {
  const KEYS = {
    cart: "lumbini-cart",
    orders: "lumbini-orders",
    auth: "lumbini-admin-auth",
    lastOrder: "lumbini-last-order",
    adminSettings: "lumbini-admin-settings",
    feedback: "lumbini-feedback",
    feedbackSeeded: "lumbini-feedback-seeded",
  };

  const ORDER_STATUSES = ["Pending", "Confirmed", "Processing", "Delivered", "Cancelled"];

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

  function getSupabaseStatus() {
    if (window.NurserySupabase && typeof window.NurserySupabase.getStatus === "function") {
      return window.NurserySupabase.getStatus();
    }

    return {
      mode: "local",
      configured: false,
      enabled: false,
      reason: "Supabase SDK is not configured.",
      provider: "localStorage",
    };
  }

  function isSupabaseEnabled() {
    return Boolean(window.NurserySupabase && typeof window.NurserySupabase.isEnabled === "function" && window.NurserySupabase.isEnabled());
  }

  function supabaseTable(name) {
    if (!isSupabaseEnabled() || typeof window.NurserySupabase.table !== "function") {
      return null;
    }
    return window.NurserySupabase.table(name);
  }

  function normalizeFeedbackItem(item) {
    return {
      id: item.id || `FB-${Date.now()}`,
      name: item.name || "Customer",
      role: item.role || "Nursery customer",
      rating: Number(item.rating) || 0,
      text: item.text || "",
      createdAt: item.createdAt || new Date().toISOString(),
      approved: Boolean(item.approved),
    };
  }

  function normalizeOrder(order) {
    const normalizedStatus = ORDER_STATUSES.includes(order.status) ? order.status : "Pending";

    return {
      id: order.id,
      customerName: order.customerName || "",
      phone: order.phone || "",
      address: order.address || "",
      deliveryArea: order.deliveryArea || "",
      orderNotes: order.orderNotes || "",
      paymentMethod: order.paymentMethod || "Cash on Delivery",
      status: normalizedStatus,
      archived: Boolean(order.archived),
      createdAt: order.createdAt || new Date().toISOString(),
      subtotal: Number(order.subtotal) || 0,
      deliveryFee: Number(order.deliveryFee) || 0,
      total: Number(order.total) || 0,
      items: Array.isArray(order.items)
        ? order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: Math.max(1, Number(item.quantity) || 1),
            price: Number(item.price) || 0,
          }))
        : [],
    };
  }

  function isMeaningfulOrder(order) {
    const normalized = normalizeOrder(order);
    return normalized.items.length > 0 || normalized.subtotal > 0;
  }

  function normalizeCustomer(customer) {
    const lifetimeValue = Number(customer.lifetimeValue) || 0;
    const deliveryValueRaw = Number(customer.deliveryValue);
    const subtotalValueRaw = Number(customer.subtotalValue);
    const deliveryValue = Number.isFinite(deliveryValueRaw) ? deliveryValueRaw : 0;
    const subtotalValue = Number.isFinite(subtotalValueRaw)
      ? subtotalValueRaw
      : Math.max(0, lifetimeValue - deliveryValue);

    return {
      id: customer.id || `CUS-${Date.now()}`,
      fullName: customer.fullName || "",
      phone: customer.phone || "",
      address: customer.address || "",
      deliveryArea: customer.deliveryArea || "",
      totalOrders: Math.max(1, Number(customer.totalOrders) || 1),
      subtotalValue,
      deliveryValue,
      lifetimeValue,
      lastOrderId: customer.lastOrderId || "",
      lastOrderAt: customer.lastOrderAt || new Date().toISOString(),
      createdAt: customer.createdAt || new Date().toISOString(),
      updatedAt: customer.updatedAt || customer.lastOrderAt || new Date().toISOString(),
    };
  }

  function orderToRow(order) {
    const normalized = normalizeOrder(order);
    return {
      id: normalized.id,
      customer_name: normalized.customerName,
      phone: normalized.phone,
      address: normalized.address,
      delivery_area: normalized.deliveryArea,
      order_notes: normalized.orderNotes,
      payment_method: normalized.paymentMethod,
      status: normalized.status,
      archived: normalized.archived,
      created_at: normalized.createdAt,
      subtotal: normalized.subtotal,
      delivery_fee: normalized.deliveryFee,
      total: normalized.total,
      items: normalized.items,
    };
  }

  function rowToOrder(row) {
    return normalizeOrder({
      id: row.id,
      customerName: row.customer_name,
      phone: row.phone,
      address: row.address,
      deliveryArea: row.delivery_area,
      orderNotes: row.order_notes,
      paymentMethod: row.payment_method,
      status: row.status,
      archived: row.archived,
      createdAt: row.created_at,
      subtotal: row.subtotal,
      deliveryFee: row.delivery_fee,
      total: row.total,
      items: row.items,
    });
  }

  function feedbackToRow(item) {
    const normalized = normalizeFeedbackItem(item);
    return {
      id: normalized.id,
      name: normalized.name,
      role: normalized.role,
      rating: normalized.rating,
      text: normalized.text,
      approved: normalized.approved,
      created_at: normalized.createdAt,
    };
  }

  function rowToFeedback(row) {
    return normalizeFeedbackItem({
      id: row.id,
      name: row.name,
      role: row.role,
      rating: row.rating,
      text: row.text,
      approved: row.approved,
      createdAt: row.created_at,
    });
  }

  function rowToCustomer(row) {
    return normalizeCustomer({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      address: row.address,
      deliveryArea: row.delivery_area,
      totalOrders: row.total_orders,
      subtotalValue: row.subtotal_value,
      deliveryValue: row.delivery_value,
      lifetimeValue: row.lifetime_value,
      lastOrderId: row.last_order_id,
      lastOrderAt: row.last_order_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  function initOrders() {
    const existing = read(KEYS.orders, null);
    if (existing) return existing;
    return write(KEYS.orders, window.NurseryData.seedOrders.slice());
  }

  function getLocalOrders(options) {
    const orders = initOrders().map(normalizeOrder).filter(isMeaningfulOrder);
    if (options && options.includeArchived) return orders;
    return orders.filter((order) => !order.archived);
  }

  function saveLocalOrder(order) {
    const orders = initOrders();
    orders.unshift(normalizeOrder(order));
    write(KEYS.orders, orders);
    write(KEYS.lastOrder, normalizeOrder(order));
    return order;
  }

  function saveLocalOrders(orders) {
    return write(KEYS.orders, orders.map(normalizeOrder));
  }

  function saveLocalFeedback(items) {
    return write(KEYS.feedback, items.map(normalizeFeedbackItem));
  }

  function initFeedback() {
    const existing = read(KEYS.feedback, null);
    const seededAlready = read(KEYS.feedbackSeeded, false);
    const seeded = (window.NurseryData.testimonials || []).map((item, index) =>
      normalizeFeedbackItem({
        id: `FB-SEED-${index + 1}`,
        ...item,
        approved: true,
      })
    );

    if (Array.isArray(existing) && seededAlready) {
      return existing.map(normalizeFeedbackItem);
    }

    if (Array.isArray(existing)) {
      const normalized = existing.map(normalizeFeedbackItem);
      const knownIds = new Set(normalized.map((item) => item.id));
      const merged = normalized.slice();

      seeded.forEach((item) => {
        if (!knownIds.has(item.id)) {
          merged.push(item);
        }
      });

      write(KEYS.feedbackSeeded, true);
      return write(KEYS.feedback, merged);
    }

    write(KEYS.feedbackSeeded, true);
    return write(KEYS.feedback, seeded);
  }

  function getLocalFeedback() {
    return initFeedback().map(normalizeFeedbackItem);
  }

  function deriveCustomersFromOrders(orders) {
    const byPhone = new Map();

    orders.forEach((order) => {
      const normalizedOrder = normalizeOrder(order);
      const hasBillableItems = normalizedOrder.items.length > 0 || normalizedOrder.subtotal > 0;
      if (!hasBillableItems) {
        return;
      }
      const phoneKey = String(normalizedOrder.phone || "").trim().toLowerCase() || `order-${normalizedOrder.id}`;
      const existing = byPhone.get(phoneKey);

      if (!existing) {
        byPhone.set(
          phoneKey,
          normalizeCustomer({
            id: `CUS-${phoneKey.replace(/[^a-z0-9]/gi, "") || Date.now()}`,
            fullName: normalizedOrder.customerName,
            phone: normalizedOrder.phone,
            address: normalizedOrder.address,
            deliveryArea: normalizedOrder.deliveryArea,
            totalOrders: 1,
            subtotalValue: normalizedOrder.subtotal,
            deliveryValue: normalizedOrder.deliveryFee,
            lifetimeValue: normalizedOrder.total,
            lastOrderId: normalizedOrder.id,
            lastOrderAt: normalizedOrder.createdAt,
            createdAt: normalizedOrder.createdAt,
            updatedAt: normalizedOrder.createdAt,
          })
        );
        return;
      }

      const lastOrderAt =
        new Date(normalizedOrder.createdAt).getTime() > new Date(existing.lastOrderAt).getTime()
          ? normalizedOrder.createdAt
          : existing.lastOrderAt;

      byPhone.set(
        phoneKey,
        normalizeCustomer({
          ...existing,
          fullName: normalizedOrder.customerName || existing.fullName,
          address: normalizedOrder.address || existing.address,
          deliveryArea: normalizedOrder.deliveryArea || existing.deliveryArea,
          totalOrders: existing.totalOrders + 1,
          subtotalValue: existing.subtotalValue + normalizedOrder.subtotal,
          deliveryValue: existing.deliveryValue + normalizedOrder.deliveryFee,
          lifetimeValue: existing.lifetimeValue + normalizedOrder.total,
          lastOrderId:
            new Date(normalizedOrder.createdAt).getTime() > new Date(existing.lastOrderAt).getTime()
              ? normalizedOrder.id
              : existing.lastOrderId,
          lastOrderAt,
          updatedAt: new Date().toISOString(),
        })
      );
    });

    return Array.from(byPhone.values()).sort(
      (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
    );
  }

  function consolidateCustomers(customers) {
    const byPhone = new Map();

    customers.forEach((entry) => {
      const customer = normalizeCustomer(entry);
      const phoneKey = String(customer.phone || "").trim().toLowerCase() || `customer-${customer.id}`;
      const existing = byPhone.get(phoneKey);

      if (!existing) {
        byPhone.set(phoneKey, customer);
        return;
      }

      const useCurrentAsLatest = new Date(customer.lastOrderAt).getTime() > new Date(existing.lastOrderAt).getTime();

      byPhone.set(
        phoneKey,
        normalizeCustomer({
          ...existing,
          fullName: useCurrentAsLatest ? customer.fullName || existing.fullName : existing.fullName,
          address: useCurrentAsLatest ? customer.address || existing.address : existing.address,
          deliveryArea: useCurrentAsLatest ? customer.deliveryArea || existing.deliveryArea : existing.deliveryArea,
          totalOrders: existing.totalOrders + customer.totalOrders,
          subtotalValue: existing.subtotalValue + customer.subtotalValue,
          deliveryValue: existing.deliveryValue + customer.deliveryValue,
          lifetimeValue: existing.lifetimeValue + customer.lifetimeValue,
          lastOrderId: useCurrentAsLatest ? customer.lastOrderId : existing.lastOrderId,
          lastOrderAt: useCurrentAsLatest ? customer.lastOrderAt : existing.lastOrderAt,
          updatedAt: useCurrentAsLatest ? customer.updatedAt : existing.updatedAt,
        })
      );
    });

    return Array.from(byPhone.values()).sort(
      (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
    );
  }

  async function getRemoteOrders(options) {
    const table = supabaseTable("orders");
    if (!table) throw new Error("Supabase orders table is unavailable.");

    const { data, error } = await table.select("*").order("created_at", { ascending: false });
    if (error) throw error;

    const orders = (data || []).map(rowToOrder).filter(isMeaningfulOrder);
    if (options && options.includeArchived) return orders;
    return orders.filter((order) => !order.archived);
  }

  async function insertRemoteOrder(order) {
    const table = supabaseTable("orders");
    if (!table) throw new Error("Supabase orders table is unavailable.");

    const { error } = await table.insert(orderToRow(order));
    if (error) throw error;
  }

  async function updateRemoteOrderStatus(orderId, status) {
    const table = supabaseTable("orders");
    if (!table) throw new Error("Supabase orders table is unavailable.");

    const { error } = await table.update({ status }).eq("id", orderId);
    if (error) throw error;
  }

  async function archiveRemoteOrder(orderId) {
    const table = supabaseTable("orders");
    if (!table) throw new Error("Supabase orders table is unavailable.");

    const { error } = await table.update({ archived: true }).eq("id", orderId);
    if (error) throw error;
  }

  async function deleteRemoteOrder(orderId) {
    const table = supabaseTable("orders");
    if (!table) throw new Error("Supabase orders table is unavailable.");

    const { error } = await table.delete().eq("id", orderId);
    if (error) throw error;
  }

  async function getRemoteFeedback() {
    const table = supabaseTable("feedback");
    if (!table) throw new Error("Supabase feedback table is unavailable.");

    const { data, error } = await table.select("*").order("created_at", { ascending: false });
    if (error) throw error;

    return (data || []).map(rowToFeedback);
  }

  async function insertRemoteFeedback(entry) {
    const table = supabaseTable("feedback");
    if (!table) throw new Error("Supabase feedback table is unavailable.");

    const { error } = await table.insert(feedbackToRow(entry));
    if (error) throw error;
  }

  async function approveRemoteFeedback(feedbackId) {
    const table = supabaseTable("feedback");
    if (!table) throw new Error("Supabase feedback table is unavailable.");

    const { error } = await table.update({ approved: true }).eq("id", feedbackId);
    if (error) throw error;
  }

  async function deleteRemoteFeedback(feedbackId) {
    const table = supabaseTable("feedback");
    if (!table) throw new Error("Supabase feedback table is unavailable.");

    const { error } = await table.delete().eq("id", feedbackId);
    if (error) throw error;
  }

  async function getRemoteCustomers() {
    const table = supabaseTable("customers");
    if (!table) throw new Error("Supabase customers table is unavailable.");

    const { data, error } = await table.select("*").order("last_order_at", { ascending: false });
    if (error) throw error;

    return (data || []).map(rowToCustomer);
  }

  async function insertRemoteCustomerSnapshot(order) {
    const table = supabaseTable("customers");
    if (!table) throw new Error("Supabase customers table is unavailable.");

    const normalizedOrder = normalizeOrder(order);
    const now = new Date().toISOString();

    const payload = {
      full_name: normalizedOrder.customerName,
      phone: normalizedOrder.phone,
      address: normalizedOrder.address,
      delivery_area: normalizedOrder.deliveryArea,
      total_orders: 1,
      lifetime_value: normalizedOrder.total,
      last_order_id: normalizedOrder.id,
      last_order_at: normalizedOrder.createdAt,
      created_at: normalizedOrder.createdAt,
      updated_at: now,
    };

    const { error: insertError } = await table.insert(payload);
    if (insertError) throw insertError;
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

  function getAuthMode() {
    return isSupabaseEnabled() ? "supabase" : "local";
  }

  async function ensureAdminSession() {
    const auth = read(KEYS.auth, null);
    if (!isSupabaseEnabled() && auth && auth.loggedIn) {
      return true;
    }

    if (!isSupabaseEnabled() || !window.NurserySupabase.getSession) {
      return false;
    }

    try {
      const session = await window.NurserySupabase.getSession();
      if (session && session.user) {
        write(KEYS.auth, {
          loggedIn: true,
          username: session.user.email || "admin",
          usesDefaultPassword: false,
          at: new Date().toISOString(),
        });
        return true;
      }
      localStorage.removeItem(KEYS.auth);
    } catch (error) {
      console.warn("Unable to verify Supabase admin session:", error);
      localStorage.removeItem(KEYS.auth);
    }

    return false;
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

  async function getOrders(options) {
    if (!isSupabaseEnabled()) {
      return getLocalOrders(options);
    }

    try {
      return await getRemoteOrders(options);
    } catch (error) {
      console.warn("Falling back to local orders:", error);
      return getLocalOrders(options);
    }
  }

  function generateOrderId() {
    const now = new Date();
    const stamp = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const random = Math.floor(100 + Math.random() * 900);
    return `LNP-${stamp}${random}`;
  }

  async function placeOrder(formData) {
    const cart = getCart();
    if (!cart.length) {
      return {
        ok: false,
        message: "Your cart is empty. Please add items before placing the order.",
      };
    }

    const area = window.NurseryData.deliveryAreas.find((item) => item.value === formData.deliveryArea) || window.NurseryData.deliveryAreas[0];
    const subtotal = getCartSubtotal();
    const deliveryFee = area.fee;
    const order = normalizeOrder({
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
    });

    let savedToRemote = false;

    if (isSupabaseEnabled()) {
      try {
        await insertRemoteOrder(order);
        await insertRemoteCustomerSnapshot(order);
        savedToRemote = true;
      } catch (error) {
        console.warn("Failed to save order to Supabase. Falling back to localStorage:", error);
      }
    }

    if (!savedToRemote) {
      saveLocalOrder(order);
    }

    write(KEYS.lastOrder, order);
    clearCart();
    return { ok: true, order };
  }

  function getLastOrder() {
    return read(KEYS.lastOrder, null);
  }

  async function updateOrderStatus(orderId, status) {
    const normalizedStatus = ORDER_STATUSES.includes(status) ? status : "Pending";

    if (!isSupabaseEnabled()) {
      const orders = initOrders().map((order) =>
        order.id === orderId ? { ...normalizeOrder(order), status: normalizedStatus } : normalizeOrder(order)
      );
      return saveLocalOrders(orders);
    }

    try {
      await updateRemoteOrderStatus(orderId, normalizedStatus);
      return true;
    } catch (error) {
      console.warn("Failed to update Supabase order status. Falling back to localStorage:", error);
      const orders = initOrders().map((order) =>
        order.id === orderId ? { ...normalizeOrder(order), status: normalizedStatus } : normalizeOrder(order)
      );
      return saveLocalOrders(orders);
    }
  }

  async function archiveOrder(orderId) {
    if (!isSupabaseEnabled()) {
      const orders = initOrders().map((order) =>
        order.id === orderId ? { ...normalizeOrder(order), archived: true } : normalizeOrder(order)
      );
      return saveLocalOrders(orders);
    }

    try {
      await archiveRemoteOrder(orderId);
      return true;
    } catch (error) {
      console.warn("Failed to archive Supabase order. Falling back to localStorage:", error);
      const orders = initOrders().map((order) =>
        order.id === orderId ? { ...normalizeOrder(order), archived: true } : normalizeOrder(order)
      );
      return saveLocalOrders(orders);
    }
  }

  async function deleteOrder(orderId) {
    if (!isSupabaseEnabled()) {
      return saveLocalOrders(initOrders().filter((order) => order.id !== orderId));
    }

    try {
      await deleteRemoteOrder(orderId);
      return true;
    } catch (error) {
      console.warn("Failed to delete Supabase order. Falling back to localStorage:", error);
      return saveLocalOrders(initOrders().filter((order) => order.id !== orderId));
    }
  }

  async function getFeedback() {
    if (!isSupabaseEnabled()) {
      return getLocalFeedback();
    }

    try {
      const remote = await getRemoteFeedback();
      if (remote.length) return remote;
      return getLocalFeedback();
    } catch (error) {
      console.warn("Falling back to local feedback:", error);
      return getLocalFeedback();
    }
  }

  async function getApprovedFeedback() {
    const items = await getFeedback();
    return items.filter((item) => item.approved);
  }

  async function addFeedback(formData) {
    const name = String(formData.name || "").trim();
    const location = String(formData.location || "").trim();
    const text = String(formData.text || "").trim();
    const rating = Number(formData.rating);

    if (!name || !text || !rating || rating < 1 || rating > 5) {
      return {
        ok: false,
        message: "Please enter your name, choose a star rating, and add a short review.",
      };
    }

    const entry = normalizeFeedbackItem({
      id: `FB-${Date.now()}`,
      name,
      role: location ? `Customer, ${location}` : "Nursery customer",
      rating,
      text,
      createdAt: new Date().toISOString(),
      approved: false,
    });

    if (isSupabaseEnabled()) {
      try {
        await insertRemoteFeedback(entry);
      } catch (error) {
        console.warn("Failed to save feedback to Supabase. Falling back to localStorage:", error);
        const feedback = getLocalFeedback();
        feedback.unshift(entry);
        saveLocalFeedback(feedback);
      }
    } else {
      const feedback = getLocalFeedback();
      feedback.unshift(entry);
      saveLocalFeedback(feedback);
    }

    return {
      ok: true,
      message: "Thanks for sharing your feedback. The nursery team can review it before it appears on the website.",
      entry,
    };
  }

  async function approveFeedback(feedbackId) {
    if (!isSupabaseEnabled()) {
      const next = getLocalFeedback().map((item) => (item.id === feedbackId ? { ...item, approved: true } : item));
      return saveLocalFeedback(next);
    }

    try {
      await approveRemoteFeedback(feedbackId);
      return true;
    } catch (error) {
      console.warn("Failed to approve Supabase feedback. Falling back to localStorage:", error);
      const next = getLocalFeedback().map((item) => (item.id === feedbackId ? { ...item, approved: true } : item));
      return saveLocalFeedback(next);
    }
  }

  async function deleteFeedback(feedbackId) {
    if (!isSupabaseEnabled()) {
      return saveLocalFeedback(getLocalFeedback().filter((item) => item.id !== feedbackId));
    }

    try {
      await deleteRemoteFeedback(feedbackId);
      return true;
    } catch (error) {
      console.warn("Failed to delete Supabase feedback. Falling back to localStorage:", error);
      return saveLocalFeedback(getLocalFeedback().filter((item) => item.id !== feedbackId));
    }
  }

  async function getCustomers() {
    if (!isSupabaseEnabled()) {
      return deriveCustomersFromOrders(getLocalOrders({ includeArchived: true }));
    }

    try {
      const remoteOrders = await getRemoteOrders({ includeArchived: true });
      return deriveCustomersFromOrders(remoteOrders);
    } catch (error) {
      console.warn("Falling back to local customers:", error);
      return deriveCustomersFromOrders(getLocalOrders({ includeArchived: true }));
    }
  }

  async function login(username, password) {
    const enteredUsername = String(username || "").trim();
    const enteredPassword = String(password || "");

    if (isSupabaseEnabled() && window.NurserySupabase.signInWithPassword) {
      try {
        const result = await window.NurserySupabase.signInWithPassword(enteredUsername, enteredPassword);
        if (result.ok) {
          write(KEYS.auth, {
            loggedIn: true,
            username: enteredUsername,
            usesDefaultPassword: false,
            at: new Date().toISOString(),
          });
          return true;
        }
        return false;
      } catch (error) {
        console.warn("Supabase admin login failed:", error);
        return false;
      }
    }

    const settings = getAdminSettings();
    const valid = enteredUsername === settings.username && enteredPassword === settings.password;

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
    if (isSupabaseEnabled()) {
      return {
        ok: false,
        message: "Supabase Auth mode is active. Manage admin passwords from your Supabase project auth settings.",
      };
    }

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
      message: "Password updated successfully.",
    };
  }

  async function logout() {
    localStorage.removeItem(KEYS.auth);

    if (isSupabaseEnabled() && window.NurserySupabase.signOut) {
      try {
        await window.NurserySupabase.signOut();
      } catch (error) {
        console.warn("Supabase sign out failed:", error);
      }
    }
  }

  function isAdminLoggedIn() {
    if (isSupabaseEnabled()) {
      return false;
    }

    const auth = read(KEYS.auth, null);
    return Boolean(auth && auth.loggedIn);
  }

  return {
    getPersistenceStatus: getSupabaseStatus,
    getAuthMode,
    ensureAdminSession,
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
    getFeedback,
    getApprovedFeedback,
    addFeedback,
    approveFeedback,
    deleteFeedback,
    getCustomers,
    login,
    getAdminPublicState,
    changeAdminPassword,
    logout,
    isAdminLoggedIn,
  };
})();
