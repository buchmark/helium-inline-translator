export async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, credentials: "omit" });
  if (!response.ok) {
    throw new Error(
      `${new URL(url).host} responded with HTTP ${response.status}`,
    );
  }
  return response.json();
}
