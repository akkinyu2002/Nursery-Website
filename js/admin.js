document.addEventListener("DOMContentLoaded", () => {
  if (!window.NurseryStorage.isAdminLoggedIn()) {
    window.location.href = "admin-login.html";
    return;
  }

  const statsRoot = document.querySelector("[data-admin-stats]");
  const securityRoot = document.querySelector("[data-admin-security]");
  const tableRoot = document.querySelector("[data-orders-table]");
  const modalRoot = document.querySelector("[data-order-modal]");
  const searchInput = document.querySelector("[data-order-search]");
  const filterSelect = document.querySelector("[data-order-filter]");
  const logoutButton = document.querySelector("[data-admin-logout]");

  const state = { search: "", status: "all", modalId: null };

  function currentOrders() {
    return window.NurseryStorage
      .getOrders({ includeArchived: true })
      .filter((order) => {
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
    const orders = window.NurseryStorage.getOrders({ includeArchived: true });
    const cards = [
      { label: "Total Orders", value: orders.filter((order) => !order.archived).length },
      { label: "Pending Orders", value: orders.filter((order) => order.status === "Pending" && !order.archived).length },
      { label: "Confirmed Orders", value: orders.filter((order) => order.status === "Confirmed" && !order.archived).length },
      { label: "Delivered Orders", value: orders.filter((order) => order.status === "Delivered" && !order.archived).length },
      { label: "Cancelled Orders", value: orders.filter((order) => order.status === "Cancelled" && !order.archived).length },
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
    const adminState = window.NurseryStorage.getAdminPublicState();
    const statusClass = adminState.usesDefaultPassword ? "is-warning" : "is-success";
    const statusTitle = adminState.usesDefaultPassword
      ? "Demo password is still active"
      : "Custom admin password is active";
    const statusText = adminState.usesDefaultPassword
      ? "Replace the demo password now. Once changed, the demo hint disappears from the login page and the old demo password stops working."
      : "Your admin login now uses a custom password. The original demo password is no longer valid.";
    const changedText = adminState.passwordChangedAt
      ? window.NurseryUI.formatDate(adminState.passwordChangedAt)
      : "Not changed yet";

    securityRoot.innerHTML = `
      <div class="admin-panel__head">
        <div>
          <h2>Admin Security</h2>
          <p>Change the admin password directly from the dashboard.</p>
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
                : "Use at least 6 characters. After a successful change, the demo password will no longer appear on the login screen."
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

      renderSecurity(result);
    });
  }

  function renderTable() {
    const orders = currentOrders();

    tableRoot.innerHTML = orders.length
      ? `
        <table>
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
                    <td>${order.id}</td>
                    <td>${order.customerName}</td>
                    <td>${order.phone}</td>
                    <td>${order.address}</td>
                    <td>${order.items.map((item) => `${item.name} x ${item.quantity}`).join(", ")}</td>
                    <td>${window.NurseryUI.formatCurrency(order.total)}</td>
                    <td>${order.paymentMethod}</td>
                    <td>
                      <select data-status-change="${order.id}">
                        ${["Pending", "Confirmed", "Processing", "Delivered", "Cancelled"]
                          .map(
                            (status) =>
                              `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                          )
                          .join("")}
                      </select>
                    </td>
                    <td>${window.NurseryUI.formatDate(order.createdAt)}</td>
                    <td>
                      <div class="table-actions">
                        <button type="button" data-order-view="${order.id}">View</button>
                        <button type="button" data-order-archive="${order.id}">${order.archived ? "Archived" : "Archive"}</button>
                        <button type="button" data-order-delete="${order.id}">Delete</button>
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

  function renderModal() {
    const order = window.NurseryStorage.getOrders({ includeArchived: true }).find((item) => item.id === state.modalId);
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

  function refresh() {
    renderStats();
    renderSecurity();
    renderTable();
    renderModal();
  }

  tableRoot.addEventListener("change", (event) => {
    const select = event.target.closest("[data-status-change]");
    if (!select) return;
    window.NurseryStorage.updateOrderStatus(select.dataset.statusChange, select.value);
    refresh();
  });

  tableRoot.addEventListener("click", (event) => {
    const view = event.target.closest("[data-order-view]");
    const archive = event.target.closest("[data-order-archive]");
    const del = event.target.closest("[data-order-delete]");

    if (view) {
      state.modalId = view.dataset.orderView;
    }

    if (archive) {
      window.NurseryStorage.archiveOrder(archive.dataset.orderArchive);
    }

    if (del) {
      window.NurseryStorage.deleteOrder(del.dataset.orderDelete);
      if (state.modalId === del.dataset.orderDelete) {
        state.modalId = null;
      }
    }

    refresh();
  });

  modalRoot.addEventListener("click", (event) => {
    if (event.target.closest("[data-modal-close]")) {
      state.modalId = null;
      renderModal();
    }
  });

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderTable();
  });

  filterSelect.addEventListener("change", (event) => {
    state.status = event.target.value;
    renderTable();
  });

  logoutButton.addEventListener("click", () => {
    window.NurseryStorage.logout();
    window.location.href = "admin-login.html";
  });

  refresh();
});
