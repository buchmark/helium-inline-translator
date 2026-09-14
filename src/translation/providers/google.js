import { fetchJson } from "../fetchJson.js";

const ENDPOINT = "https://translate.googleapis.com/translate_a/t";

export const googleProvider = {
  id: "google",
  name: "Google",
  async translate(texts, targetLanguage) {
    const params = new URLSearchParams({
      client: "gtx",
      sl: "auto",
      tl: targetLanguage,
    });
    const body = new URLSearchParams(texts.map((text) => ["q", text]));
    const translations = await fetchJson(`${ENDPOINT}?${params}`, {
      method: "POST",
      body,
    });
    return translations.map(([translatedText]) => translatedText);
  },
};
