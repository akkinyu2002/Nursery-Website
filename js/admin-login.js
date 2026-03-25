document.addEventListener("DOMContentLoaded", async () => {
  const hasSession = window.NurseryStorage.isAdminLoggedIn() || (await window.NurseryStorage.ensureAdminSession());
  if (hasSession) {
    window.location.href = "admin-dashboard.html";
    return;
  }

  const form = document.querySelector("[data-admin-login]");
  const note = document.querySelector("[data-login-note]");
  if (!form) return;

  renderLoginNote();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const ok = await window.NurseryStorage.login(formData.get("username"), formData.get("password"));
    if (ok) {
      window.location.href = "admin-dashboard.html";
      return;
    }
    const mode = window.NurseryStorage.getAuthMode();
    note.textContent =
      mode === "supabase"
        ? "Login failed. Use your Supabase admin email/password, or leave Supabase blank to use local admin login."
        : "Invalid credentials. Use the private admin login details shared by the owner.";
    note.classList.add("is-error");
  });

  function renderLoginNote() {
    const mode = window.NurseryStorage.getAuthMode();
    note.classList.remove("is-error");
    note.textContent =
      mode === "supabase"
        ? "Supabase mode is active. Sign in with your Supabase admin email and password."
        : "Use the private username and password shared for the nursery dashboard.";
  }
});
