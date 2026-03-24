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
    note.textContent = "Invalid credentials. Use the private admin login details shared by the owner.";
    note.classList.add("is-error");
  });

  function renderLoginNote() {
    note.classList.remove("is-error");
    note.textContent = "Use the private username and password shared for the nursery dashboard.";
  }
});
