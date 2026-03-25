window.NurserySupabase = (() => {
  const config = window.NurserySupabaseConfig || {};
  const hasConfig = Boolean(config.url && config.anonKey);

  const tables = {
    orders: (config.tables && config.tables.orders) || "orders",
    feedback: (config.tables && config.tables.feedback) || "feedback",
    customers: (config.tables && config.tables.customers) || "customers",
  };

  let client = null;
  let initReason = "Supabase is not configured.";

  if (hasConfig) {
    if (window.supabase && typeof window.supabase.createClient === "function") {
      client = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      initReason = "Supabase enabled.";
    } else {
      initReason = "Supabase browser SDK is missing.";
    }
  }

  function isEnabled() {
    return Boolean(client);
  }

  function getClient() {
    return client;
  }

  function table(name) {
    if (!client) return null;
    return client.from(tables[name] || name);
  }

  async function signInWithPassword(email, password) {
    if (!client) return { ok: false, error: new Error("Supabase client is unavailable.") };
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || ""),
    });

    return {
      ok: !error,
      data,
      error,
    };
  }

  async function signOut() {
    if (!client) return { ok: true };
    const { error } = await client.auth.signOut();
    return { ok: !error, error };
  }

  async function getSession() {
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw error;
    }
    return data.session || null;
  }

  function getStatus() {
    if (client) {
      return {
        mode: "supabase",
        configured: true,
        enabled: true,
        reason: initReason,
        provider: "supabase",
      };
    }

    return {
      mode: "local",
      configured: hasConfig,
      enabled: false,
      reason: initReason,
      provider: "localStorage",
    };
  }

  return {
    isEnabled,
    getClient,
    table,
    signInWithPassword,
    signOut,
    getSession,
    getStatus,
  };
})();
