document.addEventListener("DOMContentLoaded", async () => {
  const hasSession = window.NurseryStorage.isAdminLoggedIn() || (await window.NurseryStorage.ensureAdminSession());

  if (!hasSession) {
    window.location.href = "admin-login.html";
    return;
  }

  const statsRoot = document.querySelector("[data-admin-stats]");
  const securityRoot = document.querySelector("[data-admin-security]");
  const feedbackRoot = document.querySelector("[data-feedback-panel]");
  const customersRoot = document.querySelector("[data-customers-panel]");
  const tableRoot = document.querySelector("[data-orders-table]");
  const modalRoot = document.querySelector("[data-order-modal]");
  const searchInput = document.querySelector("[data-order-search]");
  const filterSelect = document.querySelector("[data-order-filter]");
  const logoutButton = document.querySelector("[data-admin-logout]");

  const state = {
    search: "",
    status: "all",
    modalId: null,
    orders: [],
    feedback: [],
    customers: [],
    securityMessage: null,
  };

  function currentOrders() {
    return state.orders.filter((order) => {
      const search = state.search.trim().toLowerCase();
      const text = [order.id, order.customerName, order.phone, order.address].join(" ").toLowerCase();
      const searchMatch = !search || text.includes(search);
      const statusMatch =
        state.status === "all" ||
        (state.status === "archived" ? order.archived : order.status.toLowerCase() === state.status);
      return searchMatch && statusMatch;
    });
  }

  function renderStats() {
    if (!statsRoot) return;

    const cards = [
      { label: "Total Orders", value: state.orders.filter((order) => !order.archived).length },
      { label: "Pending Orders", value: state.orders.filter((order) => order.status === "Pending" && !order.archived).length },
      { label: "Confirmed Orders", value: state.orders.filter((order) => order.status === "Confirmed" && !order.archived).length },
      { label: "Delivered Orders", value: state.orders.filter((order) => order.status === "Delivered" && !order.archived).length },
      { label: "Cancelled Orders", value: state.orders.filter((order) => order.status === "Cancelled" && !order.archived).length },
    ];

    statsRoot.innerHTML = cards
      .map(
        (card) => `
          <article class="admin-stat">
            <span>${card.label}</span>
            <strong>${card.value}</strong>
          </article>
        `
      )
      .join("");
  }

  function renderSecurity(message) {
    if (!securityRoot) return;

    const authMode = window.NurseryStorage.getAuthMode();
    const persistence = window.NurseryStorage.getPersistenceStatus();

    if (authMode === "supabase") {
      securityRoot.innerHTML = `
        <div class="admin-panel__head">
          <div>
            <h2>Admin Security</h2>
            <p>Authentication is managed by Supabase Auth in this mode.</p>
          </div>
        </div>
        <div class="admin-security">
          <article class="admin-security__status is-success">
            <p class="eyebrow">Current access state</p>
            <h3>Supabase Auth enabled</h3>
            <p>Use your Supabase admin email and password to sign in. Password reset and account controls are managed in Supabase.</p>
            <div class="admin-security__meta">
              <div><span>Auth provider</span><strong>Supabase</strong></div>
              <div><span>Data mode</span><strong>${persistence.provider}</strong></div>
            </div>
          </article>
          <div class="admin-security__form">
            <p class="admin-security__note is-info">${message ? message.message : "Password changes are handled in your Supabase dashboard."}</p>
          </div>
        </div>
      `;
      return;
    }

    const adminState = window.NurseryStorage.getAdminPublicState();
    const statusClass = adminState.passwordChangedAt ? "is-success" : "is-warning";
    const statusTitle = adminState.passwordChangedAt ? "Password updated" : "Password update recommended";
    const statusText = adminState.passwordChangedAt
      ? "This dashboard is using a private password saved for this browser."
      : "For better security, update the admin password after first access and keep it private.";
    const changedText = adminState.passwordChangedAt
      ? window.NurseryUI.formatDate(adminState.passwordChangedAt)
      : "Not changed yet";

    securityRoot.innerHTML = `
      <div class="admin-panel__head">
        <div>
          <h2>Admin Security</h2>
          <p>Change the local admin password directly from the dashboard.</p>
        </div>
      </div>
      <div class="admin-security">
        <article class="admin-security__status ${statusClass}">
          <p class="eyebrow">Current access state</p>
          <h3>${statusTitle}</h3>
          <p>${statusText}</p>
          <div class="admin-security__meta">
            <div><span>Username</span><strong>${adminState.username}</strong></div>
            <div><span>Password changed</span><strong>${changedText}</strong></div>
          </div>
        </article>
        <form class="admin-security__form" data-password-form>
          <label>
            <span>Current password</span>
            <input type="password" name="currentPassword" required placeholder="Enter current password">
          </label>
          <label>
            <span>New password</span>
            <input type="password" name="newPassword" required minlength="6" placeholder="Enter new password">
          </label>
          <label>
            <span>Confirm new password</span>
            <input type="password" name="confirmPassword" required minlength="6" placeholder="Re-enter new password">
          </label>
          <button type="submit">Change Password</button>
          <p class="admin-security__note ${message && message.ok === false ? "is-error" : "is-info"}">
            ${
              message
                ? message.message
                : "Use at least 6 characters and keep the dashboard password private."
            }
          </p>
        </form>
      </div>
    `;

    const form = securityRoot.querySelector("[data-password-form]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const result = window.NurseryStorage.changeAdminPassword(
        formData.get("currentPassword"),
        formData.get("newPassword"),
        formData.get("confirmPassword")
      );

      if (result.ok) {
        form.reset();
      }

      state.securityMessage = result;
      renderSecurity(result);
    });
  }

  function renderTable() {
    if (!tableRoot) return;
    const orders = currentOrders();

    tableRoot.innerHTML = orders.length
      ? `
        <table class="admin-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Items Ordered</th>
              <th>Total Amount</th>
              <th>Payment Method</th>
              <th>Order Status</th>
              <th>Order Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders
              .map(
                (order) => `
                  <tr>
                    <td data-label="Order ID">${order.id}</td>
                    <td data-label="Customer">${order.customerName}</td>
                    <td data-label="Phone">${order.phone}</td>
                    <td data-label="Address">${order.address}</td>
                    <td data-label="Items Ordered">${order.items.map((item) => `${item.name} x ${item.quantity}`).join(", ")}</td>
                    <td data-label="Total Amount">${window.NurseryUI.formatCurrency(order.total)}</td>
                    <td data-label="Payment Method">${order.paymentMethod}</td>
                    <td data-label="Order Status">
                      <select data-status-change="${order.id}">
                        ${["Pending", "Confirmed", "Processing", "Delivered", "Cancelled"]
                          .map(
                            (status) =>
                              `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                          )
                          .join("")}
                      </select>
                    </td>
                    <td data-label="Order Date">${window.NurseryUI.formatDate(order.createdAt)}</td>
                    <td data-label="Actions">
                      <div class="table-actions">
                        <button class="table-action table-action--view" type="button" data-order-view="${order.id}">View</button>
                        <button class="table-action table-action--archive" type="button" data-order-archive="${order.id}">${order.archived ? "Archived" : "Archive"}</button>
                        <button class="table-action table-action--danger" type="button" data-order-delete="${order.id}">Delete</button>
                      </div>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `
      : `<div class="admin-empty"><h3>No orders found</h3><p>Try a different search or status filter.</p></div>`;
  }

  function renderFeedbackPanel() {
    if (!feedbackRoot) return;

    const feedback = state.feedback;
    const pendingCount = feedback.filter((item) => !item.approved).length;

    feedbackRoot.innerHTML = `
      <div class="admin-panel__head">
        <div>
          <h2>Customer Reviews</h2>
          <p>Approve reviews you want to keep on the website or remove the ones you do not want to publish.</p>
        </div>
        <div class="admin-feedback-summary">
          <span>${pendingCount} pending</span>
          <strong>${feedback.length} total reviews</strong>
        </div>
      </div>
      ${
        feedback.length
          ? `
            <div class="admin-feedback-grid">
              ${feedback
                .map(
                  (item) => `
                    <article class="admin-feedback-card ${item.approved ? "is-approved" : "is-pending"}">
                      <div class="admin-feedback-card__top">
                        <div>
                          <p class="eyebrow">${item.approved ? "Live on website" : "Pending review"}</p>
                          <h3>${item.name}</h3>
                          <p>${item.role}</p>
                        </div>
                        <div class="admin-feedback-card__rating">
                          ${window.NurseryUI.renderStars(item.rating)}
                          <strong>${Number(item.rating || 0).toFixed(1)}</strong>
                        </div>
                      </div>
                      <p class="admin-feedback-card__text">${item.text}</p>
                      <div class="admin-feedback-card__meta">
                        <span>${window.NurseryUI.formatDate(item.createdAt)}</span>
                        <div class="admin-feedback-card__actions">
                          ${
                            item.approved
                              ? `<button type="button" class="is-static" disabled>Kept on website</button>`
                              : `<button type="button" data-feedback-approve="${item.id}">Keep on website</button>`
                          }
                          <button type="button" class="is-danger" data-feedback-delete="${item.id}">Delete</button>
                        </div>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>
          `
          : `<div class="admin-empty"><h3>No customer reviews yet</h3><p>New feedback submitted from the website will appear here for review.</p></div>`
      }
    `;
  }

  function renderCustomersPanel() {
    if (!customersRoot) return;

    const customers = state.customers;
    const repeatCustomers = customers.filter((item) => Number(item.totalOrders) > 1).length;

    customersRoot.innerHTML = `
      <div class="admin-panel__head">
        <div>
          <h2>Customers</h2>
          <p>Checkout customer details and order history summary from Supabase or local fallback data.</p>
        </div>
        <div class="admin-feedback-summary">
          <span>${repeatCustomers} repeat customers</span>
          <strong>${customers.length} total customers</strong>
        </div>
      </div>
      ${
        customers.length
          ? `
            <div class="admin-table-wrap">
              <table class="admin-orders-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Orders</th>
                    <th>Lifetime Value</th>
                    <th>Last Order ID</th>
                    <th>Last Order Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${customers
                    .map(
                      (customer) => `
                        <tr>
                          <td data-label="Customer">${customer.fullName || "-"}</td>
                          <td data-label="Phone">${customer.phone || "-"}</td>
                          <td data-label="Address">${customer.address || "-"}</td>
                          <td data-label="Orders">${customer.totalOrders}</td>
                          <td data-label="Lifetime Value">${window.NurseryUI.formatCurrency(customer.lifetimeValue)}</td>
                          <td data-label="Last Order ID">${customer.lastOrderId || "-"}</td>
                          <td data-label="Last Order Date">${window.NurseryUI.formatDate(customer.lastOrderAt)}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `
          : `<div class="admin-empty"><h3>No customers recorded yet</h3><p>Customer records will appear after checkout submissions.</p></div>`
      }
    `;
  }

  function renderModal() {
    if (!modalRoot) return;

    const order = state.orders.find((item) => item.id === state.modalId);
    if (!order) {
      modalRoot.classList.remove("is-open");
      modalRoot.innerHTML = "";
      return;
    }

    modalRoot.classList.add("is-open");
    modalRoot.innerHTML = `
      <div class="admin-modal__backdrop" data-modal-close></div>
      <aside class="admin-modal__panel">
        <button class="admin-modal__close" type="button" data-modal-close>x</button>
        <p class="eyebrow">Order details</p>
        <h3>${order.id}</h3>
        <div class="admin-detail-list">
          <div><span>Customer</span><strong>${order.customerName}</strong></div>
          <div><span>Phone</span><strong>${order.phone}</strong></div>
          <div><span>Address</span><strong>${order.address}</strong></div>
          <div><span>Area</span><strong>${order.deliveryArea}</strong></div>
          <div><span>Payment</span><strong>${order.paymentMethod}</strong></div>
          <div><span>Status</span><strong>${order.status}</strong></div>
          <div><span>Total</span><strong>${window.NurseryUI.formatCurrency(order.total)}</strong></div>
          <div><span>Date</span><strong>${window.NurseryUI.formatDate(order.createdAt)}</strong></div>
        </div>
        <div class="admin-items">
          <h4>Items</h4>
          ${order.items
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
        <div class="admin-note">
          <h4>Order Notes</h4>
          <p>${order.orderNotes || "No extra note provided."}</p>
        </div>
      </aside>
    `;
  }

  async function loadData() {
    const [orders, feedback, customers] = await Promise.all([
      window.NurseryStorage.getOrders({ includeArchived: true }),
      window.NurseryStorage.getFeedback(),
      window.NurseryStorage.getCustomers(),
    ]);

    state.orders = orders;
    state.feedback = feedback;
    state.customers = customers;
  }

  async function refresh(options = {}) {
    if (options.load !== false) {
      await loadData();
    }

    renderStats();
    renderSecurity(state.securityMessage);
    renderFeedbackPanel();
    renderCustomersPanel();
    renderTable();
    renderModal();
  }

  if (feedbackRoot) {
    feedbackRoot.addEventListener("click", async (event) => {
      const approve = event.target.closest("[data-feedback-approve]");
      const del = event.target.closest("[data-feedback-delete]");

      if (approve) {
        await window.NurseryStorage.approveFeedback(approve.dataset.feedbackApprove);
        await refresh();
      }

      if (del) {
        await window.NurseryStorage.deleteFeedback(del.dataset.feedbackDelete);
        await refresh();
      }
    });
  }

  if (tableRoot) {
    tableRoot.addEventListener("change", async (event) => {
      const select = event.target.closest("[data-status-change]");
      if (!select) return;
      await window.NurseryStorage.updateOrderStatus(select.dataset.statusChange, select.value);
      await refresh();
    });

    tableRoot.addEventListener("click", async (event) => {
      const view = event.target.closest("[data-order-view]");
      const archive = event.target.closest("[data-order-archive]");
      const del = event.target.closest("[data-order-delete]");

      if (view) {
        state.modalId = view.dataset.orderView;
        renderModal();
        return;
      }

      if (archive) {
        await window.NurseryStorage.archiveOrder(archive.dataset.orderArchive);
        await refresh();
        return;
      }

      if (del) {
        await window.NurseryStorage.deleteOrder(del.dataset.orderDelete);
        if (state.modalId === del.dataset.orderDelete) {
          state.modalId = null;
        }
        await refresh();
      }
    });
  }

  if (modalRoot) {
    modalRoot.addEventListener("click", (event) => {
      if (event.target.closest("[data-modal-close]")) {
        state.modalId = null;
        renderModal();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderTable();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", (event) => {
      state.status = event.target.value;
      renderTable();
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await window.NurseryStorage.logout();
      window.location.href = "admin-login.html";
    });
  }

  await refresh();
});