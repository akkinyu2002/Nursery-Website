document.addEventListener("DOMContentLoaded", () => {
  if (window.NurseryStorage.isAdminLoggedIn()) {
    window.location.href = "admin-dashboard.html";
    return;
  }

  const form = document.querySelector("[data-admin-login]");
  const note = document.querySelector("[data-login-note]");
  if (!form) return;

  renderLoginNote();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const ok = window.NurseryStorage.login(formData.get("username"), formData.get("password"));
    if (ok) {
      window.location.href = "admin-dashboard.html";
      return;
    }
    const adminState = window.NurseryStorage.getAdminPublicState();
    note.textContent = adminState.usesDefaultPassword
      ? "Invalid credentials. Use the demo login shown below, then change the password after login."
      : "Invalid credentials. Use the updated admin password.";
    note.classList.add("is-error");
  });

  function renderLoginNote() {
    const adminState = window.NurseryStorage.getAdminPublicState();
    note.classList.remove("is-error");

    if (adminState.usesDefaultPassword) {
      note.textContent = `Demo login: ${adminState.username} / ${window.NurseryData.adminCredentials.password}. Change it after login for security.`;
      return;
    }

    note.textContent = "Demo password has been removed. Sign in with the updated admin password.";
  }
});
