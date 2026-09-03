export function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra,
    },
  });
}

export function cleanText(value: unknown, max = 80) {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}

export function normalizeFlightNumber(value: unknown) {
  return cleanText(value, 12).toUpperCase().replace(/[^A-Z0-9]/g, "");
}
