import { fetchJson } from "../fetchJson.js";

const ENDPOINT = "https://translate.yandex.net/api/v1/tr.json/translate";
const LANGUAGE_CODES = { "zh-CN": "zh", "zh-TW": "zh" };
const SESSION_ID = `${crypto.randomUUID().replaceAll("-", "")}-0-0`;

export const yandexProvider = {
  id: "yandex",
  name: "Yandex",
  async translate(texts, targetLanguage) {
    const params = new URLSearchParams({ id: SESSION_ID, srv: "android" });
    const body = new URLSearchParams([
      ["lang", LANGUAGE_CODES[targetLanguage] ?? targetLanguage],
      ...texts.map((text) => ["text", text]),
    ]);
    const result = await fetchJson(`${ENDPOINT}?${params}`, {
      method: "POST",
      body,
    });
    return result.text;
  },
};
