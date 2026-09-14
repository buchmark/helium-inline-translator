import { fetchJson } from "../fetchJson.js";

const ENDPOINT = "https://edge.microsoft.com/translate/translatetext";
const LANGUAGE_CODES = { sr: "sr-Cyrl", tl: "fil" };

export const microsoftProvider = {
  id: "microsoft",
  name: "Microsoft",
  async translate(texts, targetLanguage) {
    const params = new URLSearchParams({
      from: "",
      to: LANGUAGE_CODES[targetLanguage] ?? targetLanguage,
      isEnterpriseClient: "false",
    });
    const results = await fetchJson(`${ENDPOINT}?${params}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(texts),
    });
    return results.map((result) => result.translations[0].text);
  },
};
