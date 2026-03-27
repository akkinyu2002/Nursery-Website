const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ServeHandler = (req: Request) => Response | Promise<Response>;
type DenoLike = {
  env?: {
    get?: (key: string) => string | undefined;
  };
  serve?: (handler: ServeHandler) => void;
};

function getDenoRuntime(): DenoLike | undefined {
  return (globalThis as { Deno?: DenoLike }).Deno;
}

function getEnv(name: string): string | undefined {
  const denoValue = getDenoRuntime()?.env?.get?.(name);
  if (typeof denoValue === "string") {
    return denoValue;
  }

  const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return processEnv?.[name];
}

function runServer(handler: ServeHandler): void {
  const denoServe = getDenoRuntime()?.serve;
  if (typeof denoServe === "function") {
    denoServe(handler);
    return;
  }

  const standardServe = (globalThis as { serve?: (callback: ServeHandler) => void }).serve;
  if (typeof standardServe === "function") {
    standardServe(handler);
    return;
  }

  throw new Error("No compatible serve implementation found in this runtime.");
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function getString(source: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

function getNumber(source: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = Number(source[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return fallback;
}

function getOrderPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const fromNew = toRecord(payload.new);
  if (Object.keys(fromNew).length) {
    return fromNew;
  }

  const fromRecord = toRecord(payload.record);
  if (Object.keys(fromRecord).length) {
    return fromRecord;
  }

  return payload;
}

function formatItems(itemsRaw: unknown): string {
  if (!Array.isArray(itemsRaw) || !itemsRaw.length) {
    return "No item list provided";
  }

  return itemsRaw
    .map((item) => {
      const entry = toRecord(item);
      const name = getString(entry, ["name"], "Item");
      const quantity = Math.max(1, getNumber(entry, ["quantity"], 1));
      const price = Math.round(getNumber(entry, ["price"], 0));
      return `- ${name} x ${quantity} (NPR ${price})`;
    })
    .join("\n");
}

function formatEmailText(order: Record<string, unknown>): string {
  const orderId = getString(order, ["id"], "Unknown");
  const customerName = getString(order, ["customer_name", "customerName"], "Customer");
  const phone = getString(order, ["phone"], "Not provided");
  const paymentMethod = getString(order, ["payment_method", "paymentMethod"], "Not set");
  const address = getString(order, ["address"], "Not provided");
  const deliveryArea = getString(order, ["delivery_area", "deliveryArea"], "Not provided");
  const orderNotes = getString(order, ["order_notes", "orderNotes"], "None");
  const subtotal = Math.round(getNumber(order, ["subtotal"], 0));
  const deliveryFee = Math.round(getNumber(order, ["delivery_fee", "deliveryFee"], 0));
  const total = Math.round(getNumber(order, ["total"], 0));
  const items = formatItems(order.items);

  return [
    "New nursery order received",
    "",
    `Order ID: ${orderId}`,
    `Customer: ${customerName}`,
    `Phone: ${phone}`,
    `Payment: ${paymentMethod}`,
    `Delivery area: ${deliveryArea}`,
    `Address: ${address}`,
    "",
    "Order items:",
    items,
    "",
    `Subtotal: NPR ${subtotal}`,
    `Delivery fee: NPR ${deliveryFee}`,
    `Total: NPR ${total}`,
    "",
    `Notes: ${orderNotes}`,
  ].join("\n");
}

runServer(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resendApiKey = getEnv("RESEND_API_KEY");
  const toEmail = "nyupaneaakash@gmail.com";
  const fromEmail = getEnv("ORDER_ALERT_FROM_EMAIL") || "Nursery Alerts <onboarding@resend.dev>";

  if (!resendApiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Missing email credentials",
        required: ["RESEND_API_KEY"],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = toRecord(await req.json());
  } catch (_error) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const order = getOrderPayload(payload);
  const orderId = getString(order, ["id"], "Unknown");
  const text = formatEmailText(order);

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `New Order Alert: ${orderId}`,
      text,
    }),
  });

  if (!resendResponse.ok) {
    const errorBody = await resendResponse.text();
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Resend API request failed",
        detail: errorBody.slice(0, 500),
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
